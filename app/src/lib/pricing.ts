/* ============================================================
   MT ASPHALT — Pricing engine

   DESIGN RULE: the language model NEVER calculates money.
   Every dollar figure on a quote, contract, or invoice comes from
   this file. The model writes prose and extracts what the customer
   said; arithmetic happens here, deterministically, where it can be
   unit-tested and audited.

   Rates live in Settings so Michael can edit them from the dashboard
   without a developer. Every field is optional with a fallback, so
   an existing localStorage database from before this file existed
   still loads and prices correctly.
   ============================================================ */

import type { Settings } from "./types";

export const LB_PER_TON = 2000;
export const INCHES_PER_FOOT = 12;

/** Compacted hot-mix asphalt. 140–150 lb/ft³ is the normal range. */
export const DEFAULT_DENSITY = 145;

export interface PavingRates {
  asphaltCostPerTon: number;
  asphaltDensityLbPerCuFt: number;
  installLaborPerSqft: number;
  mobilizationFee: number;
  minJobCharge: number;
  sealcoatPerSqft: number;
  crackFillPerLinearFt: number;
  patchingPerSqft: number;
  millingPerSqft: number;
  basePrepPerSqft: number;
  stripingPerStall: number;
  markupPct: number;
  taxRatePct: number;
  depositPct: number;
}

/* Placeholder rates. These are NOT MT Asphalt's real numbers — they are
   plausible Orange County figures used so the app runs before Michael has
   supplied his own. Settings → Paving Rates overrides every one of them. */
export const DEFAULT_RATES: PavingRates = {
  asphaltCostPerTon: 125,
  asphaltDensityLbPerCuFt: DEFAULT_DENSITY,
  installLaborPerSqft: 1.1,
  mobilizationFee: 450,
  minJobCharge: 1200,
  sealcoatPerSqft: 0.22,
  crackFillPerLinearFt: 1.75,
  patchingPerSqft: 4.5,
  millingPerSqft: 0.85,
  basePrepPerSqft: 1.4,
  stripingPerStall: 12,
  markupPct: 18,
  taxRatePct: 0, // see note in taxWarning()
  depositPct: 50, // matches the seeded "50% deposit, 50% on completion" terms
};

/** Pull rates out of Settings, falling back field by field. */
export function ratesFrom(settings: Partial<Settings> & Partial<PavingRates>): PavingRates {
  const s = settings as Record<string, unknown>;
  const pick = (key: keyof PavingRates, fallback: number): number => {
    const v = s[key];
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
  };
  return {
    asphaltCostPerTon: pick("asphaltCostPerTon", DEFAULT_RATES.asphaltCostPerTon),
    asphaltDensityLbPerCuFt: pick("asphaltDensityLbPerCuFt", DEFAULT_RATES.asphaltDensityLbPerCuFt),
    installLaborPerSqft: pick("installLaborPerSqft", DEFAULT_RATES.installLaborPerSqft),
    mobilizationFee: pick("mobilizationFee", DEFAULT_RATES.mobilizationFee),
    minJobCharge: pick("minJobCharge", DEFAULT_RATES.minJobCharge),
    sealcoatPerSqft: pick("sealcoatPerSqft", DEFAULT_RATES.sealcoatPerSqft),
    crackFillPerLinearFt: pick("crackFillPerLinearFt", DEFAULT_RATES.crackFillPerLinearFt),
    patchingPerSqft: pick("patchingPerSqft", DEFAULT_RATES.patchingPerSqft),
    millingPerSqft: pick("millingPerSqft", DEFAULT_RATES.millingPerSqft),
    basePrepPerSqft: pick("basePrepPerSqft", DEFAULT_RATES.basePrepPerSqft),
    stripingPerStall: pick("stripingPerStall", DEFAULT_RATES.stripingPerStall),
    markupPct: pick("markupPct", typeof s.materialMarkupPct === "number" ? (s.materialMarkupPct as number) : DEFAULT_RATES.markupPct),
    taxRatePct: pick("taxRatePct", DEFAULT_RATES.taxRatePct),
    depositPct: pick("depositPct", DEFAULT_RATES.depositPct),
  };
}

