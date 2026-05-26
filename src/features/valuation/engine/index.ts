import type {
  Asset,
  AssetValuation,
  Assumptions,
  ComparableResult,
  DCFProjection,
  EngineResult,
  IFRS13Level,
  ValuationMethod,
} from "./types";

/* ───────────────────────────────────────────────────────────
   WACC build-up — uses Modigliani re-leveraged cost of equity
   ─────────────────────────────────────────────────────────── */
export function computeWACC(a: Assumptions, beta = 1): number {
  const costOfEquity =
    a.riskFreeRate +
    beta * a.equityRiskPremium +
    a.countryRiskPremium +
    a.sizePremium;
  const afterTaxCostOfDebt = a.costOfDebt * (1 - a.taxRate);
  const we = 1 - a.targetDebtRatio;
  const wd = a.targetDebtRatio;
  return we * costOfEquity + wd * afterTaxCostOfDebt;
}

/* ───────────────────────────────────────────────────────────
   DCF — explicit projection + Gordon Growth terminal value
   Returns enterprise value and attributable equity value
   ─────────────────────────────────────────────────────────── */
export function runDCF(asset: Asset, a: Assumptions): DCFProjection | null {
  if (asset.freeCashFlowYear1 == null) return null;

  const wacc = computeWACC(a, asset.beta ?? 1);
  const years = asset.projectionYears ?? 5;
  const g = asset.growthRate ?? 0.08;
  const tg = asset.terminalGrowth ?? 0.03;

  const yearArr: number[] = [];
  const fcfs: number[] = [];
  const discountFactors: number[] = [];
  const presentValues: number[] = [];

  let fcf = asset.freeCashFlowYear1;
  for (let t = 1; t <= years; t++) {
    if (t > 1) fcf = fcf * (1 + g);
    const df = 1 / Math.pow(1 + wacc, t);
    yearArr.push(t);
    fcfs.push(fcf);
    discountFactors.push(df);
    presentValues.push(fcf * df);
  }

  /* terminal value via Gordon Growth */
  const terminalFCF = fcfs[fcfs.length - 1] * (1 + tg);
  const terminalValue = wacc > tg ? terminalFCF / (wacc - tg) : 0;
  const terminalPV = terminalValue / Math.pow(1 + wacc, years);

  const explicitPV = presentValues.reduce((s, v) => s + v, 0);
  const enterpriseValue = explicitPV + terminalPV;
  const equityValueAttributable = enterpriseValue * (asset.holdingPct / 100);

  return {
    assetId: asset.id,
    wacc,
    years: yearArr,
    fcfs,
    discountFactors,
    presentValues,
    terminalValue,
    terminalPV,
    explicitPV,
    enterpriseValue,
    equityValueAttributable,
  };
}

/* ───────────────────────────────────────────────────────────
   Comparable multiples — applies P/E, EV/EBITDA, P/B, P/S
   Returns attributable equity value (already × holdingPct)
   ─────────────────────────────────────────────────────────── */
export function runComparables(asset: Asset, a: Assumptions): ComparableResult {
  const pct = asset.holdingPct / 100;
  const fromPE =
    asset.netIncome != null ? asset.netIncome * a.peMultiple * pct : null;
  const fromEvEbitda =
    asset.ebitda != null ? asset.ebitda * a.evEbitdaMultiple * pct : null;
  const fromPB =
    asset.bookValue != null ? asset.bookValue * a.pbMultiple * pct : null;
  const fromPS =
    asset.revenue != null ? asset.revenue * a.psMultiple * pct : null;

  const vals = [fromPE, fromEvEbitda, fromPB, fromPS].filter(
    (v): v is number => v != null,
  );
  const average = vals.length
    ? vals.reduce((s, v) => s + v, 0) / vals.length
    : 0;

  return {
    assetId: asset.id,
    fromPE,
    fromEvEbitda,
    fromPB,
    fromPS,
    average,
  };
}

/* ───────────────────────────────────────────────────────────
   Bond pricing — PV of coupons + face value
   ─────────────────────────────────────────────────────────── */
export function priceBond(asset: Asset): number {
  if (
    asset.faceValue == null ||
    asset.couponRate == null ||
    asset.yearsToMaturity == null ||
    asset.ytm == null
  ) {
    return asset.carryingValue;
  }
  const n = (asset.paymentsPerYear ?? 2) * asset.yearsToMaturity;
  const r = asset.ytm / (asset.paymentsPerYear ?? 2);
  const coupon =
    (asset.faceValue * asset.couponRate) / (asset.paymentsPerYear ?? 2);
  let pv = 0;
  for (let t = 1; t <= n; t++) pv += coupon / Math.pow(1 + r, t);
  pv += asset.faceValue / Math.pow(1 + r, n);
  return pv;
}

