import type {
  Alert,
  BondPriceHistoryPoint,
  FXHistoryPoint,
  InflationMprPoint,
  PortfolioPnlPoint,
  YieldCurveHistoryPoint,
} from "./types";
import {
  ALERT_BPS,
  BOND_UNIVERSE,
  FX_BASE,
  HISTORY_DAYS,
  NGN_BASE_CURVE,
  NGN_TENORS,
  USD_BASE_CURVE,
  USD_TENORS,
} from "./constants";
import { gauss, mulberry32 } from "./random";
import { daysBack } from "./dates";
import { bondPrice } from "./bond-pricing";

/* ─── history simulators (ported from _sim_* in notebook) ─────────────── */

export function simNgnCurveHistory(asOf: string): YieldCurveHistoryPoint[] {
  const rand = mulberry32(42);
  const dates = daysBack(asOf, HISTORY_DAYS);
  // Random walk on level + slope
  let level = 0;
  let slope = 0;
  return dates.map((date) => {
    level += gauss(rand) * 0.0008;
    slope += gauss(rand) * 0.0004;
    const yields: Record<number, number> = {};
    for (const t of NGN_TENORS) {
      const base = NGN_BASE_CURVE[t];
      const tilt = (Math.log(1 + t) - 1.5) * slope;
      yields[t] = Math.max(0.05, base + level + tilt);
    }
    return { date, yields };
  });
}

export function simUsdCurveHistory(asOf: string): YieldCurveHistoryPoint[] {
  const rand = mulberry32(7);
  const dates = daysBack(asOf, HISTORY_DAYS);
  let level = 0;
  return dates.map((date) => {
    level += gauss(rand) * 0.0004;
    const yields: Record<number, number> = {};
    for (const t of USD_TENORS) {
      yields[t] = Math.max(0.01, USD_BASE_CURVE[t] + level);
    }
    return { date, yields };
  });
}

export function simFxHistory(asOf: string): FXHistoryPoint[] {
  const rand = mulberry32(123);
  const dates = daysBack(asOf, HISTORY_DAYS);
  const cur: Record<string, number> = {
    "USD-NGN": FX_BASE["USD-NGN"] - 35,
    "EUR-NGN": FX_BASE["EUR-NGN"] - 40,
    "GBP-NGN": FX_BASE["GBP-NGN"] - 45,
  };
  return dates.map((date) => {
    cur["USD-NGN"] += gauss(rand) * 4 + 0.4;
    cur["EUR-NGN"] += gauss(rand) * 4.5 + 0.45;
    cur["GBP-NGN"] += gauss(rand) * 5 + 0.5;
    return {
      date,
      rates: {
        "USD-NGN": Math.round(cur["USD-NGN"] * 100) / 100,
        "EUR-NGN": Math.round(cur["EUR-NGN"] * 100) / 100,
        "GBP-NGN": Math.round(cur["GBP-NGN"] * 100) / 100,
      },
    };
  });
}

export function simBondPriceHistory(
  asOf: string,
  ngnHist: YieldCurveHistoryPoint[],
): BondPriceHistoryPoint[] {
  const rand = mulberry32(99);
  return ngnHist.map((day) => {
    const prices: Record<string, number> = {};
    for (const b of BOND_UNIVERSE) {
      // interpolate yield for tenor
      const tenors = Object.keys(day.yields)
        .map(Number)
        .sort((a, b) => a - b);
      let y = day.yields[tenors[tenors.length - 1]];
      for (let i = 0; i < tenors.length - 1; i++) {
        if (b.tenor >= tenors[i] && b.tenor <= tenors[i + 1]) {
          const t0 = tenors[i],
            t1 = tenors[i + 1];
          const y0 = day.yields[t0],
            y1 = day.yields[t1];
          y = y0 + ((y1 - y0) * (b.tenor - t0)) / (t1 - t0);
          break;
        }
      }
      const spread = b.id.startsWith("INV") ? 0.025 + gauss(rand) * 0.001 : 0;
      prices[b.id] =
        Math.round(bondPrice(b.coupon, y + spread, b.tenor) * 100) / 100;
    }
    return { date: day.date, prices };
  });
}

export function simInflationMpr(asOf: string): InflationMprPoint[] {
  // 12 months of CPI vs MPR
  const months: InflationMprPoint[] = [];
  const end = new Date(asOf + "T00:00:00Z");
  const rand = mulberry32(11);
  let cpi = 0.262;
  let mpr = 0.275;
  for (let i = 11; i >= 0; i--) {
    const d = new Date(end);
    d.setUTCMonth(end.getUTCMonth() - i);
    cpi += gauss(rand) * 0.003 - 0.0005;
    mpr += gauss(rand) * 0.001;
    months.push({
      date: d.toISOString().slice(0, 7),
      cpi: Math.round(cpi * 10000) / 10000,
      mpr: Math.round(mpr * 10000) / 10000,
    });
  }
  return months;
}

export function simPortfolioPnl(
  asOf: string,
  ngnHist: YieldCurveHistoryPoint[],
): PortfolioPnlPoint[] {
  const rand = mulberry32(2025);
  const baseValue = 285_000_000_000; // ₦285B
  let v = baseValue;
  return ngnHist.map((day, i) => {
    const yChange = i === 0 ? 0 : day.yields[5] - ngnHist[i - 1].yields[5];
    // duration ~ 4.2, value moves by -dur * dy * value + noise
    const drift = -4.2 * yChange * v + gauss(rand) * 1e8;
    v += drift;
    return {
      date: day.date,
      value: Math.round(v),
      pnl: Math.round(v - baseValue),
    };
  });
}

export function buildAlerts(ngnHist: YieldCurveHistoryPoint[]): Alert[] {
  if (ngnHist.length < 2) return [];
  const out: Alert[] = [];
  const today = ngnHist[ngnHist.length - 1];
  const yesterday = ngnHist[ngnHist.length - 2];
  for (const t of NGN_TENORS) {
    const oldY = yesterday.yields[t];
    const newY = today.yields[t];
    const bps = Math.round((newY - oldY) * 10000);
    if (Math.abs(bps) >= ALERT_BPS) {
      out.push({
        tenor: t,
        oldYield: oldY,
        newYield: newY,
        changeBps: bps,
        severity: Math.abs(bps) >= 50 ? "critical" : "warning",
        message: `${t}Y NGN yield moved ${bps > 0 ? "+" : ""}${bps} bps`,
        timestamp: today.date,
      });
    }
  }
  return out;
}
