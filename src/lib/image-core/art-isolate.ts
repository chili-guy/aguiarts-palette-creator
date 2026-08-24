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

  for (let p = 0; p < width * height; p++) {
    const i = p * 4;
    const a = src[i + 3]!;
    if (a === 0) continue;

    const r = src[i]!;
    const g = src[i + 1]!;
    const b = src[i + 2]!;
    let score: number; // 1 = certainly background, 0 = certainly artwork

    switch (options.kind) {
      case "claro": {
        // White and light grey: bright and unsaturated. Requiring low
        // saturation is what stops a pale yellow in the artwork from going
        // with the paper.
        const l = luma(r, g, b);
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const sat = max === 0 ? 0 : (max - min) / max;
        const cut = 1 - tol * 0.55;
        score =
          l >= cut && sat < 0.25
            ? 1
            : Math.max(0, (l - (cut - 0.12)) / 0.12) * (sat < 0.25 ? 1 : 0);
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

    if (score >= 1) out[i + 3] = 0;
    else if (score > 0) {
      // `soft` decides how much of the partial band survives: at 0 the cut is
      // hard, at 1 the fade is fully honoured.
      const keep = 1 - score * (0.35 + soft * 0.65);
      out[i + 3] = a * keep;
    }
  }

  return { data: out, width, height };
}
