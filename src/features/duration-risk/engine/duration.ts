import type { Assumptions, Instrument } from "../../valuation/engine/types";
import {
  buildCashFlowSchedule,
  fxRate,
  parseDate,
  valueInstrument,
  yearsBetween,
} from "../../valuation/engine";
import { DURATION_EXCLUDED_TYPES } from "./reference-data";
import type { DurationRow } from "./types";

export function shockedValueLocal(
  inst: Instrument,
  assumptions: Assumptions,
  baseYield: number,
  bps: number,
): number {
  const valDate = parseDate(assumptions.valuationDate);
  const maturity = parseDate(inst.maturityDate);
  const remaining = yearsBetween(valDate, maturity);
  if (remaining <= 0) return inst.faceValue;
  const shockedYield = Math.max(0.0001, baseYield + bps / 10_000);

  if (
    inst.couponRate === 0 ||
    inst.couponFrequency === "Zero" ||
    inst.couponFrequency === "N/A"
  ) {
    return inst.faceValue / (1 + shockedYield * remaining);
  }

  const { totalFuturePV } = buildCashFlowSchedule(inst, valDate, shockedYield);
  return totalFuturePV;
}

function buildDurationRow(
  inst: Instrument,
  assumptions: Assumptions,
): DurationRow | null {
  if (DURATION_EXCLUDED_TYPES.has(inst.instrumentType)) return null;
  const valDate = parseDate(assumptions.valuationDate);
  const maturity = parseDate(inst.maturityDate);
  const remaining = yearsBetween(valDate, maturity);
  if (remaining <= 0) return null;

  const val = valueInstrument(inst, assumptions);
  const fx = fxRate(inst.currency, assumptions);
  const base = val.cleanFairValue || val.acCarryingValue || 0;

  const dv01Local = val.risk.dv01;
  const dv01NGN = dv01Local * fx;

  return {
    id: inst.id,
    name: inst.name,
    type: inst.instrumentType,
    issuer: inst.issuer,
    sector: inst.sector,
    classification: inst.classification,
    currency: inst.currency,
    faceValue: inst.faceValue,
    bsValueNGN: val.balanceSheetValueNGN,
    baseValueLocal: base,
    couponRate: inst.couponRate,
    marketYield: val.marketYieldUsed,
    remainingTenor: remaining,
    macaulayDur: val.risk.macaulayDuration,
    modifiedDur: val.risk.modifiedDuration,
    dv01Local,
    dv01NGN,
    convexity: val.risk.convexity,
    maturityDate: inst.maturityDate,
    purchaseDate: inst.purchaseDate,
  };
}

export function buildDurationTable(
  instruments: Instrument[],
  assumptions: Assumptions,
): DurationRow[] {
  const out: DurationRow[] = [];
  for (const inst of instruments) {
    const r = buildDurationRow(inst, assumptions);
    if (r) out.push(r);
  }
  return out;
}