export type ServiceKind =
  | "paving"
  | "resurfacing"
  | "sealcoating"
  | "crack_filling"
  | "patching"
  | "striping";

export const SERVICE_LABELS: Record<ServiceKind, string> = {
  paving: "Asphalt Paving",
  resurfacing: "Resurfacing / Overlay",
  sealcoating: "Sealcoating",
  crack_filling: "Crack Sealing",
  patching: "Pothole Repair & Patching",
  striping: "Parking Lot Striping",
};

/** Services whose price is driven by asphalt tonnage. */
const TONNAGE_SERVICES: ServiceKind[] = ["paving", "resurfacing"];

export interface JobSpec {
  service: ServiceKind;
  sqft?: number;
  thicknessInches?: number;
  linearFeet?: number;
  stalls?: number;
  basePrep?: boolean;
  milling?: boolean;
  /** Flat price typed in by Michael. Overrides the whole calculation. */
  manualPrice?: number;
}

export interface QuoteLine {
  description: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface Quote {
  lines: QuoteLine[];
  tons: number;
  subtotal: number;
  markup: number;
  markupPct: number;
  minAdjustment: number;
  tax: number;
  taxRatePct: number;
  total: number;
  deposit: number;
  depositPct: number;
  balance: number;
  isManual: boolean;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Compacted hot-mix asphalt tonnage.
 *
 *   volume_ft3 = area × (thickness ÷ 12)
 *   weight_lb  = volume_ft3 × density
 *   tons       = weight_lb ÷ 2000
 *
 * Sanity check: at 145 lb/ft³, one square yard at 1" = 108.75 lb,
 * which matches the industry rule of thumb of ~110 lb/sq yd/inch.
 */
export function tonsRequired(sqft: number, thicknessInches: number, density: number): number {
  if (!(sqft > 0) || !(thicknessInches > 0)) return 0;
  const volumeFt3 = sqft * (thicknessInches / INCHES_PER_FOOT);
  return (volumeFt3 * density) / LB_PER_TON;
}

export function priceJob(spec: JobSpec, rates: PavingRates): Quote {
  const lines: QuoteLine[] = [];
  const sqft = spec.sqft ?? 0;
  const thickness = spec.thicknessInches ?? 0;
  const linear = spec.linearFeet ?? 0;
  const stalls = spec.stalls ?? 0;

  let tons = 0;

  if (TONNAGE_SERVICES.includes(spec.service)) {
    tons = tonsRequired(sqft, thickness, rates.asphaltDensityLbPerCuFt);
    if (tons > 0) {
      lines.push({
        description: `Hot-mix asphalt — ${tons.toFixed(2)} tons (${sqft.toLocaleString()} sq ft × ${thickness}")`,
        qty: r2(tons),
        unit: "ton",
        rate: rates.asphaltCostPerTon,
        amount: r2(tons * rates.asphaltCostPerTon),
      });
    }
    if (sqft > 0) {
      lines.push({
        description: "Installation labor and equipment",
        qty: sqft,
        unit: "sq ft",
        rate: rates.installLaborPerSqft,
        amount: r2(sqft * rates.installLaborPerSqft),
      });
    }
  }

  if (spec.service === "sealcoating" && sqft > 0) {
    lines.push({
      description: "Sealcoat application",
      qty: sqft,
      unit: "sq ft",
      rate: rates.sealcoatPerSqft,
      amount: r2(sqft * rates.sealcoatPerSqft),
    });
  }

  if (spec.service === "crack_filling" && linear > 0) {
    lines.push({
      description: "Crack sealing — hot rubberized sealant",
      qty: linear,
      unit: "linear ft",
      rate: rates.crackFillPerLinearFt,
      amount: r2(linear * rates.crackFillPerLinearFt),
    });
  }

  if (spec.service === "patching" && sqft > 0) {
    lines.push({
      description: "Asphalt patching / pothole repair",
      qty: sqft,
      unit: "sq ft",
      rate: rates.patchingPerSqft,
      amount: r2(sqft * rates.patchingPerSqft),
    });
  }

  if (spec.service === "striping" && stalls > 0) {
    lines.push({
      description: "Parking stall striping and markings",
      qty: stalls,
      unit: "stall",
      rate: rates.stripingPerStall,
      amount: r2(stalls * rates.stripingPerStall),
    });
  }

  if (spec.milling && sqft > 0) {
    lines.push({
      description: "Mill and remove existing surface",
      qty: sqft,
      unit: "sq ft",
      rate: rates.millingPerSqft,
      amount: r2(sqft * rates.millingPerSqft),
    });
  }

  if (spec.basePrep && sqft > 0) {
    lines.push({
      description: "Base preparation and grading",
      qty: sqft,
      unit: "sq ft",
      rate: rates.basePrepPerSqft,
      amount: r2(sqft * rates.basePrepPerSqft),
    });
  }

  lines.push({
    description: "Mobilization — equipment transport and setup",
    qty: 1,
    unit: "job",
    rate: rates.mobilizationFee,
    amount: r2(rates.mobilizationFee),
  });

  const subtotal = r2(lines.reduce((s, l) => s + l.amount, 0));
  const markup = r2((subtotal * rates.markupPct) / 100);
  const preMin = r2(subtotal + markup);
  const minAdjustment = preMin < rates.minJobCharge ? r2(rates.minJobCharge - preMin) : 0;
  const taxable = r2(preMin + minAdjustment);
  const tax = r2((taxable * rates.taxRatePct) / 100);

  const calculated = r2(taxable + tax);
  const isManual = typeof spec.manualPrice === "number" && spec.manualPrice > 0;
  const total = isManual ? r2(spec.manualPrice as number) : calculated;

  const deposit = r2((total * rates.depositPct) / 100);

  return {
    lines,
    tons: r2(tons),
    subtotal,
    markup,
    markupPct: rates.markupPct,
    minAdjustment,
    tax,
    taxRatePct: rates.taxRatePct,
    total,
    deposit,
    depositPct: rates.depositPct,
    balance: r2(total - deposit),
    isManual,
  };
}

/** Convert a quote into the LineItem[] shape the Invoices page already renders. */
export function quoteToLineItems(quote: Quote): {
  id: string;
  description: string;
  qty: number;
  unit: string;
  rate: number;
}[] {
  return quote.lines.map((l, i) => ({
    id: `li-${Date.now().toString(36)}-${i}`,
    description: l.description,
    qty: l.qty,
    unit: l.unit,
    rate: l.rate,
  }));
}

/** Short scope bullets for the Contract card and printed contract. */
export function quoteToScopeItems(spec: JobSpec): string[] {
  const items: string[] = [SERVICE_LABELS[spec.service]];
  if (spec.milling) items.push("Mill existing surface");
  if (spec.basePrep) items.push("Base prep & grading");
  if (spec.sqft) items.push(`${spec.sqft.toLocaleString()} sq ft`);
  if (spec.thicknessInches && TONNAGE_SERVICES.includes(spec.service)) {
    items.push(`${spec.thicknessInches}" compacted`);
  }
  if (spec.linearFeet) items.push(`${spec.linearFeet.toLocaleString()} linear ft`);
  if (spec.stalls) items.push(`${spec.stalls} stalls`);
  return items;
}

/**
 * California treats most paving as an improvement to real property: the
 * contractor is the consumer of the materials and pays sales tax on them,
 * rather than charging the customer sales tax on the job. That is why
 * taxRatePct defaults to 0 here even though Settings carries a 7.75% rate
 * for retail-style sales.
 *
 * This is genuinely fact-specific and is a question for Michael's accountant,
 * not something to infer from a default. Surfaced in the UI rather than
 * silently applied either way.
 */
export function taxNotice(rates: PavingRates): string | null {
  if (rates.taxRatePct > 0) {
    return `Sales tax is being added at ${rates.taxRatePct}%. In California, paving is usually an improvement to real property — the contractor pays tax on materials and does not charge the customer sales tax. Confirm with your accountant.`;
  }
  return null;
}
