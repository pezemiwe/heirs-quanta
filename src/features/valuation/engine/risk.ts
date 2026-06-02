import type { CashFlowRow, Instrument, RiskMetrics } from "./types";
import { parseDate, yearsBetween } from "./date-helpers";

export function riskMetrics(
  inst: Instrument,
  rows: CashFlowRow[],
  marketYield: number,
  valuationDate: Date,
  fairValue: number,
): RiskMetrics {
  const future = rows.filter((r) => r.status === "Future" && r.pvOfCF != null);
  let mac = 0;
  let convex = 0;
  for (const r of future) {
    const t = r.daysToCF / 365.25;
    mac += t * (r.pvOfCF || 0);
    convex += t * (t + 1) * (r.pvOfCF || 0);
  }
  const macaulay = fairValue > 0 ? mac / fairValue : 0;
  const modified = macaulay / (1 + marketYield);
  const convexity =
    fairValue > 0 ? convex / (fairValue * Math.pow(1 + marketYield, 2)) : 0;
  const dv01 = modified * fairValue * 0.0001;

  const maturity = parseDate(inst.maturityDate);
  const remaining = yearsBetween(valuationDate, maturity);

  const nextCF = future.find((r) => r.type !== "Principal");
  const nextCouponDate = nextCF ? nextCF.date : null;
  const nextCouponAmount = nextCF
    ? nextCF.type === "Coupon + Principal"
      ? nextCF.amount - inst.faceValue
      : nextCF.amount
    : 0;
  const daysToNext = nextCF ? nextCF.daysToCF : null;

  return {
    remainingTenorYears: remaining,
    macaulayDuration: macaulay,
    modifiedDuration: modified,
    dv01,
    convexity,
    nextCouponDate,
    nextCouponAmount,
    daysToNextCoupon: daysToNext,
  };
}
