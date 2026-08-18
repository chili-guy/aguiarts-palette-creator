import type { RGBAImage } from "./types";

/**
 * Frame library — the "Molduras PRO" catalogue.
 *
 * Frames are generated, never bundled as artwork: a downloaded frame pack
 * carries a licence we cannot verify or redistribute inside a commercial
 * product, and a raster frame would have to be stretched to every art size.
 * Generating them also means the roughness and the seed are live controls
 * rather than a fixed picture, so one style yields an unlimited number of
 * distinct edges.
 *
 * Two families behave differently on purpose:
 *
 * - `linha` frames *paint over* the art near its edge. They are borders.
 * - `borda` frames *eat into* the art's alpha, which is what a grunge or torn
 *   edge actually is. Following the production tool, the erosion only removes
 *   regions that reach the outside of the image, so a gap inside the artwork
 *   never gets hollowed out by a frame applied to its border.
 * - `recorte` frames crop the art to a shape.
 */

export type FrameFamily = "linha" | "borda" | "recorte";

export type FrameStyle =
  | "solida"
  | "dupla"
  | "tracejada"
  | "cantos"
  | "interna"
  | "grunge"
  | "rasgada"
  | "pincel"
  | "respingo"
  | "reticula"
  | "esfumacada"
  | "circulo"
  | "arco";

export interface FrameDef {
  style: FrameStyle;
  /** Catalogue number, as the production tool labels its thumbnails. */
  number: string;
  label: string;
  family: FrameFamily;
  hint: string;
}

/** The catalogue the picker renders, in order. */
export const FRAMES: FrameDef[] = [
  {
    style: "solida",
    number: "01",
    label: "Sólida",
    family: "linha",
    hint: "Borda cheia, a mais neutra.",
  },
  {
    style: "dupla",
    number: "02",
    label: "Dupla",
    family: "linha",
    hint: "Dois filetes com respiro no meio.",
  },
  {
    style: "tracejada",
    number: "03",
    label: "Tracejada",
    family: "linha",
    hint: "Traço cortado, ar de recorte.",
  },
  {
    style: "cantos",
    number: "04",
    label: "Cantos",
    family: "linha",
    hint: "Só os quatro cantos, estilo mira.",
  },
  {
    style: "interna",
    number: "05",
    label: "Interna",
    family: "linha",
    hint: "Filete fino afastado da borda.",
  },
  {
    style: "grunge",
    number: "06",
    label: "Grunge",
    family: "borda",
    hint: "Borda comida, irregular.",
  },
  {
    style: "rasgada",
    number: "07",
    label: "Rasgada",
    family: "borda",
    hint: "Papel rasgado, corte grosso.",
  },
  {
    style: "pincel",
    number: "08",
    label: "Pincel",
    family: "borda",
    hint: "Pinceladas ao longo da borda.",
  },
  {
    style: "respingo",
    number: "09",
    label: "Respingo",
    family: "borda",
    hint: "Pontos soltos saindo da arte.",
  },
  {
    style: "reticula",
    number: "10",
    label: "Retícula",
    family: "borda",
    hint: "Some em pontos, combina com halftone.",
  },
  {
    style: "esfumacada",
    number: "11",
    label: "Esfumaçada",
    family: "borda",
    hint: "Desbota suave até sumir.",
  },
  {
    style: "circulo",
    number: "12",
    label: "Círculo",
    family: "recorte",
    hint: "Recorta em círculo ou elipse.",
  },
  {
    style: "arco",
    number: "13",
    label: "Arco",
    family: "recorte",
    hint: "Topo arredondado, base reta.",
  },
];

export const FRAME_BY_STYLE = new Map(FRAMES.map((f) => [f.style, f]));

export interface FrameOptions {
  style: FrameStyle;
  /** 0..100. Border weight for `linha`, bite depth for `borda`. */
  thickness: number;
  /** 0..100. Distance held back from the image edge. */
  inset?: number;
  /** 0..100. How ragged the generated edge is. Ignored by `linha` frames. */
  roughness?: number;
  /** Changes the texture without changing the style. */
  seed?: number;
  color?: [number, number, number];
}

/* ------------------------------------------------------------------ noise */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Value noise over a coarse lattice, smoothed and stacked into fBm.
 *
 * A frame edge has structure at several sizes at once — big bites out of the
 * corner, small nicks along the run — which one octave of noise cannot give.
 */
class Noise {
  private grid: Float32Array;
  private size: number;

