import { PARALLEL_SHOCKS_BPS } from "./reference-data";
import type {
  ConvexityCurvePoint,
  DurationHistogramRow,
  DurationRow,
  StressRow,
} from "./types";

const HIST_BUCKETS: { label: string; max: number }[] = [
  { label: "0-6M", max: 0.5 },
  { label: "6M-1Y", max: 1.0 },
  { label: "1-2Y", max: 2.0 },
  { label: "2-3Y", max: 3.0 },
  { label: "3-5Y", max: 5.0 },
  { label: "5-7Y", max: 7.0 },
  { label: "7-10Y", max: 10.0 },
  { label: "10-15Y", max: 15.0 },
  { label: "15Y+", max: Infinity },
];

export function buildDurationHistogram(
  durationRows: DurationRow[],
): DurationHistogramRow[] {
  const counts: Record<string, number> = {};
  for (const b of HIST_BUCKETS) counts[b.label] = 0;
  for (const r of durationRows) {
    const b = HIST_BUCKETS.find((h) => r.modifiedDur <= h.max);
    if (b) counts[b.label]++;
  }
  return HIST_BUCKETS.map((b) => ({ bucket: b.label, count: counts[b.label] }));
}

export function buildConvexityCurve(
  stressRows: StressRow[],
): ConvexityCurvePoint[] {
  const baseNGN = stressRows.reduce((s, r) => s + r.baseValueNGN, 0);
  return PARALLEL_SHOCKS_BPS.map((bps) => {
    const val =
      bps === 0
        ? baseNGN
        : stressRows.reduce(
            (s, r) => s + (r.shockValues[bps] ?? r.baseValueNGN),
            0,
          );
    return {
      shock: bps,
      portfolioNGN: val,
      pct: baseNGN > 0 ? ((val - baseNGN) / baseNGN) * 100 : 0,
    };
  });
}
