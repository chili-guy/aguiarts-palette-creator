import { PDFDocument } from "pdf-lib";
import { pixelsToPoints } from "./dpi";

export interface PngToPdfOptions {
  width: number;
  height: number;
  /** @default 300 */
  dpi?: number;
}

/** Wraps a PNG image into a single-page PDF sized to print at the given DPI. */
export async function pngToPdf(
  pngBytes: Uint8Array,
  options: PngToPdfOptions,
): Promise<Uint8Array> {
  const dpi = options.dpi ?? 300;
  const widthPt = pixelsToPoints(options.width, dpi);
  const heightPt = pixelsToPoints(options.height, dpi);

  const pdfDoc = await PDFDocument.create();
  const png = await pdfDoc.embedPng(pngBytes);
  const page = pdfDoc.addPage([widthPt, heightPt]);
  page.drawImage(png, { x: 0, y: 0, width: widthPt, height: heightPt });

  return pdfDoc.save();
}