  constructor(seed: number, size = 64) {
    this.size = size;
    this.grid = new Float32Array(size * size);
    const rnd = mulberry32(seed);
    for (let i = 0; i < this.grid.length; i++) this.grid[i] = rnd();
  }

  private at(x: number, y: number): number {
    const s = this.size;
    const xi = ((x % s) + s) % s;
    const yi = ((y % s) + s) % s;
    return this.grid[yi * s + xi]!;
  }

  value(x: number, y: number): number {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    // Smoothstep the interpolation, otherwise the lattice shows as diamonds.
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = this.at(x0, y0);
    const b = this.at(x0 + 1, y0);
    const c = this.at(x0, y0 + 1);
    const d = this.at(x0 + 1, y0 + 1);
    return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
  }

  fbm(x: number, y: number, octaves = 4): number {
    let sum = 0;
    let amp = 1;
    let norm = 0;
    let freq = 1;
    for (let o = 0; o < octaves; o++) {
      sum += this.value(x * freq, y * freq) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2.1;
    }
    return sum / norm;
  }
}

/* ------------------------------------------------------------- edge fields */

/** Normalised distance to the nearest image edge: 0 at the border, 1 inside the band. */
function edgeField(x: number, y: number, width: number, height: number, band: number): number {
  const d = Math.min(x, y, width - 1 - x, height - 1 - y);
  return band <= 0 ? 1 : Math.min(1, d / band);
}

/**
 * Blanks out mask regions that never reach the image border.
 *
 * This is the behaviour the production tool documents — a frame trims what is
 * connected to the outside, so a transparent window inside the artwork is not
 * mistaken for background and eaten away. Iterative flood fill: a design that
 * bleeds to every edge is one region spanning the image.
 */
function keepOnlyBorderConnected(cut: Uint8Array, width: number, height: number) {
  const n = width * height;
  const reached = new Uint8Array(n);
  const stack = new Int32Array(n);
  let top = 0;

  const push = (p: number) => {
    if (!reached[p] && cut[p]) {
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

  for (let p = 0; p < n; p++) if (cut[p] && !reached[p]) cut[p] = 0;
}

/* ------------------------------------------------------------------ frames */

export function applyFrame(image: RGBAImage, options: FrameOptions): RGBAImage {
  const { width, height, data: src } = image;
  const out = new Uint8ClampedArray(src);
  const def = FRAME_BY_STYLE.get(options.style);
  if (!def) return { data: out, width, height };

  const shortSide = Math.min(width, height);
  // A line frame sits on the edge; an eroded edge has to bite far enough in to
  // read as torn rather than as a nibbled outline. Same slider, different reach.
  const reach = def.family === "borda" ? 0.42 : 0.18;
  const thickness = Math.max(
    1,
    (Math.min(100, Math.max(0, options.thickness)) / 100) * shortSide * reach,
  );
  const inset = (Math.min(100, Math.max(0, options.inset ?? 0)) / 100) * shortSide * 0.12;
  const rough = Math.min(100, Math.max(0, options.roughness ?? 50)) / 100;
  const color = options.color ?? [0, 0, 0];
  const noise = new Noise(options.seed ?? 1);

  // Noise sampled in units of the short side keeps the texture's scale stable
  // whether the art is 400 px or 4000 px wide.
  const nScale = 6 / shortSide;

  if (def.family === "linha") {
    return drawBorder(out, src, width, height, thickness, inset, options.style, color);
  }

  const cut = new Uint8Array(width * height);
  const soft = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const band = thickness + inset;
      const e = edgeField(x, y, width, height, band);
      let keep = 1;

      switch (options.style) {
        case "grunge": {
          const n = noise.fbm(x * nScale * 2.5, y * nScale * 2.5, 4);
          keep = e > n * rough + (1 - rough) * 0.15 ? 1 : 0;
          break;
        }
        case "rasgada": {
          // One low-frequency octave gives a long, continuous tear rather than
          // the fine crumbling of grunge.
          const n = noise.value(x * nScale * 0.8, y * nScale * 0.8);
          keep = e > n * rough * 0.9 + 0.05 ? 1 : 0;
          break;
        }
        case "pincel": {
          // Stretch the noise along whichever edge is nearest, so the streaks
          // run with the border instead of across it.
          const horizontal = Math.min(y, height - 1 - y) <= Math.min(x, width - 1 - x);
          const nx = horizontal ? x * nScale * 4 : x * nScale * 0.5;
          const ny = horizontal ? y * nScale * 0.5 : y * nScale * 4;
          const n = noise.fbm(nx, ny, 3);
          keep = e > n * rough + 0.08 ? 1 : 0;
          break;
        }
        case "respingo": {
          const n = noise.fbm(x * nScale * 9, y * nScale * 9, 2);
          // Outside the band the art is gone; inside it, sparse specks survive.
          if (e >= 1) keep = 1;
          else keep = n > 1 - e * (0.35 + rough * 0.5) ? 1 : 0;
          break;
        }
        case "reticula": {
          const cell = Math.max(3, thickness * 0.16);
          const cx = (Math.floor(x / cell) + 0.5) * cell;
          const cy = (Math.floor(y / cell) + 0.5) * cell;
          const dx = x - cx;
          const dy = y - cy;
          const r = (cell / 2) * Math.sqrt(Math.min(1, e));
          keep = e >= 1 || dx * dx + dy * dy <= r * r ? 1 : 0;
          break;
        }
        case "esfumacada":
          soft[p] = Math.pow(e, 0.6 + rough);
          keep = 1;
          break;
        case "circulo": {
          const nx = (x - width / 2) / (width / 2 - inset);
          const ny = (y - height / 2) / (height / 2 - inset);
          const d = Math.sqrt(nx * nx + ny * ny);
          // The falloff was spread over a fifth of the radius, which reads as
          // a blur rather than a crop; scaling by the radius resolves it to
          // about a pixel. Roughness pushes the rim in and out so the cut can
          // look hand-torn instead of machine-round.
          const radius = shortSide / 2 - inset;
          const n =
            rough > 0 ? (noise.fbm(x * nScale * 3, y * nScale * 3, 3) - 0.5) * rough * 0.22 : 0;
          soft[p] = Math.min(1, Math.max(0, (1 - d + n) * radius));
          keep = 1;
          break;
        }
        case "arco": {
          const r = width / 2 - inset;
          const cy2 = r + inset;
          const inArch =
            y >= cy2
              ? x >= inset && x <= width - 1 - inset
              : (x - width / 2) ** 2 + (y - cy2) ** 2 <= r * r;
          const bottomOk = y <= height - 1 - inset;
          keep = inArch && bottomOk ? 1 : 0;
          break;
        }
        default:
          keep = 1;
      }

      if (!keep) cut[p] = 1;
    }
  }

  if (def.family === "borda") keepOnlyBorderConnected(cut, width, height);

  for (let p = 0; p < cut.length; p++) {
    const i = p * 4;
    if (cut[p]) out[i + 3] = 0;
    else if (options.style === "esfumacada" || options.style === "circulo") {
      out[i + 3] = src[i + 3]! * Math.min(1, Math.max(0, soft[p]!));
    }
  }

  return { data: out, width, height };
}

