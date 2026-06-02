import type { ByGroupRow, DurationRow } from "./types";
import { weightedAvg } from "./helpers";

function rollupBy(
  rows: DurationRow[],
  key: (r: DurationRow) => string,
): ByGroupRow[] {
  const groups: Record<string, DurationRow[]> = {};
  for (const r of rows) {
    const k = key(r);
    (groups[k] = groups[k] ?? []).push(r);
  }
  return Object.entries(groups)
    .map(([group, items]) => {
      const w = items.map((i) => i.bsValueNGN);
      return {
        group,
        count: items.length,
        wtdMacaulay: weightedAvg(
          items.map((i) => i.macaulayDur),
          w,
        ),
        wtdModified: weightedAvg(
          items.map((i) => i.modifiedDur),
          w,
        ),
        wtdConvexity: weightedAvg(
          items.map((i) => i.convexity),
          w,
        ),
        totalDV01: items.reduce((s, i) => s + i.dv01NGN, 0),
        totalBSValueNGN: items.reduce((s, i) => s + i.bsValueNGN, 0),
      };
    })
    .sort((a, b) => b.totalDV01 - a.totalDV01);
}

export function rollupBySector(rows: DurationRow[]): ByGroupRow[] {
  return rollupBy(rows, (r) => r.sector);
}

export function rollupByType(rows: DurationRow[]): ByGroupRow[] {
  return rollupBy(rows, (r) => r.type);
}

export function rollupByClassification(rows: DurationRow[]): ByGroupRow[] {
  return rollupBy(rows, (r) => r.classification);
}
