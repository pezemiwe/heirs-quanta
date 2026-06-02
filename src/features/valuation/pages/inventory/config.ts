import type { Classification, InstrumentType } from "../../engine/types";

export const ALL_TYPES: ("All" | InstrumentType)[] = [
  "All",
  "FGN Bond",
  "Corporate Bond",
  "State Bond",
  "Eurobond",
  "T-Bill",
  "Commercial Paper",
  "Promissory Note",
  "Bank Placement",
  "Fixed Deposit",
  "Mutual Fund",
  "Equity",
];

export const ALL_CLASSES: ("All" | Classification)[] = [
  "All",
  "AC",
  "FVOCI",
  "FVTPL",
];

export const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
