import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Assumptions,
  EngineResult,
  Security,
  SecurityComputed,
} from "./engine/types";
import { runEngine } from "./engine";
import { parseSecuritiesCSV } from "./engine/parsing";
import { DEFAULT_ASSUMPTIONS } from "./engine/reference-data";
import { useInstrumentBook } from "../../context/instrument-book";
import { loadOverrides } from "./pages/pd-tables";

interface IFRS9ContextValue {
  securities: Security[];
  assumptions: Assumptions;
  result: EngineResult;
  /**
   * result.rows keyed by Instrument.id, for pages that need per-instrument
   * stage/ECL/coverage (Security itself carries no instrument id). Correct
   * whenever `securities` is still in sync with the shared instrument book
   * (the normal upload → view-reports flow); may miss rows if a user has
   * manually edited securities via the IFRS 9 Data Manager.
   */
  resultByInstrumentId: Map<string, SecurityComputed>;
  hasData: boolean;
  lastUploadedFile: string | null;
  parseErrors: { row: number; message: string }[];
  setSecurities: (s: Security[]) => void;
  updateSecurity: (sn: number, patch: Partial<Security>) => void;
  removeSecurity: (sn: number) => void;
  setAssumptions: (a: Assumptions) => void;
  loadSample: () => void;
  loadFromCSV: (
    text: string,
    fileName?: string,
  ) => {
    ok: boolean;
    count: number;
    errors: { row: number; message: string }[];
  };
  clear: () => void;
}

const IFRS9Context = createContext<IFRS9ContextValue | null>(null);

export function IFRS9Provider({ children }: { children: ReactNode }) {
  const book = useInstrumentBook();
  const [securities, setSecurities] = useState<Security[]>(
    book.securities.length > 0 ? book.securities : [],
  );
  const [assumptions, setAssumptions] =
    useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [lastUploadedFile, setLastUploadedFile] = useState<string | null>(
    book.securities.length > 0
      ? book.importState.fileName ?? `Portfolio Book`
      : null,
  );
  const [parseErrors, setParseErrors] = useState<
    { row: number; message: string }[]
  >([]);

  /* Sync from InstrumentBook whenever the shared book changes */
  useEffect(() => {
    setSecurities(book.securities);
    setLastUploadedFile(
      book.securities.length > 0
        ? (book.importState.fileName ?? `Imported (${book.securities.length} instruments)`)
        : null,
    );
    setParseErrors([]);
  }, [book.importState.fileName, book.securities]);

  const result = useMemo(() => {
    const pdOverrides = loadOverrides() as Assumptions["pdOverrides"];
    return runEngine(securities, { ...assumptions, pdOverrides });
  }, [securities, assumptions]);

  const resultByInstrumentId = useMemo(() => {
    const eligible = book.instruments.filter(
      (i) => i.instrumentType !== "Equity" && i.couponFrequency !== "N/A",
    );
    const map = new Map<string, SecurityComputed>();
    eligible.forEach((inst, idx) => {
      const row = result.rows[idx];
      if (row) map.set(inst.id, row);
    });
    return map;
  }, [book.instruments, result.rows]);

  const value: IFRS9ContextValue = {
    securities,
    assumptions,
    result,
    resultByInstrumentId,
    hasData: securities.length > 0,
    lastUploadedFile,
    parseErrors,
    setSecurities,
    updateSecurity: (sn, patch) => {
      setSecurities((prev) =>
        prev.map((s) => (s.sn === sn ? { ...s, ...patch } : s)),
      );
    },
    setAssumptions,
    loadSample: () => {
      setSecurities(book.securities);
      setLastUploadedFile(
        book.importState.fileName ?? `Portfolio Book (${book.securities.length} instruments)`,
      );
      setParseErrors([]);
    },
    loadFromCSV: (text, fileName) => {
      const { securities: parsed, errors } = parseSecuritiesCSV(text);
      setSecurities(parsed);
      setLastUploadedFile(fileName ?? "uploaded.csv");
      setParseErrors(errors);
      return { ok: parsed.length > 0, count: parsed.length, errors };
    },
    clear: () => {
      setSecurities([]);
      setLastUploadedFile(null);
      setParseErrors([]);
    },
    removeSecurity: (sn) =>
      setSecurities((prev) => prev.filter((s) => s.sn !== sn)),
  };

  return (
    <IFRS9Context.Provider value={value}>{children}</IFRS9Context.Provider>
  );
}

export function useIFRS9(): IFRS9ContextValue {
  const v = useContext(IFRS9Context);
  if (!v) throw new Error("useIFRS9 must be used inside IFRS9Provider");
  return v;
}
