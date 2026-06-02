import type { Deal, InvestmentType, Priority, Stage } from "./types";

export const STAGES: Stage[] = [
  "Prospecting",
  "Due Diligence",
  "Term Sheet",
  "IC Approval",
  "Closed",
];

export const STAGE_CONFIG: Record<
  Stage,
  { border: string; label: string; bg: string; dot: string }
> = {
  Prospecting: {
    border: "border-t-slate-400",
    label: "text-slate-500",
    bg: "bg-slate-50",
    dot: "bg-slate-400",
  },
  "Due Diligence": {
    border: "border-t-blue-400",
    label: "text-blue-600",
    bg: "bg-blue-50",
    dot: "bg-blue-400",
  },
  "Term Sheet": {
    border: "border-t-amber-400",
    label: "text-amber-600",
    bg: "bg-amber-50",
    dot: "bg-amber-400",
  },
  "IC Approval": {
    border: "border-t-orange-500",
    label: "text-orange-600",
    bg: "bg-orange-50",
    dot: "bg-orange-500",
  },
  Closed: {
    border: "border-t-teal-500",
    label: "text-teal-600",
    bg: "bg-teal-50",
    dot: "bg-teal-500",
  },
};

export const PRIORITY_CONFIG: Record<
  Priority,
  { bar: string; badge: string; label: string }
> = {
  high: {
    bar: "bg-danger",
    badge: "bg-red-50 text-danger border border-red-200",
    label: "High",
  },
  medium: {
    bar: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    label: "Medium",
  },
  low: {
    bar: "bg-slate-300",
    badge: "bg-slate-50 text-slate-500 border border-slate-200",
    label: "Low",
  },
};

export const SECTOR_COLORS: Record<string, string> = {
  "Financial Services": "bg-blue-50 text-blue-700",
  FinTech: "bg-purple-50 text-purple-700",
  Technology: "bg-indigo-50 text-indigo-700",
  Agriculture: "bg-green-50 text-green-700",
  Energy: "bg-orange-50 text-orange-700",
  "Healthcare / Real Estate": "bg-teal-50 text-teal-700",
  Infrastructure: "bg-cyan-50 text-cyan-700",
  "Consumer Goods": "bg-pink-50 text-pink-700",
};

export const INV_TYPES: InvestmentType[] = [
  "Equity",
  "Debt",
  "Hybrid",
  "Real Assets",
];

export const SECTORS = Object.keys(SECTOR_COLORS);

export const EMPTY_DRAFT: Omit<Deal, "id"> = {
  name: "",
  sector: "Financial Services",
  stage: "Prospecting",
  irr: 15,
  size: 5,
  currency: "NGN",
  lead: "",
  priority: "medium",
  investmentType: "Equity",
  targetClose: "",
  notes: "",
};

export const INITIAL_DEALS: Deal[] = [
  {
    id: "D001",
    name: "Heirs Microfinance Expansion",
    sector: "Financial Services",
    stage: "IC Approval",
    irr: 18.4,
    size: 12.5,
    currency: "NGN",
    lead: "F. Aliyu",
    priority: "high",
    investmentType: "Equity",
    targetClose: "2026-06-30",
    notes:
      "Board approval meeting 28 May. Regulatory pre-clearance obtained from CBN.",
  },
  {
    id: "D002",
    name: "Afropay Digital Payments",
    sector: "FinTech",
    stage: "Due Diligence",
    irr: 31.2,
    size: 8.8,
    currency: "USD",
    lead: "F. Aliyu",
    priority: "high",
    investmentType: "Equity",
    targetClose: "2026-07-15",
    notes:
      "CBN PSSP licence review in progress. Legal DD expected to close 5-Jun.",
  },
  {
    id: "D003",
    name: "Lagos Tier-3 Data Centre JV",
    sector: "Technology",
    stage: "Term Sheet",
    irr: 22.0,
    size: 45.0,
    currency: "NGN",
    lead: "F. Aliyu",
    priority: "medium",
    investmentType: "Hybrid",
    targetClose: "2026-08-01",
    notes:
      "JV partner: MTN Infrastructure. Term sheet signed 20 May. Legal review underway.",
  },
  {
    id: "D004",
    name: "Northern Agri-Processing Hub",
    sector: "Agriculture",
    stage: "Prospecting",
    irr: 19.5,
    size: 22.0,
    currency: "NGN",
    lead: "F. Aliyu",
    priority: "medium",
    investmentType: "Debt",
    targetClose: "2026-09-30",
    notes:
      "FGN incentive zone eligible — NIRSAL co-investment under discussion.",
  },
  {
    id: "D005",
    name: "Transcorp Energy Spinoff Stake",
    sector: "Energy",
    stage: "Due Diligence",
    irr: 25.8,
    size: 38.0,
    currency: "NGN",
    lead: "F. Aliyu",
    priority: "high",
    investmentType: "Equity",
    targetClose: "2026-07-31",
    notes:
      "Follows Transcorp Group restructuring. Existing board seat provides information advantage.",
  },
  {
    id: "D006",
    name: "Pan-African Healthcare REIT",
    sector: "Healthcare / Real Estate",
    stage: "Prospecting",
    irr: 16.2,
    size: 60.0,
    currency: "USD",
    lead: "F. Aliyu",
    priority: "low",
    investmentType: "Real Assets",
    targetClose: "2026-12-31",
    notes:
      "5-country footprint: Nigeria, Kenya, Ghana, Egypt, South Africa. Anchor LP discussions ongoing.",
  },
];
