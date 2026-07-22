/**
 * Heirs Quanta - Instrument Book Context
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
 *   5. clear() removes all uploaded batches and returns the platform to empty state
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
  type UnrecognizedSheet,
} from "../features/deals/engine/workbook-parser";

/* ─────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────── */

export type ImportPhase =
  | "idle"
  | "reading"
  | "parsing"
  | "validating"
  | "conflict"
  | "done"
  | "error";

export interface ImportState {
  phase: ImportPhase;
  progress: number; // 0–100
  currentStep: string;
  fileName: string | null;
  importedAt: string | null;
  summary: SheetSummary[];
  unrecognizedSheets: UnrecognizedSheet[];
  error: string | null;
  dataQualityIssues?: import('../features/valuation/engine/types').DataQualityIssue[];
  conflictData?: {
    parsedInstruments: Instrument[];
    sheets: SheetSummary[];
    unrecognizedSheets: UnrecognizedSheet[];
    overlappingBatches: Set<string>;
    overlapCount: number;
  };
}

export type BookSource = "uploaded" | "captured" | "empty";
export type ImportMode = "append" | "replace";

export interface ImportBatch {
  id: string;
  label: string;
  fileName: string;
  importedAt: string;
  mode: ImportMode;
  instrumentsAdded: number;
  totalInstrumentsAfter: number;
  summary: SheetSummary[];
  unrecognizedSheets: UnrecognizedSheet[];
}

interface InstrumentBookValue {
  /* Canonical datasets */
  instruments: Instrument[];
  securities: Security[];
  holdings: Holding[];

  /* Metadata */
  source: BookSource;
  importState: ImportState;
  batches: ImportBatch[];
  hasData: boolean;

  /* Actions */
  importWorkbook: (file: File) => Promise<void>;
  resolveImportConflict: (mode: "append" | "replace") => void;
  addManualInstrument: (instrument: Instrument) => void;
  clear: () => void;
  removeBatch: (batchId: string) => void;
  removeInstrument: (instrumentId: string, batchId?: string) => void;
}

/* ─────────────────────────────────────────────────────────────
   localStorage helpers
   ───────────────────────────────────────────────────────────── */

const LS_KEY = "hq_instrument_book_v1";

interface PersistedBook {
  instruments: Instrument[];
  fileName: string;
  importedAt: string;
  batches: ImportBatch[];
}

function loadFromStorage(): PersistedBook | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedBook;
    
    // Auto-migrate generic IDs that were loaded before the parser was fixed
    let changed = false;
    parsed.instruments = parsed.instruments.map(inst => {
      if (/^(PLACEMENT|TB|TBILL|COR|SG|FGN|EQ|QEQU|PUSD|INV)\s*[-_]?\s*\d*$/i.test(inst.id)) {
        changed = true;
        const prefix = inst.id.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || "HQ";
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        return { ...inst, id: `HQ-${prefix}-${rand}` };
      }
      return inst;
    });
    
    if (changed) {
      saveToStorage(parsed);
    }
    
    return parsed;
  } catch {
    return null;
  }
}

