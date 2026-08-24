import type { RGBAImage } from "./types";

/**
 * Halftone screen calibrated against the Photoshop action Rodrigo verified for
 * dark-garment DTF/DTG.
 *
 * The action is: Grayscale -> Mode: Bitmap -> Halftone Screen, ellipse dot,
 * 22 degrees, 13.78 lines/cm, on a 118.11 px/cm base. Photoshop reports those
 * two numbers in metric; 118.11 px/cm is just 300 DPI and 13.78 lines/cm is
 * 35 LPI, so the whole thing reduces to one number the screen actually cares
 * about: the grid spacing, dpi / lpi = 300 / 35 = 8.57 px.
 */

export const CM_PER_INCH = 2.54;

/** Photoshop's metric readout for a 300 DPI document. */
export const PHOTOSHOP_BASE_PX_PER_CM = 118.11;

export function lpcToLpi(lpc: number): number {
  return lpc * CM_PER_INCH;
}

export function lpiToLpc(lpi: number): number {
  return lpi / CM_PER_INCH;
}

/** The values read off the verified action, for the "restore defaults" preset. */
export const PHOTOSHOP_ACTION = {
  lpc: 13.78,
  lpi: 35,
  angle: 22,
  dpi: 300,
  /** Photoshop's ellipse dot is slightly flattened rather than a true circle. */
  dotAspect: 0.85,
} as const;

/**
 * Radius multiplier at which neighbouring dots first overlap on the diagonal,
 * i.e. the point past which a fully-inked area stops showing pinholes and
 * fuses into one solid block. sqrt(2) on top of half the cell spacing.
 */
export const FUSION_STRENGTH = Math.SQRT2;

export type GarmentTone = "dark" | "light";

/**
 * Which measure of a pixel decides how much ink it gets.
 *
 * "luma" is perceived brightness, which is what a conventional screen uses.
 * "valor" is the largest channel — HSV value — and it is what a single-ink
 * garment print actually wants: a saturated red is a strong, fully-covered
 * colour that should print near-solid, but its luma is only ~0.3, so a luma
 * screen would render it as sparse dots and the artwork would fall apart.
 */
export type ToneSource = "luma" | "valor";
export type ColorMode = "mono" | "rgb";
/**
 * How a tone value maps to dot radius. "area" is what a real halftone screen
 * does — a dot's *area* is what reads as darkness, so radius tracks sqrt(tone)
 * and midtones reproduce linearly. "linear" drives the radius straight off the
 * tone, which lightens the midtones; it is what the reference snippet did.
 */
export type ToneCurve = "area" | "linear";

export interface Levels {
  /** Input black point, 0..1. Tones at or below this go to paper. */
  black: number;
  /** Input white point, 0..1. Tones at or above this go to full ink. */
  white: number;
  /** Midtone gamma. >1 opens the midtones, <1 closes them. */
  gamma: number;
}

export const DEFAULT_LEVELS: Levels = { black: 0, white: 1, gamma: 1 };

/**
 * Levels the tool starts from.
 *
 * The action runs a Levels step before converting to Bitmap, to "estourar as
 * sombras e realces" — clip the shadows and highlights — before the screen
 * sees them. Rodrigo never sent the exact input/output numbers, so these are
 * chosen to reproduce the behaviour he described rather than the digits: the
 * white point sits low enough that a vivid, fully-covered area reaches full
 * tone and its dots overlap into solid ink, and the black point drops the
 * near-blacks that would otherwise print as isolated specks.
 *
 * Neutral levels are still one slider away, and are what the "Níveis" group
 * resets to.
 */
export const ACTION_LEVELS: Levels = { black: 0.12, white: 0.82, gamma: 1 };

export interface HalftoneOptions {
  /** Screen frequency in lines per inch. The action uses 35. */
  lpi: number;
  /** Resolution the art is being screened at. The action's base is 300. */
  dpi: number;
  /** Screen angle in degrees. The action uses 22. */
  angle: number;
  /** Dot minor/major axis ratio. 1 = round, 0.85 = Photoshop's ellipse. */
  dotAspect?: number;
  /**
   * Multiplier on the dot's maximum radius, which is half the grid spacing.
   * Above FUSION_STRENGTH a 100% area is fully covered and reads as solid ink;
   * the reference snippet used 1.25, just short of that, so the very darkest
   * areas keep a hair of texture.
   */
  strength?: number;
  /**
   * Which end of the tone range gets ink. On a dark garment you print the
   * artwork's own light/saturated areas, so brighter source = bigger dot. On a
   * light garment ink stands in for darkness, so the mapping inverts.
   */
  garment?: GarmentTone;
  /** Levels applied after grayscale, before the dots are sized. */
  levels?: Levels;
  toneCurve?: ToneCurve;
  /** Defaults to "valor" on dark garments and "luma" on light ones. */
  toneSource?: ToneSource;
  /**
   * "mono" screens luminance once and lays it down in inkColor. "rgb" screens
   * each channel on its own angle so the art keeps its colour, the way a
   * separated print does.
   */
  colorMode?: ColorMode;
  inkColor?: [number, number, number];
  /** Per-channel angles for "rgb". Offset from each other to avoid moire. */
  channelAngles?: [number, number, number];
  /**
   * Scales the grid without changing lpi/dpi, for rendering a downsampled
   * preview that matches the full-resolution export dot for dot.
   */
  scale?: number;
}

