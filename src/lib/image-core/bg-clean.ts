import type { RGBAImage } from "./types";

/**
 * Background cleaner — the "Limpador de Fundo" of the production app.
 *
 * This is deliberately *not* background removal. The removal tool cuts a
 * subject out of a photo with a segmentation model; this one takes art that
 * has already been cut out (or was drawn on a flat background) and clears the
 * grime left behind: JPEG mosquito noise around the outline, a not-quite-white
 * paper tone, the halo of a previous careless cut. The artwork itself has to
 * survive untouched, which is what the protection control is for.
 */

export interface BackgroundCleanOptions {
  /** 0..100. How far from the background colour a pixel can sit and still be wiped. */
  strength: number;
  /**
   * 0..100. Guards the artwork: a pixel this far past the wipe threshold is
   * kept at full opacity instead of being partially faded, so strong colours
   * near the background tone do not get eaten.
   */
  protection: number;
  /** 0..100. Blurs the resulting alpha to break up leftover speckle. */
  smoothing: number;
  /**
   * Background colour to clear. Left out, it is sampled from the image border,
   * which is where the background is by definition.
   */
  backgroundColor?: [number, number, number];
}

/** Largest possible distance between two RGB colours, for normalising to 0..1. */
const MAX_RGB_DISTANCE = Math.sqrt(3 * 255 * 255);

/**
 * Estimates the background colour from the image border.
 *
 * Uses the median of each channel rather than the mean: a border that clips a
 * corner of the artwork would drag a mean towards the art, while the median
 * stays on whatever colour actually dominates the edge.
 */
export function sampleBorderColor(image: RGBAImage): [number, number, number] {
  const { width, height, data } = image;
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];

  const push = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    if (data[i + 3]! < 8) return; // transparent border tells us nothing
    rs.push(data[i]!);
    gs.push(data[i + 1]!);
    bs.push(data[i + 2]!);
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  if (rs.length === 0) return [255, 255, 255];
  const median = (arr: number[]) => {
    arr.sort((a, b) => a - b);
    return arr[arr.length >> 1]!;
  };
  return [median(rs), median(gs), median(bs)];
}

/** Box-blurs the alpha plane in place, separably, with the given radius. */
function blurAlpha(alpha: Float32Array, width: number, height: number, radius: number) {
  if (radius < 1) return;
  const tmp = new Float32Array(alpha.length);
  const span = radius * 2 + 1;

  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let d = -radius; d <= radius; d++) {
        const nx = Math.min(width - 1, Math.max(0, x + d));
        sum += alpha[row + nx]!;
      }
      tmp[row + x] = sum / span;
    }
  }
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let sum = 0;
      for (let d = -radius; d <= radius; d++) {
        const ny = Math.min(height - 1, Math.max(0, y + d));
        sum += tmp[ny * width + x]!;
      }
      alpha[y * width + x] = sum / span;
    }
  }
}

/**
 * Clears background residue while leaving the artwork alone.
 *
 * Pixels are scored by how far their colour sits from the background. Below
 * the wipe threshold they fade out linearly, so an anti-aliased outline keeps
 * a soft edge instead of turning into a jagged cut; past the protection
 * threshold they are restored to full opacity.
 */
export function cleanBackground(image: RGBAImage, options: BackgroundCleanOptions): RGBAImage {
  const { width, height, data: src } = image;
  const bg = options.backgroundColor ?? sampleBorderColor(image);

  // Strength maps to a slice of the colour space rather than the whole range:
  // past ~55% of maximum distance every plausible artwork colour would match
  // the background and the tool would erase the art.
  const wipe = (Math.min(100, Math.max(0, options.strength)) / 100) * 0.55;
  // Protection sits above the wipe threshold; at 0 it lands right on it, so a
  // pixel is either wiped or kept with no fade band at all.
  const keep = wipe + (Math.min(100, Math.max(0, options.protection)) / 100) * 0.45;

  const alpha = new Float32Array(width * height);
  for (let p = 0; p < alpha.length; p++) {
    const i = p * 4;
    const a = src[i + 3]!;
    if (a === 0) {
      alpha[p] = 0;
      continue;
    }
    const dr = src[i]! - bg[0];
    const dg = src[i + 1]! - bg[1];
    const db = src[i + 2]! - bg[2];
    const dist = Math.sqrt(dr * dr + dg * dg + db * db) / MAX_RGB_DISTANCE;

    if (dist <= wipe) alpha[p] = 0;
    else if (dist >= keep) alpha[p] = a;
    else alpha[p] = a * ((dist - wipe) / Math.max(1e-6, keep - wipe));
  }

  const radius = Math.round((Math.min(100, Math.max(0, options.smoothing)) / 100) * 4);
  if (radius > 0) {
    blurAlpha(alpha, width, height, radius);
    // Re-bias after blurring: a blur alone would fog the whole cut edge, so
    // push the midtones apart again and clamp what stayed near zero.
    for (let p = 0; p < alpha.length; p++) {
      const v = alpha[p]! / 255;
      alpha[p] = v < 0.12 ? 0 : Math.min(255, v * 1.18 * 255);
    }
  }

  const out = new Uint8ClampedArray(src.length);
  for (let p = 0; p < alpha.length; p++) {
    const i = p * 4;
    out[i] = src[i]!;
    out[i + 1] = src[i + 1]!;
    out[i + 2] = src[i + 2]!;
    out[i + 3] = alpha[p]!;
  }
  return { data: out, width, height };
}
