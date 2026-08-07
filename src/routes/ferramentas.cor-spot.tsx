import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { quantizeToSpotColors, type RGBAImage, type SpotColor } from "@/lib/image-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { CanvasExportButtons } from "@/components/canvas-export-buttons";
import { ToolPageShell } from "@/components/tool-page-shell";
import { drawRGBAImage, imageToRGBAImage, loadImageFile } from "@/lib/canvas-tools";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export const Route = createFileRoute("/ferramentas/cor-spot")({
  head: () => ({ meta: [{ title: "Cor Spot PRO | Printzy" }] }),
  component: SpotColorTool,
});

function rgbToHex({ r, g, b }: SpotColor): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function SpotColorTool() {
  const [original, setOriginal] = useState<RGBAImage | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [colorCount, setColorCount] = useState(6);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Quantizing is expensive; only rerun once the slider settles for a moment
  // instead of on every drag tick.
  const debouncedColorCount = useDebouncedValue(colorCount, 250);
  const isPending = debouncedColorCount !== colorCount;

  const result = useMemo(() => {
    if (!original) return null;
    return quantizeToSpotColors(original, debouncedColorCount);
  }, [original, debouncedColorCount]);

  useEffect(() => {
    if (result && canvasRef.current) {
      drawRGBAImage(canvasRef.current, result.image);
    }
  }, [result]);

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

  const baseName = `${fileName?.replace(/\.[^/.]+$/, "") || "imagem"}-spot-color`;

  return (
    <ToolPageShell
      title="Cor Spot PRO"
      subtitle="Separação de cores especiais com precisão para fechar o job certo na primeira tiragem."
    >
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Pré-visualização</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative flex min-h-80 items-center justify-center rounded-md border border-dashed bg-muted/30 p-4">
              {result ? (
                <canvas
                  ref={canvasRef}
                  role="img"
                  aria-label="Pré-visualização"
                  className={`max-h-[60vh] max-w-full rounded-sm shadow-sm transition-opacity ${isPending ? "opacity-50" : ""}`}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Envie uma imagem para começar</p>
              )}
              {isPending && result && (
                <span className="absolute bottom-3 rounded bg-background/90 px-2 py-1 text-xs text-muted-foreground">
                  Recalculando…
                </span>
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
            <CardTitle>Paleta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Quantidade de cores</Label>
                <span className="text-sm text-muted-foreground tabular-nums">{colorCount}</span>
              </div>
              <Slider
                value={[colorCount]}
                min={1}
                max={16}
                step={1}
                onValueChange={(v) => setColorCount(Array.isArray(v) ? (v[0] ?? 0) : v)}
              />
            </div>

            {result && (
              <div className="flex flex-wrap gap-2">
                {result.palette.map((color, i) => (
                  <div
                    key={i}
                    title={rgbToHex(color)}
                    className="h-8 w-8 rounded-md border shadow-sm"
                    style={{ backgroundColor: rgbToHex(color) }}
                  />
                ))}
              </div>
            )}

            <Separator />
            <CanvasExportButtons canvasRef={canvasRef} baseName={baseName} disabled={!result} />
          </CardContent>
        </Card>
      </div>
    </ToolPageShell>
  );
}
