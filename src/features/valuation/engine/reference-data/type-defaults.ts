import type { Classification, CouponFrequency, InstrumentType } from "../types";

export const TYPE_DEFAULTS: Record<
  InstrumentType,
  {
    classification: Classification[];
    coupon: { min: number; max: number };
    freq: CouponFrequency;
    tenorYears: { min: number; max: number };
    faceMin: number;
    faceMax: number;
    discountPct: { min: number; max: number };
    level: "L1" | "L2" | "L3";
  }
> = {
  "FGN Bond": {
    classification: ["AC", "FVOCI"],
    coupon: { min: 0.12, max: 0.225 },
    freq: "Semi",
    tenorYears: { min: 2, max: 25 },
    faceMin: 100_000_000,
    faceMax: 1_000_000_000,
    discountPct: { min: -0.05, max: 0.05 },
    level: "L1",
  },
  "State Bond": {
    classification: ["FVOCI"],
    coupon: { min: 0.135, max: 0.18 },
    freq: "Semi",
    tenorYears: { min: 4, max: 10 },
    faceMin: 50_000_000,
    faceMax: 500_000_000,
    discountPct: { min: -0.04, max: 0.04 },
    level: "L2",
  },
  "Corporate Bond": {
    classification: ["AC", "FVOCI"],
    coupon: { min: 0.14, max: 0.185 },
    freq: "Semi",
    tenorYears: { min: 3, max: 8 },
    faceMin: 30_000_000,
    faceMax: 500_000_000,
    discountPct: { min: -0.05, max: 0.05 },
    level: "L2",
  },
  Eurobond: {
    classification: ["FVOCI", "FVTPL"],
    coupon: { min: 0.0625, max: 0.095 },
    freq: "Semi",
    tenorYears: { min: 3, max: 12 },
    faceMin: 5_000_000,
    faceMax: 20_000_000,
    discountPct: { min: -0.02, max: 0.02 },
    level: "L1",
  },
  "T-Bill": {
    classification: ["AC", "FVTPL"],
    coupon: { min: 0, max: 0 },
    freq: "Zero",
    tenorYears: { min: 0.25, max: 1 },
    faceMin: 100_000_000,
    faceMax: 500_000_000,
    discountPct: { min: 0.05, max: 0.2 },
    level: "L1",
  },
  "Commercial Paper": {
    classification: ["FVTPL", "AC"],
    coupon: { min: 0, max: 0 },
    freq: "Zero",
    tenorYears: { min: 0.25, max: 1 },
    faceMin: 100_000_000,
    faceMax: 400_000_000,
    discountPct: { min: 0.06, max: 0.18 },
    level: "L2",
  },
  "Promissory Note": {
    classification: ["AC"],
    coupon: { min: 0, max: 0 },
    freq: "Zero",
    tenorYears: { min: 1, max: 3 },
    faceMin: 100_000_000,
    faceMax: 300_000_000,
    discountPct: { min: 0.05, max: 0.15 },
    level: "L2",
  },
  "Bank Placement": {
    classification: ["AC"],
    coupon: { min: 0.14, max: 0.22 },
    freq: "Quarterly",
    tenorYears: { min: 0.25, max: 1 },
    faceMin: 80_000_000,
    faceMax: 250_000_000,
    discountPct: { min: 0, max: 0 },
    level: "L2",
  },
  "Fixed Deposit": {
    classification: ["AC"],
    coupon: { min: 0.13, max: 0.2 },
    freq: "Quarterly",
    tenorYears: { min: 0.25, max: 1 },
    faceMin: 50_000_000,
    faceMax: 250_000_000,
    discountPct: { min: 0, max: 0 },
    level: "L2",
  },
  "Mutual Fund": {
    classification: ["FVTPL"],
    coupon: { min: 0, max: 0 },
    freq: "N/A",
    tenorYears: { min: 1, max: 5 },
    faceMin: 50_000_000,
    faceMax: 200_000_000,
    discountPct: { min: -0.2, max: -0.05 },
    level: "L2",
  },
  Equity: {
    classification: ["FVOCI", "FVTPL"],
    coupon: { min: 0, max: 0 },
    freq: "N/A",
    tenorYears: { min: 10, max: 20 },
    faceMin: 5_000_000,
    faceMax: 70_000_000,
    discountPct: { min: -0.2, max: -0.05 },
    level: "L1",
  },
};