/* ───────────────────────────────────────────────────────────
   Real estate — income capitalization
   ─────────────────────────────────────────────────────────── */
export function valueRealEstate(asset: Asset, a: Assumptions): number {
  if (asset.noi == null) return asset.carryingValue;
  const cap = asset.capRate ?? a.defaultCapRate;
  if (cap <= 0) return asset.carryingValue;
  return asset.noi / cap;
}

/* ───────────────────────────────────────────────────────────
   Listed equity — market price × shares
   ─────────────────────────────────────────────────────────── */
export function valueMarket(asset: Asset, a: Assumptions): number {
  if (asset.sharesHeld == null || asset.lastPrice == null)
    return asset.carryingValue;
  const native = asset.sharesHeld * asset.lastPrice;
  const fx =
    asset.currency === "USD"
      ? a.fxUSD
      : asset.currency === "GBP"
        ? a.fxGBP
        : asset.currency === "EUR"
          ? a.fxEUR
          : 1;
  // Convert kobo amount to millions (sharesHeld × price assumed kobo-clean already in NGN)
  return (native * fx) / 1_000_000;
}

/* ───────────────────────────────────────────────────────────
   Per-asset orchestration — choose primary method + range
   ─────────────────────────────────────────────────────────── */
function classifyLevel(method: ValuationMethod): IFRS13Level {
  if (method === "Market Price") return "Level 1";
  if (method === "Discounted Cash Flow (Bond)" || method === "Par Value")
    return "Level 2";
  return "Level 3";
}

export function valueAsset(asset: Asset, a: Assumptions): AssetValuation {
  let method: ValuationMethod = "DCF";
  let fairValue = 0;
  let fairValueLow = 0;
  let fairValueHigh = 0;
  let dcf: DCFProjection | undefined;
  let comparable: ComparableResult | undefined;
  let notes = "";

  switch (asset.type) {
    case "subsidiary":
    case "equity_unlisted":
    case "joint_venture": {
      dcf = runDCF(asset, a) ?? undefined;
      comparable = runComparables(asset, a);
      method = "DCF";
      const dcfVal = dcf?.equityValueAttributable ?? asset.carryingValue;
      const cmpVal = comparable.average || dcfVal;
      // 70/30 weighting DCF vs comparables
      fairValue = dcfVal * 0.7 + cmpVal * 0.3;
      fairValueLow = Math.min(dcfVal, cmpVal) * 0.92;
      fairValueHigh = Math.max(dcfVal, cmpVal) * 1.08;
      notes = `Primary DCF @ WACC ${((dcf?.wacc ?? 0) * 100).toFixed(1)}%, cross-check via comparables.`;
      break;
    }
    case "equity_listed": {
      method = "Market Price";
      const mkt = valueMarket(asset, a);
      comparable = runComparables(asset, a);
      fairValue = mkt;
      fairValueLow = mkt * 0.95;
      fairValueHigh = mkt * 1.05;
      notes = `Marked at NSE close on ${asset.marketSnapshotDate ?? "snapshot date"}.`;
      break;
    }
    case "real_estate": {
      method = "Income Capitalization";
      const rev = valueRealEstate(asset, a);
      fairValue = rev;
      fairValueLow = rev * 0.92;
      fairValueHigh = rev * 1.1;
      notes = `NOI / cap rate (${((asset.capRate ?? a.defaultCapRate) * 100).toFixed(2)}%).`;
      break;
    }
    case "bond": {
      method = "Discounted Cash Flow (Bond)";
      const bp = priceBond(asset);
      fairValue = bp;
      fairValueLow = bp * 0.985;
      fairValueHigh = bp * 1.015;
      notes = `PV of coupons + face @ YTM ${((asset.ytm ?? 0) * 100).toFixed(2)}%.`;
      break;
    }
    case "tbill": {
      method = "Par Value";
      fairValue = asset.carryingValue;
      fairValueLow = asset.carryingValue * 0.999;
      fairValueHigh = asset.carryingValue * 1.001;
      notes = "Short-dated, held at amortised cost / par.";
      break;
    }
    case "pe_fund": {
      method = "Net Asset Value";
      const nav = asset.reportedNav ?? asset.carryingValue;
      fairValue = nav;
      fairValueLow = nav * 0.85;
      fairValueHigh = nav * 1.15;
      notes = "Latest reported NAV from GP capital account statement.";
      break;
    }
  }

  const uplift = fairValue - asset.carryingValue;
  const upliftPct = asset.carryingValue > 0 ? uplift / asset.carryingValue : 0;
  const ifrs13Level = classifyLevel(method);

  return {
    assetId: asset.id,
    method,
    fairValue,
    fairValueLow,
    fairValueHigh,
    ifrs13Level,
    uplift,
    upliftPct,
    dcf,
    comparable,
    notes,
  };
}

/* ───────────────────────────────────────────────────────────
   Portfolio engine
   ─────────────────────────────────────────────────────────── */
