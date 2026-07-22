import type { Instrument, Assumptions, ScheduleMetrics, FcyScheduleMetrics } from "./types";
import { parseDate } from "./index";

export function computeScheduleMetrics(inst: Instrument, val: any, assumptions: Assumptions): ScheduleMetrics {
  const valDate = new Date(assumptions.valuationDate);
  const monthStart = new Date(valDate.getFullYear(), valDate.getMonth(), 1);
  const monthStartMs = monthStart.getTime();
  const valDateMs = valDate.getTime();
  const maturityDate = parseDate(inst.maturityDate);
  const valueDate = parseDate(inst.purchaseDate);
  const currentPeriod = val.amortSchedule.find((r: any) => r.status === "Current");
  const lastCouponDate = currentPeriod ? parseDate(currentPeriod.periodStartDate) : parseDate(inst.purchaseDate);
  const priorMonthEndMs = monthStartMs - 86400000;

  // T-Bill variables
  const repDateMs = Math.min(maturityDate.getTime(), valDateMs);
  const tbillStartMs = Math.max(valueDate.getTime(), priorMonthEndMs);
  const tbillDaysInMonth = Math.max(0, Math.round((repDateMs - tbillStartMs) / 86400000));
  const tbillTenor = Math.round((maturityDate.getTime() - valueDate.getTime()) / 86400000);
  const tbillTotalDiscount = inst.faceValue - inst.purchasePrice;
  const tbillThisMonthIncome = tbillTenor > 0 ? tbillTotalDiscount * (tbillDaysInMonth / tbillTenor) : 0;
  const tbillClosingAccrued = tbillTenor > 0 ? tbillTotalDiscount * (Math.max(0, repDateMs - valueDate.getTime()) / 86400000) / tbillTenor : 0;

  // Bond variables
  const daysEarnedInMonth = Math.max(0, Math.round((repDateMs - Math.max(lastCouponDate.getTime(), priorMonthEndMs)) / 86400000));
  const bondThisMonthInterest = inst.faceValue * (inst.couponRate ?? 0) * (daysEarnedInMonth / 365);
  const lastMonthAccruedDays = Math.max(0, Math.round((priorMonthEndMs - lastCouponDate.getTime()) / 86400000));
  const lastMonthAccrued = inst.faceValue * (inst.couponRate ?? 0) * (lastMonthAccruedDays / 365);
  const pastCoupons = val.amortSchedule.filter((r: any) => r.status === "Past" && parseDate(r.date).getTime() > valueDate.getTime());
  const ppy = inst.couponFrequency === "Semi" ? 2 : inst.couponFrequency === "Quarterly" ? 4 : inst.couponFrequency === "Monthly" ? 12 : 1;
  const grossCouponPerPayment = ppy > 0 ? (inst.faceValue * (inst.couponRate ?? 0)) / ppy : 0;
  const totalCouponReceivedGross = pastCoupons.length * grossCouponPerPayment;

  // Placements variables
  const placementThisMonthInterest = val.amortSchedule.find((r: any) => r.status === "Current")?.eirIncome ?? 0;

  // Assign per instrument type
  let thisMonthInterest = 0;
  let closingAmortisedCost = 0;
  let currentMarketValue = 0;
  let totalAccruedInterest = val.accruedInterest ?? 0; // default for bonds/placements — unchanged

  if (inst.instrumentType === "T-Bill") {
    thisMonthInterest = tbillThisMonthIncome;
    closingAmortisedCost = tbillClosingAccrued;
    currentMarketValue = val.cleanFairValue ?? 0;
    totalAccruedInterest = tbillTotalDiscount; // Interest Receivable = full discount at issuance, not accrued-to-date
  } else if (inst.instrumentType === "Bank Placement" || inst.instrumentType === "Fixed Deposit") {
    thisMonthInterest = placementThisMonthInterest;
    closingAmortisedCost = val.accruedInterest;
    currentMarketValue = val.totalBookValueDirty ?? val.cleanFairValue ?? 0;
  } else if (inst.instrumentType === "FGN Bond" || inst.instrumentType === "Corporate Bond" || inst.instrumentType === "State Bond") {
    thisMonthInterest = bondThisMonthInterest;
    closingAmortisedCost = val.acCarryingValue;
    currentMarketValue = val.totalBookValueDirty ?? val.cleanFairValue ?? 0;
  } else {
    thisMonthInterest = 0;
    closingAmortisedCost = val.acCarryingValue ?? 0;
    currentMarketValue = val.totalBookValueDirty ?? val.cleanFairValue ?? 0;
  }

  return {
    totalAccruedInterest,
    effectiveInterestRate: val.eir ?? 0,
    thisMonthInterest,
    lastMonthAccruedInterest: lastMonthAccrued,
    couponReceivedToDateGross: totalCouponReceivedGross,
    closingAmortisedCost,
    currentMarketYield: val.yieldToMaturity ?? 0,
    totalCurrentMarketValue: currentMarketValue,
    currentMtmGainLoss: val.unrealisedGL ?? 0,
    monthlyMtmToPost: val.unrealisedGL ?? 0,
    lastCouponDate: lastCouponDate ? lastCouponDate.toISOString().split('T')[0] : undefined,
    nextCouponDate: val.risk?.nextCouponDate ?? undefined,
    daysEarnedInMonth: inst.instrumentType.includes("Bond") ? daysEarnedInMonth : undefined,
  };
}

export function computeFcyScheduleMetrics(inst: Instrument, val: any, assumptions: Assumptions): FcyScheduleMetrics {
  const valDate = new Date(assumptions.valuationDate);
  const monthStart = new Date(valDate.getFullYear(), valDate.getMonth(), 1);
  const monthStartMs = monthStart.getTime();
  const valDateMs = valDate.getTime();
  const maturityDate = parseDate(inst.maturityDate);
  const valueDate = parseDate(inst.purchaseDate);
  const priorMonthEndMs = monthStartMs - 86400000;

  const repDateMs = Math.min(maturityDate.getTime(), valDateMs);
  const tbillStartMs = Math.max(valueDate.getTime(), priorMonthEndMs);
  const tbillDaysInMonth = Math.max(0, Math.round((repDateMs - tbillStartMs) / 86400000));

  const currentFx = val.balanceSheetValueNGN / (val.cleanFairValue || 1);
  const purchaseFx = inst.purchaseFxRate ?? currentFx;
  const openingFx = inst.openingFxRate ?? currentFx;

  const monthIncomeCcy = inst.purchasePrice * (inst.couponRate ?? 0) * (tbillDaysInMonth / 365);
  const unrealisedFxGain = (val.acCarryingValue * currentFx) - (val.acCarryingValue * purchaseFx);
  const thisMonthFxGain = (val.acCarryingValue * currentFx) - (val.acCarryingValue * openingFx);
  const accruedCcy = val.acCarryingValue - inst.purchasePrice;
  const thisMonthAccruedFxGainLoss = (accruedCcy * currentFx) - (accruedCcy * openingFx);

  return {
    totalAccruedInterestFcy: accruedCcy,
    thisMonthInterestFcy: monthIncomeCcy,
    closingAmortisedCostFcy: val.acCarryingValue,
    closingAmortisedCostBase: val.acCarryingValue * currentFx,
    thisMonthUnrealisedFxGainLoss: thisMonthFxGain,
    thisMonthAccruedFxGainLoss,
    totalUnrealisedFxGainLoss: unrealisedFxGain,
    totalCurrentMarketValueBase: val.balanceSheetValueNGN,
  };
}
