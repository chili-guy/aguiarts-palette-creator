import type { MockupView } from "@/lib/mockup-templates";

/**
 * Renders one garment view — cropped out of its source file and, when the
 * artwork allows it, recoloured.
 *
 * Recolouring composites rather than editing the SVG: `source-in` keeps the
 * silhouette's alpha and replaces every colour under it, which works no matter
 * how the file is structured internally. Editing fills would mean parsing each
 * file and guessing which path is the body — and these files come from several
 * different authors, so there is no consistent structure to rely on.
 *
 * Garments whose shading is painted in are left alone; a flat tint would erase
 * the very thing that makes them look like fabric.
 */
export function renderGarment(
  img: HTMLImageElement,
  view: MockupView,
  targetWidth: number,
  color?: string,
): HTMLCanvasElement {
  const k = targetWidth / view.crop.width;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(view.crop.width * k));
  canvas.height = Math.max(1, Math.round(view.crop.height * k));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2d canvas context");

  // Draw the whole file offset so the crop region lands on the origin. Going
  // through drawImage's source-rect arguments would depend on the SVG
  // reporting an intrinsic size, which files without width/height do not.
  ctx.drawImage(
    img,
    -view.crop.x * k,
    -view.crop.y * k,
    view.sourceWidth * k,
    view.sourceHeight * k,
  );

  if (color) {
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";
  }

  return canvas;
}
