import type { Assumptions, Instrument } from "../../valuation/engine/types";
import { fxRate } from "../../valuation/engine";
import { CURVE_SCENARIOS, NIGERIAN_SCENARIOS } from "./reference-data";
import type { DurationRow, ScenarioImpact } from "./types";
import { isShortEnd } from "./helpers";
import { shockedValueLocal } from "./duration";

export function runCurveScenarios(
  instruments: Instrument[],
  durationRows: DurationRow[],
  assumptions: Assumptions,
): ScenarioImpact[] {
  const map = new Map(instruments.map((i) => [i.id, i]));
  return CURVE_SCENARIOS.map((scen) => {
    let total = 0;
    for (const d of durationRows) {
      const inst = map.get(d.id);
      if (!inst) continue;
      const fx = fxRate(inst.currency, assumptions);
      const bps = isShortEnd(d.remainingTenor) ? scen.shortBps : scen.longBps;
      const shocked = shockedValueLocal(inst, assumptions, d.marketYield, bps);
      total += (shocked - d.baseValueLocal) * fx;
    }
    return { name: scen.name, totalNGN: total, ociNGN: 0, plNGN: 0 };
  });
}

export function runNigerianScenarios(
  instruments: Instrument[],
  durationRows: DurationRow[],
  assumptions: Assumptions,
): ScenarioImpact[] {
  const map = new Map(instruments.map((i) => [i.id, i]));
  return NIGERIAN_SCENARIOS.map((scen) => {
    let total = 0;
    let oci = 0;
    let pl = 0;
    for (const d of durationRows) {
      const inst = map.get(d.id);
      if (!inst) continue;
      const isUSD = inst.currency === "USD";
      const bps = isUSD ? scen.usdShock : scen.ngnShock;
      const shocked = shockedValueLocal(inst, assumptions, d.marketYield, bps);
      const baseFX = isUSD ? assumptions.fxUSD : 1;
      const shockedFX = isUSD
        ? assumptions.fxUSD * (1 + scen.fxShock / 100)
        : 1;
      const pnl = shocked * shockedFX - d.baseValueLocal * baseFX;
      total += pnl;
      if (d.classification === "FVOCI") oci += pnl;
      else if (d.classification === "FVTPL") pl += pnl;
    }
    return { name: scen.name, totalNGN: total, ociNGN: oci, plNGN: pl };
  });
}
