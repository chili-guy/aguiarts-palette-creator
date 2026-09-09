import { createServerFn } from "@tanstack/react-start";

/**
 * AI halftone engine — img2img, the way the reference product (dtfchat/OverOne)
 * does it: the artwork is sent to an image model with an instruction to redraw
 * it as a DTF/DTG halftone screenprint separation, and the model's result comes
 * back as a flat, print-ready raster.
 *
 * Two providers, picked by env. The key never leaves the server.
 *
 *   AI_PROVIDER            "gemini" | "fal" — default: gemini if GEMINI_API_KEY
 *                          is set, else fal if FAL_KEY is set.
 *
 *   Gemini (Google AI Studio — has a free tier):
 *     GEMINI_API_KEY        required for this provider
 *     GEMINI_HALFTONE_MODEL optional — default "gemini-2.5-flash-image"
 *
 *   fal.ai (billed per image):
 *     FAL_KEY               required for this provider
 *     FAL_HALFTONE_MODEL    optional — default "fal-ai/flux/dev/image-to-image"
 *     FAL_HALFTONE_MODE     optional — "img2img" (default) or "edit"
 *     FAL_HALFTONE_LORA_URL optional — a halftone LoRA; switches the model to
 *                           "fal-ai/flux-lora/image-to-image" when set
 *
 * One blocking call: the browser posts the art, waits, gets the image. For fal
 * (queue-based) the wait is done server-side.
 */

export type GarmentTone = "dark" | "light";
export type AiStyle = "mono" | "black" | "color";

export interface HalftoneAiInput {
  /** The isolated artwork as a data: URI (PNG, alpha preserved). */
  image: string;
  garment: GarmentTone;
  style: AiStyle;
  /** Spot-ink colour for `style === "mono"`, "#rrggbb". */
  inkHex: string;
  /** 0..1 — how coarse and how far from the source the screen goes. */
  intensity: number;
  /**
   * Screen only the soft parts: flat colour areas stay 100% solid, dots appear
   * only in gradients, shading and blurred edges. This is how a DTF stamp is
   * normally screened — a flat logo or fill is never dot-screened.
   */
  selective: boolean;
  /** Optional free-text the user adds to the instruction. */
  notes?: string;
}

export interface HalftoneAiResult {
  /** The finished separation as a data: URI. */
  image: string;
  provider: "gemini" | "fal";
  elapsedMs: number;
}

const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash-image";
// Instruction-edit model by default: it keeps the composition and actually lays
// down a dot screen. Plain flux img2img either ignores the instruction (low
// strength) or repaints the whole picture (high strength) — never a halftone.
const FAL_DEFAULT_MODEL = "fal-ai/nano-banana/edit";
const FAL_DEFAULT_MODE: "img2img" | "edit" = "edit";
const FAL_LORA_MODEL = "fal-ai/flux-lora/image-to-image";
const FAL_QUEUE_BASE = "https://queue.fal.run";
const MAX_IMAGE_CHARS = 8_000_000; // ~6 MB decoded — a 1024px PNG is well under
/** Server-side wait budget for fal's queue. */
const FAL_MAX_WAIT_MS = 90_000;
const FAL_POLL_MS = 2_000;

interface Provider {
  name: "gemini" | "fal";
  key: string;
  model: string;
  falMode: "img2img" | "edit";
  falLora: string;
}

