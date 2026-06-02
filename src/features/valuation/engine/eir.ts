export function priceAtYield(
  cashFlows: { t: number; cf: number }[],
  y: number,
  periodsYear: number,
): number {
  if (periodsYear === 0) {
    return cashFlows.reduce((s, c) => s + c.cf / Math.pow(1 + y, c.t), 0);
  }
  const r = y / periodsYear;
  return cashFlows.reduce((s, c) => s + c.cf / Math.pow(1 + r, c.t), 0);
}

export function solveEIR(
  cashFlows: { t: number; cf: number }[],
  price: number,
  periodsYear: number,
  guess = 0.1,
): number {
  let y = guess;
  for (let iter = 0; iter < 100; iter++) {
    const f = priceAtYield(cashFlows, y, periodsYear) - price;
    const h = 1e-6;
    const fp =
      (priceAtYield(cashFlows, y + h, periodsYear) -
        priceAtYield(cashFlows, y - h, periodsYear)) /
      (2 * h);
    if (Math.abs(fp) < 1e-12) break;
    const step = f / fp;
    y -= step;
    if (Math.abs(step) < 1e-10) return y;
    if (y < -0.5) y = -0.5;
    if (y > 5) y = 5;
  }
  return y;
}
