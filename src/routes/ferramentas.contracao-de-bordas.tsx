import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { choke, type RGBAImage } from "@/lib/image-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { CanvasExportButtons } from "@/components/canvas-export-buttons";
import { ToolPageShell } from "@/components/tool-page-shell";
import {
  TRANSPARENCY_BG_CLASS,
  drawRGBAImage,
  imageToRGBAImage,
  loadImageFile,
} from "@/lib/canvas-tools";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export const Route = createFileRoute("/ferramentas/contracao-de-bordas")({
  head: () => ({ meta: [{ title: "Contração de Bordas | Printzy" }] }),
  component: ChokeTool,
});

function ChokeTool() {
  const [original, setOriginal] = useState<RGBAImage | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [radius, setRadius] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // The kernel grows with radius², so a big radius on a big image gets slow
  // fast — debounce so dragging the slider doesn't recompute on every tick.
  const debouncedRadius = useDebouncedValue(radius, 150);
  const isPending = debouncedRadius !== radius;

  const processed = useMemo<RGBAImage | null>(() => {
    if (!original) return null;
    return choke(original, debouncedRadius);
  }, [original, debouncedRadius]);

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
      const rgba = imageToRGBAImage(img);
      const hasTransparency = Array.from({ length: rgba.data.length / 4 }).some(
        (_, i) => rgba.data[i * 4 + 3]! < 255,
      );
      if (!hasTransparency) {
        setError(
          "Essa imagem não tem fundo transparente — envie um PNG recortado para melhores resultados.",
        );
      }
      setOriginal(rgba);
      setFileName(file.name);
    } catch {
      setError("Não foi possível carregar essa imagem.");
    }
  }

  const baseName = `${fileName?.replace(/\.[^/.]+$/, "") || "imagem"}-choke`;

  return (
    <ToolPageShell
      title="Contração de Bordas"
      subtitle="Fim do halo branco no transfer: encolha a borda da arte para um acabamento de gráfica profissional."
    >
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Pré-visualização</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`relative flex min-h-80 items-center justify-center rounded-md border border-dashed p-4 ${TRANSPARENCY_BG_CLASS}`}
            >
              {processed ? (
                <canvas
                  ref={canvasRef}
                  role="img"
                  aria-label="Pré-visualização"
                  className={`max-h-[60vh] max-w-full rounded-sm shadow-sm transition-opacity ${isPending ? "opacity-50" : ""}`}
                />
              ) : (
                <p className="rounded bg-background/80 px-2 py-1 text-sm text-muted-foreground">
                  Envie um PNG com fundo transparente para começar
                </p>
              )}
              {isPending && processed && (
                <span className="absolute bottom-3 rounded bg-background/90 px-2 py-1 text-xs text-muted-foreground">
                  Recalculando…
                </span>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Input
                type="file"
                accept="image/png"
                onChange={handleFileChange}
                className="w-auto"
              />
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
              <div className="flex items-center justify-between">
                <Label>Raio de contração</Label>
                <span className="text-sm text-muted-foreground tabular-nums">{radius}px</span>
              </div>
              <Slider
                value={[radius]}
                min={0}
                max={20}
                step={1}
                onValueChange={(v) => setRadius(Array.isArray(v) ? (v[0] ?? 0) : v)}
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
