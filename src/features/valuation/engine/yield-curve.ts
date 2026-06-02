import type {
  Assumptions,
  Currency,
  Instrument,
  YieldCurvePoint,
} from "./types";
import { toISO } from "./date-helpers";

export function interpolateYield(
  curve: YieldCurvePoint[],
  tenorYears: number,
): number {
  if (curve.length === 0) return 0;
  if (tenorYears <= curve[0].tenorYears) return curve[0].yield;
  if (tenorYears >= curve[curve.length - 1].tenorYears)
    return curve[curve.length - 1].yield;
  for (let i = 0; i < curve.length - 1; i++) {
    const a = curve[i];
    const b = curve[i + 1];
    if (tenorYears >= a.tenorYears && tenorYears <= b.tenorYears) {
      const frac = (tenorYears - a.tenorYears) / (b.tenorYears - a.tenorYears);
      return a.yield + (b.yield - a.yield) * frac;
    }
  }
  return curve[curve.length - 1].yield;
}

export function pickYieldCurve(
  inst: Instrument,
  assumptions: Assumptions,
  valuationDate: Date,
): { curve: YieldCurvePoint[]; spread: number; label: string } {
  const valDate = toISO(valuationDate);
  if (inst.currency !== "NGN") {
    return {
      curve: assumptions.usdYieldCurve,
      spread:
        inst.instrumentType === "Corporate Bond" ||
        inst.instrumentType === "Eurobond"
          ? assumptions.corporateSpread
          : 0,
      label: `USD Benchmark — ${valDate}`,
    };
  }
  let spread = 0;
  if (
    inst.instrumentType === "Corporate Bond" ||
    inst.instrumentType === "Commercial Paper" ||
    inst.instrumentType === "Promissory Note"
  )
    spread = assumptions.corporateSpread;
  else if (inst.instrumentType === "State Bond")
    spread = assumptions.stateSpread;
  return {
    curve: assumptions.fgnYieldCurve,
    spread,
    label: `FGN Sovereign — ${valDate}`,
  };
}

export function fxRate(currency: Currency, a: Assumptions): number {
  switch (currency) {
    case "NGN":
      return 1;
    case "USD":
      return a.fxUSD;
    case "GBP":
      return a.fxGBP;
    case "EUR":
      return a.fxEUR;
  }
}
