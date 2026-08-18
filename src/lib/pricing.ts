/**
 * Pricing maths behind the "Calculadora de Preços Pro".
 *
 * Kept apart from the form so the arithmetic can be checked on its own — the
 * part a print shop actually depends on is that the margin it asked for is the
 * margin it ends up with after the card fee and the tax are taken out.
 */

export type PrintMode = "manual" | "metro" | "m2" | "folha";
export type PriceMode = "sugerido" | "manual";
export type Currency = "BRL" | "USD" | "EUR";

export const CURRENCIES: Record<Currency, { symbol: string; locale: string }> = {
  BRL: { symbol: "R$", locale: "pt-BR" },
  USD: { symbol: "$", locale: "en-US" },
  EUR: { symbol: "€", locale: "de-DE" },
};

export interface PricingInput {
  quantity: number;
  /** Per-unit costs the shop pays regardless of how the art is printed. */
  productBase: number;
  packaging: number;
  labourPerUnit: number;
  energyOther: number;

  printMode: PrintMode;
  /** printMode "manual": the printing cost per unit, entered directly. */
  manualPrint: number;
  pricePerMeter: number;
  pricePerM2: number;
  sheetPrice: number;
  sheetWidthCm: number;
  sheetHeightCm: number;
  artWidthCm: number;
  artHeightCm: number;
  /** Film/sheet wasted as a percentage, added on top of the printing cost. */
  wastePercent: number;

  /** Payment processor percentage and flat fee, both charged on the sale. */
  feePercent: number;
  feeFixed: number;
  taxPercent: number;
  discountPercent: number;

  priceMode: PriceMode;
  /** priceMode "sugerido": the margin to solve for, as a percentage of the sale. */
  targetMarginPercent: number;
  /** priceMode "manual": the sale price the shop wants to charge. */
  manualPrice: number;
}

export interface PricingResult {
  /** Printing cost for one unit, before the other per-unit costs. */
  printCost: number;
  /** How many pieces fit on one sheet. Only meaningful for printMode "folha". */
  piecesPerSheet: number;
  unitCost: number;
  unitPrice: number;
  /** What is actually taken off each sale by the processor and the tax. */
  unitFees: number;
  unitProfit: number;
  /** Realised margin as a percentage of the sale price. */
  marginPercent: number;
  totalCost: number;
  totalRevenue: number;
  totalProfit: number;
  /** True when fees plus target margin reach 100% and no price can satisfy them. */
  impossible: boolean;
}

const pct = (v: number) => Math.max(0, v) / 100;

/** Printing cost for a single piece under the selected charging model. */
export function printCostPerUnit(input: PricingInput): { cost: number; piecesPerSheet: number } {
  const waste = 1 + pct(input.wastePercent);
  const w = Math.max(0, input.artWidthCm);
  const h = Math.max(0, input.artHeightCm);

  switch (input.printMode) {
    case "metro":
      // Roll media is sold by length, so only the art's height along the roll
      // is billed — the roll's full width is paid for either way.
      return { cost: input.pricePerMeter * (h / 100) * waste, piecesPerSheet: 0 };
    case "m2":
      return { cost: input.pricePerM2 * ((w * h) / 10000) * waste, piecesPerSheet: 0 };
    case "folha": {
      const across = Math.floor(Math.max(0, input.sheetWidthCm) / (w || Infinity));
      const down = Math.floor(Math.max(0, input.sheetHeightCm) / (h || Infinity));
      const fit = Math.max(0, across * down);
      // A sheet that fits nothing still costs a whole sheet per piece.
      const perPiece = fit > 0 ? input.sheetPrice / fit : input.sheetPrice;
      return { cost: perPiece * waste, piecesPerSheet: fit };
    }
    default:
      return { cost: input.manualPrint * waste, piecesPerSheet: 0 };
  }
}

/**
 * Solves for the sale price, or measures the margin of one already chosen.
 *
 * The percentage fees and the tax are charged *on the sale price*, not on the
 * cost, so a shop that just adds its margin to the cost and then pays 5% to the
 * card machine ends up under its target. Solving for the price with those
 * percentages in the denominator is what keeps the requested margin intact.
 */
export function calculatePricing(input: PricingInput): PricingResult {
  const { cost: printCost, piecesPerSheet } = printCostPerUnit(input);
  const unitCost =
    Math.max(0, input.productBase) +
    Math.max(0, input.packaging) +
    Math.max(0, input.labourPerUnit) +
    Math.max(0, input.energyOther) +
    printCost;

  const feeRate = pct(input.feePercent) + pct(input.taxPercent);
  const discount = 1 - pct(input.discountPercent);
  const margin = pct(input.targetMarginPercent);

  let unitPrice: number;
  let impossible = false;

  if (input.priceMode === "manual") {
    unitPrice = Math.max(0, input.manualPrice);
  } else {
    const denominator = 1 - feeRate - margin;
    if (denominator <= 0) {
      impossible = true;
      unitPrice = 0;
    } else {
      // Solve price from: price = cost + feeFixed + price*feeRate + price*margin
      unitPrice = ((unitCost + Math.max(0, input.feeFixed)) / denominator) * discount;
    }
  }

  const unitFees = unitPrice * feeRate + Math.max(0, input.feeFixed);
  const unitProfit = unitPrice - unitCost - unitFees;
  const marginPercent = unitPrice > 0 ? (unitProfit / unitPrice) * 100 : 0;
  const quantity = Math.max(0, Math.round(input.quantity));

  return {
    printCost,
    piecesPerSheet,
    unitCost,
    unitPrice,
    unitFees,
    unitProfit,
    marginPercent,
    totalCost: (unitCost + unitFees) * quantity,
    totalRevenue: unitPrice * quantity,
    totalProfit: unitProfit * quantity,
    impossible,
  };
}

export function formatMoney(value: number, currency: Currency): string {
  const { locale } = CURRENCIES[currency];
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    Number.isFinite(value) ? value : 0,
  );
}

/** Labour cost for one piece, from an hourly rate and minutes spent. */
export function labourFromHourly(hourlyRate: number, minutesPerPiece: number): number {
  return (Math.max(0, hourlyRate) / 60) * Math.max(0, minutesPerPiece);
}
