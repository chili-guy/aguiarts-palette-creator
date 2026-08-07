import * as ort from "onnxruntime-web";
import { loadImageFile } from "./canvas-tools";

// U^2-Net-family model (u2netp, Apache-2.0, from https://github.com/xuebinqin/U-2-Net),
// self-hosted from the same weights redistributed by the MIT-licensed rembg project
// (https://github.com/danielgatis/rembg). Avoids @imgly/background-removal's AGPL-3.0
// license, which is unsuitable for a closed-source commercial product without a paid
// IMG.LY license.
const MODEL_URL = "/models/u2netp.onnx";
const INPUT_SIZE = 320;
const MEAN = [0.485, 0.456, 0.406] as const;
const STD = [0.229, 0.224, 0.225] as const;

// Point the WASM runtime (not the model) at a CDN matching the installed onnxruntime-web
// version, the standard workaround for bundler WASM asset resolution issues.
ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.27.0/dist/";

let sessionPromise: Promise<ort.InferenceSession> | null = null;

function getSession(): Promise<ort.InferenceSession> {
  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create(MODEL_URL, { executionProviders: ["wasm"] });
  }
  return sessionPromise;
}

function imageToInputTensor(img: HTMLImageElement): ort.Tensor {
  const canvas = document.createElement("canvas");
  canvas.width = INPUT_SIZE;
  canvas.height = INPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2d canvas context");
  ctx.drawImage(img, 0, 0, INPUT_SIZE, INPUT_SIZE);
  const { data } = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);

  // NCHW float32, normalized to match the original U^2-Net training pipeline.
  const planeSize = INPUT_SIZE * INPUT_SIZE;
  const chw = new Float32Array(3 * planeSize);
  for (let i = 0; i < planeSize; i++) {
    chw[i] = (data[i * 4]! / 255 - MEAN[0]) / STD[0];
    chw[planeSize + i] = (data[i * 4 + 1]! / 255 - MEAN[1]) / STD[1];
    chw[2 * planeSize + i] = (data[i * 4 + 2]! / 255 - MEAN[2]) / STD[2];
  }

  return new ort.Tensor("float32", chw, [1, 3, INPUT_SIZE, INPUT_SIZE]);
}

/** Converts the model's raw saliency output into a 320x320 grayscale mask canvas. */
function maskOutputToCanvas(output: ort.Tensor): HTMLCanvasElement {
  const data = output.data as Float32Array;
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < data.length; i++) {
    if (data[i]! < min) min = data[i]!;
    if (data[i]! > max) max = data[i]!;
  }
  const range = max - min || 1;

  const canvas = document.createElement("canvas");
  canvas.width = INPUT_SIZE;
  canvas.height = INPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2d canvas context");
  const imageData = ctx.createImageData(INPUT_SIZE, INPUT_SIZE);
  for (let i = 0; i < INPUT_SIZE * INPUT_SIZE; i++) {
    const v = Math.round(((data[i]! - min) / range) * 255);
    imageData.data[i * 4] = v;
    imageData.data[i * 4 + 1] = v;
    imageData.data[i * 4 + 2] = v;
    imageData.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export type BgRemovalStage =
  "loading-model" | "preprocessing" | "running-inference" | "compositing";

export async function removeBackgroundOnnx(
  file: File,
  onProgress?: (stage: BgRemovalStage) => void,
): Promise<Blob> {
  onProgress?.("loading-model");
  const session = await getSession();
  const img = await loadImageFile(file);

  onProgress?.("preprocessing");
  const inputTensor = imageToInputTensor(img);

  onProgress?.("running-inference");
  const inputName = session.inputNames[0]!;
  const outputName = session.outputNames[0]!;
  const results = await session.run({ [inputName]: inputTensor });
  const maskCanvas = maskOutputToCanvas(results[outputName]!);

  onProgress?.("compositing");
  const outCanvas = document.createElement("canvas");
  outCanvas.width = img.naturalWidth;
  outCanvas.height = img.naturalHeight;
  const outCtx = outCanvas.getContext("2d");
  if (!outCtx) throw new Error("Could not get 2d canvas context");
  outCtx.drawImage(img, 0, 0);
  const outData = outCtx.getImageData(0, 0, outCanvas.width, outCanvas.height);

  // Upsample the 320x320 mask to the output size via canvas's built-in bilinear scaling.
  const maskScaled = document.createElement("canvas");
  maskScaled.width = outCanvas.width;
  maskScaled.height = outCanvas.height;
  const maskScaledCtx = maskScaled.getContext("2d");
  if (!maskScaledCtx) throw new Error("Could not get 2d canvas context");
  maskScaledCtx.drawImage(maskCanvas, 0, 0, outCanvas.width, outCanvas.height);
  const maskData = maskScaledCtx.getImageData(0, 0, outCanvas.width, outCanvas.height);

  for (let i = 0; i < outData.data.length / 4; i++) {
    outData.data[i * 4 + 3] = maskData.data[i * 4]!;
  }
  outCtx.putImageData(outData, 0, 0);

  return new Promise((resolve, reject) => {
    outCanvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("canvas.toBlob failed"))),
      "image/png",
    );
  });
}