export const DEFAULT_CHANNEL_ANGLES: [number, number, number] = [15, 75, 45];

/** Grid spacing in pixels — the only geometry number the screen needs. */
export function gridSpacing(dpi: number, lpi: number): number {
  return dpi / Math.max(1e-6, lpi);
}

function applyLevels(value: number, levels: Levels): number {
  const span = Math.max(1e-6, levels.white - levels.black);
  const t = Math.min(1, Math.max(0, (value - levels.black) / span));
  return levels.gamma === 1 ? t : Math.pow(t, 1 / levels.gamma);
}

/**
 * Samples one cell centre and returns the dot radius for it.
 *
 * `channel` is -1 for luminance, or 0/1/2 for R/G/B. Transparent pixels return
 * 0 so art that fades out tapers into isolated dots and then nothing, instead
 * of stopping at a hard edge.
 */
function radiusAt(
  src: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  channel: number,
  toneSource: ToneSource,
  garment: GarmentTone,
  levels: Levels,
  toneCurve: ToneCurve,
  maxRadius: number,
): number {
  const cx = Math.min(width - 1, Math.max(0, Math.round(x)));
  const cy = Math.min(height - 1, Math.max(0, Math.round(y)));
  const idx = (cy * width + cx) * 4;

  const alpha = src[idx + 3]! / 255;
  if (alpha === 0) return 0;

  let value: number;
  if (channel >= 0) {
    value = src[idx + channel]! / 255;
  } else if (toneSource === "valor") {
    value = Math.max(src[idx]!, src[idx + 1]!, src[idx + 2]!) / 255;
  } else {
    value = (0.299 * src[idx]! + 0.587 * src[idx + 1]! + 0.114 * src[idx + 2]!) / 255;
  }

  const tone = applyLevels(garment === "light" ? 1 - value : value, levels);
  const factor = tone * alpha;
  if (factor <= 0) return 0;

  return maxRadius * (toneCurve === "area" ? Math.sqrt(factor) : factor);
}

interface Grid {
  radii: Float32Array;
  /** Cell index of the first column/row stored. */
  i0: number;
  j0: number;
  cols: number;
  rows: number;
}

/**
 * Builds the rotated dot grid once, sampling the source at each cell centre,
 * so the per-pixel rasterisation below is a pure geometry test.
 */
function buildGrid(
  image: RGBAImage,
  spacing: number,
  angleRad: number,
  channel: number,
  toneSource: ToneSource,
  garment: GarmentTone,
  levels: Levels,
  toneCurve: ToneCurve,
  maxRadius: number,
): Grid {
  const { width, height, data } = image;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  // Screen-space bounds of the image's four corners.
  let minRx = Infinity;
  let maxRx = -Infinity;
  let minRy = Infinity;
  let maxRy = -Infinity;
  for (const [cx, cy] of [
    [0, 0],
    [width, 0],
    [0, height],
    [width, height],
  ] as const) {
    const rx = cx * cos + cy * sin;
    const ry = -cx * sin + cy * cos;
    if (rx < minRx) minRx = rx;
    if (rx > maxRx) maxRx = rx;
    if (ry < minRy) minRy = ry;
    if (ry > maxRy) maxRy = ry;
  }

  // One cell of margin on each side: a dot centred just outside the image can
  // still spill ink back into it.
  const i0 = Math.floor(minRx / spacing) - 1;
  const j0 = Math.floor(minRy / spacing) - 1;
  const cols = Math.floor(maxRx / spacing) - i0 + 2;
  const rows = Math.floor(maxRy / spacing) - j0 + 2;

  const radii = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    const rcy = (j0 + j + 0.5) * spacing;
    for (let i = 0; i < cols; i++) {
      const rcx = (i0 + i + 0.5) * spacing;
      // Rotate the cell centre back into image space to sample it.
      const ox = rcx * cos - rcy * sin;
      const oy = rcx * sin + rcy * cos;
      radii[j * cols + i] = radiusAt(
        data,
        width,
        height,
        ox,
        oy,
        channel,
        toneSource,
        garment,
        levels,
        toneCurve,
        maxRadius,
      );
    }
  }

  return { radii, i0, j0, cols, rows };
}

/**
 * Rasterises one screened channel into `coverage` (0..1 per pixel).
 *
 * Each pixel checks its own cell and the eight around it, because a dot whose
 * radius exceeds half the spacing reaches into its neighbours — that overlap is
 * exactly what fuses solid areas, so clipping dots to their own cell would turn
 * them into squares right where the art should go solid.
 */
