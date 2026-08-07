import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { halftone, type RGBAImage } from "@/lib/image-core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { CanvasExportButtons } from "@/components/canvas-export-buttons";
import { ToolPageShell } from "@/components/tool-page-shell";
import { drawRGBAImage, imageToRGBAImage, loadImageFile } from "@/lib/canvas-tools";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export const Route = createFileRoute("/ferramentas/halftone")({
  head: () => ({ meta: [{ title: "Halftone DTF/DTG | Printzy" }] }),
  component: HalftoneTool,
});

const ANGLE_PRESETS = [
  { label: "Amarelo (0°)", value: 0 },
  { label: "Ciano (15°)", value: 15 },
  { label: "Preto (45°)", value: 45 },
  { label: "Magenta (75°)", value: 75 },
  { label: "Camiseta escura (22°)", value: 22 },
];

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function ToolSlider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm text-muted-foreground tabular-nums">{value}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={1}
        onValueChange={(v) => onChange(Array.isArray(v) ? (v[0] ?? 0) : v)}
      />
    </div>
  );
}

function HalftoneTool() {
  const [original, setOriginal] = useState<RGBAImage | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [cellSize, setCellSize] = useState(10);
  const [angle, setAngle] = useState(45);
  const [inkColor, setInkColor] = useState("#000000");
  const [swatch, setSwatch] = useState("#ffffff");
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Every pixel is revisited on each render — debounce so dragging the cell
  // size or picking an ink color doesn't recompute on every tick.
  const debouncedCellSize = useDebouncedValue(cellSize, 150);
  const debouncedInkColor = useDebouncedValue(inkColor, 150);
  const isPending = debouncedCellSize !== cellSize || debouncedInkColor !== inkColor;

  const processed = useMemo<RGBAImage | null>(() => {
    if (!original) return null;
    return halftone(original, {
      cellSize: debouncedCellSize,
      angle,
      inkColor: hexToRgb(debouncedInkColor),
    });
  }, [original, debouncedCellSize, angle, debouncedInkColor]);

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

  const baseName = `${fileName?.replace(/\.[^/.]+$/, "") || "imagem"}-halftone`;

  return (
    <ToolPageShell
      title="Halftone DTF/DTG"
      subtitle="Retícula calibrada para sua máquina: menos tinta por peça e traço limpo na prensa."
    >
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Pré-visualização</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="relative flex min-h-80 items-center justify-center rounded-md border border-dashed p-4"
              style={{ backgroundColor: swatch }}
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
                  Envie uma imagem para começar
                </p>
              )}
              {isPending && processed && (
                <span className="absolute bottom-3 rounded bg-background/90 px-2 py-1 text-xs text-muted-foreground">
                  Recalculando…
                </span>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Input type="file" accept="image/*" onChange={handleFileChange} className="w-auto" />
              {error && <span className="text-sm text-destructive">{error}</span>}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              "Cor do tecido" acima é só pra simular a prévia — o arquivo exportado sai com fundo
              transparente e só os pontos de tinta.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ajustes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ToolSlider
              label="Tamanho da célula"
              value={cellSize}
              min={2}
              max={40}
              onChange={setCellSize}
            />

            <div className="space-y-2">
              <Label>Ângulo da tela</Label>
              <div className="grid grid-cols-2 gap-2">
                {ANGLE_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    type="button"
                    variant={angle === preset.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAngle(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cor da tinta</Label>
                <input
                  type="color"
                  value={inkColor}
                  onChange={(e) => setInkColor(e.target.value)}
                  className="h-9 w-full cursor-pointer rounded-md border"
                />
              </div>
              <div className="space-y-2">
                <Label>Cor do tecido</Label>
                <input
                  type="color"
                  value={swatch}
                  onChange={(e) => setSwatch(e.target.value)}
                  className="h-9 w-full cursor-pointer rounded-md border"
                />
              </div>
            </div>

            <Separator />
            <CanvasExportButtons canvasRef={canvasRef} baseName={baseName} disabled={!processed} />
          </CardContent>
        </Card>
      </div>
    </ToolPageShell>
  );
}
