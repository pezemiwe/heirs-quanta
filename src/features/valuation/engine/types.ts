/* ───────────────────────────────────────────────────────────
   Heirs Quanta Valuation Engine — Types
   ─────────────────────────────────────────────────────────── */

export type AssetType =
  | "subsidiary" // wholly/majority-owned operating company
  | "equity_listed" // listed equity holding
  | "equity_unlisted" // private equity holding / minority
  | "real_estate" // PPE / investment property
  | "bond" // fixed-income security
  | "tbill" // short-term treasury
  | "pe_fund" // limited partner stake
  | "joint_venture"; // JV / associate

export type IFRS13Level = "Level 1" | "Level 2" | "Level 3";

export type ValuationMethod =
  | "DCF"
  | "Market Price"
  | "Comparable Multiples"
  | "Net Asset Value"
  | "Income Capitalization"
  | "Discounted Cash Flow (Bond)"
  | "Par Value";

export type Currency = "NGN" | "USD" | "GBP" | "EUR";

/* ─── source asset ──────────────────────────────────────── */
export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  sector: string;
  currency: Currency;
  holdingPct: number; // % of entity owned (e.g. 100, 51, 12.7)
  carryingValue: number; // current book value (NGN millions)

  /* DCF inputs (subsidiaries, unlisted, JVs) */
  freeCashFlowYear1?: number; // NGN millions
  growthRate?: number; // explicit period growth, fraction (0.08 = 8%)
  terminalGrowth?: number; // fraction
  projectionYears?: number; // default 5
  beta?: number; // for WACC build-up

  /* Market-price inputs (listed) */
  sharesHeld?: number;
  lastPrice?: number; // currency-native
  marketSnapshotDate?: string;

  /* Comparable inputs */
  revenue?: number; // last twelve months, NGN millions
  ebitda?: number;
  netIncome?: number;
  bookValue?: number;

  /* Bond inputs */
  faceValue?: number; // NGN millions
  couponRate?: number; // fraction (0.135 = 13.5%)
  yearsToMaturity?: number;
  ytm?: number; // fraction
  paymentsPerYear?: number; // default 2

  /* Real estate inputs */
  noi?: number; // net operating income, NGN millions
  capRate?: number; // fraction

  /* PE / NAV inputs */
  reportedNav?: number; // NGN millions
}

/* ─── global assumptions ────────────────────────────────── */
export interface Assumptions {
  /* WACC build-up */
  riskFreeRate: number; // Nigerian 10yr FGN
  equityRiskPremium: number;
  countryRiskPremium: number;
  sizePremium: number;
  costOfDebt: number;
  taxRate: number;
  targetDebtRatio: number; // D / (D+E)

  /* Multiples for cross-check */
  peMultiple: number;
  evEbitdaMultiple: number;
  pbMultiple: number;
  psMultiple: number;

  /* Real estate */
  defaultCapRate: number;

  /* FX (snapshot rates against NGN) */
  fxUSD: number;
  fxGBP: number;
  fxEUR: number;

  /* Reporting */
  valuationDate: string;
  reportingCurrency: Currency;
}

/* ─── per-asset DCF projection ──────────────────────────── */
export interface DCFProjection {
  assetId: string;
  wacc: number;
  years: number[];
  fcfs: number[];
  discountFactors: number[];
  presentValues: number[];
  terminalValue: number;
  terminalPV: number;
  explicitPV: number;
  enterpriseValue: number;
  equityValueAttributable: number; // EV * holdingPct
}

/* ─── per-asset comparable result ───────────────────────── */
export interface ComparableResult {
  assetId: string;
  fromPE: number | null;
  fromEvEbitda: number | null;
  fromPB: number | null;
  fromPS: number | null;
  average: number;
}

/* ─── per-asset final valuation ─────────────────────────── */
export interface AssetValuation {
  assetId: string;
  method: ValuationMethod;
  fairValue: number; // attributable to Heirs (NGN millions)
  fairValueLow: number;
  fairValueHigh: number;
  ifrs13Level: IFRS13Level;
  uplift: number; // fairValue - carryingValue
  upliftPct: number;
  dcf?: DCFProjection;
  comparable?: ComparableResult;
  notes: string;
}

/* ─── portfolio-wide engine result ──────────────────────── */
export interface EngineResult {
  valuations: AssetValuation[];
  totalCarryingValue: number;
  totalFairValue: number;
  totalFairValueLow: number;
  totalFairValueHigh: number;
  totalUplift: number;
  totalUpliftPct: number;
  level1Total: number;
  level2Total: number;
  level3Total: number;
  byType: { type: AssetType; carrying: number; fair: number; count: number }[];
  bySector: { sector: string; carrying: number; fair: number; count: number }[];
}
