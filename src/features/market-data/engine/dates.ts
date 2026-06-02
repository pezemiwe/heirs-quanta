/* ─── dates ──────────────────────────────────────────────────────────── */

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function daysBack(asOf: string, n: number): string[] {
  const end = new Date(asOf + "T00:00:00Z");
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setUTCDate(end.getUTCDate() - i);
    out.push(isoDate(d));
  }
  return out;
}
