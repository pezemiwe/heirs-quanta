import type { Assumptions, Instrument } from "../../valuation/engine/types";
import {
  buildCashFlowSchedule,
  fxRate,
  parseDate,
} from "../../valuation/engine";
import {
  CASHFLOW_EXCLUDED_TYPES,
  MATURITY_BUCKETS_ORDER,
} from "./reference-data";
import type { CashflowBucketRow } from "./types";
import { dateBucket } from "./helpers";

export function buildCashflowProjection(
  instruments: Instrument[],
  assumptions: Assumptions,
): CashflowBucketRow[] {
  const valDate = parseDate(assumptions.valuationDate);
  const buckets: Record<string, { coupon: number; principal: number }> = {};
  for (const b of MATURITY_BUCKETS_ORDER)
    buckets[b] = { coupon: 0, principal: 0 };

  for (const inst of instruments) {
    if (CASHFLOW_EXCLUDED_TYPES.has(inst.instrumentType)) continue;
    const maturity = parseDate(inst.maturityDate);
    if (maturity.getTime() <= valDate.getTime()) continue;

    const fx = fxRate(inst.currency, assumptions);
    const { rows } = buildCashFlowSchedule(
      inst,
      valDate,
      inst.marketYield ?? inst.couponRate ?? 0.18,
    );

    for (const cf of rows) {
      if (cf.status !== "Future") continue;
      const cfDate = parseDate(cf.date);
      const days = Math.round(
        (cfDate.getTime() - valDate.getTime()) / 86_400_000,
      );
      const b = dateBucket(days);
      if (!buckets[b]) continue;

      if (cf.type === "Principal") {
        buckets[b].principal += cf.amount * fx;
      } else if (cf.type === "Coupon + Principal") {
        buckets[b].principal += inst.faceValue * fx;
        buckets[b].coupon += (cf.amount - inst.faceValue) * fx;
      } else {
        buckets[b].coupon += cf.amount * fx;
      }
    }
  }

  return MATURITY_BUCKETS_ORDER.map((b) => ({
    bucket: b,
    coupon: buckets[b].coupon,
    principal: buckets[b].principal,
    total: buckets[b].coupon + buckets[b].principal,
  }));
}
