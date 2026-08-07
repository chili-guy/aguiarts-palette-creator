import ImageTracer from "imagetracerjs";
import type { RGBAImage } from "./types";

export interface VectorizeOptions {
  /** Size of the color palette used to flatten the art before tracing. */
  numberOfColors?: number;
  /** Minimum path size to keep, in pixels — higher = fewer small artifacts. */
  pathOmit?: number;
  strokeWidth?: number;
}

/** Traces a raster image into an SVG string, suitable for flat-color print art. */
export function rasterToSvg(image: RGBAImage, options: VectorizeOptions = {}): string {
  return ImageTracer.imagedataToSVG(
    { width: image.width, height: image.height, data: image.data },
    {
      numberofcolors: options.numberOfColors ?? 16,
      pathomit: options.pathOmit ?? 8,
      strokewidth: options.strokeWidth ?? 1,
    },
  );
}
