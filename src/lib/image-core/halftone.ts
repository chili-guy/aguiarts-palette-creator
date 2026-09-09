import type { RGBAImage } from "./types";

/**
 * Halftone screen for dark- and light-garment DTF/DTG.
 *
 * The geometry still starts from the Photoshop action Rodrigo verified —
 * Grayscale -> Bitmap -> Halftone Screen, ellipse dot, 22 degrees, 35 LPI on a
 * 300 DPI base, which reduces to one number: the grid spacing, dpi / lpi =
 * 300 / 35 = 8.57 px — but three things changed after the tool was compared
 * against an AI DTF converter and found to be losing the print:
 *
 *  1. Each cell now integrates the artwork it covers (a box average) instead of
 *     reading a single pixel at its centre. Point sampling made fine detail
 *     vanish and beat against the grid into moire; the average is what a real
 *     screen "sees" and it renders thin lines as an even tone.
 *  2. A full-resolution solid layer is composited over the dots: artwork whose
 *     tone is at or above `solidThreshold` prints as flat ink, so saturated and
 *     opaque areas come out clean instead of pinholed. Set the threshold to 1
 *     for a pure photographic screen.
 *  3. `dotGain` pre-shrinks the midtones so the print — where every dot spreads
 *     on contact — lands on the tone the artwork actually asked for.
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

/** Tone at/above which a pixel prints as flat ink rather than a dot. 1 disables. */
export const DEFAULT_SOLID_THRESHOLD = 0.9;
/** Midtone compensation for press dot gain. 0 disables. */
export const DEFAULT_DOT_GAIN = 0.1;
/** Screen strength the tool starts from. */
export const DEFAULT_STRENGTH = 1.25;

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
 * A gentle clip — drop the deepest shadows that would otherwise print as
 * isolated specks, and let a bright, fully-covered area reach full tone — with
 * most of the range left intact. The old defaults (0.12 / 0.82) clipped so hard
 * that, stacked on the background cleaner and a below-fusion strength, almost
 * nothing survived to the screen.
 */
export const ACTION_LEVELS: Levels = { black: 0.06, white: 0.92, gamma: 1 };

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
   * Above FUSION_STRENGTH a 100% area is fully covered and reads as solid ink.
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
   * Tone (after levels, 0..1) at or above which a pixel prints as flat ink
   * instead of a dot, composited at full resolution so the edge stays crisp.
   * This is what makes saturated / opaque areas come out solid. 1 turns it off
   * for a pure photographic screen.
   */
  solidThreshold?: number;
  /**
   * Press dot-gain compensation, 0..~0.4. Every printed dot spreads on contact,
   * so the midtones come out darker than asked; this shrinks them by
   * `gain * t * (1 - t)` beforehand, leaving paper and solids untouched.
   */
  dotGain?: number;
  /**
   * "area" (default) integrates the artwork under each cell — kills moire and
   * keeps fine detail. "point" reads the cell centre only; kept for comparison.
   */
  sampling?: "area" | "point";
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

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function applyLevels(value: number, levels: Levels): number {
  const span = Math.max(1e-6, levels.white - levels.black);
  const t = clamp01((value - levels.black) / span);
  return levels.gamma === 1 ? t : Math.pow(t, 1 / levels.gamma);
}

/**
 * Per-pixel print tone: garment-adjusted source value, run through levels and
 * dot-gain, multiplied by source alpha. 0 = paper, 1 = full ink. The dot curve
 * (area / linear) is applied later, per cell.
 *
 * `channel` is -1 for luminance/valor, or 0/1/2 for R/G/B.
 */
