import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from "react-konva";
import type Konva from "konva";
import { pngToPdf } from "@/lib/image-core";
import { downloadBlob, loadImageFile } from "@/lib/canvas-tools";
import { renderGarment } from "@/components/garment-canvas";
import {
  GARMENT_COLORS,
  MOCKUP_CATEGORIES,
  MOCKUP_TEMPLATES,
  type MockupCategory,
  type MockupTemplate,
} from "@/lib/mockup-templates";
import { ControlGroup, Hint, OptionPills, PrimaryAction } from "@/components/tool-ui";

const DISPLAY_WIDTH = 430;
/** The garment is rasterised at this width so exports stay crisp. */
const EXPORT_WIDTH = 1600;

interface DesignAttrs {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

type FitMode = "fit" | "fill" | "stretch";

function useHtmlImage(src: string): HTMLImageElement | null {
  const [prevSrc, setPrevSrc] = useState(src);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setImg(null);
  }
  useEffect(() => {
    let cancelled = false;
    const image = new window.Image();
    image.onload = () => {
      if (!cancelled) setImg(image);
    };
    image.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);
  return img;
}

function placeInArea(
  imgW: number,
  imgH: number,
  area: { x: number; y: number; width: number; height: number },
  mode: FitMode,
): DesignAttrs {
  if (mode === "stretch") {
    return { x: area.x, y: area.y, width: area.width, height: area.height, rotation: 0 };
  }
  // "fit" keeps the whole design inside the area; "fill" covers it and lets the
  // overflow hang outside, which is what a bleed placement looks like.
  const pick = mode === "fill" ? Math.max : Math.min;
  const scale = pick(area.width / imgW, area.height / imgH) * (mode === "fill" ? 1 : 0.92);
  const width = imgW * scale;
  const height = imgH * scale;
  return {
    x: area.x + (area.width - width) / 2,
    y: area.y + (area.height - height) / 2,
    width,
    height,
    rotation: 0,
  };
}

function GarmentThumb({ template }: { template: MockupTemplate }) {
  const view = template.views[0]!;
  const img = useHtmlImage(view.src);
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!img || !ref.current) return;
    const c = renderGarment(img, view, 180);
    const ctx = ref.current.getContext("2d");
    if (!ctx) return;
    ref.current.width = c.width;
    ref.current.height = c.height;
    ctx.drawImage(c, 0, 0);
  }, [img, view]);
  return (
    <canvas ref={ref} aria-hidden className="h-16 w-full rounded-md bg-white object-contain" />
  );
}

