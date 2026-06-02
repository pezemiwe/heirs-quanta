import type { YieldCurvePoint } from "../types";

export const DEFAULT_FGN_CURVE: YieldCurvePoint[] = [
  { tenorYears: 0.25, yield: 0.198 },
  { tenorYears: 0.5, yield: 0.2005 },
  { tenorYears: 1, yield: 0.204 },
  { tenorYears: 2, yield: 0.196 },
  { tenorYears: 3, yield: 0.193 },
  { tenorYears: 5, yield: 0.1885 },
  { tenorYears: 7, yield: 0.185 },
  { tenorYears: 10, yield: 0.182 },
  { tenorYears: 15, yield: 0.179 },
  { tenorYears: 20, yield: 0.176 },
  { tenorYears: 30, yield: 0.174 },
];

export const DEFAULT_USD_CURVE: YieldCurvePoint[] = [
  { tenorYears: 0.25, yield: 0.052 },
  { tenorYears: 0.5, yield: 0.054 },
  { tenorYears: 1, yield: 0.057 },
  { tenorYears: 2, yield: 0.063 },
  { tenorYears: 3, yield: 0.066 },
  { tenorYears: 5, yield: 0.069 },
  { tenorYears: 7, yield: 0.071 },
  { tenorYears: 10, yield: 0.072 },
];