function resolveProvider(): Provider {
  const env = process.env;
  const geminiKey = env["GEMINI_API_KEY"]?.trim();
  const falKey = env["FAL_KEY"]?.trim();
  const want = env["AI_PROVIDER"]?.trim().toLowerCase();

  const useGemini = want === "gemini" || (!want && !!geminiKey);
  const useFal = want === "fal" || (!want && !geminiKey && !!falKey);

  if (useGemini) {
    if (!geminiKey) {
      throw new Error(
        "Motor de IA (Gemini) sem chave: defina GEMINI_API_KEY no servidor. Veja IA-HALFTONE.md.",
      );
    }
    return {
      name: "gemini",
      key: geminiKey,
      model: env["GEMINI_HALFTONE_MODEL"]?.trim() || GEMINI_DEFAULT_MODEL,
      falMode: "img2img",
      falLora: "",
    };
  }

  if (useFal) {
    if (!falKey) {
      throw new Error(
        "Motor de IA (fal.ai) sem chave: defina FAL_KEY no servidor. Veja IA-HALFTONE.md.",
      );
    }
    const falLora = env["FAL_HALFTONE_LORA_URL"]?.trim() || "";
    const falMode =
      (env["FAL_HALFTONE_MODE"]?.trim() as "img2img" | "edit") ||
      (falLora ? "img2img" : FAL_DEFAULT_MODE);
    return {
      name: "fal",
      key: falKey,
      model:
        env["FAL_HALFTONE_MODEL"]?.trim() ||
        (falLora ? FAL_LORA_MODEL : falMode === "edit" ? FAL_DEFAULT_MODEL : "fal-ai/flux/dev/image-to-image"),
      falMode,
      falLora,
    };
  }

  throw new Error(
    "Motor de IA não configurado: defina GEMINI_API_KEY (grátis, recomendado) ou FAL_KEY no servidor. Veja IA-HALFTONE.md.",
  );
}

function inkName(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "the given spot colour";
  const n = parseInt(m[1]!, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 24) {
    if (max > 224) return "white";
    if (max < 40) return "black";
    return "grey";
  }
  const names: [string, number, number, number][] = [
    ["white", 255, 255, 255],
    ["black", 0, 0, 0],
    ["red", 220, 30, 40],
    ["orange", 240, 140, 20],
    ["yellow", 245, 215, 40],
    ["green", 40, 170, 80],
    ["cyan", 40, 190, 220],
    ["blue", 40, 90, 210],
    ["purple", 140, 60, 200],
    ["pink", 235, 110, 175],
    ["brown", 130, 80, 45],
  ];
  let best = names[0]!;
  let bestD = Infinity;
  for (const c of names) {
    const d = (r - c[1]) ** 2 + (g - c[2]) ** 2 + (b - c[3]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best[0];
}

/** The "screen only the soft parts" instruction, shared by every style. */
const SELECTIVE_CLAUSE =
  "SELECTIVE screen: apply the halftone dots ONLY to gradients, soft shading, glows, airbrush and blurred transitions. Every area of flat, even colour must stay 100% solid ink with NO dots on it. Keep hard-edged flat fills and vector shapes completely solid and crisp; only the shaded ramps get broken into dots.";

const FULL_CLAUSE =
  "Screen the ENTIRE image: even flat areas are broken into a regular dot grid.";

function buildPrompt(input: HalftoneAiInput): string {
  const grain =
    input.intensity < 0.38
      ? "fine, tight"
      : input.intensity > 0.74
        ? "coarse, large"
        : "medium";
  const coverage = input.selective ? SELECTIVE_CLAUSE : FULL_CLAUSE;

  if (input.style === "color") {
    const parts = [
      `Convert this image into a ${grain} full-colour halftone screenprint separation.`,
      `Use overlapping CMYK halftone dot screens (cyan, magenta, yellow, black), each channel on its own angle forming a rosette; dot size follows tone per channel.`,
      coverage,
      `No smooth gradients left behind in the screened areas, no linework, no sketch or grain texture.`,
      `Keep the exact composition, subject, pose, framing and proportions. Do not redraw, reinterpret or add or remove anything. Keep any existing text.`,
      `Flat, hard-edged, print-ready, on a plain pure white background — no scene, no garment, no mockup, no shadow, no frame.`,
    ];
    if (input.notes?.trim()) parts.push(input.notes.trim().slice(0, 400));
    return parts.join(" ");
  }

  // One-ink styles always come back as BLACK dots on WHITE — the model's most
  // reliable mode. The tool then keys the white out and repaints the surviving
  // dots in the chosen ink (white on a dark garment). The artwork's dark
  // linework and shadows become the ink, which is the standard white-on-black
  // look for cartoon / line art.
  const parts = [
    `Convert this image into a ${grain} one-colour halftone screenprint separation: black dots on a pure white background.`,
    `Dot diameter follows local tone: the darkest / most saturated areas become large black dots that fuse into solid black, and the lightest areas shrink to nothing and stay pure white.`,
    coverage,
    `No colour of any kind, no outlines or linework, no cross-hatching, no pencil, sketch, stipple or grain texture.`,
    `Keep the exact composition, subject, pose, framing and proportions of the original. Do not redraw, reinterpret, restyle or add or remove anything. Keep any existing text.`,
    `Flat, hard-edged, maximum contrast, print-ready. Plain flat pure white background only — no scene, no garment, no mockup, no shadow, no vignette, no frame.`,
  ];

  if (input.notes?.trim()) parts.push(input.notes.trim().slice(0, 400));
  return parts.join(" ");
}

function splitDataUri(uri: string): { mime: string; base64: string } {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(uri);
  if (!m) throw new Error("Imagem inválida enviada para o motor de IA.");
  return { mime: m[1]!, base64: m[2]! };
}

function googleError(payload: unknown, status: number): string {
  const msg = (payload as { error?: { message?: string; status?: string } } | null)?.error?.message;
  if (status === 400) return `Gemini rejeitou a requisição${msg ? `: ${msg}` : "."}`;
  if (status === 403)
    return `Gemini recusou a chave (GEMINI_API_KEY inválida ou API "Generative Language" não habilitada no projeto).`;
  if (status === 429) {
    // The image models sit outside Google's free tier: the 429 carries
    // "limit: 0" / "free_tier" and no amount of waiting clears it — billing has
    // to be enabled on the project. A plain rate-limit 429 is different.
    if (msg && /free[_ ]tier|limit:\s*0|billing/i.test(msg)) {
      return "Gemini: geração de imagem não está no free tier do Google (cota 0). Habilite faturamento no projeto Google Cloud, ou use AI_PROVIDER=fal. Veja IA-HALFTONE.md.";
    }
    return "Gemini: muitas requisições em pouco tempo. Espere alguns segundos e tente de novo.";
  }
  return `Gemini respondeu ${status}${msg ? `: ${msg}` : "."}`;
}

async function runGemini(p: Provider, input: HalftoneAiInput): Promise<string> {
  const { mime, base64 } = splitDataUri(input.image);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${p.model}:generateContent?key=${encodeURIComponent(p.key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: buildPrompt(input) },
            { inline_data: { mime_type: mime, data: base64 } },
          ],
        },
      ],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
  });

  const json = (await res.json().catch(() => null)) as {
    candidates?: {
      content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] };
      finishReason?: string;
    }[];
    promptFeedback?: { blockReason?: string };
  } | null;

  if (!res.ok) throw new Error(googleError(json, res.status));

  if (json?.promptFeedback?.blockReason) {
    throw new Error(`Gemini bloqueou a arte (${json.promptFeedback.blockReason}).`);
  }
  const cand = json?.candidates?.[0];
  const part = cand?.content?.parts?.find((x) => x.inlineData?.data);
  if (!part?.inlineData?.data) {
    const why = cand?.finishReason ? ` (motivo: ${cand.finishReason})` : "";
    throw new Error(`Gemini não devolveu uma imagem${why}. Tente reduzir a intensidade ou trocar o estilo.`);
  }
  return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
}

