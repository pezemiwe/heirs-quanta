import type { AmortRow, CashFlowRow, Instrument, OCIRow } from "./types";
import { MS_DAY, daysBetween, toISO } from "./date-helpers";
import { couponDates, periodsPerYear } from "./coupon";

export function buildCashFlowSchedule(
  inst: Instrument,
  valuationDate: Date,
  marketYield: number,
): { rows: CashFlowRow[]; totalFuturePV: number } {
  const dates = couponDates(inst);
  const ppy = periodsPerYear(inst.couponFrequency);
  const couponCF = ppy > 0 ? (inst.faceValue * inst.couponRate) / ppy : 0;

  let totalFuturePV = 0;
  const rows: CashFlowRow[] = dates.map((d, i) => {
    const isFinal = i === dates.length - 1;
    const amount =
      ppy === 0 ? inst.faceValue : couponCF + (isFinal ? inst.faceValue : 0);
    const daysToCF = daysBetween(valuationDate, d);
    const t = daysToCF / 365.25;
    const isFuture = d.getTime() >= valuationDate.getTime();
    const isCurrent = Math.abs(d.getTime() - valuationDate.getTime()) < MS_DAY;
    let pv: number | null = null;
    if (isFuture) {
      const disc = 1 / Math.pow(1 + marketYield, t);
      pv = amount * disc;
      totalFuturePV += pv;
    }
    let type: CashFlowRow["type"];
    if (ppy === 0) type = "Principal";
    else if (isFinal) type = "Coupon + Principal";
    else type = "Coupon";
    return {
      period: i + 1,
      date: toISO(d),
      type,
      amount,
      daysToCF,
      pvOfCF: pv,
      status: isCurrent
        ? "Future"
        : d.getTime() < valuationDate.getTime()
          ? "Past"
          : "Future",
    };
  });

  return { rows, totalFuturePV };
}

export function buildOCIMovement(
  inst: Instrument,
  schedule: AmortRow[],
  marketYield: number,
): OCIRow[] {
  const ppy = periodsPerYear(inst.couponFrequency);
  const couponCF = ppy > 0 ? (inst.faceValue * inst.couponRate) / ppy : 0;
  const dates = couponDates(inst);
  const N = dates.length;

  const rows: OCIRow[] = schedule.map((row, idx) => {
    let fv = 0;
    for (let j = idx + 1; j < N; j++) {
      const isFinal = j === N - 1;
      const amt = couponCF + (isFinal ? inst.faceValue : 0);
      const periods = j - idx;
      const r = ppy > 0 ? marketYield / ppy : marketYield;
      fv += amt / Math.pow(1 + r, periods);
    }
    if (idx === N - 1) fv = inst.faceValue;
    return {
      period: row.period,
      date: row.date,
      acCarryingValue: row.closingBalance,
      fairValueEst: fv,
      ociReserve: fv - row.closingBalance,
    };
  });
  return rows;
}
