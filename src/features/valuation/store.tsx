import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Asset, Assumptions, EngineResult } from "./engine/types";
import { runEngine } from "./engine";
import { parseAssetsCSV } from "./engine/parsing";
import { DEFAULT_ASSUMPTIONS, SAMPLE_ASSETS } from "./engine/reference-data";

interface ValuationContextValue {
  assets: Asset[];
  assumptions: Assumptions;
  result: EngineResult;
  hasData: boolean;
  lastUploadedFile: string | null;
  parseErrors: { row: number; message: string }[];
  selectedAssetId: string | null;
  setSelectedAssetId: (id: string | null) => void;
  setAssets: (a: Asset[]) => void;
  setAssumptions: (a: Assumptions) => void;
  updateAsset: (id: string, patch: Partial<Asset>) => void;
  addAsset: (a: Asset) => void;
  removeAsset: (id: string) => void;
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
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assumptions, setAssumptions] =
    useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [lastUploadedFile, setLastUploadedFile] = useState<string | null>(null);
  const [parseErrors, setParseErrors] = useState<
    { row: number; message: string }[]
  >([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const result = useMemo(
    () => runEngine(assets, assumptions),
    [assets, assumptions],
  );

  const value: ValuationContextValue = {
    assets,
    assumptions,
    result,
    hasData: assets.length > 0,
    lastUploadedFile,
    parseErrors,
    selectedAssetId,
    setSelectedAssetId,
    setAssets,
    setAssumptions,
    updateAsset: (id, patch) => {
      setAssets((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      );
    },
    addAsset: (a) => {
      setAssets((prev) => [a, ...prev]);
    },
    removeAsset: (id) => {
      setAssets((prev) => prev.filter((a) => a.id !== id));
      setSelectedAssetId((cur) => (cur === id ? null : cur));
    },
    loadSample: () => {
      setAssets(SAMPLE_ASSETS);
      setLastUploadedFile(
        `Heirs Holdings Sample Portfolio (${SAMPLE_ASSETS.length} assets)`,
      );
      setParseErrors([]);
      setSelectedAssetId(SAMPLE_ASSETS[0]?.id ?? null);
    },
    loadFromCSV: (text, fileName) => {
      const { assets: parsed, errors } = parseAssetsCSV(text);
      setAssets(parsed);
      setLastUploadedFile(fileName ?? "uploaded.csv");
      setParseErrors(errors);
      setSelectedAssetId(parsed[0]?.id ?? null);
      return { ok: parsed.length > 0, count: parsed.length, errors };
    },
    clear: () => {
      setAssets([]);
      setLastUploadedFile(null);
      setParseErrors([]);
      setSelectedAssetId(null);
    },
  };

  return (
    <ValuationContext.Provider value={value}>
      {children}
    </ValuationContext.Provider>
  );
}

export function useValuation() {
  const ctx = useContext(ValuationContext);
  if (!ctx)
    throw new Error("useValuation must be used within ValuationProvider");
  return ctx;
}
