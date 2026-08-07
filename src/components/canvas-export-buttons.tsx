import { useState } from "react";
import { Button } from "@/components/ui/button";
import { downloadCanvasAsPng } from "@/lib/canvas-tools";
import { downloadCanvasAsPdf } from "@/lib/export";

export function CanvasExportButtons({
  canvasRef,
  baseName,
  disabled,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  baseName: string;
  disabled?: boolean;
}) {
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePng() {
    if (canvasRef.current) downloadCanvasAsPng(canvasRef.current, `${baseName}.png`);
  }

  async function handlePdf() {
    if (!canvasRef.current) return;
    setGeneratingPdf(true);
    setError(null);
    try {
      await downloadCanvasAsPdf(canvasRef.current, `${baseName}.pdf`);
    } catch {
      setError("Não foi possível gerar o PDF.");
    } finally {
      setGeneratingPdf(false);
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Button onClick={handlePng} disabled={disabled} className="flex-1">
          Baixar PNG
        </Button>
        <Button
          variant="outline"
          onClick={handlePdf}
          disabled={disabled || generatingPdf}
          className="flex-1"
        >
          {generatingPdf ? "Gerando…" : "Baixar PDF"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
