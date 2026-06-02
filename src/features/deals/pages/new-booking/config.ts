import type { FormState } from "./types";

export const EMPTY: FormState = {
  instrumentType: "",
  isin: "",
  instrumentName: "",
  issuer: "",
  sector: "",
  currency: "NGN",
  classification: "AC",
  ifrs13Level: "Level 2",
  faceValue: "",
  purchasePrice: "1.00",
  purchaseYield: "",
  couponRate: "",
  couponFrequency: "Semi-Annual",
  discountRate: "",
  purchaseDate: "2026-05-28",
  maturityDate: "",
  settlementDate: "2026-05-30",
  custodian: "",
  counterparty: "",
  dayCount: "Actual/365",
  portfolio: "Trading Book",
  notes: "",
};

export const INST_TYPES = [
  "FGN Bond",
  "Treasury Bill",
  "Corporate Bond",
  "Eurobond",
  "Commercial Paper",
  "Equity",
  "Sukuk",
  "Money Market",
];
export const CURRENCIES = ["NGN", "USD", "GBP", "EUR"];
export const CLASSIFICATIONS = [
  { value: "AC", label: "Amortised Cost (AC)" },
  {
    value: "FVOCI",
    label: "Fair Value through Other Comprehensive Income (FVOCI)",
  },
  { value: "FVTPL", label: "Fair Value through Profit or Loss (FVTPL)" },
];
export const IFRS13_LEVELS = ["Level 1", "Level 2", "Level 3"];
export const FREQ_OPTIONS = [
  "Monthly",
  "Quarterly",
  "Semi-Annual",
  "Annual",
  "Zero",
];
export const DAY_COUNTS = [
  "Actual/365",
  "Actual/360",
  "30/360",
  "Actual/Actual",
];
export const SECTORS = [
  "Federal Government",
  "Banking",
  "Telecoms",
  "Oil & Gas",
  "Consumer Goods",
  "Real Estate",
  "Infrastructure",
  "Utilities",
];
