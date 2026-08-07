import type { RGBAImage } from "./types";

// amount: -100..100, 0 = no change
export function adjustBrightness(image: RGBAImage, amount: number): RGBAImage {
  const offset = (amount / 100) * 255;
  const data = new Uint8ClampedArray(image.data);
  for (let i = 0; i < data.length; i += 4) {
    data[i]! += offset;
    data[i + 1]! += offset;
    data[i + 2]! += offset;
  }
  return { data, width: image.width, height: image.height };
}

// amount: -100..100, 0 = no change
export function adjustContrast(image: RGBAImage, amount: number): RGBAImage {
  const clamped = Math.max(-100, Math.min(100, amount)) * 2.55; // map to -255..255
  const factor = (259 * (clamped + 255)) / (255 * (259 - clamped));
  const data = new Uint8ClampedArray(image.data);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = factor * (data[i]! - 128) + 128;
    data[i + 1] = factor * (data[i + 1]! - 128) + 128;
    data[i + 2] = factor * (data[i + 2]! - 128) + 128;
  }
  return { data, width: image.width, height: image.height };
}

// amount: -100 (grayscale) .. 100 (double saturation), 0 = no change
export function adjustSaturation(image: RGBAImage, amount: number): RGBAImage {
  const scale = amount / 100 + 1;
  const data = new Uint8ClampedArray(image.data);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    data[i] = luma + (r - luma) * scale;
    data[i + 1] = luma + (g - luma) * scale;
    data[i + 2] = luma + (b - luma) * scale;
  }
  return { data, width: image.width, height: image.height };
}

// amount: 0..100, 0 = no change. Unsharp-mask-style 3x3 convolution.
export function sharpen(image: RGBAImage, amount: number): RGBAImage {
  if (amount <= 0) {
    return { data: new Uint8ClampedArray(image.data), width: image.width, height: image.height };
  }
  const { width, height, data: src } = image;
  const k = amount / 100;
  // Center weight grows with k; the four neighbors are subtracted so that a
  // flat region (all neighbors equal to center) is left unchanged.
  const center = 1 + 4 * k;
  const neighbor = -k;
  const out = new Uint8ClampedArray(src.length);

  const at = (x: number, y: number, c: number) => {
    const cx = Math.min(width - 1, Math.max(0, x));
    const cy = Math.min(height - 1, Math.max(0, y));
    return src[(cy * width + cx) * 4 + c]!;
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const value =
          center * at(x, y, c) +
          neighbor * at(x - 1, y, c) +
          neighbor * at(x + 1, y, c) +
          neighbor * at(x, y - 1, c) +
          neighbor * at(x, y + 1, c);
        out[idx + c] = value;
      }
      out[idx + 3] = src[idx + 3]!;
    }
  }

  return { data: out, width, height };
}
