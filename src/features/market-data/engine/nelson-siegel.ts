import type { NelsonSiegelParams, YieldCurvePoint } from "./types";

/* ─── Nelson-Siegel ──────────────────────────────────────────────────── */

export function nsYield(p: NelsonSiegelParams, t: number): number {
  if (t <= 0) return p.beta0 + p.beta1;
  const x = t / p.tau;
  const e = Math.exp(-x);
  const factor = (1 - e) / x;
  return p.beta0 + p.beta1 * factor + p.beta2 * (factor - e);
}

/**
 * Crude NS fit: grid search over (beta1, beta2, tau), beta0 = long-end yield.
 * Good enough for visualization; avoids pulling in scipy-equivalent.
 */
export function fitNelsonSiegel(points: YieldCurvePoint[]): NelsonSiegelParams {
  const sorted = [...points].sort((a, b) => a.tenor - b.tenor);
  const beta0 = sorted[sorted.length - 1].yield;
  const shortY = sorted[0].yield;
  let best: NelsonSiegelParams = {
    beta0,
    beta1: shortY - beta0,
    beta2: 0,
    tau: 2,
  };
  let bestErr = Infinity;
  const taus = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 7];
  const b1s = Array.from({ length: 11 }, (_, i) => -0.1 + i * 0.02);
  const b2s = Array.from({ length: 11 }, (_, i) => -0.1 + i * 0.02);
  for (const tau of taus) {
    for (const b1 of b1s) {
      for (const b2 of b2s) {
        const p: NelsonSiegelParams = { beta0, beta1: b1, beta2: b2, tau };
        let err = 0;
        for (const pt of sorted) {
          const d = nsYield(p, pt.tenor) - pt.yield;
          err += d * d;
        }
        if (err < bestErr) {
          bestErr = err;
          best = p;
        }
      }
    }
  }
  return best;
}
