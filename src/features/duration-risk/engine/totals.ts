import type { DurationMap, DurationRow, RiskTotals, StressRow } from "./types";
import { weightedAvg } from "./helpers";

export function computeRiskTotals(
  durationRows: DurationRow[],
  stressRows: StressRow[],
): RiskTotals {
  const w = durationRows.map((d) => d.bsValueNGN);
  return {
    instruments: durationRows.length,
    totalBSValueNGN: durationRows.reduce((s, d) => s + d.bsValueNGN, 0),
    totalDV01: durationRows.reduce((s, d) => s + d.dv01NGN, 0),
    wtdMacaulayDur: weightedAvg(
      durationRows.map((d) => d.macaulayDur),
      w,
    ),
    wtdModifiedDur: weightedAvg(
      durationRows.map((d) => d.modifiedDur),
      w,
    ),
    wtdConvexity: weightedAvg(
      durationRows.map((d) => d.convexity),
      w,
    ),
    ir100bp: stressRows.reduce((s, r) => s + (r.pnl[100] ?? 0), 0),
    ir200bp: stressRows.reduce((s, r) => s + (r.pnl[200] ?? 0), 0),
  };
}

export function indexById(rows: DurationRow[]): DurationMap {
  const out: DurationMap = {};
  for (const r of rows) out[r.id] = r;
  return out;
}
