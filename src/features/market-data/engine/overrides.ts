import type { MarketSnapshot, MarketState } from "./types";
import { BOND_UNIVERSE } from "./constants";
import { fitNelsonSiegel } from "./nelson-siegel";
import { bondPrice } from "./bond-pricing";

/* ─── overrides (mutates a state immutably and returns new) ──────────── */

export function applyYieldOverride(
  state: MarketState,
  tenor: number,
  newYield: number,
  source: string,
  currency: "NGN" | "USD" = "NGN",
): MarketState {
  const snap = state.snapshot;
  const curve = currency === "NGN" ? snap.ngnCurve : snap.usdCurve;
  const updated = curve.map((p) =>
    p.tenor === tenor ? { ...p, yield: newYield } : p,
  );
  const newSnap: MarketSnapshot = {
    ...snap,
    [currency === "NGN" ? "ngnCurve" : "usdCurve"]: updated,
    [currency === "NGN" ? "ngnNelsonSiegel" : "usdNelsonSiegel"]:
      fitNelsonSiegel(updated),
  };
  return {
    ...state,
    snapshot: newSnap,
    overrides: [
      ...state.overrides,
      {
        type: `${currency} Yield`,
        key: `${tenor}Y`,
        value: newYield,
        source,
        at: new Date().toISOString(),
      },
    ],
    source: "Manual",
    lastUpdated: new Date().toISOString(),
  };
}

export function applyFxOverride(
  state: MarketState,
  pair: string,
  rate: number,
  source: string,
): MarketState {
  const newFx = state.snapshot.fx.map((f) =>
    f.pair === pair ? { ...f, rate } : f,
  );
  return {
    ...state,
    snapshot: { ...state.snapshot, fx: newFx },
    overrides: [
      ...state.overrides,
      {
        type: "FX",
        key: pair,
        value: rate,
        source,
        at: new Date().toISOString(),
      },
    ],
    source: "Manual",
    lastUpdated: new Date().toISOString(),
  };
}

export function applyBondYieldOverride(
  state: MarketState,
  bondId: string,
  newYield: number,
  source: string,
): MarketState {
  const meta = BOND_UNIVERSE.find((b) => b.id === bondId);
  if (!meta) return state;
  const price = bondPrice(meta.coupon, newYield, meta.tenor);
  const newBonds = state.snapshot.bonds.map((b) =>
    b.id === bondId
      ? { ...b, yield: newYield, price: Math.round(price * 100) / 100 }
      : b,
  );
  return {
    ...state,
    snapshot: { ...state.snapshot, bonds: newBonds },
    overrides: [
      ...state.overrides,
      {
        type: "Bond Yield",
        key: bondId,
        value: newYield,
        source,
        at: new Date().toISOString(),
      },
    ],
    source: "Manual",
    lastUpdated: new Date().toISOString(),
  };
}
