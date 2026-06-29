import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Assumptions, EngineResult, Security } from "./engine/types";
import { runEngine } from "./engine";
import { parseSecuritiesCSV } from "./engine/parsing";
import { DEFAULT_ASSUMPTIONS } from "./engine/reference-data";
import { useInstrumentBook } from "../../context/instrument-book";

interface IFRS9ContextValue {
  securities: Security[];
  assumptions: Assumptions;
  result: EngineResult;
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

  const result = useMemo(
    () => runEngine(securities, assumptions),
    [securities, assumptions],
  );

  const value: IFRS9ContextValue = {
    securities,
    assumptions,
    result,
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
