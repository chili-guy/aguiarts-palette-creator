import type { RGBAImage } from "./types";

/**
 * Background removal that runs before the halftone screen.
 *
 * This is the production tool's first control group ("TIPO DE FUNDO"), and it
 * is not optional decoration: the screen sizes each dot from tone *and* alpha,
 * so on a JPG — which has no alpha at all — an opaque background is read as
 * artwork. A light background on a dark garment then asks for maximum ink
 * across the whole sheet, which prints the negative of the design.
 *
 * The three modes match how the artwork actually arrives at a print shop:
 * drawn on black, sitting on a flat colour, or scanned/exported onto white.
 */

export type BackgroundKind = "escuro" | "colorido" | "claro" | "transparente";

/**
 * Blanks out background regions that never touch the image border.
 *
 * Matching on colour alone removes any pixel that *looks* like background,
 * wherever it sits — so a white skull, a cream highlight or the paper showing
 * through a logo's counter all vanish along with the backdrop. The backdrop is
 * distinguished from artwork by connectivity, not by colour: it is the region
 * that reaches the outside of the image.
 *
 * Iterative flood fill, because a full-bleed background is one region spanning
 * every pixel and a recursive walk would exhaust the stack.
 */
function keepOnlyBorderConnected(mask: Float32Array, width: number, height: number) {
  const n = width * height;
  const reached = new Uint8Array(n);
  const stack = new Int32Array(n);
  let top = 0;

  // Only propagate through pixels that are a confident background match. A
  // partial match — a light-but-real area of the artwork touching the edge —
  // walls the fill off instead of letting it flood the whole shape, which is
  // what used to erase flat light artwork on dark-garment jobs.
  const FLOOD_MIN = 0.6;
  const push = (p: number) => {
    if (!reached[p] && mask[p]! >= FLOOD_MIN) {
      reached[p] = 1;
      stack[top++] = p;
    }
  };
  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }

  while (top > 0) {
    const p = stack[--top]!;
    const px = p % width;
    const py = (p / width) | 0;
    if (px > 0) push(p - 1);
    if (px < width - 1) push(p + 1);
    if (py > 0) push(p - width);
    if (py < height - 1) push(p + width);
  }

  for (let p = 0; p < n; p++) if (!reached[p]) mask[p] = 0;
}

export interface IsolateOptions {
  kind: BackgroundKind;
  /** 0..100. How far from the background a pixel may sit and still be dropped. */
  tolerance: number;
  /**
   * 0..100. Softens the cut so an anti-aliased outline tapers instead of
   * stepping, which is what keeps the screen's edge dots from looking chewed.
   */
  feather?: number;
  /** Overrides the sampled colour for `colorido`. */
  backgroundColor?: [number, number, number];
  /**
   * Restricts removal to the region touching the image border, so light or
   * background-coloured areas *inside* the artwork survive. On by default;
   * turn it off for art whose background is broken into pockets the border
   * cannot reach.
   */
  borderConnectedOnly?: boolean;
}

const MAX_RGB_DISTANCE = Math.sqrt(3 * 255 * 255);

function luma(r: number, g: number, b: number) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Estimates the background colour from the border, by median.
 *
 * The median ignores a subject that clips an edge, where a mean would be
 * dragged toward it and end up erasing part of the artwork.
 */
export function sampleBackground(image: RGBAImage): [number, number, number] {
  const { width, height, data } = image;
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  const push = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    if (data[i + 3]! < 8) return;
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
  const mid = (a: number[]) => {
    a.sort((p, q) => p - q);
    return a[a.length >> 1]!;
  };
  return [mid(rs), mid(gs), mid(bs)];
}

/**
 * Returns the artwork with its background cleared to alpha 0.
 *
 * Pixels are scored 0..1 by how much they look like background; the score is
 * mapped through a soft band so the outline keeps its anti-aliasing.
 */
export function isolateArtwork(image: RGBAImage, options: IsolateOptions): RGBAImage {
  const { width, height, data: src } = image;
  const out = new Uint8ClampedArray(src);
  if (options.kind === "transparente") return { data: out, width, height };

  const tol = Math.min(100, Math.max(0, options.tolerance)) / 100;
  const soft = Math.min(100, Math.max(0, options.feather ?? 35)) / 100;
  const bg = options.backgroundColor ?? sampleBackground(image);

  const mask = new Float32Array(width * height);

  for (let p = 0; p < width * height; p++) {
    const i = p * 4;
    const a = src[i + 3]!;
    if (a === 0) {
      mask[p] = 1; // already transparent: counts as background for the fill
      continue;
    }

    const r = src[i]!;
    const g = src[i + 1]!;
    const b = src[i + 2]!;
    let score: number; // 1 = certainly background, 0 = certainly artwork

    switch (options.kind) {
      case "claro": {
        // Paper white and the faintest grey only. The cut sits high on purpose:
        // a flat light area of the artwork (a cream fill, a pale skin tone, a
        // light-grey panel) is exactly what white ink prints on a dark garment,
        // so it must not be mistaken for the sheet. Raise the tolerance if a
        // real off-white background is being left behind.
        const l = luma(r, g, b);
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const sat = max === 0 ? 0 : (max - min) / max;
        const cut = 1 - tol * 0.32;
        score =
          l >= cut && sat < 0.12
            ? 1
            : Math.max(0, (l - (cut - 0.08)) / 0.08) * (sat < 0.12 ? 1 : 0);
        break;
      }
      case "escuro": {
        const l = luma(r, g, b);
        const cut = tol * 0.5;
        score = l <= cut ? 1 : Math.max(0, 1 - (l - cut) / 0.12);
        break;
      }
      default: {
        const dr = r - bg[0];
        const dg = g - bg[1];
        const db = b - bg[2];
        const dist = Math.sqrt(dr * dr + dg * dg + db * db) / MAX_RGB_DISTANCE;
        const cut = tol * 0.5;
        score = dist <= cut ? 1 : Math.max(0, 1 - (dist - cut) / 0.1);
        break;
      }
    }

    mask[p] = Math.min(1, Math.max(0, score));
  }

  if (options.borderConnectedOnly ?? true) keepOnlyBorderConnected(mask, width, height);

  for (let p = 0; p < width * height; p++) {
    const i = p * 4;
    const score = mask[p]!;
    if (score <= 0) continue;
    if (score >= 1) out[i + 3] = 0;
    else {
      // `soft` decides how much of the partial band survives: at 0 the cut is
      // hard, at 1 the fade is fully honoured.
      out[i + 3] = src[i + 3]! * (1 - score * (0.35 + soft * 0.65));
    }
  }

  return { data: out, width, height };
}