/** The `linha` family: a border painted over the art. */
function drawBorder(
  out: Uint8ClampedArray,
  src: Uint8ClampedArray,
  width: number,
  height: number,
  thickness: number,
  inset: number,
  style: FrameStyle,
  color: [number, number, number],
): RGBAImage {
  const t = Math.max(1, Math.round(thickness));
  const m = Math.round(inset);
  const left = m;
  const right = width - 1 - m;
  const top = m;
  const bottom = height - 1 - m;
  if (right <= left || bottom <= top) return { data: out, width, height };

  const line = Math.max(1, Math.round(t / 3));
  const gap = Math.max(1, Math.round(t / 3));
  const dash = t * 2;
  const cornerRun = Math.min(width, height) * 0.18;

  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const dT = y - top;
      const dB = bottom - y;
      const dL = x - left;
      const dR = right - x;
      const d = Math.min(dT, dB, dL, dR);
      if (d >= t) continue;

      let paint = false;
      switch (style) {
        case "dupla":
          paint = d < line || (d >= line + gap && d < 2 * line + gap);
          break;
        case "tracejada": {
          const horizontal = Math.min(dT, dB) <= Math.min(dL, dR);
          paint = Math.floor((horizontal ? x : y) / dash) % 2 === 0;
          break;
        }
        case "cantos": {
          // Only the runs near a corner, which is what a crop-mark frame is.
          const nearX = Math.min(dL, dR) < cornerRun;
          const nearY = Math.min(dT, dB) < cornerRun;
          paint = nearX && nearY;
          break;
        }
        case "interna":
          paint = d >= t - line;
          break;
        default:
          paint = true;
      }

      if (paint) {
        const i = (y * width + x) * 4;
        out[i] = color[0];
        out[i + 1] = color[1];
        out[i + 2] = color[2];
        out[i + 3] = 255;
      }
    }
  }
  void src;
  return { data: out, width, height };
}
