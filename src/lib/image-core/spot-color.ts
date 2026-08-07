import { applyPaletteSync, buildPaletteSync, utils } from "image-q";
import type { RGBAImage } from "./types";

export interface SpotColor {
  r: number;
  g: number;
  b: number;
}

export interface SpotColorResult {
  image: RGBAImage;
  palette: SpotColor[];
}

/**
 * Reduces an image to a limited set of flat "spot" colors — the common
 * DTF/screen-print requirement of separating art into a small, fixed palette.
 */
export function quantizeToSpotColors(image: RGBAImage, colorCount: number): SpotColorResult {
  const container = utils.PointContainer.fromUint8Array(image.data, image.width, image.height);
  const palette = buildPaletteSync([container], {
    colors: Math.max(1, colorCount),
    paletteQuantization: "wuquant",
  });
  const quantized = applyPaletteSync(container, palette, { imageQuantization: "nearest" });

  const data = new Uint8ClampedArray(quantized.toUint8Array());
  const paletteColors = palette
    .getPointContainer()
    .getPointArray()
    .map((p) => ({ r: p.r, g: p.g, b: p.b }));

  return {
    image: { data, width: image.width, height: image.height },
    palette: paletteColors,
  };
}
