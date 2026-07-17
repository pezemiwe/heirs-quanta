import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useInstrumentBook } from "../../context/instrument-book";

/* -------------------------------------------------------
   Portfolio Registry
   Shared state for named portfolio books consumed by both
   Portfolio Management and Deal Capture modules.
------------------------------------------------------- */

export type PortfolioType = "Trading" | "Banking" | "HTM" | "AFS" | "Custom";
export type PortfolioStatus = "Active" | "Inactive" | "Archived";

export interface Portfolio {
  id: string;
  name: string;
  type: PortfolioType;
  baseCurrency: string;
  description: string;
  manager: string;
  mandatedBy: string;
  strategy: string;
  status: PortfolioStatus;
  createdAt: string; // ISO date
  instrumentCount?: number;
  origin?: "managed" | "imported";
}

const SEED: Portfolio[] = [
  {
    id: "pb-trading",
    name: "Trading Book",
    type: "Trading",
    baseCurrency: "NGN",
    description: "Short-duration instruments held for active trading.",
    manager: "Head of Trading",
    mandatedBy: "Investment Committee",
    strategy: "Active trading - mark-to-market daily",
    status: "Active",
    createdAt: "2024-01-01",
    instrumentCount: 68,
    origin: "managed",
  },
  {
    id: "pb-banking",
    name: "Banking Book",
    type: "Banking",
    baseCurrency: "NGN",
    description: "Long-duration fixed income and loan-book instruments.",
    manager: "Head of Fixed Income",
    mandatedBy: "Investment Committee",
    strategy: "Buy and hold - EIR amortisation",
    status: "Active",
    createdAt: "2024-01-01",
    instrumentCount: 97,
    origin: "managed",
  },
  {
    id: "pb-htm",
    name: "Held-to-Maturity",
    type: "HTM",
    baseCurrency: "NGN",
    description: "Instruments designated HTM under IFRS 9 - AC classification.",
    manager: "Head of Fixed Income",
    mandatedBy: "Board Risk Committee",
    strategy: "Hold to maturity - no rebalancing",
    status: "Active",
    createdAt: "2024-01-01",
    instrumentCount: 39,
    origin: "managed",
  },
];

interface RegistryContextValue {
  portfolios: Portfolio[];
  addPortfolio: (p: Omit<Portfolio, "id" | "createdAt">) => Portfolio;
  updatePortfolio: (id: string, patch: Partial<Portfolio>) => void;
  removePortfolio: (id: string) => void;
  getPortfolioNames: () => string[];
}

const RegistryContext = createContext<RegistryContextValue | null>(null);

let _counter = SEED.length + 1;

export function PortfolioRegistryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [managedPortfolios, setManagedPortfolios] = useState<Portfolio[]>(SEED);
  const book = useInstrumentBook();

  const portfolios = useMemo<Portfolio[]>(() => {
    const observed = new Map<string, Portfolio>();

    for (const instrument of book.instruments) {
      const name = instrument.portfolioBook?.trim();
      if (!name) continue;

      const existing = observed.get(name);
      if (existing) {
        existing.instrumentCount = (existing.instrumentCount ?? 0) + 1;
        continue;
      }

      observed.set(name, {
        id: `pb-imported-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name,
        type: "Custom",
        baseCurrency: instrument.currency,
        description: `Imported from ${instrument.sourceFileName ?? "uploaded workbook"}`,
        manager: "Imported via Deal Capture",
        mandatedBy: instrument.importBatchLabel ?? "Uploaded book",
        strategy: "Imported portfolio book",
        status: "Active",
        createdAt: instrument.purchaseDate || new Date().toISOString().slice(0, 10),
        instrumentCount: 1,
        origin: "imported",
      });
    }

    const merged = managedPortfolios.map((portfolio) => {
      const observedMatch = observed.get(portfolio.name);
      if (!observedMatch) return portfolio;

      return {
        ...portfolio,
        instrumentCount: observedMatch.instrumentCount,
        baseCurrency: observedMatch.baseCurrency || portfolio.baseCurrency,
      };
    });

    const managedNames = new Set(managedPortfolios.map((portfolio) => portfolio.name));
    for (const observedPortfolio of observed.values()) {
      if (!managedNames.has(observedPortfolio.name)) {
        merged.push(observedPortfolio);
      }
    }

    return merged;
  }, [book.instruments, managedPortfolios]);

  function addPortfolio(p: Omit<Portfolio, "id" | "createdAt">): Portfolio {
    const newP: Portfolio = {
      ...p,
      id: `pb-custom-${_counter++}`,
      createdAt: new Date().toISOString().split("T")[0],
      origin: "managed",
    };
    setManagedPortfolios((prev) => [...prev, newP]);
    return newP;
  }

  function updatePortfolio(id: string, patch: Partial<Portfolio>) {
    setManagedPortfolios((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );
  }

  function removePortfolio(id: string) {
    setManagedPortfolios((prev) => prev.filter((p) => p.id !== id));
  }

  function getPortfolioNames(): string[] {
    return portfolios.filter((p) => p.status === "Active").map((p) => p.name);
  }

  return (
    <RegistryContext.Provider
      value={{
        portfolios,
        addPortfolio,
        updatePortfolio,
        removePortfolio,
        getPortfolioNames,
      }}
    >
      {children}
    </RegistryContext.Provider>
  );
}

export function usePortfolioRegistry() {
  const ctx = useContext(RegistryContext);
  if (!ctx)
    throw new Error(
      "usePortfolioRegistry must be used within PortfolioRegistryProvider",
    );
  return ctx;
}
