import type {
  BondPriceHistoryPoint,
  BondQuote,
  FXHistoryPoint,
  FXRate,
  InflationMprPoint,
  MarketHistory,
  MarketSnapshot,
  MarketState,
  YieldCurveHistoryPoint,
  YieldCurvePoint,
} from "./types";
import {
  BOND_UNIVERSE,
  NGN_TENORS,
  USD_TENORS,
  VALUATION_DATE,
} from "./constants";
import { fitNelsonSiegel } from "./nelson-siegel";
import {
  buildAlerts,
  simBondPriceHistory,
  simFxHistory,
  simInflationMpr,
  simNgnCurveHistory,
  simPortfolioPnl,
  simUsdCurveHistory,
} from "./simulators";

/* ─── snapshot builder ───────────────────────────────────────────────── */

export function buildSnapshot(
  asOf: string,
  ngnHist: YieldCurveHistoryPoint[],
  usdHist: YieldCurveHistoryPoint[],
  fxHist: FXHistoryPoint[],
  bondHist: BondPriceHistoryPoint[],
  infl: InflationMprPoint[],
): MarketSnapshot {
  const todayNgn = ngnHist[ngnHist.length - 1];
  const todayUsd = usdHist[usdHist.length - 1];
  const todayFx = fxHist[fxHist.length - 1];
  const todayBonds = bondHist[bondHist.length - 1];
  const yesterdayBonds = bondHist[bondHist.length - 2] ?? todayBonds;

  const ngnCurve: YieldCurvePoint[] = NGN_TENORS.map((t) => ({
    tenor: t,
    yield: todayNgn.yields[t],
  }));
  const usdCurve: YieldCurvePoint[] = USD_TENORS.map((t) => ({
    tenor: t,
    yield: todayUsd.yields[t],
  }));

  const fx: FXRate[] = Object.entries(todayFx.rates).map(([pair, rate]) => ({
    pair,
    rate,
  }));

  const bonds: BondQuote[] = BOND_UNIVERSE.map((b) => {
    const tenors = Object.keys(todayNgn.yields)
      .map(Number)
      .sort((a, c) => a - c);
    let y = todayNgn.yields[tenors[tenors.length - 1]];
    for (let i = 0; i < tenors.length - 1; i++) {
      if (b.tenor >= tenors[i] && b.tenor <= tenors[i + 1]) {
        const t0 = tenors[i],
          t1 = tenors[i + 1];
        const y0 = todayNgn.yields[t0],
          y1 = todayNgn.yields[t1];
        y = y0 + ((y1 - y0) * (b.tenor - t0)) / (t1 - t0);
        break;
      }
    }
    const spread = b.id.startsWith("INV") ? 0.025 : 0;
    const price = todayBonds.prices[b.id];
    const prevPrice = yesterdayBonds.prices[b.id];
    const changeBps = Math.round(((price - prevPrice) / prevPrice) * 10000);
    return {
      id: b.id,
      name: b.name,
      yield: y + spread,
      price,
      changeBps,
    };
  });

  // shared tenors for spread
  const sharedTenors = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 20];
  const spreads = sharedTenors.map((t) => {
    const ngn = todayNgn.yields[t];
    const usd = todayUsd.yields[t];
    return { tenor: t, ngn, usd, spread: ngn - usd };
  });

  return {
    asOf,
    ngnCurve,
    usdCurve,
    ngnNelsonSiegel: fitNelsonSiegel(ngnCurve),
    usdNelsonSiegel: fitNelsonSiegel(usdCurve),
    fx,
    bonds,
    inflation: infl[infl.length - 1].cpi,
    mpr: infl[infl.length - 1].mpr,
    spreads,
  };
}

/* ─── top-level build ────────────────────────────────────────────────── */

export function buildMarketState(asOf: string = VALUATION_DATE): MarketState {
  const ngnHist = simNgnCurveHistory(asOf);
  const usdHist = simUsdCurveHistory(asOf);
  const fxHist = simFxHistory(asOf);
  const bondHist = simBondPriceHistory(asOf, ngnHist);
  const infl = simInflationMpr(asOf);
  const pnl = simPortfolioPnl(asOf, ngnHist);
  const alerts = buildAlerts(ngnHist);

  const snapshot = buildSnapshot(
    asOf,
    ngnHist,
    usdHist,
    fxHist,
    bondHist,
    infl,
  );
  const history: MarketHistory = {
    ngnCurve: ngnHist,
    usdCurve: usdHist,
    fx: fxHist,
    bondPrices: bondHist,
    inflationMpr: infl,
    portfolioPnl: pnl,
    alerts,
  };
  return {
    snapshot,
    history,
    overrides: [],
    source: "Simulated",
    lastUpdated: new Date().toISOString(),
  };
}
