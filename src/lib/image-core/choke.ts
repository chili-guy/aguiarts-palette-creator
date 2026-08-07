import type { RGBAImage } from "./types";

/**
 * Shrinks ("chokes") the opaque region of an image by eroding its alpha
 * channel with a circular structuring element of the given radius. Used to
 * avoid white halos around a design when printing DTF/DTG.
 */
export function choke(image: RGBAImage, radius: number): RGBAImage {
  const { width, height, data: src } = image;
  const r = Math.max(0, Math.round(radius));
  const out = new Uint8ClampedArray(src);
  if (r === 0) return { data: out, width, height };

  const offsets: Array<[number, number]> = [];
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) offsets.push([dx, dy]);
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minAlpha = 255;
      for (const [dx, dy] of offsets) {
        const nx = x + dx;
        const ny = y + dy;
        const alpha =
          nx >= 0 && nx < width && ny >= 0 && ny < height ? src[(ny * width + nx) * 4 + 3]! : 0;
        if (alpha < minAlpha) minAlpha = alpha;
        if (minAlpha === 0) break;
      }
      const idx = (y * width + x) * 4;
      out[idx] = src[idx]!;
      out[idx + 1] = src[idx + 1]!;
      out[idx + 2] = src[idx + 2]!;
      out[idx + 3] = minAlpha;
    }
  }

  return { data: out, width, height };
}
