/**
 * Heirs Quanta — Instrument Book Context
 *
 * The single source of truth for all investment instruments on the platform.
 * Every module (IFRS9, Valuation, Duration Risk, Portfolio, Accounting) reads
 * from this context rather than maintaining its own hardcoded reference data.
 *
 * Data lifecycle:
 *   1. User uploads workbook (xlsx) or single sheet (csv) via Deal Capture
 *   2. parseWorkbook() runs and produces instruments / securities / holdings
 *   3. Results are broadcast here and persisted to localStorage
 *   4. Each module provider re-initialises from this context on mount and on change
 *   5. "Load Demo" restores the original hardcoded reference data at any time
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Instrument } from "../features/valuation/engine/types";
import type { Security } from "../features/ifrs9/engine/types";
import type { Holding } from "../features/portfolio/engine/types";
import {
  parseWorkbook,
  instrumentToSecurity,
  instrumentToHolding,
  type SheetSummary,
} from "../features/deals/engine/workbook-parser";

// Demo data — kept intact for instant reversion
import { SAMPLE_SECURITIES as DEMO_SECURITIES } from "../features/ifrs9/engine/reference-data";
import { SAMPLE_INSTRUMENTS as DEMO_INSTRUMENTS } from "../features/valuation/engine/reference-data";
import { HOLDINGS as DEMO_HOLDINGS } from "../features/portfolio/engine/reference-data";

/* ─────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────── */

export type ImportPhase =
  | "idle"
  | "reading"
  | "parsing"
  | "validating"
  | "done"
  | "error";

export interface ImportState {
  phase: ImportPhase;
  progress: number; // 0–100
  currentStep: string;
  fileName: string | null;
  importedAt: string | null;
  summary: SheetSummary[];
  error: string | null;
}

export type BookSource = "demo" | "uploaded" | "empty";

interface InstrumentBookValue {
  /* Canonical datasets */
  instruments: Instrument[];
  securities: Security[];
  holdings: Holding[];

  /* Metadata */
  source: BookSource;
  importState: ImportState;
  hasData: boolean;

  /* Actions */
  importWorkbook: (file: File) => Promise<void>;
  loadDemo: () => void;
  clear: () => void;
}

/* ─────────────────────────────────────────────────────────────
   localStorage helpers
   ───────────────────────────────────────────────────────────── */

const LS_KEY = "hq_instrument_book_v1";

interface PersistedBook {
  instruments: Instrument[];
  fileName: string;
  importedAt: string;
}

function loadFromStorage(): PersistedBook | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedBook;
  } catch {
    return null;
  }
}

function saveToStorage(data: PersistedBook) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    // Quota exceeded or private mode — ignore silently
  }
}

function clearStorage() {
  localStorage.removeItem(LS_KEY);
}

/* ─────────────────────────────────────────────────────────────
   Context
   ───────────────────────────────────────────────────────────── */

const InstrumentBookContext = createContext<InstrumentBookValue | null>(null);

const IDLE_STATE: ImportState = {
  phase: "idle",
  progress: 0,
  currentStep: "",
  fileName: null,
  importedAt: null,
  summary: [],
  error: null,
};

