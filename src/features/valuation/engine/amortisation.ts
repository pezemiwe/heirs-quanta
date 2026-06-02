import type { AmortRow, Instrument } from "./types";
import { daysBetween, parseDate, toISO, yearsBetween } from "./date-helpers";
import { couponDates, periodsPerYear } from "./coupon";
import { solveEIR } from "./eir";

export function buildAmortSchedule(
  inst: Instrument,
  valuationDate: Date,
): { schedule: AmortRow[]; eir: number } {
  const dates = couponDates(inst);
  const ppy = periodsPerYear(inst.couponFrequency);
  const couponCF = ppy > 0 ? (inst.faceValue * inst.couponRate) / ppy : 0;

  const cfArr = dates.map((_, i) => {
    const isFinal = i === dates.length - 1;
    return {
      t: i + 1,
      cf: couponCF + (isFinal ? inst.faceValue : 0),
    };
  });

  let eir: number;
  if (ppy === 0) {
    const years = yearsBetween(parseDate(inst.purchaseDate), dates[0]);
    eir =
      years > 0
        ? Math.pow(inst.faceValue / inst.purchasePrice, 1 / years) - 1
        : 0;
  } else {
    eir = solveEIR(cfArr, inst.purchasePrice, ppy, inst.couponRate || 0.1);
  }

  const periodRate = ppy > 0 ? eir / ppy : 0;
  const schedule: AmortRow[] = [];
  let opening = inst.purchasePrice;

  for (let i = 0; i < dates.length; i++) {
    const eirIncome = ppy > 0 ? opening * periodRate : 0;
    const amort = eirIncome - couponCF;
    const closing = opening + amort;
    const cfDate = dates[i];

    let status: AmortRow["status"];
    const prev = i === 0 ? parseDate(inst.purchaseDate) : dates[i - 1];
    if (cfDate.getTime() < valuationDate.getTime()) status = "Past";
    else if (
      prev.getTime() <= valuationDate.getTime() &&
      cfDate.getTime() >= valuationDate.getTime()
    )
      status = "Current";
    else status = "Future";

    schedule.push({
      period: i + 1,
      date: toISO(cfDate),
      openingBalance: opening,
      eirIncome,
      couponCF,
      amortisation: amort,
      closingBalance: closing,
      status,
    });

    if (i === dates.length - 1) {
      schedule[i].closingBalance = inst.faceValue;
      schedule[i].amortisation = inst.faceValue - opening;
      schedule[i].eirIncome = schedule[i].amortisation + couponCF;
    }
    opening = schedule[i].closingBalance;
  }

  return { schedule, eir };
}

export function interpolatedCarryingValue(
  schedule: AmortRow[],
  purchaseDate: Date,
  valuationDate: Date,
): number {
  if (schedule.length === 0) return 0;
  let prevDate = purchaseDate;
  let prevBal = schedule[0].openingBalance;
  for (const row of schedule) {
    const rowDate = parseDate(row.date);
    if (rowDate.getTime() >= valuationDate.getTime()) {
      const total = daysBetween(prevDate, rowDate);
      const elapsed = daysBetween(prevDate, valuationDate);
      const frac = total > 0 ? elapsed / total : 0;
      return prevBal + (row.closingBalance - prevBal) * frac;
    }
    prevDate = rowDate;
    prevBal = row.closingBalance;
  }
  return prevBal;
}

export function accruedInterest(
  inst: Instrument,
  schedule: AmortRow[],
  valuationDate: Date,
): number {
  const ppy = periodsPerYear(inst.couponFrequency);
  if (ppy === 0) return 0;
  const couponCF = (inst.faceValue * inst.couponRate) / ppy;

  let periodStart = parseDate(inst.purchaseDate);
  for (const row of schedule) {
    const rowDate = parseDate(row.date);
    if (rowDate.getTime() >= valuationDate.getTime()) {
      const total = daysBetween(periodStart, rowDate);
      const elapsed = daysBetween(periodStart, valuationDate);
      const frac = total > 0 ? Math.max(0, elapsed / total) : 0;
      return couponCF * frac;
    }
    periodStart = rowDate;
  }
  return 0;
}
