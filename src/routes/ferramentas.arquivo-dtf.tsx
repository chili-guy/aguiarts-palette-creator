import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { CanvasExportButtons } from "@/components/canvas-export-buttons";
import { ToolPageShell } from "@/components/tool-page-shell";
import { loadImageFile } from "@/lib/canvas-tools";

export const Route = createFileRoute("/ferramentas/arquivo-dtf")({
  head: () => ({ meta: [{ title: "Arquivo DTF | Printzy" }] }),
  component: DtfSheetTool,
});

interface SheetItem {
  id: string;
  img: HTMLImageElement;
  name: string;
}

/** Simple shelf (row) bin-packing: every item is normalized to the same print
 * height and placed left-to-right, wrapping to a new row when the sheet width
 * would be exceeded. Good enough for flat art nesting on a DTF roll. */
function layoutItems(
  items: SheetItem[],
  sheetWidthPx: number,
  itemHeightPx: number,
  gapPx: number,
) {
  let cursorX = 0;
  let cursorY = 0;
  const placed = items.map((item) => {
    const itemWidthPx = (item.img.naturalWidth / item.img.naturalHeight) * itemHeightPx;
    if (cursorX > 0 && cursorX + itemWidthPx > sheetWidthPx) {
      cursorX = 0;
      cursorY += itemHeightPx + gapPx;
    }
    const rect = { item, x: cursorX, y: cursorY, width: itemWidthPx, height: itemHeightPx };
    cursorX += itemWidthPx + gapPx;
    return rect;
  });
  const sheetHeightPx = placed.length > 0 ? cursorY + itemHeightPx + gapPx : itemHeightPx;
  return { placed, sheetHeightPx };
}

function DtfSheetTool() {
  const [items, setItems] = useState<SheetItem[]>([]);
  const [sheetWidthCm, setSheetWidthCm] = useState(58);
  const [itemHeightCm, setItemHeightCm] = useState(10);
  const [gapMm, setGapMm] = useState(5);
  const [dpi, setDpi] = useState(300);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const pxPerCm = dpi / 2.54;
  const sheetWidthPx = Math.round(sheetWidthCm * pxPerCm);
  const itemHeightPx = Math.round(itemHeightCm * pxPerCm);
  const gapPx = Math.round((gapMm / 10) * pxPerCm);

  const layout = useMemo(
    () => layoutItems(items, sheetWidthPx, itemHeightPx, gapPx),
    [items, sheetWidthPx, itemHeightPx, gapPx],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = sheetWidthPx;
    canvas.height = Math.max(itemHeightPx, layout.sheetHeightPx);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const { item, x, y, width, height } of layout.placed) {
      ctx.drawImage(item.img, x, y, width, height);
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.setLineDash([pxPerCm * 0.2, pxPerCm * 0.2]);
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, width, height);
    }

    // 1cm ruler ticks along the top edge.
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.font = `${Math.round(pxPerCm * 0.35)}px sans-serif`;
    for (let cm = 0; cm * pxPerCm < canvas.width; cm += 5) {
      const x = cm * pxPerCm;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, pxPerCm * 0.3);
      ctx.stroke();
      ctx.fillText(`${cm}cm`, x + 3, pxPerCm * 0.3 + 12);
    }
  }, [layout, sheetWidthPx, itemHeightPx, pxPerCm]);

  async function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setError(null);
    try {
      const loaded = await Promise.all(
        files.map(async (file) => ({
          id: `${file.name}-${crypto.randomUUID()}`,
          img: await loadImageFile(file),
          name: file.name,
        })),
      );
      setItems((prev) => [...prev, ...loaded]);
    } catch {
      setError("Não foi possível carregar uma ou mais imagens.");
    }
    e.target.value = "";
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const baseName = "folha-dtf";
  const sheetHeightCm = Math.round((layout.sheetHeightPx / pxPerCm) * 10) / 10;

  return (
    <ToolPageShell
      title="Arquivo DTF"
      subtitle="Monte a folha com encaixe otimizado, régua e sangria — aproveite cada metro de filme."
    >
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>
              Folha ({sheetWidthCm}cm × {sheetHeightCm}cm)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-80 items-center justify-center overflow-auto rounded-md border border-dashed bg-muted/30 p-4">
              {items.length > 0 ? (
                <canvas
                  ref={canvasRef}
                  role="img"
                  aria-label="Pré-visualização da folha DTF"
                  className="max-w-full rounded-sm border border-border shadow-sm"
                  style={{ width: `${Math.min(sheetWidthPx, 900)}px`, height: "auto" }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Envie uma ou mais artes para montar a folha
                </p>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFilesChange}
                className="w-auto"
              />
              {error && <span className="text-sm text-destructive">{error}</span>}
            </div>
            {items.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground"
                  >
                    {item.name}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remover ${item.name}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuração da folha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Largura da folha</Label>
                <span className="text-sm text-muted-foreground tabular-nums">{sheetWidthCm}cm</span>
              </div>
              <Slider
                value={[sheetWidthCm]}
                min={20}
                max={100}
                step={1}
                onValueChange={(v) => setSheetWidthCm(Array.isArray(v) ? (v[0] ?? 0) : v)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Altura de cada arte</Label>
                <span className="text-sm text-muted-foreground tabular-nums">{itemHeightCm}cm</span>
              </div>
              <Slider
                value={[itemHeightCm]}
                min={2}
                max={40}
                step={1}
                onValueChange={(v) => setItemHeightCm(Array.isArray(v) ? (v[0] ?? 0) : v)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Espaçamento entre artes</Label>
                <span className="text-sm text-muted-foreground tabular-nums">{gapMm}mm</span>
              </div>
              <Slider
                value={[gapMm]}
                min={0}
                max={30}
                step={1}
                onValueChange={(v) => setGapMm(Array.isArray(v) ? (v[0] ?? 0) : v)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Resolução</Label>
                <span className="text-sm text-muted-foreground tabular-nums">{dpi} DPI</span>
              </div>
              <Slider
                value={[dpi]}
                min={150}
                max={300}
                step={10}
                onValueChange={(v) => setDpi(Array.isArray(v) ? (v[0] ?? 0) : v)}
              />
            </div>

            <Separator />
            <CanvasExportButtons
              canvasRef={canvasRef}
              baseName={baseName}
              disabled={items.length === 0}
            />
          </CardContent>
        </Card>
      </div>
    </ToolPageShell>
  );
}
