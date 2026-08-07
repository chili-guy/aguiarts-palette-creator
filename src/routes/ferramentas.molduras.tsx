import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { applyFrame, type FrameStyle, type RGBAImage } from "@/lib/image-core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { CanvasExportButtons } from "@/components/canvas-export-buttons";
import { ToolPageShell } from "@/components/tool-page-shell";
import { drawRGBAImage, imageToRGBAImage, loadImageFile } from "@/lib/canvas-tools";

export const Route = createFileRoute("/ferramentas/molduras")({
  head: () => ({ meta: [{ title: "Molduras PRO | Printzy" }] }),
  component: FramesTool,
});

const STYLES: { value: FrameStyle; label: string }[] = [
  { value: "solid", label: "Sólida" },
  { value: "dashed", label: "Tracejada" },
  { value: "double", label: "Dupla" },
];

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function FramesTool() {
  const [original, setOriginal] = useState<RGBAImage | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [style, setStyle] = useState<FrameStyle>("solid");
  const [thickness, setThickness] = useState(8);
  const [inset, setInset] = useState(0);
  const [color, setColor] = useState("#000000");
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const processed = useMemo<RGBAImage | null>(() => {
    if (!original) return null;
    return applyFrame(original, { style, thickness, inset, color: hexToRgb(color) });
  }, [original, style, thickness, inset, color]);

  useEffect(() => {
    if (processed && canvasRef.current) {
      drawRGBAImage(canvasRef.current, processed);
    }
  }, [processed]);

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

  const baseName = `${fileName?.replace(/\.[^/.]+$/, "") || "imagem"}-moldura`;

  return (
    <ToolPageShell
      title="Molduras PRO"
      subtitle="Acabamentos e bordas prontos para agregar valor ao pedido sem hora extra de criação."
    >
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Pré-visualização</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-80 items-center justify-center rounded-md border border-dashed bg-muted/30 p-4">
              {processed ? (
                <canvas
                  ref={canvasRef}
                  role="img"
                  aria-label="Pré-visualização"
                  className="max-h-[60vh] max-w-full rounded-sm shadow-sm"
                />
              ) : (
                <p className="text-sm text-muted-foreground">Envie uma imagem para começar</p>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Input type="file" accept="image/*" onChange={handleFileChange} className="w-auto" />
              {error && <span className="text-sm text-destructive">{error}</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ajustes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Estilo</Label>
              <div className="grid grid-cols-3 gap-2">
                {STYLES.map((s) => (
                  <Button
                    key={s.value}
                    type="button"
                    variant={style === s.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStyle(s.value)}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Espessura</Label>
                <span className="text-sm text-muted-foreground tabular-nums">{thickness}px</span>
              </div>
              <Slider
                value={[thickness]}
                min={1}
                max={60}
                step={1}
                onValueChange={(v) => setThickness(Array.isArray(v) ? (v[0] ?? 0) : v)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Distância da borda</Label>
                <span className="text-sm text-muted-foreground tabular-nums">{inset}px</span>
              </div>
              <Slider
                value={[inset]}
                min={0}
                max={60}
                step={1}
                onValueChange={(v) => setInset(Array.isArray(v) ? (v[0] ?? 0) : v)}
              />
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-full cursor-pointer rounded-md border"
              />
            </div>

            <Separator />
            <CanvasExportButtons canvasRef={canvasRef} baseName={baseName} disabled={!processed} />
          </CardContent>
        </Card>
      </div>
    </ToolPageShell>
  );
}
