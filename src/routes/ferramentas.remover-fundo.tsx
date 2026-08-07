import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CanvasExportButtons } from "@/components/canvas-export-buttons";
import { ToolPageShell } from "@/components/tool-page-shell";
import { TRANSPARENCY_BG_CLASS, drawBlobToCanvas } from "@/lib/canvas-tools";
import type { BgRemovalStage } from "@/lib/bg-removal-onnx";

export const Route = createFileRoute("/ferramentas/remover-fundo")({
  head: () => ({ meta: [{ title: "Limpador de Fundo | Printzy" }] }),
  component: BackgroundRemovalTool,
});

type Status = "idle" | "loading" | "done" | "error";

const STAGE_LABELS: Record<BgRemovalStage, string> = {
  "loading-model": "Carregando modelo…",
  preprocessing: "Preparando imagem…",
  "running-inference": "Detectando o fundo…",
  compositing: "Montando o recorte…",
};

function BackgroundRemovalTool() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [stage, setStage] = useState<BgRemovalStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setStage(null);
    setFileName(file.name);
    setStatus("loading");

    try {
      const { removeBackgroundOnnx } = await import("@/lib/bg-removal-onnx");
      const resultBlob = await removeBackgroundOnnx(file, setStage);
      if (canvasRef.current) {
        await drawBlobToCanvas(canvasRef.current, resultBlob);
      }
      setStatus("done");
    } catch (err) {
      console.error(err);
      setError("Não foi possível remover o fundo dessa imagem.");
      setStatus("error");
    }
  }

  const baseName = `${fileName?.replace(/\.[^/.]+$/, "") || "imagem"}-sem-fundo`;

  return (
    <ToolPageShell
      title="Limpador de Fundo"
      subtitle="Arte do cliente chega com fundo sujo e sai recortada, sem retrabalho do setor de arte."
    >
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Pré-visualização</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`flex min-h-80 items-center justify-center rounded-md border border-dashed p-4 ${TRANSPARENCY_BG_CLASS}`}
            >
              {status === "loading" ? (
                <p className="rounded bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                  {stage ? STAGE_LABELS[stage] : "Processando…"}
                </p>
              ) : status === "done" ? (
                <canvas
                  ref={canvasRef}
                  role="img"
                  aria-label="Pré-visualização"
                  className="max-h-[60vh] max-w-full rounded-sm shadow-sm"
                />
              ) : (
                <p className="rounded bg-background/80 px-2 py-1 text-sm text-muted-foreground">
                  Envie uma imagem para começar
                </p>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-auto"
                disabled={status === "loading"}
              />
              {error && <span className="text-sm text-destructive">{error}</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exportar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">
              O modelo roda inteiramente no seu navegador — nenhuma imagem sai do seu computador. O
              primeiro uso pode demorar alguns segundos para carregar.
            </p>
            <Separator />
            <CanvasExportButtons
              canvasRef={canvasRef}
              baseName={baseName}
              disabled={status !== "done"}
            />
          </CardContent>
        </Card>
      </div>
    </ToolPageShell>
  );
}