function saveToStorage(data: PersistedBook) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    // Quota exceeded or private mode - ignore silently
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
  unrecognizedSheets: [],
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
    persisted.current
      ? persisted.current.batches.length > 0
        ? "uploaded"
        : "captured"
      : "empty",
  );
  const [batches, setBatches] = useState<ImportBatch[]>(
    persisted.current?.batches ?? [],
  );
  const [importState, setImportState] = useState<ImportState>(() => {
    if (persisted.current) {
      const latestBatch = persisted.current.batches[persisted.current.batches.length - 1];
      return {
        ...IDLE_STATE,
        phase: "done",
        fileName: persisted.current.fileName,
        importedAt: persisted.current.importedAt,
        summary: latestBatch?.summary ?? [],
        unrecognizedSheets: latestBatch?.unrecognizedSheets ?? [],
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
    const mode: ImportMode = "append";
    const tick = (phase: ImportPhase, progress: number, step: string) =>
      setImportState((s) => ({ ...s, phase, progress, currentStep: step }));

    setImportState({
      phase: "reading",
      progress: 5,
      currentStep: "Reading file…",
      fileName: file.name,
      importedAt: null,
      summary: [],
      unrecognizedSheets: [],
      error: null,
    });

    try {
      // ── Phase 1: Read file bytes ──────────────────────────
      const buffer = await file.arrayBuffer();
      tick("reading", 25, "File loaded - detecting sheets…");
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

      // ── Phase 4: Check for conflicts ───────────────────────
      const overlappingInstruments = result.instruments.filter((parsed) =>
        instruments.some((existing) => existing.id === parsed.id),
      );

      if (overlappingInstruments.length > 0) {
        const overlappingBatches = new Set(
          overlappingInstruments
            .map((i) => instruments.find((e) => e.id === i.id)?.importBatchId)
            .filter((id): id is string => id !== undefined),
        );

        setImportState((s) => ({
          ...s,
          phase: "conflict",
          progress: 95,
          currentStep: "Conflict detected",
          conflictData: {
            parsedInstruments: result.instruments,
            sheets: result.sheets,
            unrecognizedSheets: result.unrecognizedSheets,
            overlappingBatches,
            overlapCount: overlappingInstruments.length,
          },
        }));
        return;
      }

      // ── Phase 5: Commit (No Conflict) ─────────────────────
      commitImport(
        result.instruments,
        result.sheets,
        result.unrecognizedSheets,
        file.name,
        "append",
      );
    } catch (err) {
      setImportState((s) => ({
        ...s,
        phase: "error",
        progress: 0,
        error: `Import failed: ${(err as Error).message}`,
      }));
    }
  }, [instruments]);

  const commitImport = useCallback(
    (
      parsedInstruments: Instrument[],
      sheets: SheetSummary[],
      unrecognizedSheets: UnrecognizedSheet[],
      fileName: string,
      mode: "append" | "replace",
      batchesToRemove?: Set<string>,
    ) => {
      const importedAt = new Date().toISOString();
      const batchId = `batch-${Date.now()}`;
      const batchLabel = `Batch ${new Date(importedAt).toLocaleString()}`;
      const taggedInstruments = parsedInstruments.map((instrument) => ({
        ...instrument,
        sourceFileName: fileName,
        importBatchId: batchId,
        importBatchLabel: batchLabel,
      }));

      // If replacing, filter out instruments from the overlapping batches
      let baseInstruments = instruments;
      let baseBatches = batches;

      if (mode === "replace" && batchesToRemove && batchesToRemove.size > 0) {
        baseInstruments = baseInstruments.filter(
          (inst) => inst.importBatchId && !batchesToRemove.has(inst.importBatchId),
        );
        baseBatches = baseBatches.filter(
          (batch) => !batchesToRemove.has(batch.id),
        );
      }

      const nextInstruments = [...baseInstruments, ...taggedInstruments];
      const nextBatch: ImportBatch = {
        id: batchId,
        label: batchLabel,
        fileName,
        importedAt,
        mode,
        instrumentsAdded: taggedInstruments.length,
        totalInstrumentsAfter: nextInstruments.length,
        summary: sheets,
        unrecognizedSheets,
      };

      const nextBatches = [...baseBatches, nextBatch];

      setInstruments(nextInstruments);
      setBatches(nextBatches);
      setSource("uploaded");

      saveToStorage({
        instruments: nextInstruments,
        fileName,
        importedAt,
        batches: nextBatches,
      });

      setImportState({
        phase: "done",
        progress: 100,
        currentStep: "Complete",
        fileName,
        importedAt,
        summary: sheets,
        unrecognizedSheets,
        error: null,
      });
    },
    [batches, instruments],
  );

  const resolveImportConflict = useCallback(
    (mode: "append" | "replace") => {
      if (importState.phase !== "conflict" || !importState.conflictData || !importState.fileName) {
        return;
      }
      commitImport(
        importState.conflictData.parsedInstruments,
        importState.conflictData.sheets,
        importState.conflictData.unrecognizedSheets,
        importState.fileName,
        mode,
        importState.conflictData.overlappingBatches,
      );
    },
    [importState, commitImport],
  );

  /* ── Clear ────────────────────────────────────────────────── */
  const addManualInstrument = useCallback(
    (instrument: Instrument) => {
      const bookedAt = new Date().toISOString();
      const nextInstruments = [instrument, ...instruments];

      setInstruments(nextInstruments);
      setSource(batches.length > 0 ? "uploaded" : "captured");

      saveToStorage({
        instruments: nextInstruments,
        fileName: importState.fileName ?? "Manual Booking",
        importedAt: importState.importedAt ?? bookedAt,
        batches,
      });

      setImportState((state) => ({
        ...state,
        phase: "done",
        fileName: state.fileName ?? "Manual Booking",
        importedAt: state.importedAt ?? bookedAt,
      }));
    },
    [batches, importState.fileName, importState.importedAt, instruments],
  );

  const clear = useCallback(() => {
    setInstruments([]);
    setBatches([]);
    setSource("empty");
    clearStorage();
    setImportState(IDLE_STATE);
  }, []);

  const removeBatch = useCallback(
    (batchId: string) => {
      const nextInstruments = instruments.filter(
        (instrument) => instrument.importBatchId !== batchId,
      );
      const nextBatches = batches.filter((batch) => batch.id !== batchId);
      const latestBatch = nextBatches[nextBatches.length - 1];

      setInstruments(nextInstruments);
      setBatches(nextBatches);

      if (nextInstruments.length === 0) {
        setSource("empty");
        clearStorage();
        setImportState(IDLE_STATE);
        return;
      }

      setSource("uploaded");
      saveToStorage({
        instruments: nextInstruments,
        fileName:
          latestBatch?.fileName ?? importState.fileName ?? "Uploaded batch",
        importedAt:
          latestBatch?.importedAt ??
          importState.importedAt ??
          new Date().toISOString(),
        batches: nextBatches,
      });

      setImportState((state) => ({
        ...state,
        fileName: latestBatch?.fileName ?? state.fileName,
        importedAt: latestBatch?.importedAt ?? state.importedAt,
      }));
    },
    [batches, importState.fileName, importState.importedAt, instruments],
  );

  const removeInstrument = useCallback(
    (instrumentId: string, batchId?: string) => {
      const nextInstruments = instruments.filter((instrument) => {
        if (batchId) {
          return !(
            instrument.id === instrumentId &&
            instrument.importBatchId === batchId
          );
        }

        return instrument.id !== instrumentId;
      });

      const nextBatches = batches
        .map((batch) => ({
          ...batch,
          instrumentsAdded: nextInstruments.filter(
            (instrument) => instrument.importBatchId === batch.id,
          ).length,
          totalInstrumentsAfter: nextInstruments.length,
        }))
        .filter((batch) => batch.instrumentsAdded > 0);

      setInstruments(nextInstruments);
      setBatches(nextBatches);

      if (nextInstruments.length === 0) {
        setSource("empty");
        clearStorage();
        setImportState(IDLE_STATE);
        return;
      }

      setSource("uploaded");
      saveToStorage({
        instruments: nextInstruments,
        fileName:
          nextBatches[nextBatches.length - 1]?.fileName ??
          importState.fileName ??
          "Uploaded batch",
        importedAt:
          nextBatches[nextBatches.length - 1]?.importedAt ??
          importState.importedAt ??
          new Date().toISOString(),
        batches: nextBatches,
      });
    },
    [batches, importState.fileName, importState.importedAt, instruments],
  );

  const value: InstrumentBookValue = {
    instruments,
    securities,
    holdings,
    source,
    importState,
    batches,
    hasData: instruments.length > 0,
    importWorkbook,
    resolveImportConflict,
    addManualInstrument,
    clear,
    removeBatch,
    removeInstrument,
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

