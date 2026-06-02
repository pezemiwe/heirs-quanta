import {
  BOOK_INSTRUMENTS,
  BOOK_COMPUTED,
  BOOK_VALUATIONS,
  fmtCompact,
  fmtPct,
} from "../../../../features/portfolio/engine/book-compute";
import type { VarMetric, ConcentrationItem, StressScenario } from "./types";

// -- real computed risk metrics ------------------------------------------------
const vals = BOOK_VALUATIONS;
const totals = BOOK_COMPUTED.totals;
const bySector = BOOK_COMPUTED.bySector;

export const totalBSV = totals.totalBSValueNGN;
export const totalDV01 = vals.reduce((s, v) => s + v.risk.dv01, 0);
export const wDur =
  vals.reduce(
    (s, v) => s + v.risk.modifiedDuration * v.balanceSheetValueNGN,
    0,
  ) / (totalBSV || 1);

// 1-day VaR approx: DV01 × 25bps shock (1-day 95%)
const varDay95 = Math.abs(totalDV01) * 25;
const varDay99 = varDay95 * 1.54;
const var10Day95 = varDay95 * Math.sqrt(10);
const cvar95 = varDay95 * 1.43;

export const VAR_METRICS: VarMetric[] = [
  {
    label: "1-Day VaR (95%)",
    value: fmtCompact(varDay95),
    pct: fmtPct(varDay95 / totalBSV),
    status: varDay95 / totalBSV > 0.015 ? "watch" : "normal",
  },
  {
    label: "1-Day VaR (99%)",
    value: fmtCompact(varDay99),
    pct: fmtPct(varDay99 / totalBSV),
    status: varDay99 / totalBSV > 0.02 ? "watch" : "normal",
  },
  {
    label: "10-Day VaR (95%)",
    value: fmtCompact(var10Day95),
    pct: fmtPct(var10Day95 / totalBSV),
    status:
      var10Day95 / totalBSV > 0.04
        ? "breached"
        : var10Day95 / totalBSV > 0.03
          ? "watch"
          : "normal",
  },
  {
    label: "Expected Shortfall (CVaR 95%)",
    value: fmtCompact(cvar95),
    pct: fmtPct(cvar95 / totalBSV),
    status: "normal",
  },
];

// Top-5 issuer concentration
const issuerMap = new Map<string, number>();
BOOK_INSTRUMENTS.forEach((inst, i) => {
  const bsv = vals[i]?.balanceSheetValueNGN ?? 0;
  issuerMap.set(inst.issuer, (issuerMap.get(inst.issuer) ?? 0) + bsv);
});
export const sortedIssuers = [...issuerMap.entries()].sort(
  (a, b) => b[1] - a[1],
);
const top5BSV = sortedIssuers.slice(0, 5).reduce((s, [, v]) => s + v, 0);
const top10BSV = sortedIssuers.slice(0, 10).reduce((s, [, v]) => s + v, 0);
const topIssuer = sortedIssuers[0];
const topSector = bySector[0];
const ngnBSV = BOOK_INSTRUMENTS.reduce(
  (s, inst, i) =>
    inst.currency === "NGN" ? s + (vals[i]?.balanceSheetValueNGN ?? 0) : s,
  0,
);

export const CONCENTRATION: ConcentrationItem[] = [
  {
    label: "Top 5 holdings as % of portfolio",
    value: fmtPct(top5BSV / totalBSV),
    limit: "35%",
    status:
      top5BSV / totalBSV > 0.35
        ? "breached"
        : top5BSV / totalBSV > 0.3
          ? "watch"
          : "ok",
  },
  {
    label: "Top 10 holdings as % of portfolio",
    value: fmtPct(top10BSV / totalBSV),
    limit: "60%",
    status:
      top10BSV / totalBSV > 0.6
        ? "breached"
        : top10BSV / totalBSV > 0.5
          ? "watch"
          : "ok",
  },
  {
    label: `Single issuer limit (${topIssuer[0].slice(0, 30)})`,
    value: fmtPct(topIssuer[1] / totalBSV),
    limit: "10%",
    status:
      topIssuer[1] / totalBSV > 0.1
        ? "breached"
        : topIssuer[1] / totalBSV > 0.08
          ? "watch"
          : "ok",
  },
  {
    label: `Single sector limit (${topSector?.sector ?? "—"})`,
    value: fmtPct(topSector?.pctOfPortfolio ?? 0),
    limit: "30%",
    status:
      (topSector?.pctOfPortfolio ?? 0) > 0.3
        ? "breached"
        : (topSector?.pctOfPortfolio ?? 0) > 0.25
          ? "watch"
          : "ok",
  },
  {
    label: "Single currency (NGN)",
    value: fmtPct(ngnBSV / totalBSV),
    limit: "80%",
    status:
      ngnBSV / totalBSV > 0.8
        ? "breached"
        : ngnBSV / totalBSV > 0.7
          ? "watch"
          : "ok",
  },
];

// Stage distribution
export const stage1 = BOOK_INSTRUMENTS.filter(
  (i) => i.impairmentStage === "Stage 1",
).length;
export const stage2 = BOOK_INSTRUMENTS.filter(
  (i) => i.impairmentStage === "Stage 2",
).length;
export const stage3 = BOOK_INSTRUMENTS.filter(
  (i) => i.impairmentStage === "Stage 3",
).length;

export const STRESS: StressScenario[] = [
  {
    scenario: "2008 Global Financial Crisis",
    impact: fmtCompact(-totalBSV * 0.045),
    pct: "-4.5%",
    severity: "high",
  },
  {
    scenario: "2016 Nigeria Recession",
    impact: fmtCompact(-totalBSV * 0.035),
    pct: "-3.5%",
    severity: "medium",
  },
  {
    scenario: "Oil Price Crash (-50%)",
    impact: fmtCompact(-totalBSV * 0.027),
    pct: "-2.7%",
    severity: "medium",
  },
  {
    scenario: "NGN Devaluation (-30%)",
    impact: fmtCompact(-totalBSV * 0.022),
    pct: "-2.2%",
    severity: "low",
  },
  {
    scenario: `CBN Rate Hike (+300bps): DV01×300`,
    impact: fmtCompact(-Math.abs(totalDV01) * 300),
    pct: fmtPct((-Math.abs(totalDV01) * 300) / totalBSV),
    severity: "medium",
  },
];

export const totalECLNGN = totals.totalECLNGN;
export const bookInstrumentsLength = BOOK_INSTRUMENTS.length;
export { fmtCompact, fmtPct };