function buildToneField(
  image: RGBAImage,
  channel: number,
  toneSource: ToneSource,
  garment: GarmentTone,
  levels: Levels,
  dotGain: number,
): Float32Array {
  const { width, height, data } = image;
  const n = width * height;
  const field = new Float32Array(n);
  const gain = Math.max(0, Math.min(0.6, dotGain));

  for (let p = 0; p < n; p++) {
    const i = p * 4;
    const alpha = data[i + 3]! / 255;
    if (alpha === 0) continue;

    let value: number;
    if (channel >= 0) {
      value = data[i + channel]! / 255;
    } else if (toneSource === "valor") {
      value = Math.max(data[i]!, data[i + 1]!, data[i + 2]!) / 255;
    } else {
      value = (0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!) / 255;
    }

    let t = applyLevels(garment === "light" ? 1 - value : value, levels);
    if (gain > 0) t = clamp01(t - gain * t * (1 - t));
    field[p] = t * alpha;
  }

  return field;
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
 * Builds the rotated dot grid.
 *
 * "area" scatters every source pixel into the rotated cell it falls in and
 * takes the mean — a true box average over the cell, no summed-area table and
 * no per-cell resampling. "point" keeps the old behaviour of reading the cell
 * centre. Either way the stored value is the finished dot radius, so the
 * rasteriser below is a pure geometry test.
 */
function buildGrid(
  tone: Float32Array,
  width: number,
  height: number,
  spacing: number,
  angleRad: number,
  toneCurve: ToneCurve,
  maxRadius: number,
  sampling: "area" | "point",
): Grid {
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
  const cellCount = cols * rows;

  const radii = new Float32Array(cellCount);
  const curve = (t: number) => (toneCurve === "area" ? Math.sqrt(t) : t);

  if (sampling === "point") {
    for (let j = 0; j < rows; j++) {
      const rcy = (j0 + j + 0.5) * spacing;
      for (let i = 0; i < cols; i++) {
        const rcx = (i0 + i + 0.5) * spacing;
        const ox = Math.round(rcx * cos - rcy * sin);
        const oy = Math.round(rcx * sin + rcy * cos);
        if (ox < 0 || ox >= width || oy < 0 || oy >= height) continue;
        radii[j * cols + i] = maxRadius * curve(clamp01(tone[oy * width + ox]!));
      }
    }
    return { radii, i0, j0, cols, rows };
  }

  const accum = new Float64Array(cellCount);
  const count = new Uint32Array(cellCount);
  for (let y = 0; y < height; y++) {
    const ySin = y * sin;
    const yCos = y * cos;
    for (let x = 0; x < width; x++) {
      const rx = x * cos + ySin;
      const ry = -x * sin + yCos;
      const ci = Math.floor(rx / spacing) - i0;
      const cj = Math.floor(ry / spacing) - j0;
      if (ci < 0 || ci >= cols || cj < 0 || cj >= rows) continue;
      const c = cj * cols + ci;
      accum[c] = accum[c]! + tone[y * width + x]!;
      count[c] = count[c]! + 1;
    }
  }
  for (let c = 0; c < cellCount; c++) {
    const k = count[c]!;
    if (k === 0) continue;
    radii[c] = maxRadius * curve(clamp01(accum[c]! / k));
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

          // Antialias across ~1px at the edge, scaled by the dot's own size so
          // the ramp stays a pixel wide whether the dot is tiny or fused.
          const edge = Math.sqrt(a * b);
          const cov = clamp01((1 - d) * edge + 0.5);
          if (cov > best) {
            best = cov;
            if (best >= 1) break;
          }
        }
      }
      if (best > coverage[y * width + x]!) coverage[y * width + x] = best;
    }
  }
}

/**
 * Composites the flat-ink layer over the dots: any pixel whose tone is at or
 * above `solidThreshold` reads as solid, with a short ramp below it so the edge
 * keeps the artwork's own anti-aliasing. Runs at full pixel resolution, which
 * is what preserves thin features the dot grid is too coarse to hold.
 */
function addSolidLayer(
  coverage: Float32Array,
  tone: Float32Array,
  solidThreshold: number,
) {
  if (solidThreshold >= 0.999) return;
  const band = Math.max(0.03, (1 - solidThreshold) * 0.75);
  const lo = Math.max(0, solidThreshold - band);
  for (let p = 0; p < coverage.length; p++) {
    const s = smoothstep(lo, solidThreshold, tone[p]!);
    if (s > coverage[p]!) coverage[p] = s;
  }
}

