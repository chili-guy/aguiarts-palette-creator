import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from "react-konva";
import type Konva from "konva";
import { pngToPdf } from "@/lib/image-core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { downloadBlob, loadImageFile } from "@/lib/canvas-tools";
import { MOCKUP_TEMPLATES, type MockupTemplate } from "@/lib/mockup-templates";

const DISPLAY_WIDTH = 420;

interface DesignAttrs {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

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

function fitToArea(
  imgWidth: number,
  imgHeight: number,
  area: { x: number; y: number; width: number; height: number },
): DesignAttrs {
  const scale = Math.min(area.width / imgWidth, area.height / imgHeight) * 0.9;
  const width = imgWidth * scale;
  const height = imgHeight * scale;
  return {
    x: area.x + (area.width - width) / 2,
    y: area.y + (area.height - height) / 2,
    width,
    height,
    rotation: 0,
  };
}

export default function MockupEditor() {
  const [template, setTemplate] = useState<MockupTemplate>(MOCKUP_TEMPLATES[0]!);
  const [designImg, setDesignImg] = useState<HTMLImageElement | null>(null);
  const [designAttrs, setDesignAttrs] = useState<DesignAttrs | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const templateImg = useHtmlImage(template.src);
  const stageRef = useRef<Konva.Stage>(null);
  const designNodeRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const scale = DISPLAY_WIDTH / template.width;
  const displayHeight = template.height * scale;

  const fitKey = designImg ? `${template.id}:${designImg.src}` : null;
  const [prevFitKey, setPrevFitKey] = useState<string | null>(null);
  if (fitKey !== prevFitKey) {
    setPrevFitKey(fitKey);
    setDesignAttrs(
      designImg
        ? fitToArea(designImg.naturalWidth, designImg.naturalHeight, template.printArea)
        : null,
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
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    setDesignAttrs({
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation(),
    });
  }

  function handleDragEnd(e: Konva.KonvaEventObject<Event>) {
    setDesignAttrs((prev) => (prev ? { ...prev, x: e.target.x(), y: e.target.y() } : prev));
  }

  async function getCompositeCanvas(): Promise<HTMLCanvasElement | null> {
    if (!stageRef.current) return null;
    transformerRef.current?.nodes([]);
    transformerRef.current?.getLayer()?.batchDraw();
    const canvas = stageRef.current.toCanvas({ pixelRatio: 1 / scale });
    if (transformerRef.current && designNodeRef.current) {
      transformerRef.current.nodes([designNodeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
    return canvas;
  }

  const baseName = `${fileName?.replace(/\.[^/.]+$/, "") || "arte"}-mockup-${template.id}`;

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

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <CardTitle>Pré-visualização</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center overflow-x-auto rounded-md border border-dashed bg-muted/30 p-4">
            <Stage
              ref={stageRef}
              width={DISPLAY_WIDTH}
              height={displayHeight}
              scaleX={scale}
              scaleY={scale}
            >
              <Layer>
                {templateImg && (
                  <KonvaImage
                    image={templateImg}
                    x={0}
                    y={0}
                    width={template.width}
                    height={template.height}
                    listening={false}
                  />
                )}
                <Rect
                  x={template.printArea.x}
                  y={template.printArea.y}
                  width={template.printArea.width}
                  height={template.printArea.height}
                  stroke="#a1a1aa"
                  dash={[8, 8]}
                  listening={false}
                />
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
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Input type="file" accept="image/*" onChange={handleFileChange} className="w-auto" />
            {error && <span className="text-sm text-destructive">{error}</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-3 gap-2">
            {MOCKUP_TEMPLATES.map((mt) => (
              <Button
                key={mt.id}
                type="button"
                variant={template.id === mt.id ? "default" : "outline"}
                size="sm"
                onClick={() => setTemplate(mt)}
              >
                {mt.label}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Arraste e redimensione a arte dentro da área tracejada para posicioná-la no produto.
          </p>
          <Separator />
          <div className="flex gap-2">
            <Button onClick={handleDownloadPng} disabled={!designImg} className="flex-1">
              Baixar PNG
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={!designImg || generatingPdf}
              className="flex-1"
            >
              {generatingPdf ? "Gerando…" : "Baixar PDF"}
            </Button>
          </div>
          {pdfError && <p className="text-xs text-destructive">{pdfError}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
