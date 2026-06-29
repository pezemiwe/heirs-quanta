import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Assumptions, Instrument } from "../valuation/engine/types";
import { DEFAULT_ASSUMPTIONS } from "../valuation/engine/reference-data";
import { parseInstrumentsCSV } from "../valuation/engine/parsing";
import { useInstrumentBook } from "../../context/instrument-book";
import {
  buildCashflowProjection,
  buildConvexityCurve,
  buildDurationHistogram,
  buildDurationTable,
  buildStressTable,
  computeALMGap,
  computeRiskTotals,
  rollupByClassification,
  rollupBySector,
  rollupByType,
  runCurveScenarios,
  runNigerianScenarios,
} from "./engine";
import type {
  ALMResult,
  ByGroupRow,
  CashflowBucketRow,
  ConvexityCurvePoint,
  DurationHistogramRow,
  DurationRow,
  LiabilityBucket,
  RiskTotals,
  ScenarioImpact,
  StressRow,
} from "./engine/types";
import { DEFAULT_LIABILITY_STRUCTURE } from "./engine/reference-data";

interface RiskResult {
  durationRows: DurationRow[];
  stressRows: StressRow[];
  cashflowBuckets: CashflowBucketRow[];
  curveScenarios: ScenarioImpact[];
  nigerianScenarios: ScenarioImpact[];
  alm: ALMResult;
  bySector: ByGroupRow[];
  byType: ByGroupRow[];
  byClassification: ByGroupRow[];
  totals: RiskTotals;
  durationHistogram: DurationHistogramRow[];
  convexityCurve: ConvexityCurvePoint[];
}

interface DurationRiskContextValue {
  instruments: Instrument[];
  assumptions: Assumptions;
  liabilities: LiabilityBucket[];
  result: RiskResult;
  hasData: boolean;
  lastUploadedFile: string | null;
  parseErrors: { row: number; message: string }[];

  setAssumptions: (a: Assumptions) => void;
  setLiabilities: (l: LiabilityBucket[]) => void;
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

const Ctx = createContext<DurationRiskContextValue | null>(null);

export function DurationRiskProvider({ children }: { children: ReactNode }) {
  const book = useInstrumentBook();
  const [instruments, setInstruments] = useState<Instrument[]>(
    book.instruments.length > 0
      ? (book.instruments as Instrument[])
      : [],
  );
  const [assumptions, setAssumptions] =
    useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [liabilities, setLiabilities] = useState<LiabilityBucket[]>(
    DEFAULT_LIABILITY_STRUCTURE,
  );
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

  const result = useMemo<RiskResult>(() => {
    const durationRows = buildDurationTable(instruments, assumptions);
    const stressRows = buildStressTable(instruments, durationRows, assumptions);
    const cashflowBuckets = buildCashflowProjection(instruments, assumptions);
    const curveScenarios = runCurveScenarios(
      instruments,
      durationRows,
      assumptions,
    );
    const nigerianScenarios = runNigerianScenarios(
      instruments,
      durationRows,
      assumptions,
    );
    const alm = computeALMGap(durationRows, liabilities);
    const totals = computeRiskTotals(durationRows, stressRows);
    return {
      durationRows,
      stressRows,
      cashflowBuckets,
      curveScenarios,
      nigerianScenarios,
      alm,
      bySector: rollupBySector(durationRows),
      byType: rollupByType(durationRows),
      byClassification: rollupByClassification(durationRows),
      totals,
      durationHistogram: buildDurationHistogram(durationRows),
      convexityCurve: buildConvexityCurve(stressRows),
    };
  }, [instruments, assumptions, liabilities]);

  const value: DurationRiskContextValue = {
    instruments,
    assumptions,
    liabilities,
    result,
    hasData: instruments.length > 0,
    lastUploadedFile,
    parseErrors,
    setAssumptions,
    setLiabilities,
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

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDurationRisk(): DurationRiskContextValue {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useDurationRisk must be used within DurationRiskProvider");
  return ctx;
}
