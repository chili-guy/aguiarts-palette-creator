export const PDF_POINTS_PER_INCH = 72;

/** Converts a pixel measurement at a given DPI into PDF points (1/72 inch). */
export function pixelsToPoints(pixels: number, dpi: number): number {
  return (pixels / dpi) * PDF_POINTS_PER_INCH;
}
