import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import {
  CURRENCIES,
  calculatePricing,
  formatMoney,
  labourFromHourly,
  type Currency,
  type PriceMode,
  type PricingInput,
  type PrintMode,
} from "@/lib/pricing";
import { ToolPageShell } from "@/components/tool-page-shell";
import { ControlGroup, Hint, OptionPills, PrimaryAction, ToolLayout } from "@/components/tool-ui";
import { downloadTextFile } from "@/lib/canvas-tools";

export const Route = createFileRoute("/ferramentas/calculadora")({
  head: () => ({ meta: [{ title: "Calculadora de Preços Pro | Printzy" }] }),
  component: PriceCalculatorTool,
});

const EMPTY: PricingInput = {
  quantity: 1,
  productBase: 0,
  packaging: 0,
  labourPerUnit: 0,
  energyOther: 0,
  printMode: "manual",
  manualPrint: 0,
  pricePerMeter: 0,
  pricePerM2: 0,
  sheetPrice: 0,
  sheetWidthCm: 30,
  sheetHeightCm: 40,
  artWidthCm: 10,
  artHeightCm: 12,
  wastePercent: 0,
  feePercent: 0,
  feeFixed: 0,
  taxPercent: 0,
  discountPercent: 0,
  priceMode: "sugerido",
  targetMarginPercent: 50,
  manualPrice: 0,
};

/** Starting points for the jobs a shop quotes most often. */
const PRESETS: { label: string; name: string; values: Partial<PricingInput> }[] = [
  {
    label: "Camiseta DTF",
    name: "Camiseta DTF",
    values: {
      productBase: 18,
      packaging: 1,
      energyOther: 0.5,
      printMode: "folha",
      sheetPrice: 12,
      sheetWidthCm: 30,
      sheetHeightCm: 40,
      artWidthCm: 28,
      artHeightCm: 35,
      wastePercent: 10,
      targetMarginPercent: 55,
    },
  },
  {
    label: "Caneca",
    name: "Caneca personalizada",
    values: {
      productBase: 9,
      packaging: 2.5,
      energyOther: 0.8,
      printMode: "manual",
      manualPrint: 2.2,
      wastePercent: 5,
      targetMarginPercent: 60,
    },
  },
  {
    label: "Adesivo",
    name: "Adesivo recortado",
    values: {
      productBase: 0,
      packaging: 0.3,
      energyOther: 0.2,
      printMode: "m2",
      pricePerM2: 120,
      artWidthCm: 10,
      artHeightCm: 10,
      wastePercent: 15,
      targetMarginPercent: 65,
    },
  },
];

function Field({
  label,
  value,
  onChange,
  step = "0.01",
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
  suffix?: string;
}) {
  return (
    <label className="space-y-1">
      <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          step={step}
          min={0}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded-lg border border-border bg-secondary px-2 py-1.5 text-sm tabular-nums"
        />
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </label>
  );
}

