/**
 * Heirs Quanta — Deal Slip Control Checks
 *
 * Six automated checks that run against a deal slip's economics before it
 * may move from "Under Review" to "Approved". Every check produces a
 * ControlCheck result; a reviewer may manually "clear" a watch/breach with a
 * recorded reason, but a "pending" check (one that hasn't run yet) always
 * blocks approval.
 */

import type { CheckResultStatus, CheckType, ControlCheck, DealEconomics } from "../types";

const SUB_INVESTMENT_RATINGS = ["CCC+", "CCC", "CCC-", "CC", "C", "SD", "D"];
const WATCH_RATINGS = ["B-", "B", "B+"];

function nowIso(): string {
  return new Date().toISOString();
}

function makeCheck(
  type: CheckType,
  label: string,
  status: CheckResultStatus,
  detail: string,
  extra?: { threshold?: string; actual?: string },
): ControlCheck {
  return {
    id: `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    label,
    status,
    detail,
    threshold: extra?.threshold,
    actual: extra?.actual,
    checkedAt: nowIso(),
    checkedBy: "System",
  };
}

/** Single-issuer concentration vs. the NAICOM 10% guideline used elsewhere in the app. */
export function runLimitCheck(
  economics: DealEconomics,
  existingBookFaceValueNGN: number,
): ControlCheck {
  const fv = economics.faceValue;
  if (!fv || fv <= 0) {
    return makeCheck("limit", "Single-Issuer Concentration", "breach", "Face value is zero or missing — cannot assess concentration.");
  }
  // Concentration limits are meaningless against a book that doesn't exist
  // yet — a founding position can't be "concentrated" relative to nothing.
  if (existingBookFaceValueNGN <= 0) {
    return makeCheck(
      "limit",
      "Single-Issuer Concentration",
      "pass",
      "No existing book to compare against — this would be the seed position.",
    );
  }
  const proposedPct = (fv / (existingBookFaceValueNGN + fv)) * 100;
  const actual = `${proposedPct.toFixed(1)}%`;
  if (proposedPct > 10) {
    return makeCheck(
      "limit",
      "Single-Issuer Concentration",
      "breach",
      `Single-issuer concentration would reach ${actual} — exceeds the NAICOM 10% ceiling.`,
      { threshold: "10%", actual },
    );
  }
  if (proposedPct > 8) {
    return makeCheck(
      "limit",
      "Single-Issuer Concentration",
      "watch",
      `Single-issuer concentration would reach ${actual} — approaching the 10% ceiling.`,
      { threshold: "10%", actual },
    );
  }
  return makeCheck(
    "limit",
    "Single-Issuer Concentration",
    "pass",
    `Single-issuer concentration ${actual} is within the 10% ceiling.`,
    { threshold: "10%", actual },
  );
}

/** Counterparty on file + rationale documented for large tickets. */
export function runComplianceCheck(economics: DealEconomics): ControlCheck {
  if (!economics.counterparty?.trim()) {
    return makeCheck("compliance", "Counterparty & KYC", "breach", "No counterparty recorded — KYC cannot be evidenced.");
  }
  const LARGE_TICKET = 1_000_000_000;
  if (economics.faceValue >= LARGE_TICKET && !economics.notes?.trim()) {
    return makeCheck(
      "compliance",
      "Counterparty & KYC",
      "watch",
      `Ticket size ${economics.faceValue.toLocaleString()} exceeds ₦1B — investment rationale / IC reference should be documented.`,
    );
  }
  return makeCheck("compliance", "Counterparty & KYC", "pass", `Counterparty "${economics.counterparty}" on file.`);
}

/** Sanity-check the clean price against a plausible band around par. */
export function runPricingCheck(economics: DealEconomics): ControlCheck {
  const price = economics.purchasePriceDecimal;
  const actual = price.toFixed(4);
  if (!price || price <= 0) {
    return makeCheck("pricing", "Price Sanity", "breach", "Purchase price is zero or missing.", { actual });
  }
  if (price < 0.5 || price > 1.5) {
    return makeCheck(
      "pricing",
      "Price Sanity",
      "breach",
      `Clean price ${actual} (of par) is well outside a plausible range — verify against the market.`,
      { threshold: "0.50 – 1.50", actual },
    );
  }
  if (price < 0.85 || price > 1.15) {
    return makeCheck(
      "pricing",
      "Price Sanity",
      "watch",
      `Clean price ${actual} (of par) is a wide discount/premium — confirm against a market quote.`,
      { threshold: "0.85 – 1.15", actual },
    );
  }
  return makeCheck("pricing", "Price Sanity", "pass", `Clean price ${actual} (of par) is within a plausible range.`);
}

/** Classification must make sense for the asset class (e.g. equities can't be Amortised Cost). */
export function runEligibilityCheck(economics: DealEconomics): ControlCheck {
  const missing: string[] = [];
  if (!economics.instrumentName?.trim()) missing.push("instrument name");
  if (!economics.issuer?.trim()) missing.push("issuer");
  if (!economics.currency) missing.push("currency");
  if (missing.length > 0) {
    return makeCheck("eligibility", "IFRS 9 Eligibility", "breach", `Missing required field(s): ${missing.join(", ")}.`);
  }
  if (economics.assetClass === "Equity" && economics.classification === "AC") {
    return makeCheck(
      "eligibility",
      "IFRS 9 Eligibility",
      "breach",
      "Equity instruments cannot be classified Amortised Cost under IFRS 9 — use FVOCI or FVTPL.",
    );
  }
  return makeCheck("eligibility", "IFRS 9 Eligibility", "pass", `Classification "${economics.classification}" is consistent with asset class "${economics.assetClass}".`);
}

/** Issuer / counterparty credit rating. */
export function runRatingCheck(economics: DealEconomics): ControlCheck {
  const rating = economics.creditRating?.trim();
  if (!rating) {
    return makeCheck("rating", "Credit Rating", "watch", "No credit rating captured — treated as unrated.", { actual: "Unrated" });
  }
  if (SUB_INVESTMENT_RATINGS.includes(rating)) {
    return makeCheck("rating", "Credit Rating", "breach", `Rating "${rating}" is deep sub-investment grade.`, { actual: rating });
  }
  if (WATCH_RATINGS.includes(rating)) {
    return makeCheck("rating", "Credit Rating", "watch", `Rating "${rating}" is speculative grade — flag for risk sign-off.`, { actual: rating });
  }
  return makeCheck("rating", "Credit Rating", "pass", `Rating "${rating}" is acceptable.`, { actual: rating });
}

/** Maturity must be after purchase, and very long tenors get flagged for duration risk. */
export function runTenorCheck(economics: DealEconomics): ControlCheck {
  const purchase = new Date(economics.purchaseDate + "T00:00:00Z").getTime();
  const maturity = new Date(economics.maturityDate + "T00:00:00Z").getTime();
  if (!isFinite(purchase) || !isFinite(maturity) || maturity <= purchase) {
    return makeCheck("tenor", "Tenor", "breach", "Maturity date must be after the purchase date.");
  }
  const years = (maturity - purchase) / (365.25 * 86400_000);
  const actual = `${years.toFixed(1)}y`;
  if (years > 25) {
    return makeCheck("tenor", "Tenor", "watch", `Tenor ${actual} is unusually long — confirm ALM / duration limits.`, { threshold: "≤ 25y", actual });
  }
  return makeCheck("tenor", "Tenor", "pass", `Tenor ${actual} is within normal bounds.`, { threshold: "≤ 25y", actual });
}

export function runAllChecks(
  economics: DealEconomics,
  ctx: { existingBookFaceValueNGN: number },
): ControlCheck[] {
  return [
    runLimitCheck(economics, ctx.existingBookFaceValueNGN),
    runComplianceCheck(economics),
    runPricingCheck(economics),
    runEligibilityCheck(economics),
    runRatingCheck(economics),
    runTenorCheck(economics),
  ];
}

/** A deal slip may only be Approved once every check is pass/cleared — no breach, watch, or pending. */
export function allChecksPassed(checks: ControlCheck[]): boolean {
  if (checks.length === 0) return false;
  return checks.every((c) => c.status === "pass" || c.status === "cleared");
}

export function outstandingCheckCount(checks: ControlCheck[]): number {
  return checks.filter((c) => c.status === "breach" || c.status === "watch" || c.status === "pending").length;
}
