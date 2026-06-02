import type { Assumptions } from "../types";
import { DEFAULT_VALUATION_DATE } from "./valuation-date";
import { DEFAULT_FGN_CURVE, DEFAULT_USD_CURVE } from "./yield-curves";

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  valuationDate: DEFAULT_VALUATION_DATE,
  fgnYieldCurve: DEFAULT_FGN_CURVE,
  usdYieldCurve: DEFAULT_USD_CURVE,
  corporateSpread: 0.025,
  stateSpread: 0.015,
  fxUSD: 1580,
  fxGBP: 1980,
  fxEUR: 1720,
  taxRate: 0.3,
};
