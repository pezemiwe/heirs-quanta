/* ─── price from yield (simple bullet bond, semi-annual coupons) ──────── */

export function bondPrice(
  coupon: number,
  ytm: number,
  years: number,
  face = 100,
): number {
  const freq = 2;
  const n = Math.max(1, Math.round(years * freq));
  const c = (coupon * face) / freq;
  const y = ytm / freq;
  let pv = 0;
  for (let k = 1; k <= n; k++) pv += c / Math.pow(1 + y, k);
  pv += face / Math.pow(1 + y, n);
  return pv;
}
