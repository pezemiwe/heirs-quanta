import type { Assumptions, Instrument, InstrumentValuation } from "./types";
import { parseDate, yearsBetween } from "./date-helpers";
import {
  accruedInterest,
  buildAmortSchedule,
  interpolatedCarryingValue,
} from "./amortisation";
import { buildCashFlowSchedule, buildOCIMovement } from "./cash-flow";
import { fxRate, interpolateYield, pickYieldCurve } from "./yield-curve";
import { riskMetrics } from "./risk";

export function valueInstrument(
  inst: Instrument,
  assumptions: Assumptions,
): InstrumentValuation {
  const valDate = parseDate(assumptions.valuationDate);
  const purchaseDate = parseDate(inst.purchaseDate);
  const maturity = parseDate(inst.maturityDate);

  if (inst.instrumentType === "Equity") {
    const fv = inst.marketPrice ?? inst.purchasePrice;
    const fx = fxRate(inst.currency, assumptions);
    return {
      instrument: inst,
      eir: 0,
      discountAtPurchase: 0,
      amortSchedule: [],
      acCarryingValue: fv,
      accruedInterest: 0,
      totalBookValueDirty: fv,
      cleanFairValue: fv,
      dirtyFairValue: fv,
      cashFlowSchedule: [],
      totalFuturePV: fv,
      ociReserve: fv - inst.purchasePrice,
      ociMovement: [],
      unrealisedGL: fv - inst.purchasePrice,
      marketYieldUsed: 0,
      yieldCurveLabel: "Market Price (Equity)",
      annualEIRIncome: 0,
      risk: {
        remainingTenorYears: 0,
        macaulayDuration: 0,
        modifiedDuration: 0,
        dv01: 0,
        convexity: 0,
        nextCouponDate: null,
        nextCouponAmount: 0,
        daysToNextCoupon: null,
      },
      balanceSheetValueNGN: fv * fx,
    };
  }

  const { schedule, eir } = buildAmortSchedule(inst, valDate);
  const ac = interpolatedCarryingValue(schedule, purchaseDate, valDate);
  const accrued = accruedInterest(inst, schedule, valDate);

  const { curve, spread, label } = pickYieldCurve(inst, assumptions, valDate);
  const remainingYrs = Math.max(0, yearsBetween(valDate, maturity));
  const interpolated =
    inst.marketYield ?? interpolateYield(curve, remainingYrs) + spread;

  const { rows, totalFuturePV } = buildCashFlowSchedule(
    inst,
    valDate,
    interpolated,
  );

  const cleanFV = inst.marketPrice ?? totalFuturePV - accrued;
  const dirtyFV = cleanFV + accrued;

  const oci =
    inst.classification === "FVOCI"
      ? buildOCIMovement(inst, schedule, interpolated)
      : [];

  const risk = riskMetrics(inst, rows, interpolated, valDate, totalFuturePV);

  const fx = fxRate(inst.currency, assumptions);

  let bsLocal: number;
  if (inst.classification === "AC") bsLocal = ac;
  else bsLocal = cleanFV;

  return {
    instrument: inst,
    eir,
    discountAtPurchase: inst.faceValue - inst.purchasePrice,
    amortSchedule: schedule,
    acCarryingValue: ac,
    accruedInterest: accrued,
    totalBookValueDirty: ac + accrued,
    cleanFairValue: cleanFV,
    dirtyFairValue: dirtyFV,
    cashFlowSchedule: rows,
    totalFuturePV,
    ociReserve: cleanFV - ac,
    ociMovement: oci,
    unrealisedGL: cleanFV - inst.purchasePrice,
    marketYieldUsed: interpolated,
    yieldCurveLabel: label,
    annualEIRIncome: ac * eir,
    risk,
    balanceSheetValueNGN: bsLocal * fx,
  };
}
