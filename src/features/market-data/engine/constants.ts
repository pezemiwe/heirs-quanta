/* ─── constants (ported from notebook) ───────────────────────────────── */

export const VALUATION_DATE = "2026-05-28";
export const HISTORY_DAYS = 90;
export const ALERT_BPS = 25;

export const NGN_TENORS = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20];
export const USD_TENORS = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30];

// Base levels (decimal yields)
export const NGN_BASE_CURVE: Record<number, number> = {
  0.25: 0.175,
  0.5: 0.178,
  1: 0.182,
  2: 0.185,
  3: 0.188,
  5: 0.19,
  7: 0.192,
  10: 0.195,
  15: 0.198,
  20: 0.2,
};

export const USD_BASE_CURVE: Record<number, number> = {
  0.25: 0.0525,
  0.5: 0.052,
  1: 0.048,
  2: 0.043,
  3: 0.041,
  5: 0.04,
  7: 0.041,
  10: 0.042,
  20: 0.045,
  30: 0.047,
};

export const FX_BASE: Record<string, number> = {
  "USD-NGN": 1580.0,
  "EUR-NGN": 1720.0,
  "GBP-NGN": 2010.0,
};

export const BOND_UNIVERSE: {
  id: string;
  name: string;
  tenor: number;
  coupon: number;
}[] = [
  { id: "FGN-2027", name: "FGN 14.55% 2027", tenor: 1, coupon: 0.1455 },
  { id: "FGN-2029", name: "FGN 13.98% 2029", tenor: 3, coupon: 0.1398 },
  { id: "FGN-2031", name: "FGN 14.80% 2031", tenor: 5, coupon: 0.148 },
  { id: "FGN-2034", name: "FGN 15.45% 2034", tenor: 8, coupon: 0.1545 },
  { id: "FGN-2042", name: "FGN 16.25% 2042", tenor: 16, coupon: 0.1625 },
  { id: "INV-046", name: "Heirs Corp 18.50% 2030", tenor: 4, coupon: 0.185 },
];

export const COLORS = {
  ngn: "#CC0000",
  usd: "#1A6B8A",
  green: "#2ecc71",
  amber: "#f39c12",
  red: "#e74c3c",
  blue: "#3498db",
  purple: "#8e44ad",
  gray: "#95a5a6",
};
