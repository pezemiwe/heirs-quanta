import type { CouponFrequency, Instrument } from "./types";
import { addMonths, parseDate } from "./date-helpers";

export function periodsPerYear(freq: CouponFrequency): number {
  switch (freq) {
    case "Annual":
      return 1;
    case "Semi":
      return 2;
    case "Quarterly":
      return 4;
    case "Monthly":
      return 12;
    default:
      return 0;
  }
}

export function monthsPerPeriod(freq: CouponFrequency): number {
  switch (freq) {
    case "Annual":
      return 12;
    case "Semi":
      return 6;
    case "Quarterly":
      return 3;
    case "Monthly":
      return 1;
    default:
      return 0;
  }
}

export function couponDates(inst: Instrument): Date[] {
  const purchase = parseDate(inst.purchaseDate);
  const maturity = parseDate(inst.maturityDate);
  const months = monthsPerPeriod(inst.couponFrequency);
  if (months === 0) return [maturity];
  const dates: Date[] = [];
  let d = addMonths(purchase, months);
  while (d.getTime() < maturity.getTime()) {
    dates.push(d);
    d = addMonths(d, months);
  }
  dates.push(maturity);
  return dates;
}
