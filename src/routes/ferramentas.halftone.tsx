import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_PRESET_ID,
  HALFTONE_PRESETS,
  isolateArtwork,
  knockoutHalftone,
  type BackgroundKind,
  type HalftonePreset,
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
import { generateHalftoneAI, type AiStyle } from "@/lib/ai/halftone-ai";
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
type Engine = "screen" | "ai";
type AiPhase = "idle" | "running" | "done" | "error";

/** Above ~40 MP an RGBA buffer starts costing more RAM than a browser tab has. */
const MAX_OUTPUT_PX = 40_000_000;
/** The preview is screened at reduced size with a matching grid, so it reads the same. */
const PREVIEW_MAX_EDGE = 1400;
/** The AI engine is billed per image and the models bucket to ~1 MP anyway. */
const AI_MAX_EDGE = 1024;

const CM_PER_INCH = 2.54;

const DEFAULT_PRESET =
  HALFTONE_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID) ?? HALFTONE_PRESETS[0]!;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Loads a data: URI into a fresh canvas, for export of the AI result. */
function dataUrlToCanvas(url: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d");
      if (!ctx) return reject(new Error("no 2d context"));
      ctx.drawImage(img, 0, 0);
      resolve(c);
    };
    img.onerror = () => reject(new Error("failed to decode AI image"));
    img.src = url;
  });
}

function dataUrlToRGBA(url: string): Promise<RGBAImage> {
  return dataUrlToCanvas(url).then((c) => {
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    const d = ctx.getImageData(0, 0, c.width, c.height);
    return { data: d.data, width: c.width, height: c.height };
  });
}

interface AiRenderOpts {
  garment: GarmentTone;
  style: AiStyle;
  ink: [number, number, number];
  knockout: boolean;
  contrast: number;
  invert: boolean;
}

/**
 * Turns the raw AI render into the canvas shown / exported: for the one-ink
 * styles that means keying the model's opaque field out and repainting the dots
 * in the chosen ink, so it drops straight onto the garment.
 */
async function aiResultToCanvas(url: string, o: AiRenderOpts): Promise<HTMLCanvasElement> {
  if (!o.knockout || o.style === "color") return dataUrlToCanvas(url);
  const rgba = await dataUrlToRGBA(url);
  // The one-ink prompt always returns black dots on white; keep the white out
  // and repaint the dots in the chosen ink (white for a dark garment).
  const knocked = knockoutHalftone(rgba, {
    background: "white",
    ink: o.ink,
    contrast: o.contrast,
    invert: o.invert,
  });
  const c = document.createElement("canvas");
  drawRGBAImage(c, knocked);
  return c;
}

