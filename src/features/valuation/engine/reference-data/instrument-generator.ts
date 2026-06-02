import type {
  Currency,
  ImpairmentStage,
  Instrument,
  InstrumentType,
} from "../types";
import { between, pick } from "./random";
import { ISSUERS } from "./issuers";
import { TYPE_DEFAULTS } from "./type-defaults";

const VALUATION_REFERENCE = new Date("2026-05-28T00:00:00Z");

function randomPurchaseAndMaturity(tenor: { min: number; max: number }): {
  purchase: string;
  maturity: string;
} {
  const totalTenor = between(tenor.min, tenor.max);
  // for some, the purchase date is in the past; for others may be recent
  const yearsHeld = between(0.1, Math.min(totalTenor - 0.1, 6));
  const purchaseDate = new Date(
    VALUATION_REFERENCE.getTime() - yearsHeld * 365.25 * 86_400_000,
  );
  const maturityDate = new Date(
    purchaseDate.getTime() + totalTenor * 365.25 * 86_400_000,
  );
  return {
    purchase: purchaseDate.toISOString().slice(0, 10),
    maturity: maturityDate.toISOString().slice(0, 10),
  };
}

export function generateInstrument(
  id: string,
  type: InstrumentType,
): Instrument {
  const def = TYPE_DEFAULTS[type];
  const cat = ISSUERS[type] || [{ issuer: "Unknown", sector: "Other" }];
  const issuerInfo = pick(cat);
  const classification = pick(def.classification);
  const { purchase, maturity } = randomPurchaseAndMaturity(def.tenorYears);
  const faceValue =
    Math.round(between(def.faceMin, def.faceMax) / 1_000_000) * 1_000_000;
  const discountPct = between(def.discountPct.min, def.discountPct.max);
  const purchasePrice = Math.round(faceValue * (1 - discountPct));
  const coupon =
    def.coupon.max === 0
      ? 0
      : Math.round(between(def.coupon.min, def.coupon.max) * 10000) / 10000;

  const currency: Currency = type === "Eurobond" ? "USD" : "NGN";

  const stages: ImpairmentStage[] = [
    "Stage 1",
    "Stage 1",
    "Stage 1",
    "Stage 2",
  ];
  const stage: ImpairmentStage =
    classification === "FVTPL" || type === "Equity" ? "N/A" : pick(stages);

  const eclProvision =
    stage === "Stage 1"
      ? Math.round(faceValue * 0.001)
      : stage === "Stage 2"
        ? Math.round(faceValue * 0.005)
        : 0;

  return {
    id,
    name: makeName(type, issuerInfo.issuer, coupon, maturity),
    instrumentType: type,
    issuer: issuerInfo.issuer,
    sector: issuerInfo.sector,
    classification,
    ifrs13Level: def.level,
    currency,
    faceValue:
      currency === "USD" ? Math.round(faceValue / 1000) * 1000 : faceValue,
    purchasePrice:
      currency === "USD"
        ? Math.round(purchasePrice / 1000) * 1000
        : purchasePrice,
    purchaseDate: purchase,
    maturityDate: maturity,
    couponRate: coupon,
    couponFrequency: def.freq,
    status: "Active",
    impairmentStage: stage,
    eclProvision,
  };
}

function makeName(
  type: InstrumentType,
  issuer: string,
  coupon: number,
  maturity: string,
): string {
  const yr = maturity.slice(0, 4);
  const pct = (coupon * 100).toFixed(2).replace(/\.00$/, "");
  switch (type) {
    case "FGN Bond":
      return `FGN Bond ${pct}% ${yr}`;
    case "State Bond":
      return `${issuer} Bond ${pct}% ${yr}`;
    case "Corporate Bond":
      return `${issuer} Bond ${pct}% ${yr}`;
    case "Eurobond":
      return `${issuer} Eurobond ${pct}% ${yr}`;
    case "T-Bill":
      return `T-Bill ${yr}`;
    case "Commercial Paper":
      return `${issuer} CP ${yr}`;
    case "Promissory Note":
      return `${issuer} ${yr}`;
    case "Bank Placement":
      return `${issuer} Placement ${pct}%`;
    case "Fixed Deposit":
      return `${issuer} FD ${pct}%`;
    case "Mutual Fund":
      return `${issuer} Fund`;
    case "Equity":
      return `${issuer} Equity`;
  }
}
