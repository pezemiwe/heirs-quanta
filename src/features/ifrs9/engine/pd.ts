import type { Assumptions, AssetSpecification } from "./types";
import {
  MOODY_PD_CUM,
  SP_SOV_FCY_PD_CUM,
  SP_SOV_LCY_PD_CUM,
} from "./reference-data";

function cumulativeToMarginal(cumPct: number[]): number[] {
  const marginal: number[] = [];
  for (let i = 0; i < cumPct.length; i++) {
    const cur = cumPct[i] / 100;
    const prev = i === 0 ? 0 : cumPct[i - 1] / 100;
    marginal.push(Math.max(0, cur - prev));
  }
  return marginal;
}

function yearlyToMonthly(yearlyMarginal: number[]): number[] {
  const months: number[] = [];
  for (const y of yearlyMarginal) {
    const m = 1 - Math.pow(1 - Math.min(0.999999, Math.max(0, y)), 1 / 12);
    for (let k = 0; k < 12; k++) months.push(m);
  }
  return months;
}

export function buildPDTermStructure(
  cumulativePct: number[],
  assumptions: Assumptions,
): number[] {
  const marginal = cumulativeToMarginal(cumulativePct);
  const monthly = yearlyToMonthly(marginal);

  const flatAt = (overlay: number[], m: number) =>
    overlay[Math.min(m, overlay.length - 1)] ?? 1;

  const scenarioWeighted: number[] = monthly.map((p, m) => {
    const base = p * flatAt(assumptions.baseline, m);
    const best = p * flatAt(assumptions.bestCase, m);
    const worse = p * flatAt(assumptions.worseCase, m);
    return (
      base * assumptions.weights.baseline +
      best * assumptions.weights.bestCase +
      worse * assumptions.weights.worseCase
    );
  });

  const out: number[] = [];
  let survival = 1;
  for (let m = 0; m < scenarioWeighted.length; m++) {
    const p = Math.min(0.999999, Math.max(0, scenarioWeighted[m]));
    out.push(survival * p);
    survival *= 1 - p;
  }
  return out;
}

export function pdTableFor(spec: AssetSpecification): Record<string, number[]> {
  if (spec === "Corporate") return MOODY_PD_CUM;
  if (spec === "Sovereign FCY") return SP_SOV_FCY_PD_CUM;
  return SP_SOV_LCY_PD_CUM;
}