function falError(payload: unknown, status: number): string {
  const p = payload as { detail?: unknown; message?: unknown } | null;
  const detail =
    p && typeof p.detail === "string"
      ? p.detail
      : p && Array.isArray(p.detail)
        ? (p.detail as { msg?: string }[]).map((d) => d?.msg).filter(Boolean).join("; ")
        : p && typeof p.message === "string"
          ? p.message
          : "";
  if (status === 401) return "fal.ai recusou a chave (FAL_KEY inválida).";
  if (status === 403) {
    if (/lock|balance|top up|exhaust/i.test(detail)) {
      return "fal.ai: conta sem saldo. É preciso adicionar crédito em fal.ai/dashboard/billing antes de gerar.";
    }
    return `fal.ai negou o acesso${detail ? `: ${detail}` : "."}`;
  }
  if (status === 422) return `fal.ai rejeitou os parâmetros do modelo${detail ? `: ${detail}` : "."}`;
  if (status === 429) return "fal.ai: limite de requisições atingido, tente de novo em instantes.";
  return `fal.ai respondeu ${status}${detail ? `: ${detail}` : "."}`;
}

function falBody(p: Provider, input: HalftoneAiInput): Record<string, unknown> {
  const prompt = buildPrompt(input);
  if (p.falMode === "edit") {
    return { prompt, image_urls: [input.image], num_images: 1, output_format: "png" };
  }
  const strength = Math.min(0.95, Math.max(0.35, 0.5 + input.intensity * 0.42));
  const body: Record<string, unknown> = {
    prompt,
    image_url: input.image,
    strength,
    num_inference_steps: 40,
    guidance_scale: 3.5,
    num_images: 1,
    output_format: "png",
    // Off on purpose: this is the user's own print artwork and the checker
    // false-positives on common DTF motifs (skulls, weapons), blanking the result.
    enable_safety_checker: false,
  };
  if (p.falLora) body["loras"] = [{ path: p.falLora, scale: 1 }];
  return body;
}

