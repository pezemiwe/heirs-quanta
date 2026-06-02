export function isShortEnd(tenor: number): boolean {
  return tenor <= 2.0;
}

export function assignBucket(tenor: number): string {
  if (tenor <= 0.25) return "0-3 Months";
  if (tenor <= 0.5) return "3-6 Months";
  if (tenor <= 1.0) return "6-12 Months";
  if (tenor <= 2.0) return "1-2 Years";
  if (tenor <= 5.0) return "2-5 Years";
  if (tenor <= 10.0) return "5-10 Years";
  return "10+ Years";
}

export function dateBucket(days: number): string {
  if (days <= 90) return "0-3 Months";
  if (days <= 180) return "3-6 Months";
  if (days <= 365) return "6-12 Months";
  if (days <= 730) return "1-2 Years";
  if (days <= 1825) return "2-5 Years";
  if (days <= 3650) return "5-10 Years";
  return "10+ Years";
}

export function weightedAvg(values: number[], weights: number[]): number {
  let w = 0;
  let s = 0;
  for (let i = 0; i < values.length; i++) {
    w += weights[i];
    s += values[i] * weights[i];
  }
  return w > 0 ? s / w : 0;
}
