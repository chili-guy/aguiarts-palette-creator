import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { diffMask, removeGhostDots, type RGBAImage } from "@/lib/image-core";
import { ToolPageShell } from "@/components/tool-page-shell";
import {
  ControlGroup,
  Hint,
  OptionPills,
  PreviewPlaceholder,
  PreviewStage,
  PrimaryAction,
  SliderRow,
  ToolLayout,
} from "@/components/tool-ui";
import {
  downloadCanvasAsPng,
  drawRGBAImage,
  imageToRGBAImage,
  loadImageFile,
} from "@/lib/canvas-tools";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export const Route = createFileRoute("/ferramentas/pontos-fantasmas")({
  head: () => ({ meta: [{ title: "Removedor de Pontos Fantasmas | Printzy" }] }),
  component: GhostDotsTool,
});

type View = "resultado" | "removido";

function GhostDotsTool() {
  const [original, setOriginal] = useState<RGBAImage | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [minAlpha, setMinAlpha] = useState(24);
  const [maxSpeckArea, setMaxSpeckArea] = useState(12);
  const [hardenEdges, setHardenEdges] = useState(0);
  const [view, setView] = useState<View>("resultado");
  const [showBefore, setShowBefore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const settings = useMemo(
    () => ({ minAlpha, maxSpeckArea, hardenEdges }),
    [minAlpha, maxSpeckArea, hardenEdges],
  );
  // Labelling islands walks the whole image, so don't redo it mid-drag.
  const debounced = useDebouncedValue(settings, 180);
  const isPending = debounced !== settings;

  const result = useMemo(() => {
    if (!original) return null;
    return removeGhostDots(original, { ...debounced, diagonal: true });
  }, [original, debounced]);

  const shown = useMemo<RGBAImage | null>(() => {
    if (!original || !result) return null;
    if (showBefore) return original;
    return view === "removido" ? diffMask(original, result) : result;
  }, [original, result, view, showBefore]);

  useEffect(() => {
    if (shown && canvasRef.current) drawRGBAImage(canvasRef.current, shown);
  }, [shown]);

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

  const baseName = `${fileName?.replace(/\.[^/.]+$/, "") || "imagem"}-sem-pontos`;
  const status = result
    ? `${result.specksRemoved} ponto${result.specksRemoved === 1 ? "" : "s"} solto${
        result.specksRemoved === 1 ? "" : "s"
      } removido${result.specksRemoved === 1 ? "" : "s"} • ${result.pixelsCleared.toLocaleString(
        "pt-BR",
      )} pixels limpos`
    : "Sem imagem";

  return (
    <ToolPageShell
      title="Removedor de Pontos Fantasmas"
      subtitle="Remova resíduos e pixels semitransparentes antes de exportar."
    >
      <ToolLayout
        controls={
          <>
            <ControlGroup step="01" label="Imagem">
              <label className="block cursor-pointer rounded-xl border border-border-strong bg-accent/10 px-4 py-4 text-center transition-colors hover:bg-accent/15">
                <span className="block text-sm font-bold">Selecionar imagem</span>
                <span className="block text-xs text-muted-foreground">PNG com fundo removido</span>
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
                  {original
                    ? `${original.width} × ${original.height} px`
                    : "Rode depois do recorte, antes de exportar"}
                </p>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </ControlGroup>

            <ControlGroup step="02" label="Pixels fantasmas">
              <SliderRow
                label="Transparência mínima"
                value={minAlpha}
                min={0}
                max={128}
                onChange={setMinAlpha}
              />
              <Hint>
                pixel com opacidade abaixo disso some. É o que causa aquele véu cinza em volta da
                arte: quase invisível na tela, mas o RIP joga tinta nele.
              </Hint>
            </ControlGroup>

            <ControlGroup step="03" label="Pontos soltos">
              <SliderRow
                label="Tamanho do ponto"
                value={maxSpeckArea}
                min={0}
                max={200}
                suffix=" px"
                onChange={setMaxSpeckArea}
              />
              <Hint>
                ilhas de pixels menores que isso são apagadas. Cuidado ao passar de{" "}
                <strong>100 px</strong>: detalhes legítimos separados da arte — pingo de "i", brilho
                no olho — também são ilhas pequenas.
              </Hint>
            </ControlGroup>

            <ControlGroup step="04" label="Acabamento">
              <SliderRow
                label="Endurecer borda"
                value={hardenEdges}
                min={0}
                max={100}
                onChange={setHardenEdges}
              />
              <Hint>
                deixa a borda chapada em vez de degradê. Ajuda na prensa, mas em 100% a arte fica
                serrilhada — suba só até a borda parar de esfumaçar.
              </Hint>
            </ControlGroup>

            <ControlGroup step="05" label="Visualização">
              <OptionPills<View>
                columns={2}
                value={view}
                onChange={setView}
                options={[
                  { value: "resultado", label: "Resultado" },
                  { value: "removido", label: "O que saiu" },
                ]}
              />
              <Hint>
                "O que saiu" pinta de rosa tudo que a limpeza apagou — confira antes de exportar que
                nenhum detalhe da arte foi junto.
              </Hint>
            </ControlGroup>

            <div className="border-t border-border pt-4">
              <PrimaryAction
                className="w-full"
                disabled={!result}
                onClick={() => {
                  if (!canvasRef.current || !result) return;
                  // Export the clean art, never the inspection overlay.
                  drawRGBAImage(canvasRef.current, result);
                  downloadCanvasAsPng(canvasRef.current, `${baseName}.png`);
                }}
              >
                Baixar PNG
              </PrimaryAction>
            </div>
          </>
        }
      >
        <PreviewStage
          title="Prévia da arte"
          caption="Pixels semitransparentes e ilhas soltas saem; o resto fica."
          status={status}
          hint="Segure “Ver antes” para comparar com o original."
          actions={
            <button
              type="button"
              disabled={!original}
              onMouseDown={() => setShowBefore(true)}
              onMouseUp={() => setShowBefore(false)}
              onMouseLeave={() => setShowBefore(false)}
              onTouchStart={() => setShowBefore(true)}
              onTouchEnd={() => setShowBefore(false)}
              className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-semibold transition-colors hover:border-border-strong disabled:opacity-40"
            >
              Ver antes
            </button>
          }
        >
          {shown ? (
            <div className="relative rounded-xl bg-checkerboard p-4">
              <canvas
                ref={canvasRef}
                role="img"
                aria-label="Prévia da limpeza de pontos"
                className={`max-h-[60vh] max-w-full rounded-sm transition-opacity ${
                  isPending ? "opacity-50" : ""
                }`}
              />
              <span className="absolute top-3 left-3 rounded-md bg-background/85 px-2 py-1 font-mono text-[10px] font-bold tracking-wider">
                {showBefore
                  ? "Antes / original"
                  : view === "removido"
                    ? "Área removida"
                    : "Depois / resultado"}
              </span>
            </div>
          ) : (
            <PreviewPlaceholder label="Envie uma imagem para começar" />
          )}
        </PreviewStage>
      </ToolLayout>
    </ToolPageShell>
  );
}
