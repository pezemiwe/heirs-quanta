import { VALUATION_DATE, MS_PER_YEAR } from "./config";

export function yearsSince(purchaseDateStr: string): number {
  const val = new Date(VALUATION_DATE + "T00:00:00Z").getTime();
  const pur = new Date(purchaseDateStr + "T00:00:00Z").getTime();
  return Math.max((val - pur) / MS_PER_YEAR, 0.001);
}

export function yearsToMaturity(maturityDateStr: string | null): number {
  if (!maturityDateStr) return 5;
  const val = new Date(VALUATION_DATE + "T00:00:00Z").getTime();
  const mat = new Date(maturityDateStr + "T00:00:00Z").getTime();
  return Math.max((mat - val) / MS_PER_YEAR, 0);
}
