import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Holding,
  Transaction,
  AllocationTarget,
  PortfolioMetrics,
} from "./engine/types";
import { computePortfolioMetrics } from "./engine";
import { TARGETS as DEFAULT_TARGETS } from "./engine/reference-data";
import { useInstrumentBook } from "../../context/instrument-book";

interface PortfolioContextValue {
  holdings: Holding[];
  transactions: Transaction[];
  targets: AllocationTarget[];
  metrics: PortfolioMetrics;
  selectedHoldingId: string | null;

  setSelectedHoldingId: (id: string | null) => void;
  addHolding: (h: Holding) => void;
  updateHolding: (id: string, patch: Partial<Holding>) => void;
  removeHolding: (id: string) => void;
  addTransaction: (tx: Transaction) => void;
  setTargets: (t: AllocationTarget[]) => void;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const book = useInstrumentBook();
  const [holdings, setHoldings] = useState<Holding[]>(
    book.holdings.length > 0 ? book.holdings : [],
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [targets, setTargets] = useState<AllocationTarget[]>(DEFAULT_TARGETS);
  const [selectedHoldingId, setSelectedHoldingId] = useState<string | null>(
    null,
  );

  /* Sync from InstrumentBook whenever the shared book changes */
  useEffect(() => {
    setHoldings(book.holdings);
    if (book.holdings.length === 0) {
      setSelectedHoldingId(null);
    }
  }, [book.holdings]);

  const metrics = useMemo(
    () => computePortfolioMetrics(holdings, targets),
    [holdings, targets],
  );

  const value: PortfolioContextValue = {
    holdings,
    transactions,
    targets,
    metrics,
    selectedHoldingId,
    setSelectedHoldingId,
    addHolding: (h) => setHoldings((prev) => [h, ...prev]),
    updateHolding: (id, patch) =>
      setHoldings((prev) =>
        prev.map((h) => (h.id === id ? { ...h, ...patch } : h)),
      ),
    removeHolding: (id) =>
      setHoldings((prev) => prev.filter((h) => h.id !== id)),
    addTransaction: (tx) => setTransactions((prev) => [tx, ...prev]),
    setTargets,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx)
    throw new Error("usePortfolio must be used within PortfolioProvider");
  return ctx;
}