async function falToDataUri(url: string): Promise<string> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Falha ao baixar o resultado da IA (${r.status}).`);
  const ct = r.headers.get("content-type") || "image/png";
  const buf = Buffer.from(await r.arrayBuffer());
  return `data:${ct};base64,${buf.toString("base64")}`;
}

/** Only follow queue URLs fal itself handed back. */
function safeFalUrl(url: string | undefined, requestId: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === "queue.fal.run" && u.pathname.includes(requestId)) return url;
  } catch {
    /* ignore */
  }
  return null;
}

async function runFal(p: Provider, input: HalftoneAiInput): Promise<string> {
  const auth = { Authorization: `Key ${p.key}` };
  const base2 = `${FAL_QUEUE_BASE}/${p.model.split("/").slice(0, 2).join("/")}`;

  const submit = await fetch(`${FAL_QUEUE_BASE}/${p.model}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify(falBody(p, input)),
  });
  const sub = (await submit.json().catch(() => null)) as {
    request_id?: string;
    status_url?: string;
    response_url?: string;
  } | null;
  if (!submit.ok || !sub?.request_id) throw new Error(falError(sub, submit.status));

  // Prefer the URLs fal returned; fall back to the documented first-two-segments
  // shape if they are missing.
  const id = sub.request_id;
  const statusUrl = safeFalUrl(sub.status_url, id) ?? `${base2}/requests/${id}/status`;
  const resultUrl = safeFalUrl(sub.response_url, id) ?? `${base2}/requests/${id}`;

  const deadline = Date.now() + FAL_MAX_WAIT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, FAL_POLL_MS));
    const st = await fetch(statusUrl, { headers: auth });
    const sj = (await st.json().catch(() => null)) as { status?: string } | null;
    if (!st.ok) throw new Error(falError(sj, st.status));
    if (sj?.status === "COMPLETED") {
      const rr = await fetch(resultUrl, { headers: auth });
      const rj = await rr.json().catch(() => null);
      if (!rr.ok) throw new Error(falError(rj, rr.status));
      const out = rj as { images?: { url?: string }[]; image?: { url?: string } } | null;
      const imgUrl = out?.images?.[0]?.url ?? out?.image?.url;
      if (!imgUrl) throw new Error("A IA terminou mas não devolveu uma imagem.");
      return falToDataUri(imgUrl);
    }
  }
  throw new Error("A IA demorou mais que o esperado. Tente de novo.");
}

/**
 * Turns the artwork into a halftone separation. One request in, one image out;
 * for fal the queue wait happens here on the server.
 */
export const generateHalftoneAI = createServerFn({ method: "POST" })
  .validator((data: HalftoneAiInput) => data)
  .handler(async ({ data }): Promise<HalftoneAiResult> => {
    if (!data.image?.startsWith("data:image/")) {
      throw new Error("Imagem inválida enviada para o motor de IA.");
    }
    if (data.image.length > MAX_IMAGE_CHARS) {
      throw new Error("Imagem grande demais para a IA — reduza o tamanho da arte e tente de novo.");
    }
    const provider = resolveProvider();
    const startedAt = Date.now();
    const image = provider.name === "gemini" ? await runGemini(provider, data) : await runFal(provider, data);
    return { image, provider: provider.name, elapsedMs: Date.now() - startedAt };
  });
