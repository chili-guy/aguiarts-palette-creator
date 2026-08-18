import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { enhance, type EnhanceMode, type RGBAImage } from "@/lib/image-core";
import { ToolPageShell } from "@/components/tool-page-shell";
import {
  ControlGroup,
  Hint,
  OptionPills,
  PreviewPlaceholder,
  PreviewStage,
  PrimaryAction,
  SliderRow,
  ToolLayout,
} from "@/components/tool-ui";
import {
  canvasToJpgBlob,
  downloadBlob,
  downloadCanvasAsPng,
  drawRGBAImage,
  loadImageFile,
  resampleImageToRGBA,
} from "@/lib/canvas-tools";

export const Route = createFileRoute("/ferramentas/melhorador")({
  head: () => ({ meta: [{ title: "Melhorador de Imagem Pro | Printzy" }] }),
  component: EnhancerTool,
});

type Item = {
  name: string;
  image: HTMLImageElement;
  /** Filled once the item has been through the enhancer. */
  result?: RGBAImage;
};

/** Guard against a 4x upscale of an already-large photo eating all the memory. */
const MAX_OUTPUT_PX = 40_000_000;

function EnhancerTool() {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState(0);
  const [scale, setScale] = useState(2);
  const [mode, setMode] = useState<EnhanceMode>("rapida");
  const [extraSharpen, setExtraSharpen] = useState(0);
  const [format, setFormat] = useState<"png" | "jpg">("png");
  const [busy, setBusy] = useState<string | null>(null);
  const [showBefore, setShowBefore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const current = items[active];
  const done = items.filter((i) => i.result).length;

  useEffect(() => {
    if (!current || !canvasRef.current) return;
    if (showBefore || !current.result) {
      drawRGBAImage(
        canvasRef.current,
        resampleImageToRGBA(current.image, current.image.naturalWidth, current.image.naturalHeight),
      );
    } else {
      drawRGBAImage(canvasRef.current, current.result);
    }
  }, [current, showBefore]);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setError(null);
    try {
      const loaded = await Promise.all(
        files.map(async (f) => ({ name: f.name, image: await loadImageFile(f) })),
      );
      setItems((prev) => [...prev, ...loaded]);
      setActive((prev) => (items.length === 0 ? 0 : prev));
    } catch {
      setError("Não foi possível carregar uma das imagens.");
    }
  }

  /** Scales the item up, then runs the mode's chain over the scaled pixels. */
  function process(item: Item): RGBAImage {
    const w = item.image.naturalWidth * scale;
    const h = item.image.naturalHeight * scale;
    const fit = Math.min(1, Math.sqrt(MAX_OUTPUT_PX / (w * h)));
    const scaled = resampleImageToRGBA(item.image, w * fit, h * fit);
    return enhance(scaled, { mode, extraSharpen });
  }

  async function runAll() {
    if (items.length === 0) return;
    setError(null);
    for (let i = 0; i < items.length; i++) {
      setBusy(`Melhorando ${i + 1} de ${items.length}…`);
      // Yield between images so the counter actually repaints.
      await new Promise((r) => setTimeout(r, 0));
      try {
        const result = process(items[i]!);
        setItems((prev) => prev.map((it, k) => (k === i ? { ...it, result } : it)));
      } catch {
        setError("Uma das imagens é grande demais nessa escala. Tente 2× em vez de 4×.");
        break;
      }
    }
    setBusy(null);
  }

  async function download(item: Item) {
    if (!item.result) return;
    const canvas = document.createElement("canvas");
    drawRGBAImage(canvas, item.result);
    const base = `${item.name.replace(/\.[^/.]+$/, "")}-melhorado`;
    if (format === "png") downloadCanvasAsPng(canvas, `${base}.png`);
    else downloadBlob(await canvasToJpgBlob(canvas), `${base}.jpg`);
  }

  async function downloadAll() {
    for (const item of items) await download(item);
  }

  const status = current
    ? current.result
      ? `${current.result.width} × ${current.result.height} px • ${scale}× • ${
          mode === "rapida" ? "Melhoria rápida" : "Super HD"
        }`
      : `${current.image.naturalWidth} × ${current.image.naturalHeight} px • ainda não melhorada`
    : "Sem imagem";

  return (
    <ToolPageShell
      title="Melhorador de Imagem Pro"
      subtitle="Melhore imagens e prepare arquivos para produção."
    >
      <ToolLayout
        controls={
          <>
            <ControlGroup step="01" label="Imagens">
              <label className="block cursor-pointer rounded-xl border border-border-strong bg-accent/10 px-4 py-4 text-center transition-colors hover:bg-accent/15">
                <span className="block text-sm font-bold">Subir imagens</span>
                <span className="block text-xs text-muted-foreground">
                  PNG, JPG ou WebP • lote liberado
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFiles}
                  className="sr-only"
                />
              </label>
              {items.length > 0 ? (
                <div className="max-h-44 space-y-1 overflow-y-auto">
                  {items.map((it, i) => (
                    <button
                      key={`${it.name}-${i}`}
                      type="button"
                      onClick={() => setActive(i)}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors ${
                        i === active
                          ? "border-transparent bg-accent text-accent-foreground"
                          : "border-border bg-secondary hover:border-border-strong"
                      }`}
                    >
                      <span className="truncate font-semibold">{it.name}</span>
                      {it.result && <span className="shrink-0 font-mono text-[10px]">✓</span>}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-secondary px-3 py-2.5">
                  <p className="text-xs font-bold">Nenhuma imagem carregada</p>
                </div>
              )}
              <div className="flex items-center justify-between rounded-xl border border-border bg-secondary px-3 py-2">
                <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  Total
                </span>
                <span className="font-mono text-xs font-bold text-accent">
                  {done}/{items.length}
                </span>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </ControlGroup>

            <ControlGroup step="02" label="Escala">
              <OptionPills<number>
                value={scale}
                onChange={setScale}
                options={[1, 2, 3, 4].map((v) => ({ value: v, label: `${v}×` }))}
              />
              <Hint>
                a escala multiplica a resolução, não inventa detalhe que não existe. Para uma arte
                pequena demais, o Vetorizador costuma dar resultado melhor que 4×.
              </Hint>
            </ControlGroup>

            <ControlGroup step="03" label="Modo">
              <OptionPills<EnhanceMode>
                columns={1}
                value={mode}
                onChange={setMode}
                options={[
                  {
                    value: "rapida",
                    label: "Melhoria rápida",
                    note: "processa mais rápido e já melhora a nitidez",
                  },
                  {
                    value: "super-hd",
                    label: "Super HD",
                    note: "qualidade mais forte, com reforço extra de detalhe",
                  },
                ]}
              />
              <SliderRow
                label="Nitidez extra"
                value={extraSharpen}
                min={0}
                max={60}
                onChange={setExtraSharpen}
              />
            </ControlGroup>

            <ControlGroup step="04" label="Formato">
              <OptionPills<"png" | "jpg">
                columns={2}
                value={format}
                onChange={setFormat}
                options={[
                  { value: "png", label: "PNG" },
                  { value: "jpg", label: "JPG" },
                ]}
              />
              <Hint>
                PNG mantém a transparência. JPG achata o que for transparente em branco, então use
                só para foto.
              </Hint>
            </ControlGroup>

            <div className="space-y-2 border-t border-border pt-4">
              <PrimaryAction
                className="w-full"
                disabled={items.length === 0 || busy !== null}
                onClick={runAll}
              >
                {busy ?? "Melhorar imagem"}
              </PrimaryAction>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!current?.result}
                  onClick={() => current && download(current)}
                  className="rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm font-semibold transition-colors hover:border-border-strong disabled:opacity-40"
                >
                  Baixar
                </button>
                <button
                  type="button"
                  disabled={done === 0}
                  onClick={downloadAll}
                  className="rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm font-semibold transition-colors hover:border-border-strong disabled:opacity-40"
                >
                  Baixar todas
                </button>
              </div>
            </div>
          </>
        }
      >
        <PreviewStage
          title="Prévia da arte"
          caption="Escala e nitidez aplicadas na imagem selecionada."
          status={status}
          hint="Segure “Comparar” para ver a imagem original."
          actions={
            <button
              type="button"
              disabled={!current?.result}
              onMouseDown={() => setShowBefore(true)}
              onMouseUp={() => setShowBefore(false)}
              onMouseLeave={() => setShowBefore(false)}
              onTouchStart={() => setShowBefore(true)}
              onTouchEnd={() => setShowBefore(false)}
              className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-semibold transition-colors hover:border-border-strong disabled:opacity-40"
            >
              Comparar
            </button>
          }
        >
          {current ? (
            <div className="relative rounded-xl bg-checkerboard p-4">
              <canvas
                ref={canvasRef}
                role="img"
                aria-label="Prévia da imagem melhorada"
                className="max-h-[60vh] max-w-full rounded-sm"
              />
              <span className="absolute top-3 left-3 rounded-md bg-background/85 px-2 py-1 font-mono text-[10px] font-bold tracking-wider">
                {showBefore || !current.result ? "Antes / original" : "Depois / resultado"}
              </span>
            </div>
          ) : (
            <PreviewPlaceholder label="Envie uma ou várias imagens" />
          )}
        </PreviewStage>
      </ToolLayout>
    </ToolPageShell>
  );
}
