import type { RGBAImage } from "./types";

// Rec. 601 luma weights, standard for perceptual grayscale conversion.
export function toGrayscale(image: RGBAImage): RGBAImage {
  const data = new Uint8ClampedArray(image.data);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    data[i] = luma;
    data[i + 1] = luma;
    data[i + 2] = luma;
  }
  return { data, width: image.width, height: image.height };
}
