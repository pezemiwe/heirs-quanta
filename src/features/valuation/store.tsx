import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Assumptions, Instrument, PortfolioResult } from "./engine/types";
import { runPortfolioEngine } from "./engine";
import { parseInstrumentsCSV } from "./engine/parsing";
import { DEFAULT_ASSUMPTIONS } from "./engine/reference-data";
import { useInstrumentBook } from "../../context/instrument-book";

interface ValuationContextValue {
  instruments: Instrument[];
  assumptions: Assumptions;
  result: PortfolioResult;
  hasData: boolean;
  lastUploadedFile: string | null;
  parseErrors: { row: number; message: string }[];

  setAssumptions: (a: Assumptions) => void;
  addInstrument: (i: Instrument) => void;
  updateInstrument: (id: string, patch: Partial<Instrument>) => void;
  removeInstrument: (id: string) => void;
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

const ValuationContext = createContext<ValuationContextValue | null>(null);

export function ValuationProvider({ children }: { children: ReactNode }) {
  const book = useInstrumentBook();
  const [instruments, setInstruments] = useState<Instrument[]>(
    book.instruments.length > 0
      ? (book.instruments as Instrument[])
      : [],
  );
  const [assumptions, setAssumptions] =
    useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [lastUploadedFile, setLastUploadedFile] = useState<string | null>(
    book.instruments.length > 0
      ? book.importState.fileName ?? "Portfolio Book"
      : null,
  );
  const [parseErrors, setParseErrors] = useState<
    { row: number; message: string }[]
  >([]);

  /* Sync from InstrumentBook whenever the shared book changes */
  useEffect(() => {
    setInstruments(book.instruments as Instrument[]);
    setLastUploadedFile(
      book.instruments.length > 0
        ? (book.importState.fileName ?? `Imported (${book.instruments.length} instruments)`)
        : null,
    );
    setParseErrors([]);
  }, [book.importState.fileName, book.instruments]);

  const result = useMemo(
    () => runPortfolioEngine(instruments, assumptions),
    [instruments, assumptions],
  );

  const value: ValuationContextValue = {
    instruments,
    assumptions,
    result,
    hasData: instruments.length > 0,
    lastUploadedFile,
    parseErrors,
    setAssumptions,
    addInstrument: (i) => setInstruments((p) => [i, ...p]),
    updateInstrument: (id, patch) =>
      setInstruments((p) =>
        p.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      ),
    removeInstrument: (id) =>
      setInstruments((p) => p.filter((x) => x.id !== id)),
    loadSample: () => {
      setInstruments(book.instruments as Instrument[]);
      setLastUploadedFile(
        book.importState.fileName ?? `Portfolio Book (${book.instruments.length} instruments)`,
      );
      setParseErrors([]);
    },
    loadFromCSV: (text, fileName) => {
      const { instruments: parsed, errors } = parseInstrumentsCSV(text);
      setInstruments(parsed);
      setLastUploadedFile(fileName ?? "uploaded.csv");
      setParseErrors(errors);
      return { ok: parsed.length > 0, count: parsed.length, errors };
    },
    clear: () => {
      setInstruments([]);
      setLastUploadedFile(null);
      setParseErrors([]);
    },
  };

  return (
    <ValuationContext.Provider value={value}>
      {children}
    </ValuationContext.Provider>
  );
}

export function useValuation(): ValuationContextValue {
  const ctx = useContext(ValuationContext);
  if (!ctx)
    throw new Error("useValuation must be used within ValuationProvider");
  return ctx;
}
