import { buildAmortSchedule } from './src/features/valuation/engine/index';
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
  faceValue: 54588088.88, // manually setting what the parser will now produce
  purchasePrice: 53444235.82,
  purchaseDate: "2026-03-31",
  maturityDate: "2026-06-01",
  couponRate: 0,
  couponFrequency: "Monthly",
  status: "Active",
  bookedBy: "Union Bank",
  impairmentStage: "Stage 1",
  eclProvision: 0,
};

const result = buildAmortSchedule(inst, new Date("2026-04-30"));
console.log(JSON.stringify(result.schedule, null, 2));