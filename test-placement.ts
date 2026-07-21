import { valueInstrument } from './src/features/valuation/engine/index';
import type { Instrument } from './src/features/valuation/engine/types';

const inst: Instrument = {
  id: "PLC-1",
  name: "Union Bank Placement",
  instrumentType: "Bank Placement",
  issuer: "Union Bank",
  sector: "Banking",
  portfolioBook: "Placements <90 Days",
  classification: "AC",
  ifrs13Level: "L2",
  currency: "NGN",
  faceValue: 53444235.82,
  purchasePrice: 53444235.82,
  purchaseDate: "2026-03-31",
  maturityDate: "2026-06-01",
  couponRate: 0.14,
  couponFrequency: "Zero",
  status: "Active",
  bookedBy: "Union Bank",
  impairmentStage: "Stage 1",
  eclProvision: 0,
};

const assumptions = {
  valuationDate: "2026-04-30",
  yieldCurves: {},
  fxRates: {},
  riskFreeRates: {},
  lossGivenDefault: 0.45
};

const result = valueInstrument(inst, assumptions);
console.log(JSON.stringify(result.cashFlowSchedule, null, 2));
console.log("Valuation:", result.balanceSheetValueNGN);