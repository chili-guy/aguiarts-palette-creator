import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { CURRENCIES, formatMoney, type Currency } from "@/lib/pricing";
import {
  QUOTE_DPI,
  quoteToText,
  quoteTotals,
  renderQuote,
  type QuoteData,
  type QuoteItem,
  type QuoteTheme,
} from "@/lib/quote-render";
import { cleanBackground } from "@/lib/image-core";
import { ToolPageShell } from "@/components/tool-page-shell";
import { ControlGroup, Hint, OptionPills, PrimaryAction, ToolLayout } from "@/components/tool-ui";
import {
  downloadCanvasAsPng,
  drawRGBAImage,
  imageToRGBAImage,
  loadImageFile,
} from "@/lib/canvas-tools";
import { downloadCanvasAsPdf } from "@/lib/export";

export const Route = createFileRoute("/ferramentas/orcamento")({
  head: () => ({ meta: [{ title: "Orçamento PRO | Printzy" }] }),
  component: QuoteTool,
});

const SERVICE_TYPES = [
  "DTF",
  "DTG",
  "Sublimação",
  "Camiseta personalizada",
  "Caneca personalizada",
  "Adesivo",
  "Brinde / personalizado",
  "Outro",
];

const PAYMENT_METHODS = ["Pix", "Dinheiro", "Cartão", "Parcelado", "A combinar"];

type CatalogGroup = "DTF/DTG" | "Sublimação" | "Outros";

const CATALOG: { name: string; price: number; group: CatalogGroup }[] = [
  { name: "Camiseta DTF frente pequena", price: 39.9, group: "DTF/DTG" },
  { name: "Camiseta DTF frente grande", price: 49.9, group: "DTF/DTG" },
  { name: "Camiseta DTF frente e costas", price: 64.9, group: "DTF/DTG" },
  { name: "Camiseta DTG", price: 59.9, group: "DTF/DTG" },
  { name: "Transfer DTF por unidade", price: 12.0, group: "DTF/DTG" },
  { name: "Folha DTF 30×40 cm", price: 28.0, group: "DTF/DTG" },
  { name: "Caneca sublimada 325 ml", price: 34.9, group: "Sublimação" },
  { name: "Almofada sublimada", price: 44.9, group: "Sublimação" },
  { name: "Azulejo sublimado", price: 29.9, group: "Sublimação" },
  { name: "Adesivo recortado", price: 8.5, group: "Outros" },
  { name: "Chaveiro acrílico", price: 14.9, group: "Outros" },
  { name: "Tratamento de arte", price: 25.0, group: "Outros" },
];

const STORAGE_KEY = "printzy:orcamento";

function today() {
  return new Date().toLocaleDateString("pt-BR");
}

function inDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("pt-BR");
}

const EMPTY: QuoteData = {
  company: "",
  companyWhatsapp: "",
  companyContact: "",
  pixKey: "",
  client: "",
  clientWhatsapp: "",
  number: "0001",
  date: today(),
  validUntil: inDays(7),
  serviceType: SERVICE_TYPES[0]!,
  paymentMethod: PAYMENT_METHODS[0]!,
  notes: "",
  items: [],
  discountPercent: 0,
  currency: "BRL",
};

function Text({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1">
      <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-secondary px-2 py-1.5 text-sm"
      />
    </label>
  );
}

