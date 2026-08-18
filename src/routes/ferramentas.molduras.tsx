import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { applyFrame, FRAMES, type FrameStyle, type RGBAImage } from "@/lib/image-core";
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

export const Route = createFileRoute("/ferramentas/molduras")({
  head: () => ({ meta: [{ title: "Molduras PRO | Printzy" }] }),
  component: FramesTool,
});

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const THUMB = 76;

/**
 * A stand-in artwork the thumbnails are drawn over.
 *
 * The catalogue has to be legible before any image is loaded, and half the
 * frames work by removing alpha — over a blank swatch they would show nothing
 * at all, so the sample is a filled block with a hole in it. The hole also
 * demonstrates the rule that matters: frames trim only what reaches the
 * outside, so it survives every erosion style.
 */
function thumbSample(): RGBAImage {
  const data = new Uint8ClampedArray(THUMB * THUMB * 4);
  for (let y = 0; y < THUMB; y++) {
    for (let x = 0; x < THUMB; x++) {
      const i = (y * THUMB + x) * 4;
      const hole = Math.hypot(x - THUMB * 0.5, y - THUMB * 0.42) < THUMB * 0.13;
      data[i] = 226;
      data[i + 1] = 232;
      data[i + 2] = 245;
      data[i + 3] = hole ? 0 : 255;
    }
  }
  return { data, width: THUMB, height: THUMB };
}

function FrameThumb({
  style,
  active,
  roughness,
  seed,
}: {
  style: FrameStyle;
  active: boolean;
  roughness: number;
  seed: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    drawRGBAImage(
      ref.current,
      applyFrame(thumbSample(), {
        style,
        thickness: 34,
        inset: 4,
        roughness,
        seed,
        color: [17, 17, 24],
      }),
    );
  }, [style, roughness, seed]);
  return (
    <canvas
      ref={ref}
      aria-hidden
      className={`h-full w-full rounded-lg bg-checkerboard transition-opacity ${
        active ? "" : "opacity-80"
      }`}
    />
  );
}

function FramesTool() {
  const [original, setOriginal] = useState<RGBAImage | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [style, setStyle] = useState<FrameStyle>("grunge");
  const [thickness, setThickness] = useState(22);
  const [inset, setInset] = useState(0);
  const [roughness, setRoughness] = useState(55);
  const [seed, setSeed] = useState(1);
  const [color, setColor] = useState("#000000");
  const [showBefore, setShowBefore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const settings = useMemo(
    () => ({ style, thickness, inset, roughness, seed, color }),
    [style, thickness, inset, roughness, seed, color],
  );
  const debounced = useDebouncedValue(settings, 140);
  const isPending = debounced !== settings;

  const processed = useMemo<RGBAImage | null>(() => {
    if (!original) return null;
    return applyFrame(original, {
      style: debounced.style,
      thickness: debounced.thickness,
      inset: debounced.inset,
      roughness: debounced.roughness,
      seed: debounced.seed,
      color: hexToRgb(debounced.color),
    });
  }, [original, debounced]);

  useEffect(() => {
    const shown = showBefore ? original : processed;
    if (shown && canvasRef.current) drawRGBAImage(canvasRef.current, shown);
  }, [processed, original, showBefore]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const img = await loadImageFile(file);
      setOriginal(imageToRGBAImage(img));
      setFileName(file.name);
    } catch {
      setError("Não foi possível carregar essa imagem.");
    }
  }

  const active = FRAMES.find((f) => f.style === style)!;
  const baseName = `${fileName?.replace(/\.[^/.]+$/, "") || "imagem"}-moldura`;
  const isLine = active.family === "linha";

  return (
    <ToolPageShell
      title="Molduras Pro"
      subtitle="Aplique molduras corridas e bordas grunge na arte com PNG transparente."
    >
      <ToolLayout
        controls={
          <>
            <ControlGroup step="01" label="Imagem">
              <label className="block cursor-pointer rounded-xl border border-border-strong bg-accent/10 px-4 py-4 text-center transition-colors hover:bg-accent/15">
                <span className="block text-sm font-bold">Selecionar imagem</span>
                <span className="block text-xs text-muted-foreground">PNG transparente</span>
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
                    : "PNG dá o melhor resultado"}
                </p>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </ControlGroup>

            <ControlGroup step="02" label={`Molduras · ${FRAMES.length}`}>
              <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto pr-1">
                {FRAMES.map((f) => {
                  const on = f.style === style;
                  return (
                    <button
                      key={f.style}
                      type="button"
                      title={f.hint}
                      onClick={() => setStyle(f.style)}
                      className={`relative aspect-square rounded-xl border p-1 transition-colors ${
                        on
                          ? "border-accent bg-accent/15"
                          : "border-border bg-secondary hover:border-border-strong"
                      }`}
                    >
                      <FrameThumb style={f.style} active={on} roughness={roughness} seed={seed} />
                      <span className="absolute top-1.5 left-1.5 rounded bg-background/85 px-1 font-mono text-[9px] font-bold">
                        {f.number}
                      </span>
                      {on && (
                        <span className="absolute right-1.5 bottom-1.5 grid size-4 place-items-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs">
                <span className="font-bold">{active.label}</span>{" "}
                <span className="text-muted-foreground">— {active.hint}</span>
              </p>
            </ControlGroup>

            <ControlGroup step="03" label="Ajuste">
              <SliderRow
                label={isLine ? "Espessura" : "Profundidade"}
                value={thickness}
                min={1}
                max={100}
                onChange={setThickness}
              />
              <SliderRow label="Recuo" value={inset} min={0} max={100} onChange={setInset} />
              {!isLine && (
                <>
                  <SliderRow
                    label="Irregularidade"
                    value={roughness}
                    min={0}
                    max={100}
                    onChange={setRoughness}
                  />
                  <button
                    type="button"
                    onClick={() => setSeed((s) => s + 1)}
                    className="w-full rounded-lg border border-border bg-secondary px-2 py-2 text-xs font-semibold transition-colors hover:border-border-strong"
                  >
                    Sortear outra borda
                  </button>
                </>
              )}
              {isLine && (
                <label className="space-y-1">
                  <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                    Cor da moldura
                  </span>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-9 w-full cursor-pointer rounded-lg border border-border"
                  />
                </label>
              )}
              <Hint>
                {isLine
                  ? "molduras de linha são pintadas por cima da arte, então a cor importa."
                  : "molduras de borda comem a arte, e só o que encosta na parte de fora some — um vazado no meio do desenho não é tocado."}
              </Hint>
            </ControlGroup>

            <div className="border-t border-border pt-4">
              <PrimaryAction
                className="w-full"
                disabled={!processed}
                onClick={() =>
                  canvasRef.current && downloadCanvasAsPng(canvasRef.current, `${baseName}.png`)
                }
              >
                Baixar PNG
              </PrimaryAction>
            </div>
          </>
        }
      >
        <PreviewStage
          title="Prévia da arte"
          caption={`${active.number} · ${active.label} — ${active.hint}`}
          status={original ? `${original.width} × ${original.height} px` : "Sem imagem"}
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
          {processed ? (
            <div className="relative rounded-xl bg-checkerboard p-4">
              <canvas
                ref={canvasRef}
                role="img"
                aria-label="Prévia da moldura"
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
