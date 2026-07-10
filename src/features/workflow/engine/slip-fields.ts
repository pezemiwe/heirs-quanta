import type { DealEconomics, DealSlip } from "../types";

/** Heirs brand red — matches IFRS 9 PDF exports (reports.tsx). */
export const HEIRS_BRAND_HEX = "#C8102E";
export const HEIRS_BRAND_RGB = [200, 16, 46] as const;

export interface SlipDisplayField {
  label: string;
  value: string;
}

const EM = "—";

function daysBetween(a: string, b: string): number {
  const ms =
    new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

function fmtNum(n: number): string {
  if (!isFinite(n) || n === 0) return EM;
  return n.toLocaleString("en-NG", { maximumFractionDigits: 2 });
}

function fmtPct(rate: number): string {
  if (!isFinite(rate) || rate === 0) return EM;
  const pct = rate <= 1 ? rate * 100 : rate;
  return String(Number(pct.toFixed(4)));
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return EM;
  return iso.slice(0, 10);
}

/** Par / principal — shown in the notional amount highlight box. */
export function dealNotional(e: DealEconomics): number {
  return e.faceValue;
}

export function dealSlipTitle(e: DealEconomics): string {
  const name = e.instrumentName?.trim();
  if (name) return `${name} · ${e.assetClass}`;
  return `${e.issuer} · ${e.assetClass}`;
}

/** Version label: transition count + last-updated date. */
export function slipVersionLabel(slip: DealSlip): string {
  const version = Math.max(1, slip.timeline.length);
  return `v${version} · ${slip.updatedAt.slice(0, 10)}`;
}

/** Submitted date — timeline transition, else createdAt for drafts. */
export function submittedDate(slip: DealSlip): string {
  const tx = slip.timeline.find((t) => t.to === "Submitted");
  return fmtDate(tx?.at ?? slip.createdAt);
}

/** Approved-by from the Approved timeline transition. */
export function approvedByName(slip: DealSlip): string {
  const tx = slip.timeline.find((t) => t.to === "Approved");
  if (tx?.byUser) return tx.byUser;
  const step = slip.approvals.find((a) => a.action === "Approved");
  return step?.byUser ?? EM;
}

/** Settlement confirmation date, blank until confirmed. */
export function settlementDate(slip: DealSlip): string {
  return fmtDate(slip.settlement.confirmedAt);
}

export function registerRef(slip: DealSlip): string {
  return slip.registerId ?? EM;
}

/** Economics & terms rows for the printable document view. */
export function documentEconomicsFields(e: DealEconomics): SlipDisplayField[] {
  const tenorDays =
    e.purchaseDate && e.maturityDate
      ? daysBetween(e.purchaseDate, e.maturityDate)
      : null;

  const isMoneyMarket =
    e.assetClass === "Bank Placement" ||
    e.assetClass === "Fixed Deposit" ||
    e.assetClass === "Treasury Bill" ||
    e.assetClass === "Commercial Paper";

  return [
    { label: "Counterparty", value: e.counterparty || EM },
    {
      label: isMoneyMarket ? "Principal amount" : "Face value",
      value: fmtNum(e.faceValue),
    },
    { label: "Currency", value: e.currency || EM },
    {
      label: "Coupon / interest rate %",
      value: fmtPct(e.couponRate || e.discountRate || 0),
    },
    { label: "Day count convention", value: e.dayCount || "Actual/365" },
    { label: "Trade / purchase date", value: e.purchaseDate || EM },
    { label: "Settlement date", value: e.settlementDate || EM },
    { label: "Maturity date", value: e.maturityDate || EM },
    {
      label: "Tenor (days)",
      value: tenorDays != null ? `${tenorDays} days` : EM,
    },
  ];
}

export function fmtNotionalCurrency(n: number, currency: string): string {
  if (!isFinite(n) || n === 0) return EM;
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString("en-NG")}`;
  }
}
