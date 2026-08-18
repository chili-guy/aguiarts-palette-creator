import { formatMoney, type Currency } from "@/lib/pricing";

/**
 * Draws the quote document.
 *
 * PNG and PDF both come out of this one canvas so the two can never drift
 * apart — the PDF pipeline already rasterises a canvas, and a second layout
 * pass written for print would be a second place for a bug to live.
 */

export interface QuoteItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface QuoteData {
  company: string;
  companyWhatsapp: string;
  companyContact: string;
  pixKey: string;
  client: string;
  clientWhatsapp: string;
  number: string;
  date: string;
  validUntil: string;
  serviceType: string;
  paymentMethod: string;
  notes: string;
  items: QuoteItem[];
  discountPercent: number;
  currency: Currency;
}

export type QuoteTheme = "escuro" | "claro";

/** A4 portrait at 150 DPI — sharp in print, still quick to redraw while typing. */
export const QUOTE_WIDTH = 1240;
export const QUOTE_HEIGHT = 1754;
export const QUOTE_DPI = 150;

const PALETTES = {
  escuro: {
    bg: "#0b0d1a",
    panel: "#141830",
    line: "rgba(255,255,255,0.14)",
    text: "#f7f8fb",
    muted: "#9aa3bd",
    accent: "#e9389f",
  },
  claro: {
    bg: "#ffffff",
    panel: "#f4f4f8",
    line: "rgba(0,0,0,0.12)",
    text: "#14141c",
    muted: "#5d5f70",
    accent: "#c11d7d",
  },
} as const;

export function quoteTotals(data: QuoteData) {
  const subtotal = data.items.reduce(
    (sum, i) => sum + Math.max(0, i.quantity) * Math.max(0, i.unitPrice),
    0,
  );
  const discount = subtotal * (Math.max(0, data.discountPercent) / 100);
  return { subtotal, discount, total: subtotal - discount };
}