function rasterize(
  coverage: Float32Array,
  width: number,
  height: number,
  grid: Grid,
  spacing: number,
  angleRad: number,
  dotAspect: number,
) {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const { radii, i0, j0, cols, rows } = grid;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const rx = x * cos + y * sin;
      const ry = -x * sin + y * cos;
      const ci = Math.floor(rx / spacing);
      const cj = Math.floor(ry / spacing);

      let best = 0;
      for (let dj = -1; dj <= 1 && best < 1; dj++) {
        const j = cj + dj - j0;
        if (j < 0 || j >= rows) continue;
        for (let di = -1; di <= 1; di++) {
          const i = ci + di - i0;
          if (i < 0 || i >= cols) continue;

          const a = radii[j * cols + i]!;
          if (a <= 0) continue;
          const b = a * dotAspect;

          // The grid is already rotated, so an axis-aligned ellipse in screen
          // space is a dot tilted to the screen angle in the image — which is
          // what Photoshop draws.
          const dx = rx - (i0 + i + 0.5) * spacing;
          const dy = ry - (j0 + j + 0.5) * spacing;
          const nx = dx / a;
          const ny = dy / b;
          const d = Math.sqrt(nx * nx + ny * ny);

          // Antialias across roughly one pixel at the ellipse edge.
          const cov = Math.min(1, Math.max(0, (1 - d) * b + 0.5));
          if (cov > best) {
            best = cov;
            if (best >= 1) break;
          }
        }
      }
      coverage[y * width + x] = best;
    }
  }
}

/**
 * Screens an image into halftone dots.
 *
 * Dot radius is driven by tone *and* by the source alpha, which is what makes
 * the result behave like the reference print: fully-opaque saturated areas ask
 * for a radius past the grid spacing, so the dots overlap and read as solid,
 * while gradients, shadows and the fade to transparent are the only places the
 * individual dots stay visible.
 *
 * Output is transparent where there is no ink, so it drops straight onto a
 * garment mockup or into a DTF sheet.
 */
export function halftone(image: RGBAImage, options: HalftoneOptions): RGBAImage {
  const { width, height } = image;
  const {
    lpi,
    dpi,
    angle,
    dotAspect = PHOTOSHOP_ACTION.dotAspect,
    strength = 1.25,
    garment = "dark",
    levels = DEFAULT_LEVELS,
    toneCurve = "area",
    // White ink on a dark garment prints the artwork's own strong colours, so
    // "valor" is the right measure there; on a light garment the ink stands in
    // for darkness and perceived brightness is what matters.
    toneSource = garment === "dark" ? "valor" : "luma",
    colorMode = "mono",
    inkColor = [255, 255, 255],
    channelAngles = DEFAULT_CHANNEL_ANGLES,
    scale = 1,
  } = options;

  const spacing = Math.max(2, gridSpacing(dpi, lpi) * scale);
  const maxRadius = (spacing / 2) * Math.min(2, Math.max(0.1, strength));
  const aspect = Math.min(1, Math.max(0.2, dotAspect));

  const out = new Uint8ClampedArray(width * height * 4);
  const pixels = width * height;

  if (colorMode === "mono") {
    const angleRad = (angle * Math.PI) / 180;
    const grid = buildGrid(
      image,
      spacing,
      angleRad,
      -1,
      toneSource,
      garment,
      levels,
      toneCurve,
      maxRadius,
    );
    const coverage = new Float32Array(pixels);
    rasterize(coverage, width, height, grid, spacing, angleRad, aspect);

    for (let p = 0; p < pixels; p++) {
      const a = coverage[p]!;
      if (a <= 0) continue;
      const o = p * 4;
      out[o] = inkColor[0];
      out[o + 1] = inkColor[1];
      out[o + 2] = inkColor[2];
      out[o + 3] = a * 255;
    }
    return { data: out, width, height };
  }

  // Colour: one screen per channel, each on its own angle so the three grids
  // never line up and produce a moire pattern.
  const channels = [0, 1, 2].map((channel) => {
    const angleRad = (channelAngles[channel]! * Math.PI) / 180;
    const grid = buildGrid(
      image,
      spacing,
      angleRad,
      channel,
      toneSource,
      garment,
      levels,
      toneCurve,
      maxRadius,
    );
    const coverage = new Float32Array(pixels);
    rasterize(coverage, width, height, grid, spacing, angleRad, aspect);
    return coverage;
  }) as [Float32Array, Float32Array, Float32Array];

  for (let p = 0; p < pixels; p++) {
    const cr = channels[0][p]!;
    const cg = channels[1][p]!;
    const cb = channels[2][p]!;
    const a = Math.max(cr, cg, cb);
    if (a <= 0) continue;
    const o = p * 4;
    // Un-premultiply so a partially covered edge pixel keeps its hue instead
    // of washing towards white.
    out[o] = (cr / a) * 255;
    out[o + 1] = (cg / a) * 255;
    out[o + 2] = (cb / a) * 255;
    out[o + 3] = a * 255;
  }

  return { data: out, width, height };
}