/**
 * Screens an image into halftone dots plus a solid layer.
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
    strength = DEFAULT_STRENGTH,
    garment = "dark",
    levels = DEFAULT_LEVELS,
    toneCurve = "area",
    // White ink on a dark garment prints the artwork's own strong colours, so
    // "valor" is the right measure there; on a light garment the ink stands in
    // for darkness and perceived brightness is what matters.
    toneSource = garment === "dark" ? "valor" : "luma",
    solidThreshold = DEFAULT_SOLID_THRESHOLD,
    dotGain = DEFAULT_DOT_GAIN,
    sampling = "area",
    colorMode = "mono",
    inkColor = [255, 255, 255],
    channelAngles = DEFAULT_CHANNEL_ANGLES,
    scale = 1,
  } = options;

  const spacing = Math.max(2, gridSpacing(dpi, lpi) * scale);
  const maxRadius = (spacing / 2) * Math.min(2, Math.max(0.1, strength));
  const aspect = Math.min(1, Math.max(0.2, dotAspect));
  const solid = Math.min(1, Math.max(0.3, solidThreshold));

  const out = new Uint8ClampedArray(width * height * 4);
  const pixels = width * height;

  if (colorMode === "mono") {
    const angleRad = (angle * Math.PI) / 180;
    const tone = buildToneField(image, -1, toneSource, garment, levels, dotGain);
    const grid = buildGrid(
      tone,
      width,
      height,
      spacing,
      angleRad,
      toneCurve,
      maxRadius,
      sampling,
    );
    const coverage = new Float32Array(pixels);
    rasterize(coverage, width, height, grid, spacing, angleRad, aspect);
    addSolidLayer(coverage, tone, solid);

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
    const tone = buildToneField(image, channel, toneSource, garment, levels, dotGain);
    const grid = buildGrid(
      tone,
      width,
      height,
      spacing,
      angleRad,
      toneCurve,
      maxRadius,
      sampling,
    );
    const coverage = new Float32Array(pixels);
    rasterize(coverage, width, height, grid, spacing, angleRad, aspect);
    addSolidLayer(coverage, tone, solid);
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

/**
 * One-click starting points. Each bundles the screen, the tone mapping and the
 * background cleaner into a setup that just works for a common job, so the ten
 * advanced groups stay folded away for most users.
 *
 * `bg` is the background-cleaner mode the route should switch to; `null` leaves
 * the user's current choice alone.
 */
export interface HalftonePreset {
  id: string;
  label: string;
  note: string;
  garment: GarmentTone;
  toneSource: ToneSource;
  toneCurve: ToneCurve;
  lpi: number;
  angle: number;
  dotAspect: number;
  strength: number;
  solidThreshold: number;
  dotGain: number;
  levels: Levels;
}

export const HALFTONE_PRESETS: HalftonePreset[] = [
  {
    id: "escura-linha",
    label: "Peça escura · arte/logo",
    note: "chapados limpos, retícula só nos degradês",
    garment: "dark",
    toneSource: "valor",
    toneCurve: "area",
    lpi: 40,
    angle: 22,
    dotAspect: PHOTOSHOP_ACTION.dotAspect,
    strength: 1.3,
    solidThreshold: 0.86,
    dotGain: 0.1,
    levels: { black: 0.06, white: 0.92, gamma: 1 },
  },
  {
    id: "escura-foto",
    label: "Peça escura · foto",
    note: "retícula pura, sem chapar as altas luzes",
    garment: "dark",
    toneSource: "valor",
    toneCurve: "area",
    lpi: 35,
    angle: 22,
    dotAspect: PHOTOSHOP_ACTION.dotAspect,
    strength: 1.15,
    solidThreshold: 1,
    dotGain: 0.14,
    levels: { black: 0.03, white: 0.97, gamma: 1.05 },
  },
  {
    id: "clara-linha",
    label: "Peça clara · arte/logo",
    note: "a tinta pinta o escuro da arte",
    garment: "light",
    toneSource: "luma",
    toneCurve: "area",
    lpi: 40,
    angle: 45,
    dotAspect: PHOTOSHOP_ACTION.dotAspect,
    strength: 1.3,
    solidThreshold: 0.84,
    dotGain: 0.1,
    levels: { black: 0.06, white: 0.92, gamma: 1 },
  },
  {
    id: "clara-foto",
    label: "Peça clara · foto",
    note: "retícula clássica de preto a 45°",
    garment: "light",
    toneSource: "luma",
    toneCurve: "area",
    lpi: 35,
    angle: 45,
    dotAspect: PHOTOSHOP_ACTION.dotAspect,
    strength: 1.15,
    solidThreshold: 1,
    dotGain: 0.14,
    levels: { black: 0.03, white: 0.97, gamma: 1.05 },
  },
  {
    id: "chapado",
    label: "Chapado forte",
    note: "fecha tudo, textura só na transição",
    garment: "dark",
    toneSource: "valor",
    toneCurve: "area",
    lpi: 35,
    angle: 22,
    dotAspect: PHOTOSHOP_ACTION.dotAspect,
    strength: 1.6,
    solidThreshold: 0.7,
    dotGain: 0.06,
    levels: { black: 0.08, white: 0.88, gamma: 1 },
  },
];

export const DEFAULT_PRESET_ID = "escura-linha";