function Line({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "good" | "bad";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className={`text-sm ${strong ? "font-bold" : "text-muted-foreground"}`}>{label}</span>
      <span
        className={`font-mono tabular-nums ${strong ? "text-base font-bold" : "text-sm"} ${
          tone === "good" ? "text-accent" : tone === "bad" ? "text-destructive" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function PriceCalculatorTool() {
  const [name, setName] = useState("Camiseta DTF");
  const [currency, setCurrency] = useState<Currency>("BRL");
  const [input, setInput] = useState<PricingInput>({
    ...EMPTY,
    ...PRESETS[0]!.values,
    quantity: 10,
  });
  const [hourlyRate, setHourlyRate] = useState(25);
  const [minutesPerPiece, setMinutesPerPiece] = useState(6);
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof PricingInput>(key: K, value: PricingInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const result = useMemo(() => calculatePricing(input), [input]);
  const money = useCallback((v: number) => formatMoney(v, currency), [currency]);

  const summary = useMemo(
    () =>
      [
        `${name} — ${input.quantity} un.`,
        ``,
        `Custo por unidade: ${money(result.unitCost)}`,
        `Taxas e impostos:  ${money(result.unitFees)}`,
        `Preço por unidade: ${money(result.unitPrice)}`,
        `Lucro por unidade: ${money(result.unitProfit)} (${result.marginPercent.toFixed(1)}%)`,
        ``,
        `Total do pedido:   ${money(result.totalRevenue)}`,
        `Lucro do pedido:   ${money(result.totalProfit)}`,
      ].join("\n"),
    [name, input.quantity, result, money],
  );

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard is blocked outside a secure context; fall back to a file.
      downloadTextFile(summary, "text/plain", "resumo-preco.txt");
    }
  }

  return (
    <ToolPageShell
      title="Calculadora de Preços Pro"
      subtitle="Calcule custo, venda, margem e lucro."
    >
      <ToolLayout
        controls={
          <>
            <ControlGroup step="01" label="Item">
              <label className="space-y-1">
                <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  Nome do produto/serviço
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-secondary px-2 py-1.5 text-sm"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="Quantidade"
                  step="1"
                  value={input.quantity}
                  onChange={(v) => set("quantity", v)}
                />
                <label className="space-y-1">
                  <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                    Moeda
                  </span>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="w-full rounded-lg border border-border bg-secondary px-2 py-1.5 text-sm"
                  >
                    {(Object.keys(CURRENCIES) as Currency[]).map((c) => (
                      <option key={c} value={c}>
                        {CURRENCIES[c].symbol} {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setName(p.name);
                      setInput((prev) => ({ ...EMPTY, quantity: prev.quantity, ...p.values }));
                    }}
                    className="rounded-lg border border-border bg-secondary px-2 py-1.5 text-xs font-semibold transition-colors hover:border-border-strong"
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setInput((prev) => ({ ...EMPTY, quantity: prev.quantity }))}
                  className="rounded-lg border border-border bg-secondary px-2 py-1.5 text-xs font-semibold transition-colors hover:border-border-strong"
                >
                  Zerar custos
                </button>
              </div>
            </ControlGroup>

            <ControlGroup step="02" label="Custos por unidade">
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="Produto base"
                  value={input.productBase}
                  onChange={(v) => set("productBase", v)}
                />
                <Field
                  label="Embalagem"
                  value={input.packaging}
                  onChange={(v) => set("packaging", v)}
                />
                <Field
                  label="Mão de obra"
                  value={input.labourPerUnit}
                  onChange={(v) => set("labourPerUnit", v)}
                />
                <Field
                  label="Energia/outros"
                  value={input.energyOther}
                  onChange={(v) => set("energyOther", v)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Valor da hora" value={hourlyRate} onChange={setHourlyRate} />
                <Field
                  label="Minutos por peça"
                  step="1"
                  value={minutesPerPiece}
                  onChange={setMinutesPerPiece}
                />
              </div>
              <button
                type="button"
                onClick={() => set("labourPerUnit", labourFromHourly(hourlyRate, minutesPerPiece))}
                className="w-full rounded-lg border border-border bg-secondary px-2 py-2 text-xs font-semibold transition-colors hover:border-border-strong"
              >
                Calcular mão de obra
              </button>
            </ControlGroup>

            <ControlGroup step="03" label="Modo de impressão">
              <OptionPills<PrintMode>
                columns={2}
                value={input.printMode}
                onChange={(v) => set("printMode", v)}
                options={[
                  { value: "manual", label: "Manual" },
                  { value: "metro", label: "Metro" },
                  { value: "m2", label: "m²" },
                  { value: "folha", label: "Folha" },
                ]}
              />
              <div className="grid grid-cols-2 gap-2">
                {input.printMode === "manual" && (
                  <Field
                    label="Custo de impressão"
                    value={input.manualPrint}
                    onChange={(v) => set("manualPrint", v)}
                  />
                )}
                {input.printMode === "metro" && (
                  <Field
                    label="Preço / metro"
                    value={input.pricePerMeter}
                    onChange={(v) => set("pricePerMeter", v)}
                  />
                )}
                {input.printMode === "m2" && (
                  <Field
                    label="Preço / m²"
                    value={input.pricePerM2}
                    onChange={(v) => set("pricePerM2", v)}
                  />
                )}
                {input.printMode === "folha" && (
                  <>
                    <Field
                      label="Preço da folha"
                      value={input.sheetPrice}
                      onChange={(v) => set("sheetPrice", v)}
                    />
                    <Field
                      label="Largura folha"
                      suffix="cm"
                      value={input.sheetWidthCm}
                      onChange={(v) => set("sheetWidthCm", v)}
                    />
                    <Field
                      label="Altura folha"
                      suffix="cm"
                      value={input.sheetHeightCm}
                      onChange={(v) => set("sheetHeightCm", v)}
                    />
                  </>
                )}
                {input.printMode !== "manual" && (
                  <>
                    <Field
                      label="Largura arte"
                      suffix="cm"
                      value={input.artWidthCm}
                      onChange={(v) => set("artWidthCm", v)}
                    />
                    <Field
                      label="Altura arte"
                      suffix="cm"
                      value={input.artHeightCm}
                      onChange={(v) => set("artHeightCm", v)}
                    />
                  </>
                )}
                <Field
                  label="Perda"
                  suffix="%"
                  value={input.wastePercent}
                  onChange={(v) => set("wastePercent", v)}
                />
              </div>
              {input.printMode === "folha" && (
                <Hint>
                  cabem <strong>{result.piecesPerSheet}</strong> peças por folha nesse encaixe. A
                  folha inteira é paga mesmo que sobre espaço — use o Arquivo DTF para aproveitar o
                  resto.
                </Hint>
              )}
              {input.printMode === "metro" && (
                <Hint>
                  o rolo é cobrado por comprimento, então só a altura da arte entra na conta — a
                  largura do rolo você paga de qualquer jeito.
                </Hint>
              )}
            </ControlGroup>

            <ControlGroup step="04" label="Fechamento">
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="Taxa"
                  suffix="%"
                  value={input.feePercent}
                  onChange={(v) => set("feePercent", v)}
                />
                <Field
                  label="Taxa fixa"
                  value={input.feeFixed}
                  onChange={(v) => set("feeFixed", v)}
                />
                <Field
                  label="Imposto"
                  suffix="%"
                  value={input.taxPercent}
                  onChange={(v) => set("taxPercent", v)}
                />
                <Field
                  label="Desconto"
                  suffix="%"
                  value={input.discountPercent}
                  onChange={(v) => set("discountPercent", v)}
                />
              </div>
              <OptionPills<PriceMode>
                columns={2}
                value={input.priceMode}
                onChange={(v) => set("priceMode", v)}
                options={[
                  { value: "sugerido", label: "Preço sugerido" },
                  { value: "manual", label: "Preço manual" },
                ]}
              />
              {input.priceMode === "sugerido" ? (
                <Field
                  label="Margem desejada"
                  suffix="%"
                  value={input.targetMarginPercent}
                  onChange={(v) => set("targetMarginPercent", v)}
                />
              ) : (
                <Field
                  label="Preço de venda"
                  value={input.manualPrice}
                  onChange={(v) => set("manualPrice", v)}
                />
              )}
              <Hint>
                a taxa e o imposto saem <strong>do preço de venda</strong>, não do custo. O preço
                sugerido já resolve isso — sua margem sai igual à que você pediu.
              </Hint>
            </ControlGroup>
          </>
        }
      >
        <div className="flex min-h-[60vh] flex-col overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-bold tracking-tight">Orçamento</h2>
            <p className="text-xs text-muted-foreground">
              {name || "Item sem nome"} • {input.quantity} un.
            </p>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {result.impossible && (
              <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                Margem e taxas somam 100% ou mais — não existe preço que atenda. Baixe a margem
                desejada ou as taxas.
              </p>
            )}

            <section>
              <h3 className="font-mono text-[11px] font-bold tracking-[0.14em] text-accent uppercase">
                Por unidade
              </h3>
              <div className="mt-1 divide-y divide-border">
                <Line label="Impressão" value={money(result.printCost)} />
                <Line label="Custo total" value={money(result.unitCost)} />
                <Line label="Taxas e impostos" value={money(result.unitFees)} />
                <Line label="Preço de venda" value={money(result.unitPrice)} strong />
                <Line
                  label="Lucro"
                  value={money(result.unitProfit)}
                  tone={result.unitProfit >= 0 ? "good" : "bad"}
                />
                <Line
                  label="Margem real"
                  value={`${result.marginPercent.toFixed(1)}%`}
                  tone={result.marginPercent >= 0 ? "good" : "bad"}
                />
              </div>
            </section>

            <section>
              <h3 className="font-mono text-[11px] font-bold tracking-[0.14em] text-accent uppercase">
                Pedido ({input.quantity} un.)
              </h3>
              <div className="mt-1 divide-y divide-border">
                <Line label="Custo + taxas" value={money(result.totalCost)} />
                <Line label="Receita" value={money(result.totalRevenue)} strong />
                <Line
                  label="Lucro"
                  value={money(result.totalProfit)}
                  strong
                  tone={result.totalProfit >= 0 ? "good" : "bad"}
                />
              </div>
            </section>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-border p-4">
            <PrimaryAction onClick={copySummary}>
              {copied ? "Copiado!" : "Copiar resumo"}
            </PrimaryAction>
            <button
              type="button"
              onClick={() =>
                downloadTextFile(
                  summary,
                  "text/plain",
                  `${name.toLowerCase().replace(/\s+/g, "-") || "orcamento"}.txt`,
                )
              }
              className="rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm font-semibold transition-colors hover:border-border-strong"
            >
              Baixar resumo
            </button>
          </div>
        </div>
      </ToolLayout>
    </ToolPageShell>
  );
}
