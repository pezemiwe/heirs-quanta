import type { DealEconomics, DealSlip } from "../types";

export interface SlipDisplayField {
  label: string;
  value: string;
}

function daysBetween(a: string, b: string): number {
  const ms =
    new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

function fmtNum(n: number): string {
  if (!isFinite(n) || n === 0) return "—";
  return n.toLocaleString("en-NG", { maximumFractionDigits: 2 });
}

function fmtPct(rate: number): string {
  if (!isFinite(rate) || rate === 0) return "—";
  const pct = rate <= 1 ? rate * 100 : rate;
  return String(Number(pct.toFixed(4)));
}

/** Par / principal — shown in the notional amount highlight box. */
export function dealNotional(e: DealEconomics): number {
  return e.faceValue;
}

/** Cash consideration at purchase (face × clean price). */
export function dealConsideration(e: DealEconomics): number {
  return e.faceValue * e.purchasePriceDecimal;
}

export function dealSlipLabel(e: DealEconomics): string {
  if (e.instrumentName?.trim()) return e.instrumentName.trim();
  return `${e.issuer} · ${e.assetClass}`;
}

export function economicsFields(e: DealEconomics): SlipDisplayField[] {
  const tenor =
    e.purchaseDate && e.maturityDate
      ? `${daysBetween(e.purchaseDate, e.maturityDate)} days`
      : "—";

  const isMoneyMarket =
    e.assetClass === "Bank Placement" ||
    e.assetClass === "Fixed Deposit" ||
    e.assetClass === "Treasury Bill" ||
    e.assetClass === "Commercial Paper";

  const isBond =
    e.assetClass === "FGN Bond" ||
    e.assetClass === "State Bond" ||
    e.assetClass === "Corporate Bond" ||
    e.assetClass === "Eurobond" ||
    e.assetClass === "Sukuk";

  const rows: SlipDisplayField[] = [
    { label: "Counterparty", value: e.counterparty || "—" },
  ];

  if (!isMoneyMarket) {
    rows.push({ label: "Issuer", value: e.issuer || "—" });
  }

  if (e.isin?.trim()) {
    rows.push({ label: "ISIN", value: e.isin.trim() });
  }

  rows.push(
    {
      label: isMoneyMarket ? "Principal amount" : "Face value",
      value: fmtNum(e.faceValue),
    },
    { label: "Currency", value: e.currency || "—" },
  );

  if (isBond || e.assetClass === "Eurobond") {
    rows.push(
      { label: "Coupon rate %", value: fmtPct(e.couponRate) },
      { label: "Coupon frequency", value: e.couponFrequency || "—" },
      {
        label: "Clean price",
        value: e.purchasePriceDecimal ? e.purchasePriceDecimal.toFixed(4) : "—",
      },
      { label: "Consideration at purchase", value: fmtNum(dealConsideration(e)) },
    );
    if (e.purchaseYield != null) {
      rows.push({ label: "Yield at purchase %", value: fmtPct(e.purchaseYield) });
    }
  } else if (isMoneyMarket) {
    rows.push(
      { label: "Interest rate %", value: fmtPct(e.couponRate || e.discountRate || 0) },
      { label: "Day count convention", value: e.dayCount || "Actual/365" },
    );
  } else if (e.assetClass === "Equity") {
    rows.push(
      { label: "Cost price (per unit)", value: fmtNum(e.purchasePriceDecimal) },
      { label: "Total cost", value: fmtNum(dealConsideration(e)) },
    );
  } else {
    rows.push(
      { label: "Rate / yield %", value: fmtPct(e.couponRate || e.discountRate || 0) },
      {
        label: "Clean price",
        value: e.purchasePriceDecimal ? e.purchasePriceDecimal.toFixed(4) : "—",
      },
    );
  }

  rows.push(
    { label: "Trade date", value: e.purchaseDate || "—" },
    { label: "Value date", value: e.settlementDate || e.purchaseDate || "—" },
    { label: "Maturity date", value: e.maturityDate || "—" },
    { label: "Tenor (days)", value: tenor },
  );

  if (e.custodian?.trim()) {
    rows.push({ label: "Custodian", value: e.custodian });
  }

  rows.push(
    { label: "Portfolio book", value: e.portfolioBook || "—" },
    { label: "Classification", value: e.classification || "—" },
    { label: "IFRS 13 level", value: e.ifrs13Level || "—" },
  );

  if (e.creditRating?.trim()) {
    rows.push({ label: "Credit rating", value: e.creditRating });
  }

  if (e.notes?.trim()) {
    rows.push({ label: "Notes", value: e.notes.trim() });
  }

  return rows;
}

export function submittedDate(slip: DealSlip): string {
  const tx = slip.timeline.find((t) => t.to === "Submitted");
  return tx?.at.slice(0, 10) ?? "—";
}

export function approvedByName(slip: DealSlip): string {
  const step = slip.approvals.find((a) => a.action === "Approved");
  return step?.byUser ?? "—";
}

export function slipVersion(slip: DealSlip): number {
  return Math.max(1, slip.timeline.length);
}
