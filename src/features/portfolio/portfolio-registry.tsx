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



interface RegistryContextValue {
  portfolios: Portfolio[];
  addPortfolio: (p: Omit<Portfolio, "id" | "createdAt">) => Portfolio;
  updatePortfolio: (id: string, patch: Partial<Portfolio>) => void;
  removePortfolio: (id: string) => void;
  getPortfolioNames: () => string[];
}

const RegistryContext = createContext<RegistryContextValue | null>(null);

let _counter = 1;

export function PortfolioRegistryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [managedPortfolios, setManagedPortfolios] = useState<Portfolio[]>([]);
  const book = useInstrumentBook();

  const portfolios = useMemo<Portfolio[]>(() => {
    const observedMap = new Map<string, Portfolio & { _currencies: Set<string> }>();

    for (const instrument of book.instruments) {
      let rawName = instrument.portfolioBook?.trim();
      if (!rawName) continue;
      
      const t = rawName.toLowerCase().replace(/\s+/g, " ");
      let key = t;
      let display = rawName;
      if (t.includes("annuity")) {
        key = "annuity funds";
        display = "Annuity Funds";
      } else if (t.includes("phf")) {
        key = "phf";
        display = "PHF";
      } else {
        key = t;
        // Keep display as Title Cased variant
        display = rawName.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      }

      const existing = observedMap.get(key);
      if (existing) {
        existing.instrumentCount = (existing.instrumentCount ?? 0) + 1;
        existing._currencies.add(instrument.currency || "NGN");
        continue;
      }

      observedMap.set(key, {
        id: `pb-imported-${key.replace(/[^a-z0-9]+/g, "-")}`,
        name: display,
        type: "Custom",
        baseCurrency: instrument.currency || "NGN",
        description: `Imported from ${instrument.sourceFileName ?? "uploaded workbook"}`,
        manager: "Imported via Deal Capture",
        mandatedBy: instrument.importBatchLabel ?? "Uploaded book",
        strategy: "Imported portfolio book",
        status: "Active",
        createdAt: instrument.purchaseDate || new Date().toISOString().slice(0, 10),
        instrumentCount: 1,
        origin: "imported",
        _currencies: new Set([instrument.currency || "NGN"]),
      });
    }

    const observedList = Array.from(observedMap.values()).map(p => {
      if (p._currencies.size > 1) {
        p.baseCurrency = "Mixed";
      } else if (p._currencies.size === 1) {
        p.baseCurrency = Array.from(p._currencies)[0];
      }
      return p as Portfolio;
    });

    const merged = managedPortfolios.map((portfolio) => {
      const observedMatch = observedList.find(o => o.name.toLowerCase() === portfolio.name.toLowerCase());
      if (!observedMatch) return portfolio;

      return {
        ...portfolio,
        instrumentCount: observedMatch.instrumentCount,
      };
    });

    for (const obs of observedList) {
      if (!merged.find((m) => m.name.toLowerCase() === obs.name.toLowerCase())) {
        merged.push(obs);
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
