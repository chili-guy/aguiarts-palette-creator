declare module "imagetracerjs" {
  interface ImageDataLike {
    width: number;
    height: number;
    data: Uint8ClampedArray | Uint8Array | number[];
  }

  interface ImageTracerOptions {
    [key: string]: unknown;
  }

  interface ImageTracerStatic {
    imagedataToSVG(imgd: ImageDataLike, options?: ImageTracerOptions): string;
  }

  const ImageTracer: ImageTracerStatic;
  export default ImageTracer;
}
