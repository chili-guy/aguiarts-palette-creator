import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ACTION_LEVELS,
  DEFAULT_LEVELS,
  isolateArtwork,
  type BackgroundKind,
  FUSION_STRENGTH,
  PHOTOSHOP_ACTION,
  gridSpacing,
  halftone,
  lpiToLpc,
  type ColorMode,
  type GarmentTone,
  type RGBAImage,
  type ToneCurve,
  type ToneSource,
} from "@/lib/image-core";
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
import { drawRGBAImage, loadImageFile, resampleImageToRGBA } from "@/lib/canvas-tools";
import { downloadCanvasAsPdf } from "@/lib/export";
import { downloadCanvasAsPng } from "@/lib/canvas-tools";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export const Route = createFileRoute("/ferramentas/halftone")({
  head: () => ({ meta: [{ title: "Halftone DTF/DTG | Printzy" }] }),
  component: HalftoneTool,
});

/**
 * The screen is defined in print units, so the art is resampled to the chosen
 * sheet size and DPI before the dots are generated — same order as the
 * Photoshop action (set resolution, then convert to Bitmap/Halftone Screen).
 */
const SHEETS = {
  a4: { label: "A4", cm: [21, 29.7] },
  a3: { label: "A3", cm: [29.7, 42] },
  a2: { label: "A2", cm: [42, 59.4] },
} as const;

type ArtSize = "original" | keyof typeof SHEETS | "custom";

/** Above ~40 MP an RGBA buffer starts costing more RAM than a browser tab has. */
const MAX_OUTPUT_PX = 40_000_000;
/** The preview is screened at reduced size with a matching grid, so it reads the same. */
const PREVIEW_MAX_EDGE = 1400;

