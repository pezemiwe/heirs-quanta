/**
 * Heirs Quanta - Deal Slip → Instrument conversion
 *
 * The ONLY place a settled deal slip becomes an Instrument in the shared
 * instrument book. Called exactly once, at the moment a deal slip's
 * settlement instruction is confirmed (Pending Settlement -> Settled).
 */

import type { Instrument, InstrumentType } from "../../valuation/engine/types";
import type { AssetClass, DealSlip } from "../types";

const ASSET_CLASS_TO_INSTRUMENT_TYPE: Record<AssetClass, InstrumentType> = {
  "FGN Bond": "FGN Bond",
  "State Bond": "State Bond",
  "Corporate Bond": "Corporate Bond",
  Eurobond: "Eurobond",
  "Treasury Bill": "T-Bill",
  "Commercial Paper": "Commercial Paper",
  "Bank Placement": "Bank Placement",
  "Fixed Deposit": "Fixed Deposit",
  Equity: "Equity",
  Sukuk: "FGN Bond",
  "Mutual Fund": "Mutual Fund",
};

export function dealSlipToInstrument(slip: DealSlip): Instrument {
  const e = slip.economics;
  const isEquity = e.assetClass === "Equity";
  // purchasePriceDecimal is a clean-price fraction of par (e.g. 0.985);
  // Instrument.purchasePrice is an absolute local-currency amount, same
  // scale as faceValue - matches every other producer of Instrument records
  // (workbook-parser.ts, deal capture) in this codebase.
  const purchasePrice = e.purchasePriceDecimal * e.faceValue;

  return {
    id: slip.instrumentId ?? slip.id,
    name: e.instrumentName,
    instrumentType: ASSET_CLASS_TO_INSTRUMENT_TYPE[e.assetClass],
    issuer: e.issuer,
    sector: e.sector,
    portfolioBook: e.portfolioBook,
    classification: e.classification,
    ifrs13Level: e.ifrs13Level,
    currency: e.currency,
    faceValue: e.faceValue,
    purchasePrice: purchasePrice || e.faceValue,
    purchaseDate: e.purchaseDate,
    maturityDate: e.maturityDate,
    couponRate: e.couponRate,
    couponFrequency: isEquity ? "N/A" : e.couponFrequency,
    status: "Active",
    bookedBy: slip.createdBy.name,
    marketYield: e.purchaseYield,
    impairmentStage: isEquity ? "N/A" : "Stage 1",
    eclProvision: 0,
  };
}
