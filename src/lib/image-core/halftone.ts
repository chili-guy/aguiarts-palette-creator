import type { RGBAImage } from "./types";

export interface HalftoneOptions {
  /** Size in pixels of each dot cell. Larger = coarser screen. */
  cellSize: number;
  /** Screen angle in degrees. Classic CMYK separation angles: C=15, M=75, Y=0, K=45. */
  angle?: number;
  inkColor?: [number, number, number];
  paperColor?: [number, number, number];
}

function sampleAt(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
): { luminance: number; alpha: number } {
  const cx = Math.min(width - 1, Math.max(0, Math.round(x)));
  const cy = Math.min(height - 1, Math.max(0, Math.round(y)));
  const idx = (cy * width + cx) * 4;
  const luminance = 0.299 * data[idx]! + 0.587 * data[idx + 1]! + 0.114 * data[idx + 2]!;
  return { luminance, alpha: data[idx + 3]! };
}

/**
 * Renders a classic circular-dot halftone screen. Darker, more opaque regions
 * of the source image produce larger ink dots; the screen can be rotated to
 * the standard CMYK separation angles (C=15, M=75, Y=0, K=45) for manual
 * spot-color prep, or to 22° for the single-ink dark-garment DTF/DTG action
 * this was calibrated against.
 *
 * Two things matter for that garment workflow specifically: dot size must
 * factor in the source alpha (not just tone) so a design that fades to
 * transparent tapers into isolated dots instead of stopping abruptly, and
 * the dot radius must be allowed to grow past the point where neighboring
 * dots touch — otherwise fully-opaque, fully-dark regions (a solid black
 * logo fill, say) keep a pinhole texture instead of fusing into one solid
 * ink block the way a real halftone screen does.
 */
export function halftone(image: RGBAImage, options: HalftoneOptions): RGBAImage {
  const { width, height, data: src } = image;
  const cellSize = Math.max(1, options.cellSize);
  const angleRad = ((options.angle ?? 45) * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const ink = options.inkColor ?? [0, 0, 0];
  const paper = options.paperColor ?? [255, 255, 255];
  // > cellSize * sqrt(2)/2 (~0.707), the point at which a circle centered on
  // each grid cell can fully tile the plane with no gaps left uninked.
  const maxRadius = cellSize * 0.75;

  const out = new Uint8ClampedArray(src.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Rotate pixel coords into screen space.
      const rx = x * cos + y * sin;
      const ry = -x * sin + y * cos;

      const cellX = Math.floor(rx / cellSize);
      const cellY = Math.floor(ry / cellSize);
      const rcx = (cellX + 0.5) * cellSize;
      const rcy = (cellY + 0.5) * cellSize;

      // Rotate the cell center back into image space to sample it.
      const ox = rcx * cos - rcy * sin;
      const oy = rcx * sin + rcy * cos;
      const { luminance, alpha } = sampleAt(src, width, height, ox, oy);
      // 0 = paper (no ink), 1 = full ink. sqrt() counteracts the fact that a
      // circle's *area* — not its radius — is what reads as "how dark this
      // dot looks", so tone reproduces roughly linearly instead of dot gain
      // crushing the midtones dark.
      const coverage = Math.sqrt((1 - luminance / 255) * (alpha / 255));
      const radius = coverage * maxRadius;

      const dx = rx - rcx;
      const dy = ry - rcy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const idx = (y * width + x) * 4;
      if (radius > 0 && dist <= radius) {
        out[idx] = ink[0];
        out[idx + 1] = ink[1];
        out[idx + 2] = ink[2];
        out[idx + 3] = 255;
      } else {
        out[idx] = paper[0];
        out[idx + 1] = paper[1];
        out[idx + 2] = paper[2];
        out[idx + 3] = 0;
      }
    }
  }

  return { data: out, width, height };
}
