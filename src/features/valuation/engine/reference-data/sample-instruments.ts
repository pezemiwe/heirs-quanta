import type { Instrument, InstrumentType } from "../types";
import { SPEC_INSTRUMENTS } from "./spec-instruments";
import { generateInstrument } from "./instrument-generator";

const TYPE_PLAN: { type: InstrumentType; count: number }[] = [
  { type: "FGN Bond", count: 20 },
  { type: "Corporate Bond", count: 31 },
  { type: "Fixed Deposit", count: 25 },
  { type: "T-Bill", count: 15 },
  { type: "Commercial Paper", count: 15 },
  { type: "State Bond", count: 15 },
  { type: "Bank Placement", count: 15 },
  { type: "Mutual Fund", count: 15 },
  { type: "Promissory Note", count: 10 },
  { type: "Equity", count: 24 },
  { type: "Eurobond", count: 15 },
];

export const SAMPLE_INSTRUMENTS: Instrument[] = (() => {
  const list: Instrument[] = [...SPEC_INSTRUMENTS];
  const usedIds = new Set(list.map((i) => i.id));
  let n = 1;
  for (const { type, count } of TYPE_PLAN) {
    let added = 0;
    while (added < count) {
      let id = `INV-${String(n).padStart(3, "0")}`;
      n++;
      if (usedIds.has(id)) continue;
      list.push(generateInstrument(id, type));
      usedIds.add(id);
      added++;
    }
  }
  // sort by id
  list.sort((a, b) => a.id.localeCompare(b.id));
  return list;
})();