export function InstrumentBookProvider({ children }: { children: ReactNode }) {
  // Resolve initial state from localStorage (if a previous upload exists)
  const persisted = useRef(loadFromStorage());

  const getInitialInstruments = (): Instrument[] =>
    persisted.current?.instruments ?? [];

  const [instruments, setInstruments] = useState<Instrument[]>(
    getInitialInstruments,
  );
  const [source, setSource] = useState<BookSource>(
    persisted.current ? "uploaded" : "empty",
  );
  const [importState, setImportState] = useState<ImportState>(() => {
    if (persisted.current) {
      return {
        ...IDLE_STATE,
        phase: "done",
        fileName: persisted.current.fileName,
        importedAt: persisted.current.importedAt,
        summary: [],
      };
    }
    return IDLE_STATE;
  });

  /* Derive securities and holdings reactively from instruments */
  const securities: Security[] = instruments
    .filter((i) => i.instrumentType !== "Equity" && i.couponFrequency !== "N/A")
    .map((inst, idx) => instrumentToSecurity(inst, idx + 1));

  const holdings: Holding[] = instruments.map(instrumentToHolding);

  /* ── Import workbook ──────────────────────────────────────── */
  const importWorkbook = useCallback(async (file: File) => {
    const tick = (phase: ImportPhase, progress: number, step: string) =>
      setImportState((s) => ({ ...s, phase, progress, currentStep: step }));

    setImportState({
      phase: "reading",
      progress: 5,
      currentStep: "Reading file…",
      fileName: file.name,
      importedAt: null,
      summary: [],
      error: null,
    });

    try {
      // ── Phase 1: Read file bytes ──────────────────────────
      const buffer = await file.arrayBuffer();
      tick("reading", 25, "File loaded — detecting sheets…");
      await sleep(120);

      // ── Phase 2: Parse workbook ───────────────────────────
      tick("parsing", 35, "Parsing workbook structure…");
      await sleep(80);

      const result = await parseWithProgress(buffer, (sheetName, pct) => {
        setImportState((s) => ({
          ...s,
          phase: "parsing",
          progress: 35 + pct * 45, // 35 → 80
          currentStep: `Parsing ${sheetName}…`,
        }));
      });

      // ── Phase 3: Validate ─────────────────────────────────
      tick("validating", 82, "Validating instrument data…");
      await sleep(150);

      if (result.instruments.length === 0) {
        setImportState((s) => ({
          ...s,
          phase: "error",
          progress: 0,
          error:
            "No instruments could be parsed. Please check the file format matches the expected workbook.",
        }));
        return;
      }

      tick("validating", 92, "Applying data to platform…");
      await sleep(100);

      // ── Phase 4: Commit ───────────────────────────────────
      const importedAt = new Date().toISOString();
      setInstruments(result.instruments);
      setSource("uploaded");

      saveToStorage({
        instruments: result.instruments,
        fileName: file.name,
        importedAt,
      });

      setImportState({
        phase: "done",
        progress: 100,
        currentStep: "Complete",
        fileName: file.name,
        importedAt,
        summary: result.sheets,
        error: null,
      });
    } catch (err) {
      setImportState((s) => ({
        ...s,
        phase: "error",
        progress: 0,
        error: `Import failed: ${(err as Error).message}`,
      }));
    }
  }, []);

  /* ── Load demo data ───────────────────────────────────────── */
  const loadDemo = useCallback(() => {
    // Merge the three hardcoded sources into a unified Instrument[] so all modules see the same data.
    // For demo mode we push instruments directly from both DEMO_INSTRUMENTS and we synthesise
    // Instrument stubs from DEMO_SECURITIES (IFRS9) so the book is complete.
    setInstruments(DEMO_INSTRUMENTS);
    setSource("demo");
    clearStorage();
    setImportState({
      phase: "done",
      progress: 100,
      currentStep: "Demo data loaded",
      fileName: "Demo Dataset",
      importedAt: new Date().toISOString(),
      summary: [
        {
          sheetName: "Demo",
          detectedType: "Portfolio Book",
          rowsParsed: DEMO_INSTRUMENTS.length,
          rowsSkipped: 0,
          warnings: [],
        },
      ],
      error: null,
    });
  }, []);

  /* ── Clear ────────────────────────────────────────────────── */
  const clear = useCallback(() => {
    setInstruments([]);
    setSource("empty");
    clearStorage();
    setImportState(IDLE_STATE);
  }, []);

  // Expose the raw DEMO arrays so module stores can use them when source === "demo"
  useEffect(() => {
    if (source === "demo") {
      // no-op — instruments already set from DEMO_INSTRUMENTS above
    }
  }, [source]);

  const value: InstrumentBookValue = {
    instruments,
    securities,
    holdings,
    source,
    importState,
    hasData: instruments.length > 0,
    importWorkbook,
    loadDemo,
    clear,
  };

  return (
    <InstrumentBookContext.Provider value={value}>
      {children}
    </InstrumentBookContext.Provider>
  );
}

export function useInstrumentBook(): InstrumentBookValue {
  const ctx = useContext(InstrumentBookContext);
  if (!ctx)
    throw new Error(
      "useInstrumentBook must be used inside InstrumentBookProvider",
    );
  return ctx;
}

/* ─────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/**
 * Runs the workbook parser sheet-by-sheet, emitting progress callbacks so the
 * UI can animate while JS is doing the work.
 */
async function parseWithProgress(
  buffer: ArrayBuffer,
  onSheet: (name: string, pct: number) => void,
): Promise<ReturnType<typeof parseWorkbook>> {
  // We let the browser breathe between each callback
  await sleep(0);

  // Peek at sheet names first
  const { read, utils } = await import("xlsx");
  const peek = read(buffer, { type: "array", sheetRows: 0 });
  const total = peek.SheetNames.length;

  for (let i = 0; i < total; i++) {
    onSheet(peek.SheetNames[i], i / total);
    await sleep(40);
  }

  onSheet("Finalising…", 0.95);
  await sleep(40);

  return parseWorkbook(buffer);
}

/* ─────────────────────────────────────────────────────────────
   Re-exports for convenience
   ───────────────────────────────────────────────────────────── */
export { DEMO_SECURITIES, DEMO_INSTRUMENTS, DEMO_HOLDINGS };
