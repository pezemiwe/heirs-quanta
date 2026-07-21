/* ───────────────────────────────────────────────────────────
   Heirs Quanta Valuation Engine - Fixed Income Types
   ─────────────────────────────────────────────────────────── */

export type Classification = "AC" | "FVOCI" | "FVTPL";
export type IFRS13Level = "L1" | "L2" | "L3";
export type Currency = "NGN" | "USD" | "GBP" | "EUR";
export type CouponFrequency =
  | "Annual"
  | "Semi"
  | "Quarterly"
  | "Monthly"
  | "Zero"
  | "N/A";
export type ImpairmentStage = "Stage 1" | "Stage 2" | "Stage 3" | "N/A";
export type InstrumentStatus = "Active" | "Matured" | "Sold";

export type InstrumentType =
  | "FGN Bond"
  | "Corporate Bond"
  | "State Bond"
  | "Eurobond"
  | "T-Bill"
  | "Commercial Paper"
  | "Promissory Note"
  | "Bank Placement"
  | "Fixed Deposit"
  | "Mutual Fund"
  | "Equity";

/* ─── core instrument record ────────────────────────────── */
export interface Instrument {
  id: string;
  name: string;
  instrumentType: InstrumentType;
  issuer: string;
  sector: string;
  portfolioBook?: string;

  classification: Classification;
  ifrs13Level: IFRS13Level;
  currency: Currency;

  faceValue: number; // local currency, absolute units
  purchasePrice: number; // local currency, absolute units
  purchaseDate: string; // ISO yyyy-mm-dd
  maturityDate: string; // ISO yyyy-mm-dd

  couponRate: number; // fraction e.g. 0.1398; 0 if zero/equity
  couponFrequency: CouponFrequency;

  status: InstrumentStatus;
  bookedBy?: string;

  /* Market overrides */
  marketYield?: number; // fraction; overrides curve interpolation
  marketPrice?: number; // absolute (local ccy) clean fair value override

  /* Impairment */
  impairmentStage?: ImpairmentStage;
  eclProvision?: number; // local currency

  /* Import lineage */
  sourceSheet?: string;
  sourceFileName?: string;
  importBatchId?: string;
  importBatchLabel?: string;

  /* FX specific properties for FCY instruments */
  purchaseFxRate?: number;
  openingFxRate?: number;

  /* Reconciliation data (uploaded manual values from grey cells) */
  uploadedManualValues?: Partial<Record<ManualValueKey, number>>;
}

export type ManualValueKey =
  | "interestReceivable"
  | "effectiveInterestRate"
  | "interestIncomeThisMonth"
  | "wht"
  | "netIncome"
  | "accruedInterestClosing"
  | "accruedInterestClosingNgn"
  | "accruedInterestClosingUsd"
  | "closingAmortisedCost"
  | "closingAmortisedCostNgn"
  | "closingAmortisedCostUsd"
  | "currentMarketBidDiscountRate"
  | "currentMarketValue"
  | "currentMarketValueNgn"
  | "currentMarketValueUsd"
  | "currentMtmGainLoss"
  | "monthlyMtmToPost"
  | "couponReceivedToDateGross"
  | "couponReceivedToDateNet"
  | "principalRepaymentThisMonth"
  | "lastMonthAccruedInterest"
  | "grossCoupon"
  | "netCoupon"
  | "totalAccruedInterest"
  | "totalCurrentMarketValue"
  | "daysEarnedInMonth"
  | "lastMonthMarketValueClean"
  | "lastMonthMarketYield"
  | "lastMonthMarketPrice"
  | "currentMarketYield"
  | "currentMarketPrice"
  | "actualCurrentMarketValueClean"
  | "thisMonthExchangeGainLoss"
  | "totalUnrealisedExchangeGainLoss"
  | "openingGainLoss"
  | "grossDividendReceived"
  | "netDividendReceived"
  | "ytdDividendReceivedNet";

/* ─── valuation engine assumptions ──────────────────────── */
export interface Assumptions {
  valuationDate: string; // ISO yyyy-mm-dd

  /* Yield curves (used for DCF if instrument lacks marketYield) */
  fgnYieldCurve: YieldCurvePoint[]; // NGN sovereign
  usdYieldCurve: YieldCurvePoint[]; // USD benchmark
  corporateSpread: number; // additional bps for corporates (decimal, e.g. 0.02)
  stateSpread: number; // additional spread for state bonds

  /* FX (snapshot rates vs NGN) */
  fxUSD: number;
  fxGBP: number;
  fxEUR: number;

  /* Tax for OCI recycling simulation */
  taxRate: number;
}

export interface YieldCurvePoint {
  tenorYears: number;
  yield: number; // fraction
}

