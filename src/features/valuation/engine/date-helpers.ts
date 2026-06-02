export const MS_DAY = 86_400_000;

export function parseDate(s: string): Date {
  return new Date(s + "T00:00:00Z");
}

export function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_DAY);
}

export function yearsBetween(a: Date, b: Date): number {
  return daysBetween(a, b) / 365.25;
}

export function addMonths(d: Date, months: number): Date {
  const r = new Date(d.getTime());
  const day = r.getUTCDate();
  r.setUTCMonth(r.getUTCMonth() + months);
  if (r.getUTCDate() < day) r.setUTCDate(0);
  return r;
}
