import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyBondYieldOverride,
  applyFxOverride,
  applyYieldOverride,
  buildMarketState,
  VALUATION_DATE,
} from "./engine";
import type { MarketState } from "./engine/types";
import { useBookComputed } from "../portfolio/engine/book-compute";

interface MarketDataContextValue {
  state: MarketState;
  asOf: string;
  refresh: () => void;
  setYield: (
    tenor: number,
    newYield: number,
    source: string,
    currency?: "NGN" | "USD",
  ) => void;
  setFx: (pair: string, rate: number, source: string) => void;
  setBondYield: (bondId: string, newYield: number, source: string) => void;
  connectBloomberg: () => void;
  bloombergConnected: boolean;
  loadFmdq: (rows: { tenor: number; yield: number }[]) => void;
}

const Ctx = createContext<MarketDataContextValue | null>(null);

export function MarketDataProvider({ children }: { children: ReactNode }) {
  const [asOf] = useState(VALUATION_DATE);
  const book = useBookComputed();

  /* Drive the simulated Portfolio MTM off the real uploaded book's value and
     weighted duration when data has been imported; otherwise keep the demo
     ₦285B / 4.2yr fallback baked into the simulator. */
  const livePortfolio = useMemo(() => {
    if (!book.hasData) return undefined;
    const totalValueNGN = book.computed.totals.totalBSValueNGN;
    let wSum = 0;
    let wWeight = 0;
    for (const v of book.valuations) {
      if (v.risk.modifiedDuration > 0) {
        wSum += v.risk.modifiedDuration * v.balanceSheetValueNGN;
        wWeight += v.balanceSheetValueNGN;
      }
    }
    const duration = wWeight > 0 ? wSum / wWeight : 4.2;
    return { totalValueNGN, duration };
  }, [book.hasData, book.computed, book.valuations]);

  const [state, setState] = useState<MarketState>(() =>
    buildMarketState(asOf, livePortfolio),
  );
  const [bloombergConnected, setBloombergConnected] = useState(false);

  const refresh = useCallback(
    () => setState(buildMarketState(asOf, livePortfolio)),
    [asOf, livePortfolio],
  );

  /* Rebuild the Portfolio MTM series whenever the shared instrument book
     changes (new upload / cleared), so it reflects what's actually loaded. */
  useEffect(() => {
    setState(buildMarketState(asOf, livePortfolio));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livePortfolio]);

  const setYield = useCallback(
    (
      tenor: number,
      newYield: number,
      source: string,
      currency: "NGN" | "USD" = "NGN",
    ) =>
      setState((s) => applyYieldOverride(s, tenor, newYield, source, currency)),
    [],
  );

  const setFx = useCallback(
    (pair: string, rate: number, source: string) =>
      setState((s) => applyFxOverride(s, pair, rate, source)),
    [],
  );

  const setBondYield = useCallback(
    (bondId: string, newYield: number, source: string) =>
      setState((s) => applyBondYieldOverride(s, bondId, newYield, source)),
    [],
  );

  const connectBloomberg = useCallback(() => setBloombergConnected(true), []);

  const loadFmdq = useCallback(
    (rows: { tenor: number; yield: number }[]) =>
      setState((s) => {
        let next = s;
        for (const r of rows)
          next = applyYieldOverride(next, r.tenor, r.yield, "FMDQ", "NGN");
        return { ...next, source: "FMDQ" };
      }),
    [],
  );

  const value = useMemo<MarketDataContextValue>(
    () => ({
      state,
      asOf,
      refresh,
      setYield,
      setFx,
      setBondYield,
      connectBloomberg,
      bloombergConnected,
      loadFmdq,
    }),
    [
      state,
      asOf,
      refresh,
      setYield,
      setFx,
      setBondYield,
      connectBloomberg,
      bloombergConnected,
      loadFmdq,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMarketData(): MarketDataContextValue {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useMarketData must be used within MarketDataProvider");
  return ctx;
}
