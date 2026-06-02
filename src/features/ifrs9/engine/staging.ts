import type { Security, Stage } from "./types";
import { MS_PER_DAY, monthsBetween } from "./date-utils";

export function computeTTM(s: Security, reportingDate: Date): number {
  const months = monthsBetween(reportingDate, s.maturityDate);
  return Math.max(0, months);
}

export function computeMEIR(s: Security): number {
  const eir = s.eir >= 1 ? s.eir / 100 : s.eir;
  return eir / 12;
}

export function computeMCIR(s: Security): number {
  const c = s.couponRate >= 1 ? s.couponRate / 100 : s.couponRate;
  return c / 12;
}

export function computeLCD(s: Security, reportingDate: Date): number {
  if (!s.lastCouponDate) return 0;
  const m = monthsBetween(s.lastCouponDate, reportingDate);
  return Math.max(0, m);
}

export function computeDPDStage(dpd: number): Stage {
  if (dpd <= 30) return 1;
  if (dpd < 90) return 2;
  return 3;
}

export function computePerformanceStage(
  p: Security["performanceStatus"],
): Stage {
  const letter = p.charAt(0).toUpperCase();
  if (letter === "P") return 1;
  if (letter === "W") return 2;
  return 3;
}

export function computeExpiryStage(
  maturity: Date,
  reportingDate: Date,
): Stage | null {
  const threshold = new Date(reportingDate.getTime() + 90 * MS_PER_DAY);
  if (maturity.getTime() <= threshold.getTime()) return 3;
  return null;
}

export function computeModelStage(
  dpd: Stage,
  perf: Stage,
  exp: Stage | null,
): Stage {
  return Math.max(dpd, perf, exp ?? 0) as Stage;
}

export function computeFinalStage(model: Stage, override: number): Stage {
  if (override && override >= 1 && override <= 3) return override as Stage;
  return model;
}
