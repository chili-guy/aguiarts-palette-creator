import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { applyFrame, type FrameStyle, type RGBAImage } from "@/lib/image-core";
import { CanvasExportButtons } from "@/components/canvas-export-buttons";
import { ToolPageShell } from "@/components/tool-page-shell";
import {
  ControlGroup,
  Hint,
  OptionPills,
  PreviewPlaceholder,
  PreviewStage,
  SliderRow,
  ToolLayout,
} from "@/components/tool-ui";
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
      title="Molduras Pro"
      subtitle="Aplique molduras corridas e bordas grunge na arte com PNG transparente."
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
                  {fileName ? "Ajuste a moldura ao lado." : "Carregue uma imagem para começar."}
                </p>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </ControlGroup>

            <ControlGroup step="02" label="Molduras">
              <OptionPills
                options={STYLES.map((s) => ({ value: s.value, label: s.label }))}
                value={style}
                onChange={setStyle}
              />
              <Hint>
                a moldura respeita a transparência do PNG — envie a arte já com o fundo removido
                para o acabamento encostar no desenho.
              </Hint>
            </ControlGroup>

            <ControlGroup step="03" label="Ajuste da arte">
              <SliderRow
                label="Espessura"
                value={thickness}
                min={1}
                max={60}
                suffix="px"
                onChange={setThickness}
              />
              <SliderRow
                label="Distância da borda"
                value={inset}
                min={0}
                max={60}
                suffix="px"
                onChange={setInset}
              />
              <div className="space-y-2">
                <span className="text-sm font-medium">Cor</span>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-full cursor-pointer rounded-xl border border-border bg-secondary"
                />
              </div>
            </ControlGroup>

            <div className="border-t border-border pt-4">
              <CanvasExportButtons
                canvasRef={canvasRef}
                baseName={baseName}
                disabled={!processed}
              />
            </div>
          </>
        }
      >
        <PreviewStage
          title="Prévia da arte"
          caption={fileName ?? "Carregue uma imagem."}
          status={processed ? `Moldura ${style} aplicada` : "Sem imagem"}
          hint="Preview = zoom • arraste para navegar"
        >
          {processed ? (
            <canvas
              ref={canvasRef}
              role="img"
              aria-label="Pré-visualização"
              className="max-h-full max-w-full rounded-lg bg-checkerboard shadow-card"
            />
          ) : (
            <PreviewPlaceholder />
          )}
        </PreviewStage>
      </ToolLayout>
    </ToolPageShell>
  );
}
