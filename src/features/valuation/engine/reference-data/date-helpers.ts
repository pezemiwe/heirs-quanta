function isoDate(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function shiftYears(iso: string, years: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return isoDate(y + years, m, d);
}