export function runEngine(assets: Asset[], a: Assumptions): EngineResult {
  const valuations = assets.map((asset) => valueAsset(asset, a));

  const totalCarryingValue = assets.reduce((s, x) => s + x.carryingValue, 0);
  const totalFairValue = valuations.reduce((s, v) => s + v.fairValue, 0);
  const totalFairValueLow = valuations.reduce((s, v) => s + v.fairValueLow, 0);
  const totalFairValueHigh = valuations.reduce(
    (s, v) => s + v.fairValueHigh,
    0,
  );
  const totalUplift = totalFairValue - totalCarryingValue;
  const totalUpliftPct =
    totalCarryingValue > 0 ? totalUplift / totalCarryingValue : 0;

  const level1Total = valuations
    .filter((v) => v.ifrs13Level === "Level 1")
    .reduce((s, v) => s + v.fairValue, 0);
  const level2Total = valuations
    .filter((v) => v.ifrs13Level === "Level 2")
    .reduce((s, v) => s + v.fairValue, 0);
  const level3Total = valuations
    .filter((v) => v.ifrs13Level === "Level 3")
    .reduce((s, v) => s + v.fairValue, 0);

  /* aggregate by type */
  const typeMap = new Map<
    string,
    { carrying: number; fair: number; count: number }
  >();
  assets.forEach((asset, i) => {
    const v = valuations[i];
    const cur = typeMap.get(asset.type) ?? { carrying: 0, fair: 0, count: 0 };
    cur.carrying += asset.carryingValue;
    cur.fair += v.fairValue;
    cur.count += 1;
    typeMap.set(asset.type, cur);
  });
  const byType = Array.from(typeMap.entries()).map(([type, v]) => ({
    type: type as Asset["type"],
    ...v,
  }));

  /* aggregate by sector */
  const sectorMap = new Map<
    string,
    { carrying: number; fair: number; count: number }
  >();
  assets.forEach((asset, i) => {
    const v = valuations[i];
    const cur = sectorMap.get(asset.sector) ?? {
      carrying: 0,
      fair: 0,
      count: 0,
    };
    cur.carrying += asset.carryingValue;
    cur.fair += v.fairValue;
    cur.count += 1;
    sectorMap.set(asset.sector, cur);
  });
  const bySector = Array.from(sectorMap.entries()).map(([sector, v]) => ({
    sector,
    ...v,
  }));

  return {
    valuations,
    totalCarryingValue,
    totalFairValue,
    totalFairValueLow,
    totalFairValueHigh,
    totalUplift,
    totalUpliftPct,
    level1Total,
    level2Total,
    level3Total,
    byType,
    bySector,
  };
}

/* ───────────────────────────────────────────────────────────
   Sensitivity — vary one assumption at a time, return % impact
   ─────────────────────────────────────────────────────────── */
export interface SensitivityRow {
  driver: string;
  low: number;
  base: number;
  high: number;
  swing: number;
}

export function runSensitivity(
  assets: Asset[],
  base: Assumptions,
): SensitivityRow[] {
  const baseResult = runEngine(assets, base).totalFairValue;

  function flex(field: keyof Assumptions, delta: number) {
    const v = base[field];
    if (typeof v !== "number") return { low: baseResult, high: baseResult };
    return {
      low: runEngine(assets, { ...base, [field]: v - delta }).totalFairValue,
      high: runEngine(assets, { ...base, [field]: v + delta }).totalFairValue,
    };
  }

  const rows: SensitivityRow[] = [
    {
      driver: "Risk-Free Rate (±1.5%)",
      ...flex("riskFreeRate", 0.015),
      base: baseResult,
      swing: 0,
    },
    {
      driver: "Equity Risk Premium (±1%)",
      ...flex("equityRiskPremium", 0.01),
      base: baseResult,
      swing: 0,
    },
    {
      driver: "Country Risk Premium (±1%)",
      ...flex("countryRiskPremium", 0.01),
      base: baseResult,
      swing: 0,
    },
    {
      driver: "EV/EBITDA Multiple (±1.0x)",
      ...flex("evEbitdaMultiple", 1.0),
      base: baseResult,
      swing: 0,
    },
    {
      driver: "P/E Multiple (±1.0x)",
      ...flex("peMultiple", 1.0),
      base: baseResult,
      swing: 0,
    },
    {
      driver: "Default Cap Rate (±0.5%)",
      ...flex("defaultCapRate", 0.005),
      base: baseResult,
      swing: 0,
    },
    {
      driver: "Cost of Debt (±1%)",
      ...flex("costOfDebt", 0.01),
      base: baseResult,
      swing: 0,
    },
  ];
  rows.forEach((r) => (r.swing = Math.abs(r.high - r.low)));
  return rows.sort((a, b) => b.swing - a.swing);
}
