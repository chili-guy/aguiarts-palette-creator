import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { cleanBackground, sampleBorderColor, type RGBAImage } from "@/lib/image-core";
import { ToolPageShell } from "@/components/tool-page-shell";
import {
  ControlGroup,
  Hint,
  PreviewPlaceholder,
  PreviewStage,
  PrimaryAction,
  SliderRow,
  ToolLayout,
} from "@/components/tool-ui";
import {
  downloadCanvasAsPng,
  drawRGBAImage,
  imageToRGBAImage,
  loadImageFile,
} from "@/lib/canvas-tools";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export const Route = createFileRoute("/ferramentas/limpador-fundo")({
  head: () => ({ meta: [{ title: "Limpador de Fundo | Printzy" }] }),
  component: BackgroundCleanerTool,
});

function rgbToHex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function BackgroundCleanerTool() {
  const [original, setOriginal] = useState<RGBAImage | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [strength, setStrength] = useState(35);
  const [protection, setProtection] = useState(45);
  const [smoothing, setSmoothing] = useState(25);
  const [autoColor, setAutoColor] = useState(true);
  const [pickedColor, setPickedColor] = useState("#ffffff");
  const [showBefore, setShowBefore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /** What the border sampler found, shown so the guess is auditable. */
  const detected = useMemo(() => (original ? sampleBorderColor(original) : null), [original]);

  const settings = useMemo(
    () => ({ strength, protection, smoothing, autoColor, pickedColor }),
    [strength, protection, smoothing, autoColor, pickedColor],
  );
  const debounced = useDebouncedValue(settings, 150);
  const isPending = debounced !== settings;

  const cleaned = useMemo<RGBAImage | null>(() => {
    if (!original) return null;
    return cleanBackground(original, {
      strength: debounced.strength,
      protection: debounced.protection,
      smoothing: debounced.smoothing,
      ...(debounced.autoColor ? {} : { backgroundColor: hexToRgb(debounced.pickedColor) }),
    });
  }, [original, debounced]);

  useEffect(() => {
    const shown = showBefore ? original : cleaned;
    if (shown && canvasRef.current) drawRGBAImage(canvasRef.current, shown);
  }, [cleaned, original, showBefore]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const img = await loadImageFile(file);
      const rgba = imageToRGBAImage(img);
      setOriginal(rgba);
      setFileName(file.name);
      setPickedColor(rgbToHex(sampleBorderColor(rgba)));
    } catch {
      setError("Não foi possível carregar essa imagem.");
    }
  }

  function reset() {
    setStrength(35);
    setProtection(45);
    setSmoothing(25);
    setAutoColor(true);
    if (original) setPickedColor(rgbToHex(sampleBorderColor(original)));
  }

  const baseName = `${fileName?.replace(/\.[^/.]+$/, "") || "imagem"}-limpo`;
  const activeColor = autoColor && detected ? rgbToHex(detected) : pickedColor;

  return (
    <ToolPageShell
      title="Limpador de Fundo"
      subtitle="Limpe sujeiras e uniformize fundos sem remover a arte."
    >
      <ToolLayout
        controls={
          <>
            <ControlGroup step="01" label="Imagem">
              <label className="block cursor-pointer rounded-xl border border-border-strong bg-accent/10 px-4 py-4 text-center transition-colors hover:bg-accent/15">
                <span className="block text-sm font-bold">Selecionar imagem</span>
                <span className="block text-xs text-muted-foreground">PNG, JPG ou WebP</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              <div className="rounded-xl border border-border bg-secondary px-3 py-2.5">
                <p className="text-xs font-bold">{fileName ?? "Nenhuma imagem carregada"}</p>
                <p className="text-xs text-muted-foreground">
                  {original
                    ? `${original.width} × ${original.height} px`
                    : "Funciona melhor em arte já recortada ou com fundo chapado"}
                </p>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </ControlGroup>

            <ControlGroup step="02" label="Cor do fundo">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary px-3 py-2.5">
                <span
                  className="size-8 shrink-0 rounded-md border border-border"
                  style={{ backgroundColor: activeColor }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold">
                    {autoColor ? "Detectada automaticamente" : "Escolhida por você"}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground uppercase">
                    {activeColor}
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoColor}
                  onChange={(e) => setAutoColor(e.target.checked)}
                  className="size-4 accent-[var(--accent)]"
                />
                Detectar sozinho pela borda
              </label>
              {!autoColor && (
                <input
                  type="color"
                  value={pickedColor}
                  onChange={(e) => setPickedColor(e.target.value)}
                  className="h-9 w-full cursor-pointer rounded-lg border border-border"
                />
              )}
              <Hint>
                a cor é lida da borda da imagem, que é onde o fundo está por definição. Se a arte
                encosta na borda, marque a cor na mão.
              </Hint>
            </ControlGroup>

            <ControlGroup step="03" label="Limpeza">
              <SliderRow
                label="Força da limpeza"
                value={strength}
                min={0}
                max={100}
                onChange={setStrength}
              />
              <SliderRow
                label="Proteção da arte"
                value={protection}
                min={0}
                max={100}
                onChange={setProtection}
              />
              <SliderRow
                label="Suavizar manchas"
                value={smoothing}
                min={0}
                max={100}
                onChange={setSmoothing}
              />
              <Hint>
                suba a <strong>força</strong> até a sujeira sumir. Se a arte começar a ser comida
                junto, suba a <strong>proteção</strong> em vez de baixar a força.
              </Hint>
            </ControlGroup>

            <div className="space-y-2 border-t border-border pt-4">
              <PrimaryAction
                className="w-full"
                disabled={!cleaned}
                onClick={() =>
                  canvasRef.current && downloadCanvasAsPng(canvasRef.current, `${baseName}.png`)
                }
              >
                Baixar PNG
              </PrimaryAction>
              <button
                type="button"
                onClick={reset}
                className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm font-semibold transition-colors hover:border-border-strong"
              >
                Limpar
              </button>
            </div>
          </>
        }
      >
        <PreviewStage
          title="Prévia da arte"
          caption="O fundo sai transparente; a arte fica intacta."
          status={
            original
              ? `${original.width} × ${original.height} px • fundo ${activeColor}`
              : "Sem imagem"
          }
          hint="Segure “Ver antes” para comparar com o original."
          actions={
            <button
              type="button"
              disabled={!original}
              onMouseDown={() => setShowBefore(true)}
              onMouseUp={() => setShowBefore(false)}
              onMouseLeave={() => setShowBefore(false)}
              onTouchStart={() => setShowBefore(true)}
              onTouchEnd={() => setShowBefore(false)}
              className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-semibold transition-colors hover:border-border-strong disabled:opacity-40"
            >
              Ver antes
            </button>
          }
        >
          {cleaned ? (
            <div className="relative rounded-xl bg-checkerboard p-4">
              <canvas
                ref={canvasRef}
                role="img"
                aria-label="Prévia do fundo limpo"
                className={`max-h-[60vh] max-w-full rounded-sm transition-opacity ${
                  isPending ? "opacity-50" : ""
                }`}
              />
              <span className="absolute top-3 left-3 rounded-md bg-background/85 px-2 py-1 font-mono text-[10px] font-bold tracking-wider">
                {showBefore ? "Antes / original" : "Depois / resultado"}
              </span>
            </div>
          ) : (
            <PreviewPlaceholder label="Envie uma imagem para começar" />
          )}
        </PreviewStage>
      </ToolLayout>
    </ToolPageShell>
  );
}