/** Wraps text to a pixel width, returning the lines. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let line = words[0]!;
  for (const word of words.slice(1)) {
    const candidate = `${line} ${word}`;
    if (ctx.measureText(candidate).width <= maxWidth) line = candidate;
    else {
      lines.push(line);
      line = word;
    }
  }
  lines.push(line);
  return lines;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function renderQuote(
  canvas: HTMLCanvasElement,
  data: QuoteData,
  theme: QuoteTheme,
  logo?: HTMLImageElement | HTMLCanvasElement | null,
) {
  canvas.width = QUOTE_WIDTH;
  canvas.height = QUOTE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2d canvas context");
  const c = PALETTES[theme];
  const money = (v: number) => formatMoney(v, data.currency);

  const M = 72; // page margin
  const right = QUOTE_WIDTH - M;
  const contentWidth = right - M;

  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, QUOTE_WIDTH, QUOTE_HEIGHT);

  // --- Header ---------------------------------------------------------------
  let y = M;
  const logoBox = 108;
  if (logo) {
    const lw = "naturalWidth" in logo ? logo.naturalWidth : logo.width;
    const lh = "naturalHeight" in logo ? logo.naturalHeight : logo.height;
    if (lw > 0 && lh > 0) {
      const k = Math.min(logoBox / lw, logoBox / lh);
      ctx.drawImage(logo, M, y, lw * k, lh * k);
    }
  }

  ctx.textAlign = "right";
  ctx.fillStyle = c.text;
  ctx.font = "bold 34px system-ui, sans-serif";
  ctx.fillText(data.company || "Sua empresa", right, y + 34);
  ctx.font = "20px system-ui, sans-serif";
  ctx.fillStyle = c.muted;
  let hy = y + 66;
  for (const line of [data.companyWhatsapp, data.companyContact].filter(Boolean)) {
    ctx.fillText(line, right, hy);
    hy += 28;
  }

  y += logoBox + 28;
  ctx.strokeStyle = c.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(M, y);
  ctx.lineTo(right, y);
  ctx.stroke();

  // --- Title ----------------------------------------------------------------
  y += 52;
  ctx.textAlign = "left";
  ctx.fillStyle = c.accent;
  ctx.font = "bold 15px ui-monospace, monospace";
  ctx.fillText("ORÇAMENTO", M, y);
  ctx.fillStyle = c.text;
  ctx.font = "bold 44px system-ui, sans-serif";
  ctx.fillText(`Nº ${data.number || "0001"}`, M, y + 46);

  ctx.textAlign = "right";
  ctx.font = "20px system-ui, sans-serif";
  ctx.fillStyle = c.muted;
  if (data.date) ctx.fillText(`Data: ${data.date}`, right, y + 16);
  if (data.validUntil) ctx.fillText(`Validade: ${data.validUntil}`, right, y + 46);

  // --- Client ---------------------------------------------------------------
  y += 86;
  const clientH = 108;
  ctx.fillStyle = c.panel;
  roundRect(ctx, M, y, contentWidth, clientH, 16);
  ctx.fill();

  ctx.textAlign = "left";
  ctx.fillStyle = c.accent;
  ctx.font = "bold 13px ui-monospace, monospace";
  ctx.fillText("CLIENTE", M + 26, y + 32);
  ctx.fillStyle = c.text;
  ctx.font = "bold 26px system-ui, sans-serif";
  ctx.fillText(data.client || "—", M + 26, y + 66);
  ctx.fillStyle = c.muted;
  ctx.font = "19px system-ui, sans-serif";
  if (data.clientWhatsapp) ctx.fillText(data.clientWhatsapp, M + 26, y + 92);

  ctx.textAlign = "right";
  ctx.fillStyle = c.accent;
  ctx.font = "bold 13px ui-monospace, monospace";
  ctx.fillText("SERVIÇO", right - 26, y + 32);
  ctx.fillStyle = c.text;
  ctx.font = "22px system-ui, sans-serif";
  ctx.fillText(data.serviceType || "—", right - 26, y + 64);

  // --- Items ----------------------------------------------------------------
  y += clientH + 46;
  const colQty = M + contentWidth * 0.52;
  const colUnit = M + contentWidth * 0.7;

  ctx.textAlign = "left";
  ctx.fillStyle = c.accent;
  ctx.font = "bold 13px ui-monospace, monospace";
  ctx.fillText("ITEM", M, y);
  ctx.textAlign = "center";
  ctx.fillText("QTD", colQty, y);
  ctx.textAlign = "right";
  ctx.fillText("UNITÁRIO", colUnit + 90, y);
  ctx.fillText("TOTAL", right, y);

  y += 14;
  ctx.strokeStyle = c.line;
  ctx.beginPath();
  ctx.moveTo(M, y);
  ctx.lineTo(right, y);
  ctx.stroke();
  y += 30;

  const rowLimit = 16;
  for (const item of data.items.slice(0, rowLimit)) {
    const total = Math.max(0, item.quantity) * Math.max(0, item.unitPrice);
    ctx.textAlign = "left";
    ctx.fillStyle = c.text;
    ctx.font = "21px system-ui, sans-serif";
    const [first] = wrap(ctx, item.name || "Item", contentWidth * 0.48);
    ctx.fillText(first ?? "Item", M, y);

    ctx.textAlign = "center";
    ctx.fillStyle = c.muted;
    ctx.fillText(String(Math.max(0, item.quantity)), colQty, y);
    ctx.textAlign = "right";
    ctx.font = "21px ui-monospace, monospace";
    ctx.fillText(money(item.unitPrice), colUnit + 90, y);
    ctx.fillStyle = c.text;
    ctx.fillText(money(total), right, y);

    y += 20;
    ctx.strokeStyle = c.line;
    ctx.beginPath();
    ctx.moveTo(M, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    y += 30;
  }

  if (data.items.length > rowLimit) {
    ctx.textAlign = "left";
    ctx.fillStyle = c.muted;
    ctx.font = "italic 18px system-ui, sans-serif";
    ctx.fillText(`+ ${data.items.length - rowLimit} item(ns) não cabem nesta página`, M, y);
    y += 34;
  }

  // --- Totals ---------------------------------------------------------------
  const { subtotal, discount, total } = quoteTotals(data);
  y += 12;
  const boxW = contentWidth * 0.46;
  const boxX = right - boxW;
  const boxH = discount > 0 ? 152 : 112;
  ctx.fillStyle = c.panel;
  roundRect(ctx, boxX, y, boxW, boxH, 16);
  ctx.fill();

  let ty = y + 42;
  const totalLine = (label: string, value: string, strong = false) => {
    ctx.textAlign = "left";
    ctx.fillStyle = strong ? c.text : c.muted;
    ctx.font = strong ? "bold 24px system-ui, sans-serif" : "20px system-ui, sans-serif";
    ctx.fillText(label, boxX + 26, ty);
    ctx.textAlign = "right";
    ctx.fillStyle = strong ? c.accent : c.text;
    ctx.font = strong ? "bold 30px ui-monospace, monospace" : "20px ui-monospace, monospace";
    ctx.fillText(value, boxX + boxW - 26, ty);
    ty += strong ? 0 : 34;
  };
  totalLine("Subtotal", money(subtotal));
  if (discount > 0) totalLine(`Desconto ${data.discountPercent}%`, `- ${money(discount)}`);
  ty += 12;
  totalLine("Total", money(total), true);

  // --- Payment --------------------------------------------------------------
  ctx.textAlign = "left";
  let py = y + 30;
  ctx.fillStyle = c.accent;
  ctx.font = "bold 13px ui-monospace, monospace";
  ctx.fillText("PAGAMENTO", M, py);
  py += 32;
  ctx.fillStyle = c.text;
  ctx.font = "21px system-ui, sans-serif";
  ctx.fillText(data.paymentMethod || "A combinar", M, py);
  if (data.pixKey) {
    py += 30;
    ctx.fillStyle = c.muted;
    ctx.font = "19px system-ui, sans-serif";
    ctx.fillText(`Pix: ${data.pixKey}`, M, py);
  }

  // --- Notes and footer -----------------------------------------------------
  y += boxH + 46;
  if (data.notes) {
    ctx.fillStyle = c.muted;
    ctx.font = "19px system-ui, sans-serif";
    for (const line of wrap(ctx, data.notes, contentWidth).slice(0, 4)) {
      ctx.fillText(line, M, y);
      y += 28;
    }
  }

  ctx.fillStyle = c.muted;
  ctx.font = "17px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    data.validUntil
      ? `Este orçamento é válido até ${data.validUntil}.`
      : "Valores sujeitos a alteração sem aviso prévio.",
    QUOTE_WIDTH / 2,
    QUOTE_HEIGHT - M,
  );
}

/** The same quote as a WhatsApp message. */
export function quoteToText(data: QuoteData): string {
  const money = (v: number) => formatMoney(v, data.currency);
  const { subtotal, discount, total } = quoteTotals(data);
  const lines = [
    `*ORÇAMENTO Nº ${data.number || "0001"}*`,
    data.company ? `_${data.company}_` : "",
    "",
    data.client ? `*Cliente:* ${data.client}` : "",
    data.serviceType ? `*Serviço:* ${data.serviceType}` : "",
    data.date ? `*Data:* ${data.date}` : "",
    "",
  ];
  for (const item of data.items) {
    const t = Math.max(0, item.quantity) * Math.max(0, item.unitPrice);
    lines.push(
      `• ${item.name || "Item"} — ${item.quantity}x ${money(item.unitPrice)} = ${money(t)}`,
    );
  }
  lines.push("");
  if (discount > 0) {
    lines.push(`Subtotal: ${money(subtotal)}`);
    lines.push(`Desconto ${data.discountPercent}%: -${money(discount)}`);
  }
  lines.push(`*TOTAL: ${money(total)}*`);
  if (data.paymentMethod) lines.push(`Pagamento: ${data.paymentMethod}`);
  if (data.pixKey) lines.push(`Pix: ${data.pixKey}`);
  if (data.validUntil) lines.push(`Válido até ${data.validUntil}`);
  if (data.notes) lines.push("", data.notes);
  return lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n");
}
