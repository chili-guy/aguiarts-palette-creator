import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { rasterToSvg, type RGBAImage } from "@/lib/image-core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { downloadTextFile, imageToRGBAImage, loadImageFile } from "@/lib/canvas-tools";
import { downloadSvgAsPdf } from "@/lib/export";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export const Route = createFileRoute("/ferramentas/vetorizar")({
  head: () => ({ meta: [{ title: "Vetorizador PRO | Printzy" }] }),
  component: VectorizeTool,
});

function VectorizeTool() {
  const [original, setOriginal] = useState<RGBAImage | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [numberOfColors, setNumberOfColors] = useState(8);
  const [detail, setDetail] = useState(8); // maps to pathomit: lower = more detail
  const [error, setError] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Tracing is expensive, and the sliders fire on every drag tick — recomputing
  // on each tick would freeze the UI while dragging. Only re-trace once the
  // value has settled for a moment.
  const debouncedColors = useDebouncedValue(numberOfColors, 300);
  const debouncedDetail = useDebouncedValue(detail, 300);
  const isPending = debouncedColors !== numberOfColors || debouncedDetail !== detail;

  const svg = useMemo<string | null>(() => {
    if (!original) return null;
    return rasterToSvg(original, { numberOfColors: debouncedColors, pathOmit: debouncedDetail });
  }, [original, debouncedColors, debouncedDetail]);

  const svgDataUri = useMemo(() => {
    if (!svg) return null;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, [svg]);

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

  const baseName = `${fileName?.replace(/\.[^/.]+$/, "") || "imagem"}-vetor`;

  function handleDownloadSvg() {
    if (!svg) return;
    downloadTextFile(svg, "image/svg+xml", `${baseName}.svg`);
  }

  async function handleDownloadPdf() {
    if (!svg || !original) return;
    setGeneratingPdf(true);
    setPdfError(null);
    try {
      await downloadSvgAsPdf(svg, original.width, original.height, `${baseName}.pdf`);
    } catch {
      setPdfError("Não foi possível gerar o PDF.");
    } finally {
      setGeneratingPdf(false);
    }
  }

  return (
    <ToolPageShell
      title="Vetorizador PRO"
      subtitle="Logo em JPG vira vetor imprimível em qualquer formato, do adesivo ao banner."
    >
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Pré-visualização</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative flex min-h-80 items-center justify-center rounded-md border border-dashed bg-muted/30 p-4">
              {svgDataUri ? (
                <img
                  src={svgDataUri}
                  alt="Vetor gerado"
                  className={`max-h-[60vh] max-w-full rounded-sm shadow-sm transition-opacity ${isPending ? "opacity-50" : ""}`}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Envie uma imagem para começar</p>
              )}
              {isPending && svgDataUri && (
                <span className="absolute bottom-3 rounded bg-background/90 px-2 py-1 text-xs text-muted-foreground">
                  Retraçando…
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
            <CardTitle>Ajustes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Quantidade de cores</Label>
                <span className="text-sm text-muted-foreground tabular-nums">{numberOfColors}</span>
              </div>
              <Slider
                value={[numberOfColors]}
                min={2}
                max={32}
                step={1}
                onValueChange={(v) => setNumberOfColors(Array.isArray(v) ? (v[0] ?? 0) : v)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Suavização</Label>
                <span className="text-sm text-muted-foreground tabular-nums">{detail}</span>
              </div>
              <Slider
                value={[detail]}
                min={0}
                max={30}
                step={1}
                onValueChange={(v) => setDetail(Array.isArray(v) ? (v[0] ?? 0) : v)}
              />
            </div>

            <Separator />
            <div className="flex gap-2">
              <Button onClick={handleDownloadSvg} disabled={!svg} className="flex-1">
                Baixar SVG
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={!svg || generatingPdf}
                className="flex-1"
              >
                {generatingPdf ? "Gerando…" : "Baixar PDF"}
              </Button>
            </div>
            {pdfError && <p className="text-xs text-destructive">{pdfError}</p>}
          </CardContent>
        </Card>
      </div>
    </ToolPageShell>
  );
}
