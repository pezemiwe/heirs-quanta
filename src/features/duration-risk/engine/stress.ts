import type { Assumptions, Instrument } from "../../valuation/engine/types";
import { fxRate } from "../../valuation/engine";
import { PARALLEL_SHOCKS_BPS } from "./reference-data";
import type { DurationRow, StressRow } from "./types";
import { shockedValueLocal } from "./duration";

export function buildStressTable(
  instruments: Instrument[],
  durationRows: DurationRow[],
  assumptions: Assumptions,
  shocks: number[] = PARALLEL_SHOCKS_BPS,
): StressRow[] {
  const map = new Map(instruments.map((i) => [i.id, i]));
  return durationRows.map((d) => {
    const inst = map.get(d.id)!;
    const fx = fxRate(inst.currency, assumptions);
    const baseLocal = d.baseValueLocal;
    const baseNGN = baseLocal * fx;

    const shockValues: Record<number, number> = {};
    const pnl: Record<number, number> = {};
    for (const bps of shocks) {
      const sLocal =
        bps === 0
          ? baseLocal
          : shockedValueLocal(inst, assumptions, d.marketYield, bps);
      const sNGN = sLocal * fx;
      shockValues[bps] = sNGN;
      pnl[bps] = sNGN - baseNGN;
    }

    return {
      id: d.id,
      name: d.name,
      type: d.type,
      sector: d.sector,
      classification: d.classification,
      baseValueNGN: baseNGN,
      shockValues,
      pnl,
    };
  });
}
