import type { Assumptions } from "../types";
/* ──────────────────────────────────────────────────────────────
   DEFAULT FLI OVERLAYS (60-month vectors per scenario)
   For demo purposes: smoothly ramps between a starting overlay and 1.0
   ────────────────────────────────────────────────────────────── */
const buildOverlay = (start: number): number[] =>
  Array.from({ length: 60 }, (_, i) => {
    const t = i / 59;
    return Number((start + (1 - start) * t).toFixed(4));
  });

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  reportingDate: new Date(2022, 11, 31), // 31 Dec 2022 — matches the sample portfolio
  sovereignRecoveryRate: 0.53,
  baseline: buildOverlay(1.0), // multiplier of 1× through horizon
  bestCase: buildOverlay(0.85), // starts 15% lower, rises to 1
  worseCase: buildOverlay(1.2), // starts 20% higher, falls to 1
  weights: {
    baseline: 0.5,
    bestCase: 0.25,
    worseCase: 0.25,
  },
};