export function MockupEditor() {
  const [template, setTemplate] = useState<MockupTemplate>(MOCKUP_TEMPLATES[0]!);
  const [viewIndex, setViewIndex] = useState(0);
  const [garmentColor, setGarmentColor] = useState("#ffffff");
  const [fitMode, setFitMode] = useState<FitMode>("fit");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<MockupCategory | "Todos">("Todos");
  const [designImg, setDesignImg] = useState<HTMLImageElement | null>(null);
  const [designAttrs, setDesignAttrs] = useState<DesignAttrs | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const stageRef = useRef<Konva.Stage>(null);
  const designNodeRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const view = template.views[Math.min(viewIndex, template.views.length - 1)]!;
  const sourceImg = useHtmlImage(view.src);

  const garment = useMemo(() => {
    if (!sourceImg) return null;
    try {
      return renderGarment(
        sourceImg,
        view,
        EXPORT_WIDTH,
        template.tintable ? garmentColor : undefined,
      );
    } catch {
      return null;
    }
  }, [sourceImg, view, template.tintable, garmentColor]);

  const scale = DISPLAY_WIDTH / view.crop.width;
  const displayHeight = view.crop.height * scale;

  // Re-place the design whenever the garment, the view or the fit mode changes,
  // since the print area moves with all three.
  const placeKey = designImg ? `${template.id}:${viewIndex}:${fitMode}:${designImg.src}` : null;
  const [prevPlaceKey, setPrevPlaceKey] = useState<string | null>(null);
  if (placeKey && placeKey !== prevPlaceKey && designImg) {
    setPrevPlaceKey(placeKey);
    setDesignAttrs(
      placeInArea(designImg.naturalWidth, designImg.naturalHeight, view.printArea, fitMode),
    );
  }

  useEffect(() => {
    if (transformerRef.current && designNodeRef.current) {
      transformerRef.current.nodes([designNodeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [designImg, designAttrs]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const img = await loadImageFile(file);
      setDesignImg(img);
      setFileName(file.name);
    } catch {
      setError("Não foi possível carregar essa imagem.");
    }
  }

  function handleTransformEnd(e: Konva.KonvaEventObject<Event>) {
    const node = e.target;
    const sx = node.scaleX();
    const sy = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    setDesignAttrs({
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * sx),
      height: Math.max(5, node.height() * sy),
      rotation: node.rotation(),
    });
  }

  function handleDragEnd(e: Konva.KonvaEventObject<Event>) {
    setDesignAttrs((prev) => (prev ? { ...prev, x: e.target.x(), y: e.target.y() } : prev));
  }

  async function getCompositeCanvas(): Promise<HTMLCanvasElement | null> {
    if (!stageRef.current) return null;
    // Hide the handles and the placement guide: they are aids, not artwork.
    transformerRef.current?.nodes([]);
    transformerRef.current?.getLayer()?.batchDraw();
    setGuideVisible(false);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const canvas = stageRef.current.toCanvas({ pixelRatio: EXPORT_WIDTH / view.crop.width });
    setGuideVisible(true);
    if (transformerRef.current && designNodeRef.current) {
      transformerRef.current.nodes([designNodeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
    return canvas;
  }

  const [guideVisible, setGuideVisible] = useState(true);
  const baseName = `${fileName?.replace(/\.[^/.]+$/, "") || "arte"}-mockup-${template.id}-${view.label.toLowerCase()}`;

  async function handleDownloadPng() {
    const canvas = await getCompositeCanvas();
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `${baseName}.png`);
    }, "image/png");
  }

  async function handleDownloadPdf() {
    setGeneratingPdf(true);
    setPdfError(null);
    try {
      const canvas = await getCompositeCanvas();
      if (!canvas) return;
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
      });
      const pngBytes = new Uint8Array(await blob.arrayBuffer());
      const pdfBytes = await pngToPdf(pngBytes, { width: canvas.width, height: canvas.height });
      downloadBlob(
        new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" }),
        `${baseName}.pdf`,
      );
    } catch {
      setPdfError("Não foi possível gerar o PDF.");
    } finally {
      setGeneratingPdf(false);
    }
  }

  const visible = MOCKUP_TEMPLATES.filter(
    (t) =>
      (category === "Todos" || t.category === category) &&
      t.label.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)_260px]">
      {/* Mockup library */}
      <div className="max-h-[calc(100vh-var(--topbar-h)-2.5rem)] space-y-3 overflow-y-auto rounded-2xl border border-border bg-card p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar mockups..."
          className="w-full rounded-lg border border-border bg-secondary px-2.5 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          {(["Todos", ...MOCKUP_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                category === c
                  ? "border-transparent bg-accent text-accent-foreground"
                  : "border-border bg-secondary hover:border-border-strong"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <h2 className="font-mono text-[11px] font-bold tracking-[0.14em] text-accent uppercase">
          Mockups · {visible.length}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {visible.map((t) => {
            const on = t.id === template.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTemplate(t);
                  setViewIndex(0);
                }}
                className={`relative rounded-xl border p-1.5 text-left transition-colors ${
                  on
                    ? "border-accent bg-accent/15"
                    : "border-border bg-secondary hover:border-border-strong"
                }`}
              >
                <GarmentThumb template={t} />
                <span className="mt-1 block truncate text-[11px] font-semibold">{t.label}</span>
                {on && (
                  <span className="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {template.source && (
          <p className="text-[10px] text-muted-foreground">Molde: {template.source}</p>
        )}
      </div>

      {/* Stage */}
      <div className="flex min-h-[60vh] flex-col overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex gap-1.5">
            {template.views.map((v, i) => (
              <button
                key={v.label}
                type="button"
                onClick={() => setViewIndex(i)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  i === viewIndex
                    ? "border-transparent bg-accent text-accent-foreground"
                    : "border-border bg-secondary hover:border-border-strong"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <label className="cursor-pointer rounded-xl bg-accent px-3 py-2 text-xs font-bold text-accent-foreground transition-opacity hover:opacity-90">
            + Adicionar arte
            <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
          </label>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-auto bg-background-2 p-5">
          <Stage
            ref={stageRef}
            width={DISPLAY_WIDTH}
            height={displayHeight}
            scaleX={scale}
            scaleY={scale}
          >
            <Layer>
              {garment && (
                <KonvaImage
                  image={garment}
                  x={0}
                  y={0}
                  width={view.crop.width}
                  height={view.crop.height}
                  listening={false}
                />
              )}
              {guideVisible && (
                <Rect
                  x={view.printArea.x}
                  y={view.printArea.y}
                  width={view.printArea.width}
                  height={view.printArea.height}
                  stroke="#ff2d87"
                  strokeWidth={view.crop.width / 300}
                  dash={[view.crop.width / 60, view.crop.width / 90]}
                  listening={false}
                />
              )}
              {designImg && designAttrs && (
                <KonvaImage
                  ref={designNodeRef}
                  image={designImg}
                  x={designAttrs.x}
                  y={designAttrs.y}
                  width={designAttrs.width}
                  height={designAttrs.height}
                  rotation={designAttrs.rotation}
                  draggable
                  onDragEnd={handleDragEnd}
                  onTransformEnd={handleTransformEnd}
                />
              )}
              {designImg && <Transformer ref={transformerRef} rotateEnabled keepRatio={false} />}
            </Layer>
          </Stage>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-xs">
          <span className="text-muted-foreground">
            {fileName ?? "Nenhuma arte carregada"} · {template.label} / {view.label}
          </span>
          <span className="text-muted-foreground/70">
            Arraste e redimensione dentro da área rosa
          </span>
        </div>
      </div>

      {/* Design panel */}
      <div className="max-h-[calc(100vh-var(--topbar-h)-2.5rem)] space-y-5 overflow-y-auto rounded-2xl border border-border bg-card p-4">
        <ControlGroup label="Cor da peça">
          {template.tintable ? (
            <>
              <div className="grid grid-cols-5 gap-1.5">
                {GARMENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Cor ${c}`}
                    onClick={() => setGarmentColor(c)}
                    style={{ backgroundColor: c }}
                    className={`aspect-square rounded-lg border-2 transition-transform ${
                      garmentColor === c ? "border-accent scale-110" : "border-border"
                    }`}
                  />
                ))}
              </div>
              <input
                type="color"
                value={garmentColor}
                onChange={(e) => setGarmentColor(e.target.value)}
                className="h-8 w-full cursor-pointer rounded-lg border border-border"
              />
            </>
          ) : (
            <Hint>
              esse molde tem sombreado pintado na arte. Tingir apagaria justamente o que dá cara de
              tecido, então ele vai só na cor original.
            </Hint>
          )}
        </ControlGroup>

        <ControlGroup label="Modo de ajuste">
          <OptionPills<FitMode>
            columns={3}
            value={fitMode}
            onChange={setFitMode}
            options={[
              { value: "fit", label: "Fit" },
              { value: "fill", label: "Fill" },
              { value: "stretch", label: "Stretch" },
            ]}
          />
          <Hint>
            reposiciona a arte na área de impressão. Depois disso você ainda pode arrastar e
            redimensionar na mão.
          </Hint>
        </ControlGroup>

        <div className="space-y-2 border-t border-border pt-4">
          <PrimaryAction className="w-full" onClick={handleDownloadPng} disabled={!designImg}>
            Exportar PNG
          </PrimaryAction>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={!designImg || generatingPdf}
            className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm font-semibold transition-colors hover:border-border-strong disabled:opacity-40"
          >
            {generatingPdf ? "Gerando…" : "Exportar PDF"}
          </button>
          {error && <p className="text-xs text-destructive">{error}</p>}
          {pdfError && <p className="text-xs text-destructive">{pdfError}</p>}
        </div>
      </div>
    </div>
  );
}

/** Default export: the route lazy-loads this so Konva never runs during SSR. */
export default MockupEditor;