/* ─── derived schedules / metrics ───────────────────────── */
export interface AmortRow {
  period: number;
  periodStartDate: string;
  daysBetween: number;
  date: string;
  openingBalance: number;
  eirIncome: number;
  couponCF: number;
  amortisation: number;
  closingBalance: number;
  status: "Past" | "Current" | "Future";
}

export interface CashFlowRow {
  period: number;
  date: string;
  type: "Coupon" | "Principal" | "Coupon + Principal";
  amount: number;
  daysToCF: number;
  pvOfCF: number | null;
  status: "Past" | "Current" | "Future";
}

export interface OCIRow {
  period: number;
  date: string;
  acCarryingValue: number;
  fairValueEst: number;
  ociReserve: number;
}

export interface RiskMetrics {
  remainingTenorYears: number;
  macaulayDuration: number;
  modifiedDuration: number;
  dv01: number;
  convexity: number;
  nextCouponDate: string | null;
  nextCouponAmount: number;
  daysToNextCoupon: number | null;
}

/* ─── per-instrument valuation result ───────────────────── */
export interface InstrumentValuation {
  instrument: Instrument;

  /* EIR & amortisation */
  eir: number; // fraction
  discountAtPurchase: number;
  amortSchedule: AmortRow[];
  acCarryingValue: number; // clean AC value at valuation date
  accruedInterest: number;
  totalBookValueDirty: number; // AC dirty (AC + accrued) - for AC class

  /* Cash flow PV / fair value */
  cleanFairValue: number;
  dirtyFairValue: number;
  cashFlowSchedule: CashFlowRow[];
  totalFuturePV: number;

  /* FVOCI specific */
  ociReserve: number; // FV - AC (FVOCI only)
  ociMovement: OCIRow[];

  /* FVTPL specific */
  unrealisedGL: number; // FV - purchasePrice (FVTPL)

  /* IFRS 13 / market */
  marketYieldUsed: number;
  yieldCurveLabel: string;

  /* Risk */
  risk: RiskMetrics;

  /* Income */
  annualEIRIncome: number;

  /* NGN balance sheet value (after FX) */
  balanceSheetValueNGN: number;
}

/* ─── portfolio rollups ─────────────────────────────────── */
export interface PortfolioByClassification {
  classification: Classification;
  count: number;
  faceValueNGN: number;
  bsValueNGN: number;
  eclNGN: number;
}

export interface PortfolioByType {
  type: InstrumentType;
  count: number;
  faceValueNGN: number;
  bsValueNGN: number;
}

export interface PortfolioBySector {
  sector: string;
  count: number;
  faceValueNGN: number;
  bsValueNGN: number;
  pctOfPortfolio: number;
}

export interface MaturityBucket {
  bucket: string;
  minDays: number;
  maxDays: number;
  count: number;
  faceValueNGN: number;
}

export interface TopExposure {
  rank: number;
  id: string;
  name: string;
  type: InstrumentType;
  classification: Classification;
  bsValueNGN: number;
}

export interface IncomeSummary {
  ac: {
    instruments: number;
    totalCarryingValueNGN: number;
    totalAccruedInterestNGN: number;
    totalECLNGN: number;
  };
  fvoci: {
    instruments: number;
    totalACCarryingValueNGN: number;
    totalFairValueNGN: number;
    totalOCIReserveNGN: number;
    totalECLNGN: number;
  };
  fvtpl: {
    instruments: number;
    totalFairValueNGN: number;
    totalUnrealisedGLNGN: number;
  };
}

export interface PortfolioResult {
  valuations: InstrumentValuation[];
  totals: {
    instruments: number;
    totalFaceValueNGN: number;
    totalBSValueNGN: number;
    totalECLNGN: number;
    totalOCIReserveNGN: number;
    totalFVTPLUnrealisedGLNGN: number;
  };
  byClassification: PortfolioByClassification[];
  byType: PortfolioByType[];
  bySector: PortfolioBySector[];
  maturityProfile: MaturityBucket[];
  topExposures: TopExposure[];
  income: IncomeSummary;
}
export interface ScheduleMetrics {
  totalAccruedInterest: number;
  effectiveInterestRate: number;
  thisMonthInterest: number;
  lastMonthAccruedInterest: number;
  couponReceivedToDateGross: number;
  closingAmortisedCost: number;
  currentMarketYield: number;
  totalCurrentMarketValue: number;
  currentMtmGainLoss: number;
  monthlyMtmToPost: number;
}

export interface FcyScheduleMetrics {
  totalAccruedInterestFcy: number;
  thisMonthInterestFcy: number;
  closingAmortisedCostFcy: number;
  closingAmortisedCostBase: number;
  thisMonthUnrealisedFxGainLoss: number;
  totalUnrealisedFxGainLoss: number;
  totalCurrentMarketValueBase: number;
}
