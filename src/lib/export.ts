import { pngToPdf } from "@/lib/image-core";
import { canvasToPngBlob, downloadBlob } from "./canvas-tools";

export async function downloadCanvasAsPdf(canvas: HTMLCanvasElement, filename: string, dpi = 300) {
  const pngBlob = await canvasToPngBlob(canvas);
  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
  const pdfBytes = await pngToPdf(pngBytes, { width: canvas.width, height: canvas.height, dpi });
  downloadBlob(new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" }), filename);
}

/** Rasterizes an SVG string at its native pixel size, then reuses the PNG->PDF pipeline. */
export async function downloadSvgAsPdf(
  svg: string,
  width: number,
  height: number,
  filename: string,
  dpi = 300,
) {
  const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Failed to rasterize SVG"));
    el.src = dataUri;
  });

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2d canvas context");
  ctx.drawImage(img, 0, 0, width, height);

  await downloadCanvasAsPdf(canvas, filename, dpi);
}
