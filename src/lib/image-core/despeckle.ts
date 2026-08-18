import type { RGBAImage } from "./types";

/**
 * Ghost-dot remover — the "Removedor de Pontos Fantasmas" of the production
 * app: "remova resíduos e pixels semitransparentes antes de exportar".
 *
 * Two different defects share one name on the press. Ghost pixels are the
 * barely-there alpha values left by a sloppy cut or a resize; they look like
 * nothing on screen but the RIP still lays ink for them, so the print comes
 * out with a grey veil around the design. Loose dots are small islands of
 * fully opaque pixels — dust from a scan, JPEG blocks, the dot of an "i" that
 * got separated — which print as specks scattered around the art.
 *
 * The first is fixed by a threshold, the second needs to know how big each
 * island is, which means labelling connected components.
 */

export interface DespeckleOptions {
  /** 0..255. Alpha at or below this is treated as a ghost and cleared. */
  minAlpha: number;
  /** Islands with fewer opaque pixels than this are removed entirely. */
  maxSpeckArea: number;
  /**
   * 0..100. Pushes surviving semi-transparent pixels towards opaque, so the
   * outline prints as a clean edge instead of a soft fade the press smears.
   */
  hardenEdges: number;
  /** Treats diagonally touching pixels as one island. Matches how ink spreads. */
  diagonal?: boolean;
}

export interface DespeckleResult extends RGBAImage {
  /** How many separate islands were removed — shown in the tool's status bar. */
  specksRemoved: number;
  /** How many pixels were cleared in total, ghosts included. */
  pixelsCleared: number;
}

/**
 * Clears ghost pixels and loose dots.
 *
 * The scan is iterative rather than recursive: a full-bleed design is one
 * island covering every pixel in the image, and a recursive flood fill would
 * blow the stack long before it finished.
 */
export function removeGhostDots(image: RGBAImage, options: DespeckleOptions): DespeckleResult {
  const { width, height, data: src } = image;
  const n = width * height;
  const minAlpha = Math.min(255, Math.max(0, options.minAlpha));
  const maxArea = Math.max(0, Math.round(options.maxSpeckArea));
  const diagonal = options.diagonal ?? true;

  const out = new Uint8ClampedArray(src);
  let pixelsCleared = 0;

  // Pass 1 — ghosts. Anything at or under the threshold stops being ink.
  const solid = new Uint8Array(n);
  for (let p = 0; p < n; p++) {
    const a = src[p * 4 + 3]!;
    if (a === 0) continue;
    if (a <= minAlpha) {
      out[p * 4 + 3] = 0;
      pixelsCleared++;
    } else {
      solid[p] = 1;
    }
  }

  // Pass 2 — loose dots. Label what survived and drop the small islands.
  let specksRemoved = 0;
  if (maxArea > 0) {
    const seen = new Uint8Array(n);
    const stack = new Int32Array(n);
    const island = new Int32Array(n);

    const neighbours = diagonal
      ? [-1, 1, -1, 0, 1, 0, -1, -1, 0, -1, 1, -1, -1, 1, 0, 1, 1, 1]
      : [-1, 0, 1, 0, 0, -1, 0, 1];

    for (let start = 0; start < n; start++) {
      if (!solid[start] || seen[start]) continue;

      let top = 0;
      let size = 0;
      stack[top++] = start;
      seen[start] = 1;

      while (top > 0) {
        const p = stack[--top]!;
        island[size++] = p;
        const px = p % width;
        const py = (p / width) | 0;

        for (let k = 0; k < neighbours.length; k += 2) {
          const nx = px + neighbours[k]!;
          const ny = py + neighbours[k + 1]!;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const q = ny * width + nx;
          if (!solid[q] || seen[q]) continue;
          seen[q] = 1;
          stack[top++] = q;
        }
      }

      if (size < maxArea) {
        specksRemoved++;
        for (let k = 0; k < size; k++) {
          out[island[k]! * 4 + 3] = 0;
          pixelsCleared++;
        }
      }
    }
  }

  // Pass 3 — harden what is left, so the edge prints crisp.
  const harden = Math.min(100, Math.max(0, options.hardenEdges)) / 100;
  if (harden > 0) {
    for (let p = 0; p < n; p++) {
      const a = out[p * 4 + 3]!;
      if (a === 0 || a === 255) continue;
      out[p * 4 + 3] = a + (255 - a) * harden;
    }
  }

  return { data: out, width, height, specksRemoved, pixelsCleared };
}

/**
 * Paints what the cleanup took out, for the tool's "ver o que foi removido"
 * view — the same idea as the production app's "Visualizar área removida".
 */
export function diffMask(
  original: RGBAImage,
  cleaned: RGBAImage,
  color: [number, number, number] = [255, 59, 122],
): RGBAImage {
  const n = original.width * original.height;
  const out = new Uint8ClampedArray(original.data.length);
  for (let p = 0; p < n; p++) {
    const i = p * 4;
    const lost = original.data[i + 3]! - cleaned.data[i + 3]!;
    if (lost > 0) {
      out[i] = color[0];
      out[i + 1] = color[1];
      out[i + 2] = color[2];
      out[i + 3] = Math.min(255, lost * 3);
    } else {
      out[i] = cleaned.data[i]!;
      out[i + 1] = cleaned.data[i + 1]!;
      out[i + 2] = cleaned.data[i + 2]!;
      out[i + 3] = cleaned.data[i + 3]! * 0.25;
    }
  }
  return { data: out, width: original.width, height: original.height };
}