function QuoteTool() {
  const [data, setData] = useState<QuoteData>(EMPTY);
  const [theme, setTheme] = useState<QuoteTheme>("escuro");
  const [logoBg, setLogoBg] = useState<"automatico" | "transparente">("automatico");
  const [rawLogo, setRawLogo] = useState<HTMLImageElement | null>(null);
  const [filter, setFilter] = useState<"Todos" | CatalogGroup>("Todos");
  const [toast, setToast] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const set = <K extends keyof QuoteData>(key: K, value: QuoteData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  function flash(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 1800);
  }

  /** "Transparente" reuses the background cleaner to knock the logo's plate out. */
  const logo = useMemo(() => {
    if (!rawLogo) return null;
    if (logoBg === "automatico") return rawLogo;
    const cleaned = cleanBackground(imageToRGBAImage(rawLogo), {
      strength: 30,
      protection: 40,
      smoothing: 15,
    });
    const canvas = document.createElement("canvas");
    drawRGBAImage(canvas, cleaned);
    return canvas;
  }, [rawLogo, logoBg]);

  useEffect(() => {
    if (canvasRef.current) renderQuote(canvasRef.current, data, theme, logo);
  }, [data, theme, logo]);

  const totals = useMemo(() => quoteTotals(data), [data]);
  const money = (v: number) => formatMoney(v, data.currency);

  function addItem(name = "", unitPrice = 0) {
    const item: QuoteItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      quantity: 1,
      unitPrice,
    };
    setData((prev) => ({ ...prev, items: [...prev.items, item] }));
  }

  function patchItem(id: string, patch: Partial<QuoteItem>) {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setRawLogo(await loadImageFile(file));
    } catch {
      flash("Não foi possível carregar a logo.");
    }
  }

  const baseName = `orcamento-${data.number || "0001"}`;
  const visibleCatalog = CATALOG.filter((c) => filter === "Todos" || c.group === filter);

  return (
    <ToolPageShell
      title="Orçamento PRO"
      subtitle="Monte orçamentos profissionais e gere arquivos para seus clientes."
    >
      <ToolLayout
        controls={
          <>
            <ControlGroup step="01" label="Identidade">
              <label className="block cursor-pointer rounded-xl border border-border-strong bg-accent/10 px-4 py-3 text-center transition-colors hover:bg-accent/15">
                <span className="block text-sm font-bold">
                  {rawLogo ? "Trocar logo" : "Adicionar logo"}
                </span>
                <input type="file" accept="image/*" onChange={handleLogo} className="sr-only" />
              </label>
              <OptionPills<QuoteTheme>
                columns={2}
                value={theme}
                onChange={setTheme}
                options={[
                  { value: "escuro", label: "Escuro" },
                  { value: "claro", label: "Claro" },
                ]}
              />
              {rawLogo && (
                <OptionPills<"automatico" | "transparente">
                  columns={2}
                  value={logoBg}
                  onChange={setLogoBg}
                  options={[
                    { value: "automatico", label: "Fundo automático" },
                    { value: "transparente", label: "Transparente" },
                  ]}
                />
              )}
              <Hint>
                "Transparente" passa a logo pelo Limpador de Fundo — resolve logo salva em JPG com
                fundo branco, que ficaria com um bloco branco no tema escuro.
              </Hint>
            </ControlGroup>

            <ControlGroup step="02" label="Sua empresa">
              <Text
                label="Empresa"
                value={data.company}
                onChange={(v) => set("company", v)}
                placeholder="Sua gráfica"
              />
              <div className="grid grid-cols-2 gap-2">
                <Text
                  label="WhatsApp"
                  value={data.companyWhatsapp}
                  onChange={(v) => set("companyWhatsapp", v)}
                />
                <Text
                  label="E-mail / Instagram"
                  value={data.companyContact}
                  onChange={(v) => set("companyContact", v)}
                />
              </div>
              <Text label="Chave Pix" value={data.pixKey} onChange={(v) => set("pixKey", v)} />
            </ControlGroup>

            <ControlGroup step="03" label="Cliente">
              <Text label="Cliente" value={data.client} onChange={(v) => set("client", v)} />
              <Text
                label="WhatsApp cliente"
                value={data.clientWhatsapp}
                onChange={(v) => set("clientWhatsapp", v)}
              />
              <div className="grid grid-cols-3 gap-2">
                <Text label="Nº" value={data.number} onChange={(v) => set("number", v)} />
                <Text label="Data" value={data.date} onChange={(v) => set("date", v)} />
                <Text
                  label="Validade"
                  value={data.validUntil}
                  onChange={(v) => set("validUntil", v)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                    Tipo de serviço
                  </span>
                  <select
                    value={data.serviceType}
                    onChange={(e) => set("serviceType", e.target.value)}
                    className="w-full rounded-lg border border-border bg-secondary px-2 py-1.5 text-sm"
                  >
                    {SERVICE_TYPES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                    Forma pagamento
                  </span>
                  <select
                    value={data.paymentMethod}
                    onChange={(e) => set("paymentMethod", e.target.value)}
                    className="w-full rounded-lg border border-border bg-secondary px-2 py-1.5 text-sm"
                  >
                    {PAYMENT_METHODS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>
            </ControlGroup>

            <ControlGroup step="04" label="Catálogo">
              <OptionPills<"Todos" | CatalogGroup>
                columns={2}
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "Todos", label: "Todos" },
                  { value: "DTF/DTG", label: "DTF/DTG" },
                  { value: "Sublimação", label: "Sublimação" },
                  { value: "Outros", label: "Outros" },
                ]}
              />
              <div className="max-h-52 space-y-1 overflow-y-auto">
                {visibleCatalog.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => addItem(c.name, c.price)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-secondary px-2.5 py-2 text-left text-xs transition-colors hover:border-border-strong"
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="shrink-0 font-mono font-bold text-accent">
                      {money(c.price)}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addItem()}
                className="w-full rounded-lg border border-border bg-secondary px-2 py-2 text-xs font-semibold transition-colors hover:border-border-strong"
              >
                Adicionar item em branco
              </button>
            </ControlGroup>

            <ControlGroup step="05" label="Arquivo">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                    flash("Orçamento salvo.");
                  }}
                  className="rounded-lg border border-border bg-secondary px-2 py-2 text-xs font-semibold transition-colors hover:border-border-strong"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const raw = localStorage.getItem(STORAGE_KEY);
                    if (!raw) return flash("Nada salvo ainda.");
                    try {
                      setData({ ...EMPTY, ...(JSON.parse(raw) as QuoteData) });
                      flash("Orçamento carregado.");
                    } catch {
                      flash("Arquivo salvo está corrompido.");
                    }
                  }}
                  className="rounded-lg border border-border bg-secondary px-2 py-2 text-xs font-semibold transition-colors hover:border-border-strong"
                >
                  Carregar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setData({ ...EMPTY, date: today(), validUntil: inDays(7) });
                    setRawLogo(null);
                  }}
                  className="rounded-lg border border-border bg-secondary px-2 py-2 text-xs font-semibold transition-colors hover:border-border-strong"
                >
                  Limpar
                </button>
              </div>
              {toast && <p className="text-xs font-semibold text-accent">{toast}</p>}
            </ControlGroup>
          </>
        }
      >
        <div className="flex min-h-[60vh] flex-col overflow-hidden rounded-2xl border border-border bg-card lg:max-h-[calc(100vh-var(--topbar-h)-2.5rem)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <h2 className="font-bold tracking-tight">Prévia do orçamento</h2>
              <p className="text-xs text-muted-foreground">
                A4 em {QUOTE_DPI} DPI • {data.items.length} item(ns) • total {money(totals.total)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <PrimaryAction
                className="px-3 py-2 text-xs"
                onClick={() =>
                  canvasRef.current && downloadCanvasAsPng(canvasRef.current, `${baseName}.png`)
                }
              >
                Baixar PNG
              </PrimaryAction>
              <button
                type="button"
                onClick={() =>
                  canvasRef.current &&
                  downloadCanvasAsPdf(canvasRef.current, `${baseName}.pdf`, QUOTE_DPI)
                }
                className="rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-semibold transition-colors hover:border-border-strong"
              >
                Baixar PDF
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(quoteToText(data));
                    flash("Texto copiado.");
                  } catch {
                    flash("O navegador bloqueou a área de transferência.");
                  }
                }}
                className="rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-semibold transition-colors hover:border-border-strong"
              >
                Copiar WhatsApp
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-background-2 p-4">
            {data.items.length > 0 && (
              <div className="space-y-1.5 rounded-xl border border-border bg-card p-3">
                {data.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <input
                      value={item.name}
                      placeholder="Item"
                      onChange={(e) => patchItem(item.id, { name: e.target.value })}
                      className="min-w-0 flex-1 rounded-lg border border-border bg-secondary px-2 py-1.5 text-sm"
                    />
                    <input
                      type="number"
                      min={0}
                      value={item.quantity}
                      onChange={(e) => patchItem(item.id, { quantity: Number(e.target.value) })}
                      className="w-16 rounded-lg border border-border bg-secondary px-2 py-1.5 text-sm tabular-nums"
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => patchItem(item.id, { unitPrice: Number(e.target.value) })}
                      className="w-24 rounded-lg border border-border bg-secondary px-2 py-1.5 text-sm tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setData((prev) => ({
                          ...prev,
                          items: prev.items.filter((i) => i.id !== item.id),
                        }))
                      }
                      aria-label={`Remover ${item.name || "item"}`}
                      className="shrink-0 rounded-lg border border-border px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-end gap-2 border-t border-border pt-2">
                  <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                    Desconto %
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={data.discountPercent}
                    onChange={(e) => set("discountPercent", Number(e.target.value))}
                    className="w-20 rounded-lg border border-border bg-secondary px-2 py-1.5 text-sm tabular-nums"
                  />
                </div>
              </div>
            )}

            <canvas
              ref={canvasRef}
              role="img"
              aria-label="Prévia do orçamento"
              className="mx-auto h-auto w-full max-w-[560px] rounded-xl border border-border shadow-card"
            />
          </div>
        </div>
      </ToolLayout>
    </ToolPageShell>
  );
}
