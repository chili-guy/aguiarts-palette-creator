import type { RGBAImage } from "./types";

export type FrameStyle = "solid" | "dashed" | "double";

export interface FrameOptions {
  style: FrameStyle;
  /** Border band thickness in pixels. */
  thickness: number;
  color?: [number, number, number];
  /** Gap in pixels between the image edge and the frame. */
  inset?: number;
}

/** Hand-rolled border/frame compositing — no image assets required. */
export function applyFrame(image: RGBAImage, options: FrameOptions): RGBAImage {
  const { width, height, data: src } = image;
  const thickness = Math.max(1, Math.floor(options.thickness));
  const inset = Math.max(0, Math.floor(options.inset ?? 0));
  const color = options.color ?? [0, 0, 0];
  const out = new Uint8ClampedArray(src);

  const left = inset;
  const right = width - 1 - inset;
  const top = inset;
  const bottom = height - 1 - inset;
  if (right <= left || bottom <= top) {
    return { data: out, width, height };
  }

  const dashLen = thickness * 2;
  const lineWidth = Math.max(1, Math.floor(thickness / 3));
  const gap = Math.max(1, Math.floor(thickness / 3));

  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const distTop = y - top;
      const distBottom = bottom - y;
      const distLeft = x - left;
      const distRight = right - x;
      const dist = Math.min(distTop, distBottom, distLeft, distRight);
      if (dist >= thickness) continue;

      let paint: boolean;
      switch (options.style) {
        case "double":
          paint = dist < lineWidth || (dist >= lineWidth + gap && dist < 2 * lineWidth + gap);
          break;
        case "dashed": {
          const nearestIsHorizontalEdge =
            Math.min(distTop, distBottom) <= Math.min(distLeft, distRight);
          const phase = nearestIsHorizontalEdge ? x : y;
          paint = Math.floor(phase / dashLen) % 2 === 0;
          break;
        }
        case "solid":
        default:
          paint = true;
      }

      if (paint) {
        const idx = (y * width + x) * 4;
        out[idx] = color[0];
        out[idx + 1] = color[1];
        out[idx + 2] = color[2];
        out[idx + 3] = 255;
      }
    }
  }

  return { data: out, width, height };
}
