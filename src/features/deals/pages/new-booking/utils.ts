import { BOOK_COMPUTED } from "../../../portfolio/engine/book-compute";

export function computeLimitWarning(
  issuer: string,
  faceValue: string,
): string | null {
  if (!issuer || !faceValue) return null;
  const fv = parseFloat(faceValue);
  if (isNaN(fv) || fv <= 0) return null;
  const totalBSV = BOOK_COMPUTED.totals.totalBSValueNGN;
  const proposedPct = (fv / (totalBSV + fv)) * 100;
  if (proposedPct > 10) {
    return `Single-issuer concentration would reach ${proposedPct.toFixed(1)}% (NAICOM limit: 10%)`;
  }
  if (proposedPct > 8) {
    return `Single-issuer concentration approaching limit: ${proposedPct.toFixed(1)}% (limit: 10%)`;
  }
  return null;
}

export function computeEirApprox(
  purchaseYield: string,
  couponRate: string,
): number | null {
  return purchaseYield
    ? parseFloat(purchaseYield)
    : couponRate
      ? parseFloat(couponRate)
      : null;
}
