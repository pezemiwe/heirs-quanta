import type { AllocationTarget } from "../types";

export const TARGETS: AllocationTarget[] = [
  { assetClass: "Private Equity", targetPct: 42, limitPct: 55 },
  { assetClass: "Equity", targetPct: 19, limitPct: 30 },
  { assetClass: "Fixed Income", targetPct: 14, limitPct: 25 },
  { assetClass: "Real Estate", targetPct: 14, limitPct: 20 },
  { assetClass: "Cash", targetPct: 4, limitPct: 15 },
  { assetClass: "Alternatives", targetPct: 5, limitPct: 12 },
];