function HalftoneTool() {
  const [source, setSource] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<null | "png" | "pdf">(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [engine, setEngine] = useState<Engine>("screen");

  // The tool opens on a preset; every tunable below is seeded from it and the
  // preset row falls back to "Personalizado" the moment one is touched by hand.
  const [presetId, setPresetId] = useState<string>(DEFAULT_PRESET.id);

  const [background, setBackground] = useState<BackgroundKind>("claro");
  const [bgTolerance, setBgTolerance] = useState(35);
  const [garment, setGarment] = useState<GarmentTone>(DEFAULT_PRESET.garment);
  const [toneSource, setToneSource] = useState<ToneSource>(DEFAULT_PRESET.toneSource);
  const [artSize, setArtSize] = useState<ArtSize>("original");
  const [customCm, setCustomCm] = useState({ w: 30, h: 40 });
  const [dpi, setDpi] = useState<number>(PHOTOSHOP_ACTION.dpi);
  const [lpi, setLpi] = useState<number>(DEFAULT_PRESET.lpi);
  const [angle, setAngle] = useState<number>(DEFAULT_PRESET.angle);
  const [dotAspect, setDotAspect] = useState<number>(DEFAULT_PRESET.dotAspect);
  const [strength, setStrength] = useState(DEFAULT_PRESET.strength);
  const [solidThreshold, setSolidThreshold] = useState(DEFAULT_PRESET.solidThreshold);
  const [dotGain, setDotGain] = useState(DEFAULT_PRESET.dotGain);
  const [toneCurve, setToneCurve] = useState<ToneCurve>(DEFAULT_PRESET.toneCurve);
  const [colorMode, setColorMode] = useState<ColorMode>("mono");
  const [screenSelective, setScreenSelective] = useState(false);
  const [screenSelectiveStrength, setScreenSelectiveStrength] = useState(0.5);
  const [inkColor, setInkColor] = useState("#ffffff");
  const [fabricColor, setFabricColor] = useState("#111111");
  const [black, setBlack] = useState(DEFAULT_PRESET.levels.black);
  const [white, setWhite] = useState(DEFAULT_PRESET.levels.white);
  const [gamma, setGamma] = useState(DEFAULT_PRESET.levels.gamma);

  // AI engine.
  const [aiStyle, setAiStyle] = useState<AiStyle>("mono");
  const [aiIntensity, setAiIntensity] = useState(0.7);
  const [aiNotes, setAiNotes] = useState("");
  const [aiKnockout, setAiKnockout] = useState(true);
  const [aiContrast, setAiContrast] = useState(0.5);
  const [aiInvert, setAiInvert] = useState(false);
  const [aiSelective, setAiSelective] = useState(true);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiPhase, setAiPhase] = useState<AiPhase>("idle");
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiElapsed, setAiElapsed] = useState(0);
  const [aiProvider, setAiProvider] = useState<string | null>(null);
  /** Bumped on every new run / cancel so a stale run's result is ignored. */
  const aiRun = useRef(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  function applyPreset(p: HalftonePreset) {
    setPresetId(p.id);
    setGarment(p.garment);
    setToneSource(p.toneSource);
    setToneCurve(p.toneCurve);
    setLpi(p.lpi);
    setAngle(p.angle);
    setDotAspect(p.dotAspect);
    setStrength(p.strength);
    setSolidThreshold(p.solidThreshold);
    setDotGain(p.dotGain);
    setBlack(p.levels.black);
    setWhite(p.levels.white);
    setGamma(p.levels.gamma);
    setFabricColor(p.garment === "light" ? "#f2f2f2" : "#111111");
    setInkColor(p.garment === "light" ? "#111111" : "#ffffff");
  }

  /** Wraps a setter so any hand tweak drops the preset back to "Personalizado". */
  function tweak<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPresetId("custom");
    };
  }

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
      solidThreshold,
      dotGain,
      garment,
      toneCurve,
      toneSource,
      colorMode,
      selective: screenSelective,
      selectiveStrength: screenSelectiveStrength,
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
      solidThreshold,
      dotGain,
      garment,
      toneCurve,
      toneSource,
      colorMode,
      screenSelective,
      screenSelectiveStrength,
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
  const isPending = engine === "screen" && debounced !== options;

  const preview = useMemo<RGBAImage | null>(() => {
    if (engine !== "screen" || !source || !output) return null;
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
  }, [engine, source, output, debounced]);

  useEffect(() => {
    if (engine === "screen" && preview && canvasRef.current) drawRGBAImage(canvasRef.current, preview);
  }, [engine, preview]);

  // Paint the AI result onto the same canvas — after the DTF knockout, so the
  // preview shows exactly what will be exported and it sits right on the fabric.
  useEffect(() => {
    if (engine !== "ai" || !aiResult || !canvasRef.current) return;
    let stale = false;
    const dest = canvasRef.current;
    aiResultToCanvas(aiResult, {
      garment,
      style: aiStyle,
      ink: hexToRgb(inkColor),
      knockout: aiKnockout,
      contrast: aiContrast,
      invert: aiInvert,
    })
      .then((c) => {
        if (stale) return;
        dest.width = c.width;
        dest.height = c.height;
        const ctx = dest.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, dest.width, dest.height);
        ctx.drawImage(c, 0, 0);
      })
      .catch(() => {});
    return () => {
      stale = true;
    };
  }, [engine, aiResult, garment, aiStyle, inkColor, aiKnockout, aiContrast, aiInvert]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const img = await loadImageFile(file);
      setSource(img);
      setFileName(file.name);
      resetAI();
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
    if (!source) return;
    setExporting(kind);
    setError(null);
    // Yield first so the button can paint its busy state before the main thread
    // disappears into a full-resolution render.
    await sleep(0);
    try {
      let canvas: HTMLCanvasElement;
      if (engine === "ai") {
        if (!aiResult) throw new Error("Gere a arte com IA antes de exportar.");
        canvas = await aiResultToCanvas(aiResult, {
          garment,
          style: aiStyle,
          ink: hexToRgb(inkColor),
          knockout: aiKnockout,
          contrast: aiContrast,
          invert: aiInvert,
        });
      } else {
        canvas = renderFullSize();
      }
      const name = engine === "ai" ? `${baseName}-ia` : baseName;
      if (kind === "png") downloadCanvasAsPng(canvas, `${name}.png`);
      else await downloadCanvasAsPdf(canvas, `${name}.pdf`, dpi);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível gerar o arquivo nessa resolução. Tente um DPI menor.",
      );
    } finally {
      setExporting(null);
    }
  }

  function restoreAction() {
    applyPreset(DEFAULT_PRESET);
  }

  function resetAI() {
    aiRun.current++;
    setAiResult(null);
    setAiPhase("idle");
    setAiError(null);
    setAiElapsed(0);
    setAiProvider(null);
  }

  function cancelAI() {
    aiRun.current++;
    setAiPhase("idle");
  }

  /** The isolated artwork, capped to AI_MAX_EDGE, as a PNG data: URI. */
  function buildAiInput(): string {
    if (!source) throw new Error("no image");
    const k = Math.min(1, AI_MAX_EDGE / Math.max(source.naturalWidth, source.naturalHeight));
    const w = Math.max(1, Math.round(source.naturalWidth * k));
    const h = Math.max(1, Math.round(source.naturalHeight * k));
    const art = isolateArtwork(resampleImageToRGBA(source, w, h), {
      kind: background,
      tolerance: bgTolerance,
    });
    // Flatten the cut-out onto white so the model gets an opaque image — the
    // one-ink prompt always asks for black dots on white, and the tool's
    // knockout keys that white out and repaints the dots in the chosen ink
    // (white for a dark garment). No tonal inversion: the artwork's dark
    // linework / shadows become the ink, which is the standard white-on-black
    // look for cartoon and line art.
    const d = art.data;
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3]! / 255;
      d[i] = d[i]! * a + 255 * (1 - a);
      d[i + 1] = d[i + 1]! * a + 255 * (1 - a);
      d[i + 2] = d[i + 2]! * a + 255 * (1 - a);
      d[i + 3] = 255;
    }
    const c = document.createElement("canvas");
    drawRGBAImage(c, art);
    return c.toDataURL("image/png");
  }

  async function runAI() {
    if (!source) return;
    const run = ++aiRun.current;
    setAiError(null);
    setAiResult(null);
    setAiElapsed(0);
    setAiProvider(null);
    setAiPhase("running");
    const startedAt = Date.now();
    const ticker = window.setInterval(() => {
      if (aiRun.current === run) setAiElapsed(Math.round((Date.now() - startedAt) / 1000));
    }, 1000);
    try {
      const image = buildAiInput();
      const res = await generateHalftoneAI({
        data: {
          image,
          garment,
          style: aiStyle,
          inkHex: inkColor,
          intensity: aiIntensity,
          selective: aiSelective,
          notes: aiNotes,
        },
      });
      if (aiRun.current !== run) return;
      setAiResult(res.image);
      setAiProvider(res.provider);
      setAiElapsed(Math.round(res.elapsedMs / 1000));
      setAiPhase("done");
    } catch (err) {
      if (aiRun.current !== run) return;
      setAiError(err instanceof Error ? err.message : "Falha ao gerar com IA.");
      setAiPhase("error");
    } finally {
      window.clearInterval(ticker);
    }
  }

  const baseName = `${fileName?.replace(/\.[^/.]+$/, "") || "imagem"}-halftone`;
  const spacing = gridSpacing(dpi, lpi);
  const aiBusy = aiPhase === "running";
  const hasResult = engine === "ai" ? !!aiResult : !!preview;

  const status =
    engine === "ai"
      ? source
        ? aiPhase === "done"
          ? `IA • resultado pronto${aiProvider ? ` (${aiProvider})` : ""} • exporta transparente, pronto para DTF`
          : `IA • img2img no servidor • a arte vai a no máx. ${AI_MAX_EDGE}px`
        : "Sem imagem"
      : output
        ? `${output.width} × ${output.height} px • ${dpi} DPI • ${lpi} LPI (${lpiToLpc(lpi).toFixed(2)} l/cm) • ponto a cada ${spacing.toFixed(2)} px${
            solidThreshold < 1 ? ` • sólido ≥ ${Math.round(solidThreshold * 100)}%` : ""
          }`
        : "Sem imagem";

  const aiStatusText =
    aiPhase === "running"
      ? `Gerando… ${aiElapsed}s`
      : aiPhase === "done"
        ? `Pronto em ${aiElapsed || "—"}s${aiProvider ? ` • ${aiProvider}` : ""}`
        : "";

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

            <ControlGroup step="02" label="Motor">
              <OptionPills<Engine>
                columns={1}
                value={engine}
                onChange={setEngine}
                options={[
                  {
                    value: "screen",
                    label: "Retícula",
                    note: "determinística, controle total de LPI/ângulo/sólido",
                  },
                  {
                    value: "ai",
                    label: "IA (img2img)",
                    note: "um modelo redesenha a arte no estilo halftone",
                  },
                ]}
              />
              {engine === "ai" && (
                <Hint>
                  a arte recortada é enviada a um modelo de imagem que a redesenha como separação
                  de halftone para DTF, no espírito da referência. Precisa de{" "}
                  <strong>GEMINI_API_KEY</strong> (grátis) ou <strong>FAL_KEY</strong> no servidor
                  — veja IA-HALFTONE.md.
                </Hint>
              )}
            </ControlGroup>

            <ControlGroup step="03" label="Tipo de fundo">
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
                    note: "PNG que já veio recortado — pula a limpeza",
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
                a limpeza agora é conservadora: só tira o que encosta na borda e é mesmo fundo,
                para não comer área clara chapada da arte. Suba a tolerância se sobrar fundo;
                use "Já sem fundo" se o PNG já veio recortado.
              </Hint>
            </ControlGroup>

            <ControlGroup step="04" label="Tipo de peça">
              <OptionPills<GarmentTone>
                columns={1}
                value={garment}
                onChange={engine === "screen" ? tweak(setGarment) : setGarment}
                options={[
                  { value: "dark", label: "Peça escura", note: "a tinta pinta o claro da arte" },
                  { value: "light", label: "Peça clara", note: "a tinta pinta o escuro da arte" },
                ]}
              />
              <Hint>
                em peça escura o ponto cresce onde a arte é clara e forte. Em peça clara a lógica
                inverte, como numa retícula comum de preto.
              </Hint>
            </ControlGroup>

            {engine === "screen" ? (
              <>
                <ControlGroup step="05" label="Começo rápido">
                  <OptionPills<string>
                    columns={1}
                    value={presetId}
                    onChange={(id) => {
                      const p = HALFTONE_PRESETS.find((x) => x.id === id);
                      if (p) applyPreset(p);
                    }}
                    options={HALFTONE_PRESETS.map((p) => ({
                      value: p.id,
                      label: p.label,
                      note: p.note,
                    }))}
                  />
                  {presetId === "custom" && (
                    <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                      Personalizado — ajustes alterados à mão
                    </p>
                  )}
                  <Hint>
                    cada opção já ajusta retícula, níveis, limite de sólido e ganho de ponto de
                    uma vez. Comece por aqui e só abra os ajustes finos se precisar.
                  </Hint>
                </ControlGroup>

                <ControlGroup step="06" label="Tamanho da arte">
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
                      Resolução reduzida para caber na memória do navegador. Baixe o DPI para
                      exportar no tamanho cheio.
                    </p>
                  )}
                </ControlGroup>

                <ControlGroup step="07" label="Qualidade da imagem">
                  <OptionPills<number>
                    value={dpi}
                    onChange={setDpi}
                    options={[300, 600, 1200].map((v) => ({ value: v, label: String(v) }))}
                  />
                  <Hint>
                    300 DPI já resolve a maioria dos trabalhos — é a base de 118,11 px/cm da
                    action. Use 600 ou 1200 para arquivos maiores e mais detalhados.
                  </Hint>
                </ControlGroup>

                <div className="border-t border-border pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced((v) => !v)}
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm font-semibold transition-colors hover:border-border-strong"
                  >
                    Ajustes avançados
                    <span className="font-mono text-xs text-accent">
                      {showAdvanced ? "▲" : "▼"}
                    </span>
                  </button>
                </div>

                {showAdvanced && (
                  <>
                    <ControlGroup step="08" label="Frequência da retícula">
                      <OptionPills<number>
                        value={lpi}
                        onChange={tweak(setLpi)}
                        options={[30, 35, 40, 45, 50].map((v) => ({ value: v, label: String(v) }))}
                      />
                      <Hint>
                        em LPI (linhas por polegada). <strong>35 LPI = 13,78 linhas/cm</strong>, o
                        valor conferido na action. Valores menores deixam os pontos maiores e mais
                        separados.
                      </Hint>
                    </ControlGroup>

                    <ControlGroup step="09" label="Forma e ângulo do ponto">
                      <OptionPills<number>
                        columns={2}
                        value={dotAspect}
                        onChange={tweak(setDotAspect)}
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
                        onChange={tweak(setAngle)}
                      />
                      <Hint>
                        22° é o ângulo verificado na action. 45° é o clássico de preto; 15° e 75°
                        evitam moiré quando a arte tem trama própria.
                      </Hint>
                    </ControlGroup>

                    <ControlGroup step="10" label="Força do ponto">
                      <SliderRow
                        label="Força"
                        value={strength}
                        min={0.5}
                        max={2}
                        step={0.05}
                        onChange={tweak(setStrength)}
                      />
                      <Hint>
                        multiplica o raio máximo do ponto. A partir de{" "}
                        <strong>{FUSION_STRENGTH.toFixed(2)}</strong> as áreas 100% cheias fecham
                        sozinhas. Com o limite de sólido ligado, isso importa só na banda de
                        transição.
                      </Hint>
                    </ControlGroup>

                    <ControlGroup step="11" label="Sólidos e ganho de ponto">
                      <SliderRow
                        label="Limite de sólido"
                        value={solidThreshold}
                        min={0.5}
                        max={1}
                        step={0.01}
                        onChange={tweak(setSolidThreshold)}
                      />
                      <SliderRow
                        label="Ganho de ponto"
                        value={dotGain}
                        min={0}
                        max={0.4}
                        step={0.01}
                        onChange={tweak(setDotGain)}
                      />
                      <Hint>
                        acima do <strong>limite de sólido</strong> a arte imprime chapada, em alta
                        resolução, com a retícula só na transição — <strong>1,00</strong> desliga
                        e vira retícula pura (foto). O <strong>ganho de ponto</strong> encolhe os
                        meios-tons para compensar o ponto fechar na prensa.
                      </Hint>
                    </ControlGroup>

                    <ControlGroup step="12" label="Níveis">
                      <SliderRow
                        label="Preto de entrada"
                        value={black}
                        min={0}
                        max={0.9}
                        step={0.01}
                        onChange={tweak(setBlack)}
                      />
                      <SliderRow
                        label="Branco de entrada"
                        value={white}
                        min={0.1}
                        max={1}
                        step={0.01}
                        onChange={tweak(setWhite)}
                      />
                      <SliderRow
                        label="Gama"
                        value={gamma}
                        min={0.3}
                        max={3}
                        step={0.05}
                        onChange={tweak(setGamma)}
                      />
                      <OptionPills<ToneCurve>
                        columns={2}
                        value={toneCurve}
                        onChange={tweak(setToneCurve)}
                        options={[
                          { value: "area", label: "Área" },
                          { value: "linear", label: "Linear" },
                        ]}
                      />
                      <OptionPills<ToneSource>
                        columns={2}
                        value={toneSource}
                        onChange={tweak(setToneSource)}
                        options={[
                          { value: "valor", label: "Cor viva" },
                          { value: "luma", label: "Brilho" },
                        ]}
                      />
                      <Hint>
                        "Área" é como a retícula de verdade se comporta — o que o olho lê como tom
                        é a área do ponto. <strong>"Cor viva"</strong> trata vermelho e roxo
                        saturados como cor cheia, que é o que fecha sólido na peça escura;
                        "Brilho" usa a luminância.
                      </Hint>
                    </ControlGroup>

                    <ControlGroup step="13" label="Retícula seletiva">
                      <OptionPills<"on" | "off">
                        columns={2}
                        value={screenSelective ? "on" : "off"}
                        onChange={(v) => tweak(setScreenSelective)(v === "on")}
                        options={[
                          { value: "off", label: "Reticula tudo" },
                          { value: "on", label: "Só nos degradês" },
                        ]}
                      />
                      {screenSelective && (
                        <SliderRow
                          label="Sensibilidade"
                          value={screenSelectiveStrength}
                          min={0}
                          max={1}
                          step={0.05}
                          onChange={tweak(setScreenSelectiveStrength)}
                        />
                      )}
                      <Hint>
                        com <strong>"Só nos degradês"</strong> a área de cor chapada passa direto,
                        sólida — a retícula aparece só onde a arte tem sombreado / degradê. É o
                        certo pra DTF, principalmente no modo <strong>Colorido</strong>.
                        Sensibilidade mais alta pega blends mais suaves.
                      </Hint>
                    </ControlGroup>

                    <ControlGroup step="14" label="Cor">
                      <OptionPills<ColorMode>
                        columns={1}
                        value={colorMode}
                        onChange={tweak(setColorMode)}
                        options={[
                          {
                            value: "mono",
                            label: "Monocromático",
                            note: "uma tinta só, como a action",
                          },
                          {
                            value: "rgb",
                            label: "Colorido",
                            note: "separa R, G e B em 3 ângulos",
                          },
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
                        a cor do tecido é só prévia. O arquivo exportado sai transparente, com os
                        pontos de tinta e mais nada.
                      </Hint>
                    </ControlGroup>
                  </>
                )}
              </>
            ) : (
              <ControlGroup step="05" label="Estilo da IA">
                <OptionPills<AiStyle>
                  columns={1}
                  value={aiStyle}
                  onChange={setAiStyle}
                  options={[
                    { value: "mono", label: "1 cor (spot)", note: "todo ponto na cor da tinta" },
                    { value: "black", label: "Preto no branco", note: "serigrafia clássica" },
                    {
                      value: "color",
                      label: "Colorido (roseta CMYK)",
                      note: "separação em 4 ângulos",
                    },
                  ]}
                />
                {aiStyle === "mono" && (
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
                <SliderRow
                  label="Intensidade"
                  value={aiIntensity}
                  min={0.1}
                  max={1}
                  step={0.05}
                  onChange={setAiIntensity}
                />
                <OptionPills<"sel" | "full">
                  columns={2}
                  value={aiSelective ? "sel" : "full"}
                  onChange={(v) => setAiSelective(v === "sel")}
                  options={[
                    { value: "sel", label: "Seletiva" },
                    { value: "full", label: "Tudo em ponto" },
                  ]}
                />
                <label className="space-y-1">
                  <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                    Ajustes (opcional)
                  </span>
                  <textarea
                    value={aiNotes}
                    onChange={(e) => setAiNotes(e.target.value.slice(0, 400))}
                    rows={2}
                    placeholder="ex: pontos bem redondos, contraste alto, sem contorno"
                    className="w-full resize-none rounded-lg border border-border bg-secondary px-2 py-1.5 text-sm"
                  />
                </label>
                {aiStyle !== "color" && (
                  <>
                    <OptionPills<"on" | "off">
                      columns={2}
                      value={aiKnockout ? "on" : "off"}
                      onChange={(v) => setAiKnockout(v === "on")}
                      options={[
                        { value: "on", label: "Recorte DTF" },
                        { value: "off", label: "Cru da IA" },
                      ]}
                    />
                    {aiKnockout && (
                      <>
                        <SliderRow
                          label="Dureza do recorte"
                          value={aiContrast}
                          min={0}
                          max={1}
                          step={0.05}
                          onChange={setAiContrast}
                        />
                        <OptionPills<"linha" | "foto">
                          columns={2}
                          value={aiInvert ? "foto" : "linha"}
                          onChange={(v) => setAiInvert(v === "foto")}
                          options={[
                            { value: "linha", label: "Tinta no traço" },
                            { value: "foto", label: "Tinta na luz" },
                          ]}
                        />
                      </>
                    )}
                  </>
                )}
                <label className="space-y-1">
                  <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                    Fundo da prévia
                  </span>
                  <input
                    type="color"
                    value={fabricColor}
                    onChange={(e) => setFabricColor(e.target.value)}
                    className="h-9 w-full cursor-pointer rounded-lg border border-border"
                  />
                </label>
                <Hint>
                  <strong>Seletiva</strong> = ponto só nos degradês e sombras; área de cor chapada
                  fica sólida (é o certo pra DTF). "Tudo em ponto" reticula a imagem inteira.
                  <br />
                  <strong>camisa preta:</strong> "1 cor (spot)" + "Peça escura" (passo 04) + tinta
                  branca. O <strong>Recorte DTF</strong> deixa só os pontos, transparente.{" "}
                  <strong>Tinta no traço</strong> para desenho/cartoon; <strong>Tinta na luz</strong>{" "}
                  se a arte for foto e ficar em negativo.
                </Hint>
              </ControlGroup>
            )}

            <div className="space-y-2 border-t border-border pt-4">
              {engine === "ai" && (
                <>
                  {aiBusy ? (
                    <button
                      type="button"
                      onClick={cancelAI}
                      className="w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-bold transition-colors hover:border-border-strong"
                    >
                      Cancelar
                    </button>
                  ) : (
                    <PrimaryAction className="w-full" disabled={!source} onClick={runAI}>
                      {aiPhase === "done" ? "Gerar de novo" : "Gerar com IA"}
                    </PrimaryAction>
                  )}
                  {aiStatusText && (
                    <p className="text-xs font-semibold text-accent">{aiStatusText}</p>
                  )}
                  {aiError && <p className="text-xs text-destructive">{aiError}</p>}
                </>
              )}

              <PrimaryAction
                className="w-full"
                disabled={!source || exporting !== null || (engine === "ai" && !aiResult)}
                onClick={() => handleExport("png")}
              >
                {exporting === "png" ? "Gerando…" : "Baixar PNG"}
              </PrimaryAction>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!source || exporting !== null || (engine === "ai" && !aiResult)}
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
                  Restaurar padrão
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {engine === "ai"
                  ? "A exportação usa o resultado da IA como veio, em tamanho cheio."
                  : `A exportação é gerada em ${dpi} DPI no tamanho cheio, não a partir da prévia.`}
              </p>
            </div>
          </>
        }
      >
        <PreviewStage
          title="Prévia da arte"
          caption={
            engine === "ai"
              ? "Redesenho por IA (img2img) no estilo halftone DTF"
              : `Grayscale → níveis → tela de meio-tom ${dotAspect === 1 ? "redonda" : "elíptica"} a ${angle}° + camada de sólido`
          }
          status={status}
          hint={
            engine === "ai"
              ? "O modelo roda no servidor; a arte vai recortada e volta achatada."
              : "A prévia é reduzida; os pontos ficam na mesma posição do arquivo final."
          }
        >
          {hasResult ? (
            <div
              className="relative rounded-xl p-4 transition-colors"
              style={{ backgroundColor: fabricColor }}
            >
              <canvas
                ref={canvasRef}
                role="img"
                aria-label="Prévia do halftone"
                className={`max-h-[60vh] max-w-full rounded-sm transition-opacity ${
                  (engine === "screen" && isPending) || aiBusy ? "opacity-50" : ""
                }`}
              />
              {engine === "screen" && isPending && (
                <span className="absolute right-3 bottom-3 rounded-md bg-background/90 px-2 py-1 font-mono text-[10px] font-bold">
                  Recalculando…
                </span>
              )}
              {engine === "ai" && aiBusy && (
                <span className="absolute right-3 bottom-3 rounded-md bg-background/90 px-2 py-1 font-mono text-[10px] font-bold">
                  {aiStatusText}
                </span>
              )}
            </div>
          ) : (
            <PreviewPlaceholder
              label={
                engine === "ai" && source
                  ? 'Clique em "Gerar com IA"'
                  : "Envie uma imagem para começar"
              }
            />
          )}
        </PreviewStage>
      </ToolLayout>
    </ToolPageShell>
  );
}
