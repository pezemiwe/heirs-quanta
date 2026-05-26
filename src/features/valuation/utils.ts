import type { AssetType, IFRS13Level } from "./engine/types";

/* ─── currency formatters ───────────────────────────────── */
export function fmtNGN(millions: number, decimals = 1): string {
  if (millions == null || isNaN(millions)) return "—";
  const abs = Math.abs(millions);
  const sign = millions < 0 ? "-" : "";
  if (abs >= 1_000_000)
    return `${sign}₦${(abs / 1_000_000).toFixed(decimals)}T`;
  if (abs >= 1_000) return `${sign}₦${(abs / 1_000).toFixed(decimals)}B`;
  return `${sign}₦${abs.toFixed(decimals)}M`;
}

export function fmtPct(v: number, decimals = 1): string {
  if (v == null || isNaN(v)) return "—";
  return `${(v * 100).toFixed(decimals)}%`;
}

export function fmtNumber(v: number, decimals = 0): string {
  if (v == null || isNaN(v)) return "—";
  return v.toLocaleString("en-NG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/* ─── enum label maps ───────────────────────────────────── */
export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  subsidiary: "Subsidiary",
  equity_listed: "Listed Equity",
  equity_unlisted: "Unlisted Equity",
  real_estate: "Real Estate",
  bond: "Bond",
  tbill: "Treasury Bill",
  pe_fund: "PE Fund",
  joint_venture: "Joint Venture",
};

export const ASSET_TYPE_COLOR: Record<AssetType, string> = {
  subsidiary: "#CC0000",
  equity_listed: "#B30000",
  equity_unlisted: "#800000",
  real_estate: "#5C0000",
  bond: "#0f766e",
  tbill: "#1A1A1A",
  pe_fund: "#7c2d12",
  joint_venture: "#9333ea",
};

export const IFRS13_BADGE: Record<IFRS13Level, string> = {
  "Level 1": "bg-teal-50 text-success",
  "Level 2": "bg-blue-50 text-blue-700",
  "Level 3": "bg-pale-red text-primary",
};