const CM_PER_INCH = 2.54;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function HalftoneTool() {
  const [source, setSource] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<null | "png" | "pdf">(null);

  // Everything below defaults to the values read off Rodrigo's verified action.
  const [background, setBackground] = useState<BackgroundKind>("claro");
  const [bgTolerance, setBgTolerance] = useState(50);
  const [garment, setGarment] = useState<GarmentTone>("dark");
  const [toneSource, setToneSource] = useState<ToneSource>("valor");
  const [artSize, setArtSize] = useState<ArtSize>("original");
  const [customCm, setCustomCm] = useState({ w: 30, h: 40 });
  const [dpi, setDpi] = useState<number>(PHOTOSHOP_ACTION.dpi);
  const [lpi, setLpi] = useState<number>(PHOTOSHOP_ACTION.lpi);
  const [angle, setAngle] = useState<number>(PHOTOSHOP_ACTION.angle);
  const [dotAspect, setDotAspect] = useState<number>(PHOTOSHOP_ACTION.dotAspect);
  const [strength, setStrength] = useState(1.25);
  const [toneCurve, setToneCurve] = useState<ToneCurve>("area");
  const [colorMode, setColorMode] = useState<ColorMode>("mono");
  const [inkColor, setInkColor] = useState("#ffffff");
  const [fabricColor, setFabricColor] = useState("#111111");
  const [black, setBlack] = useState(ACTION_LEVELS.black);
  const [white, setWhite] = useState(ACTION_LEVELS.white);
  const [gamma, setGamma] = useState(ACTION_LEVELS.gamma);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  /** Output pixel size for the chosen art size, clamped to what fits in memory. */
  const output = useMemo(() => {
    if (!source) return null;
    const nw = source.naturalWidth;
    const nh = source.naturalHeight;

    let w = nw;
    let h = nh;
    if (artSize !== "original") {
      const [cmW, cmH] =
        artSize === "custom"
          ? [Math.max(1, customCm.w), Math.max(1, customCm.h)]
          : SHEETS[artSize].cm;
      // Fit the art inside the sheet rather than letterboxing it, so the export
      // is the artwork itself at print size with no transparent margin.
      const boxW = (cmW / CM_PER_INCH) * dpi;
      const boxH = (cmH / CM_PER_INCH) * dpi;
      const k = Math.min(boxW / nw, boxH / nh);
      w = nw * k;
      h = nh * k;
    }

    const clamp = Math.min(1, Math.sqrt(MAX_OUTPUT_PX / (w * h)));
    return {
      width: Math.max(1, Math.round(w * clamp)),
      height: Math.max(1, Math.round(h * clamp)),
      clamped: clamp < 1,
    };
  }, [source, artSize, customCm, dpi]);

  const options = useMemo(
    () => ({
      lpi,
      dpi,
      angle,
      dotAspect,
      strength,
      garment,
      toneCurve,
      toneSource,
      colorMode,
      background,
      bgTolerance,
      levels: { black, white, gamma },
      inkColor: hexToRgb(inkColor),
    }),
    [
      lpi,
      dpi,
      angle,
      dotAspect,
      strength,
      garment,
      toneCurve,
      toneSource,
      colorMode,
      background,
      bgTolerance,
      black,
      white,
      gamma,
      inkColor,
    ],
  );

  // Screening touches every pixel nine times per channel; debounce so dragging
  // a slider doesn't queue a full re-render on every tick.
  const debounced = useDebouncedValue(options, 180);
  const isPending = debounced !== options;

  const preview = useMemo<RGBAImage | null>(() => {
    if (!source || !output) return null;
    const scale = Math.min(1, PREVIEW_MAX_EDGE / Math.max(output.width, output.height));
    const w = Math.max(1, Math.round(output.width * scale));
    const h = Math.max(1, Math.round(output.height * scale));
    // Clear the background before screening. Without this the screen reads an
    // opaque backdrop as artwork, and on a dark garment a light backdrop asks
    // for full ink across the whole sheet — the negative of the design.
    const art = isolateArtwork(resampleImageToRGBA(source, w, h), {
      kind: debounced.background,
      tolerance: debounced.bgTolerance,
    });
    // The same `scale` goes into the screen, so the preview's dots land exactly
    // where the full-resolution export's will.
    return halftone(art, { ...debounced, scale });
  }, [source, output, debounced]);

  useEffect(() => {
    if (preview && canvasRef.current) drawRGBAImage(canvasRef.current, preview);
  }, [preview]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const img = await loadImageFile(file);
      setSource(img);
      setFileName(file.name);
    } catch {
      setError("Não foi possível carregar essa imagem.");
    }
  }

  /** Renders the screen once at full output resolution, for export only. */
  function renderFullSize(): HTMLCanvasElement {
    if (!source || !output) throw new Error("no image");
    const canvas = document.createElement("canvas");
    const art = isolateArtwork(resampleImageToRGBA(source, output.width, output.height), {
      kind: background,
      tolerance: bgTolerance,
    });
    drawRGBAImage(canvas, halftone(art, options));
    return canvas;
  }

  async function handleExport(kind: "png" | "pdf") {
    if (!source || !output) return;
    setExporting(kind);
    setError(null);
    // Yield first so the button can paint its busy state before the main thread
    // disappears into a full-resolution render.
    await new Promise((r) => setTimeout(r, 0));
    try {
      const canvas = renderFullSize();
      if (kind === "png") downloadCanvasAsPng(canvas, `${baseName}.png`);
      else await downloadCanvasAsPdf(canvas, `${baseName}.pdf`, dpi);
    } catch {
      setError("Não foi possível gerar o arquivo nessa resolução. Tente um DPI menor.");
    } finally {
      setExporting(null);
    }
  }

  function restoreAction() {
    setLpi(PHOTOSHOP_ACTION.lpi);
    setAngle(PHOTOSHOP_ACTION.angle);
    setDpi(PHOTOSHOP_ACTION.dpi);
    setDotAspect(PHOTOSHOP_ACTION.dotAspect);
    setStrength(1.25);
    setToneCurve("area");
    setToneSource("valor");
    setBlack(ACTION_LEVELS.black);
    setWhite(ACTION_LEVELS.white);
    setGamma(ACTION_LEVELS.gamma);
  }

  const baseName = `${fileName?.replace(/\.[^/.]+$/, "") || "imagem"}-halftone`;
  const spacing = gridSpacing(dpi, lpi);
  const status = output
    ? `${output.width} × ${output.height} px • ${dpi} DPI • ${lpi} LPI (${lpiToLpc(lpi).toFixed(2)} l/cm) • ponto a cada ${spacing.toFixed(2)} px`
    : "Sem imagem";

  return (
    <ToolPageShell
      title="Halftone DTF Pro"
      subtitle="Crie halftone e tramados para DTF/DTG em poucos cliques."
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
                  {source
                    ? `${source.naturalWidth} × ${source.naturalHeight} px`
                    : "PNG com fundo transparente dá o melhor resultado"}
                </p>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </ControlGroup>

            <ControlGroup step="02" label="Tipo de fundo">
              <OptionPills<BackgroundKind>
                columns={1}
                value={background}
                onChange={setBackground}
                options={[
                  { value: "claro", label: "Fundo claro", note: "remove branco e cinza claro" },
                  {
                    value: "escuro",
                    label: "Fundo escuro",
                    note: "ideal para artes em fundo preto",
                  },
                  { value: "colorido", label: "Fundo colorido", note: "remove a cor do fundo" },
                  {
                    value: "transparente",
                    label: "Já sem fundo",
                    note: "PNG que já veio recortado",
                  },
                ]}
              />
              {background !== "transparente" && (
                <SliderRow
                  label="Tolerância"
                  value={bgTolerance}
                  min={0}
                  max={100}
                  onChange={setBgTolerance}
                />
              )}
              <Hint>
                escolha o fundo mais parecido com a imagem para a limpeza ficar mais precisa. Sem
                isso o fundo entra na conta como se fosse arte e sai reticulado junto.
              </Hint>
            </ControlGroup>

            <ControlGroup step="03" label="Tipo de peça">
              <OptionPills<GarmentTone>
                columns={1}
                value={garment}
                onChange={setGarment}
                options={[
                  { value: "dark", label: "Peça escura", note: "a tinta pinta o claro da arte" },
                  { value: "light", label: "Peça clara", note: "a tinta pinta o escuro da arte" },
                ]}
              />
              <Hint>
                em peça escura o ponto cresce onde a arte é clara e forte, que é como a action do
                Photoshop foi calibrada. Em peça clara a lógica inverte, como numa retícula comum.
              </Hint>
            </ControlGroup>

            <ControlGroup step="04" label="Tamanho da arte">
              <OptionPills<ArtSize>
                value={artSize}
                onChange={setArtSize}
                options={[
                  { value: "original", label: "Original" },
                  { value: "a4", label: "A4" },
                  { value: "a3", label: "A3" },
                  { value: "a2", label: "A2" },
                  { value: "custom", label: "Person." },
                ]}
              />
              {artSize === "custom" && (
                <div className="grid grid-cols-2 gap-2">
                  {(["w", "h"] as const).map((axis) => (
                    <label key={axis} className="space-y-1">
                      <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                        {axis === "w" ? "Largura (cm)" : "Altura (cm)"}
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={customCm[axis]}
                        onChange={(e) =>
                          setCustomCm((c) => ({ ...c, [axis]: Number(e.target.value) }))
                        }
                        className="w-full rounded-lg border border-border bg-secondary px-2 py-1.5 text-sm"
                      />
                    </label>
                  ))}
                </div>
              )}
              {output?.clamped && (
                <p className="text-xs text-destructive">
                  Resolução reduzida para caber na memória do navegador. Baixe o DPI para exportar
                  no tamanho cheio.
                </p>
              )}
            </ControlGroup>

            <ControlGroup step="05" label="Qualidade da imagem">
              <OptionPills<number>
                value={dpi}
                onChange={setDpi}
                options={[300, 600, 1200].map((v) => ({ value: v, label: String(v) }))}
              />
              <Hint>
                300 DPI já resolve a maioria dos trabalhos — é a base de 118,11 px/cm da action. Use
                600 ou 1200 para arquivos maiores e mais detalhados.
              </Hint>
            </ControlGroup>

            <ControlGroup step="06" label="Frequência da retícula">
              <OptionPills<number>
                value={lpi}
                onChange={setLpi}
                options={[30, 35, 40, 45, 50].map((v) => ({ value: v, label: String(v) }))}
              />
              <Hint>
                em LPI (linhas por polegada). <strong>35 LPI = 13,78 linhas/cm</strong>, o valor
                conferido na action. Valores menores deixam os pontos maiores e mais separados.
              </Hint>
            </ControlGroup>

            <ControlGroup step="07" label="Forma e ângulo do ponto">
              <OptionPills<number>
                columns={2}
                value={dotAspect}
                onChange={setDotAspect}
                options={[
                  { value: PHOTOSHOP_ACTION.dotAspect, label: "Elipse" },
                  { value: 1, label: "Redondo" },
                ]}
              />
              <SliderRow
                label="Ângulo"
                value={angle}
                min={0}
                max={90}
                step={1}
                suffix="°"
                onChange={setAngle}
              />
              <Hint>
                22° é o ângulo verificado na action. 45° é o clássico de preto; 15° e 75° evitam
                moiré quando a arte tem trama própria.
              </Hint>
            </ControlGroup>

            <ControlGroup step="08" label="Força do ponto">
              <SliderRow
                label="Força"
                value={strength}
                min={0.5}
                max={2}
                step={0.05}
                onChange={setStrength}
              />
              <Hint>
                multiplica o raio máximo do ponto. A partir de{" "}
                <strong>{FUSION_STRENGTH.toFixed(2)}</strong> as áreas 100% cheias fecham totalmente
                e viram bloco sólido — 1,25 deixa a retícula visível só nos degradês, sombras e nas
                bordas que somem no transparente.
              </Hint>
            </ControlGroup>

            <ControlGroup step="09" label="Níveis">
              <SliderRow
                label="Preto de entrada"
                value={black}
                min={0}
                max={0.9}
                step={0.01}
                onChange={setBlack}
              />
              <SliderRow
                label="Branco de entrada"
                value={white}
                min={0.1}
                max={1}
                step={0.01}
                onChange={setWhite}
              />
              <SliderRow
                label="Gama"
                value={gamma}
                min={0.3}
                max={3}
                step={0.05}
                onChange={setGamma}
              />
              <OptionPills<ToneCurve>
                columns={2}
                value={toneCurve}
                onChange={setToneCurve}
                options={[
                  { value: "area", label: "Área" },
                  { value: "linear", label: "Linear" },
                ]}
              />
              <OptionPills<ToneSource>
                columns={2}
                value={toneSource}
                onChange={setToneSource}
                options={[
                  { value: "valor", label: "Cor viva" },
                  { value: "luma", label: "Brilho" },
                ]}
              />
              <Hint>
                "Área" é como a retícula de verdade se comporta — o que o olho lê como tom é a área
                do ponto, não o raio. <strong>"Cor viva"</strong> trata vermelho e roxo saturados
                como cor cheia, que é o que fecha sólido na peça escura; "Brilho" usa a luminância e
                deixa esses tons ralos.
              </Hint>
            </ControlGroup>

            <ControlGroup step="10" label="Cor">
              <OptionPills<ColorMode>
                columns={1}
                value={colorMode}
                onChange={setColorMode}
                options={[
                  { value: "mono", label: "Monocromático", note: "uma tinta só, como a action" },
                  { value: "rgb", label: "Colorido", note: "separa R, G e B em 3 ângulos" },
                ]}
              />
              <div className="grid grid-cols-2 gap-3">
                {colorMode === "mono" && (
                  <label className="space-y-1">
                    <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                      Cor da tinta
                    </span>
                    <input
                      type="color"
                      value={inkColor}
                      onChange={(e) => setInkColor(e.target.value)}
                      className="h-9 w-full cursor-pointer rounded-lg border border-border"
                    />
                  </label>
                )}
                <label className="space-y-1">
                  <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                    Cor do tecido
                  </span>
                  <input
                    type="color"
                    value={fabricColor}
                    onChange={(e) => setFabricColor(e.target.value)}
                    className="h-9 w-full cursor-pointer rounded-lg border border-border"
                  />
                </label>
              </div>
              <Hint>
                a cor do tecido é só prévia. O arquivo exportado sai transparente, com os pontos de
                tinta e mais nada.
              </Hint>
            </ControlGroup>

            <div className="space-y-2 border-t border-border pt-4">
              <PrimaryAction
                className="w-full"
                disabled={!source || exporting !== null}
                onClick={() => handleExport("png")}
              >
                {exporting === "png" ? "Gerando…" : "Baixar PNG"}
              </PrimaryAction>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!source || exporting !== null}
                  onClick={() => handleExport("pdf")}
                  className="rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm font-semibold transition-colors hover:border-border-strong disabled:opacity-40"
                >
                  {exporting === "pdf" ? "Gerando…" : "Baixar PDF"}
                </button>
                <button
                  type="button"
                  onClick={restoreAction}
                  className="rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm font-semibold transition-colors hover:border-border-strong"
                >
                  Padrão da action
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                A exportação é gerada em {dpi} DPI no tamanho cheio, não a partir da prévia.
              </p>
            </div>
          </>
        }
      >
        <PreviewStage
          title="Prévia da arte"
          caption={`Grayscale → níveis → tela de meio-tom ${dotAspect === 1 ? "redonda" : "elíptica"} a ${angle}°`}
          status={status}
          hint="A prévia é reduzida; os pontos ficam na mesma posição do arquivo final."
        >
          {preview ? (
            <div
              className="relative rounded-xl p-4 transition-colors"
              style={{ backgroundColor: fabricColor }}
            >
              <canvas
                ref={canvasRef}
                role="img"
                aria-label="Prévia do halftone"
                className={`max-h-[60vh] max-w-full rounded-sm transition-opacity ${
                  isPending ? "opacity-50" : ""
                }`}
              />
              {isPending && (
                <span className="absolute right-3 bottom-3 rounded-md bg-background/90 px-2 py-1 font-mono text-[10px] font-bold">
                  Recalculando…
                </span>
              )}
            </div>
          ) : (
            <PreviewPlaceholder label="Envie uma imagem para começar" />
          )}
        </PreviewStage>
      </ToolLayout>
    </ToolPageShell>
  );
}
