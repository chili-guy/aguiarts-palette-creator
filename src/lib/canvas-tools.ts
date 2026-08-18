import type { RGBAImage } from "@/lib/image-core";

export function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

export function imageToRGBAImage(img: HTMLImageElement): RGBAImage {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2d canvas context");
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { data: imageData.data, width: canvas.width, height: canvas.height };
}

/**
 * Resamples a loaded image to an exact pixel size and hands back its pixels.
 *
 * The halftone screen is defined in physical units (lines per inch on a page at
 * a given DPI), so the art has to be resampled to the output resolution *before*
 * it is screened — the same reason the Photoshop action sets the document
 * resolution before converting to Bitmap. Uses the browser's own high-quality
 * scaler rather than a hand-rolled filter.
 */
export function resampleImageToRGBA(
  img: HTMLImageElement,
  width: number,
  height: number,
): RGBAImage {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2d canvas context");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { data: imageData.data, width: canvas.width, height: canvas.height };
}

export function drawRGBAImage(canvas: HTMLCanvasElement, image: RGBAImage) {
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2d canvas context");
  const imageData = new ImageData(new Uint8ClampedArray(image.data), image.width, image.height);
  ctx.putImageData(imageData, 0, 0);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("canvas.toBlob returned null"))),
      "image/png",
    );
  });
}

/** JPEG has no alpha, so anything transparent is flattened onto white first. */
export function canvasToJpgBlob(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> {
  const flat = document.createElement("canvas");
  flat.width = canvas.width;
  flat.height = canvas.height;
  const ctx = flat.getContext("2d");
  if (!ctx) throw new Error("Could not get 2d canvas context");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, flat.width, flat.height);
  ctx.drawImage(canvas, 0, 0);
  return new Promise((resolve, reject) => {
    flat.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("canvas.toBlob returned null"))),
      "image/jpeg",
      quality,
    );
  });
}

export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
  canvasToPngBlob(canvas).then((blob) => downloadBlob(blob, filename));
}

export function downloadTextFile(content: string, mimeType: string, filename: string) {
  downloadBlob(new Blob([content], { type: mimeType }), filename);
}

export function drawBlobToCanvas(canvas: HTMLCanvasElement, blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Could not get 2d canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image blob"));
    };
    img.src = url;
  });
}

// Checkerboard background so transparency is visible, matching typical
// image-editor transparency indicators.
export const TRANSPARENCY_BG_CLASS =
  "bg-[length:16px_16px] bg-[image:linear-gradient(45deg,#e5e5e5_25%,transparent_25%),linear-gradient(-45deg,#e5e5e5_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e5e5_75%),linear-gradient(-45deg,transparent_75%,#e5e5e5_75%)] bg-[position:0_0,0_8px,8px_-8px,-8px_0]";
