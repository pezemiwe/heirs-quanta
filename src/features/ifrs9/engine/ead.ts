import type { Security } from "./types";

function paymentsPerYear(freq: Security["couponRepayment"]): number {
  switch (freq) {
    case "MONTHLY":
      return 12;
    case "QUARTERLY":
      return 4;
    case "SEMI-ANNUALLY":
    case "HALF-YEARLY":
      return 2;
    case "ANNUALLY":
    case "YEARLY":
      return 1;
    case "BULLET":
    default:
      return 0;
  }
}

export function projectEAD(
  s: Security,
  ttm: number,
  meir: number,
  mcir: number,
  lcd: number,
): number[] {
  const carrying = s.carryingAmountLcy;
  if (ttm <= 0) return [carrying];

  const piy = paymentsPerYear(s.couponRepayment);
  const couponLcy =
    piy > 0 ? mcir * (12 / piy) * s.redemptionValueAcy * s.fxRate : 0;

  const ead: number[] = [];
  let bal = carrying;
  for (let m = 0; m < ttm; m++) {
    bal = bal * (1 + meir);
    if (piy > 0 && lcd >= 0) {
      const period = 12 / piy;
      const offset = (lcd + m) % period;
      if (Math.round(offset) === 0 && m > 0) {
        bal -= couponLcy;
      }
    }
    ead.push(Math.max(0, bal));
  }
  return ead;
}
