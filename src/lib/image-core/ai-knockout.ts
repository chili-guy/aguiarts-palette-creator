import type { RGBAImage } from "./types";

/**
 * Turns an AI halftone render into a DTF-ready separation: one flat ink colour
 * on transparency.
 *
 * The image models return the screen on an opaque field — black dots on white,
 * or white dots on black for a dark garment. Neither drops onto a garment as-is.
 * This keys the field out by luminance and repaints every surviving dot in the
 * chosen ink, keeping the soft edge so the dots stay anti-aliased.
 *
 *   background "white"  → knock out the paper, keep the dark dots  (light garment)
 *   background "black"  → knock out the black, keep the light dots (dark garment)
 */
export interface KnockoutOptions {
  background: "white" | "black";
  /** Ink the surviving dots are repainted in. */
  ink: [number, number, number];
  /**
   * How hard the key is. 0 keeps the model's own soft ramp; 1 is almost a hard
   * threshold. Default 0.5.
   */
  contrast?: number;
  /**
   * Swap which tone becomes ink. Off: the dark dots print (right for line art —
   * the outlines carry the ink). On: the light areas print instead, for art
   * whose subject is the bright part.
   */
  invert?: boolean;
}

function luma(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function smoothstep(e0: number, e1: number, x: number): number {
  if (e1 === e0) return x < e0 ? 0 : 1;
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

export function knockoutHalftone(image: RGBAImage, options: KnockoutOptions): RGBAImage {
  const { width, height, data } = image;
  const { background, ink } = options;
  const k = Math.min(1, Math.max(0, options.contrast ?? 0.5));
  // Wider band = softer key. k 0 → ~0.45 wide, k 1 → ~0.05 wide.
  const half = 0.05 + (1 - k) * 0.4;
  const mid = 0.5;
  // "dark = ink" for a white field; `invert` flips that.
  const darkIsInk = (background === "white") !== !!options.invert;

  const out = new Uint8ClampedArray(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    const i = p * 4;
    const srcA = data[i + 3]! / 255;
    if (srcA === 0) continue;
    const l = luma(data[i]!, data[i + 1]!, data[i + 2]!);

    // coverage = how much this pixel is "ink" rather than field
    const coverage = darkIsInk
      ? smoothstep(mid + half, mid - half, l)
      : smoothstep(mid - half, mid + half, l);
    const a = coverage * srcA;
    if (a <= 0) continue;

    out[i] = ink[0];
    out[i + 1] = ink[1];
    out[i + 2] = ink[2];
    out[i + 3] = a * 255;
  }
  return { data: out, width, height };
}
