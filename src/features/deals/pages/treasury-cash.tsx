import { useMemo } from "react";
import { Landmark } from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge, type BadgeVariant } from "../../../components/shared/badge";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { useWorkflow } from "../../workflow/store";
import type { SettlementStatus } from "../../workflow/types";
import type { Currency } from "../../valuation/engine/types";
import { fmtDate, daysBetween } from "../../portfolio/engine/book-compute";

/* ─────────────────────────────────────────────────────────────
   Multi-currency formatting - this book holds NGN, USD, GBP and EUR
   instruments side by side with no clean FX rate to blend them, so
   every total on this page is kept per-currency rather than summed
   into a single fabricated number.
   ───────────────────────────────────────────────────────────── */

const CCY_SYMBOLS: Record<Currency, string> = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
};

const CURRENCY_ORDER: Currency[] = ["NGN", "USD", "GBP", "EUR"];

function fmtCcy(n: number, ccy: string): string {
  if (!isFinite(n)) return "-";
  const sym = CCY_SYMBOLS[ccy as Currency] ?? `${ccy} `;
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}${sym}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${sym}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${sym}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${sym}${(abs / 1e3).toFixed(2)}K`;
  return `${sign}${sym}${abs.toFixed(0)}`;
}

function sumByCcy(rows: { currency: Currency; cashAmount: number }[]): Map<Currency, number> {
  const map = new Map<Currency, number>();
  for (const r of rows) map.set(r.currency, (map.get(r.currency) ?? 0) + r.cashAmount);
  return map;
}

/** Joins per-currency totals into a single display string, e.g. "₦1.40B · $2.10M" - never blends across currencies. */
function fmtMultiCcy(map: Map<Currency, number>): string {
  const entries = CURRENCY_ORDER.filter((c) => (map.get(c) ?? 0) !== 0).map((c) => [c, map.get(c)!] as const);
  if (entries.length === 0) return "₦0";
  return entries.map(([ccy, amt]) => fmtCcy(amt, ccy)).join(" · ");
}

const SETTLEMENT_BADGE: Record<SettlementStatus, BadgeVariant> = {
  "Not Raised": "neutral",
  "Instruction Raised": "info",
  Confirmed: "success",
  Failed: "danger",
};

const TODAY = new Date().toISOString().slice(0, 10);

/* ─────────────────────────────────────────────────────────────
   Row shapes
   ───────────────────────────────────────────────────────────── */

interface FundingRow {
  id: string;
  instrumentName: string;
  counterparty: string;
  custodian: string;
  settlementDate: string;
  daysToSettlement: number;
  cashAmount: number;
  currency: Currency;
  settlementStatus: SettlementStatus;
}
type FRow = FundingRow & Record<string, unknown>;

interface DeployedRow {
  id: string;
  dealSlipId: string;
  instrumentName: string;
  issuer: string;
  currency: Currency;
  cashAmount: number;
  settledAt: string;
}
type DRow = DeployedRow & Record<string, unknown>;

/* ─────────────────────────────────────────────────────────────
   Currency breakdown mini-table - reused for both sections
   ───────────────────────────────────────────────────────────── */

function CurrencyBreakdown({ byCcy, emptyMessage }: { byCcy: Map<Currency, number>; emptyMessage: string }) {
  const present = CURRENCY_ORDER.filter((c) => (byCcy.get(c) ?? 0) !== 0);
  if (present.length === 0) {
    return <p className="mt-4 border-t border-border pt-4 text-xs text-dark-gray/40">{emptyMessage}</p>;
  }
  return (
    <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4">
      {present.map((c) => (
        <div key={c} className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs">
          <span className="font-semibold text-dark-gray">{c}</span>{" "}
          <span className="text-dark-gray/70">{fmtCcy(byCcy.get(c)!, c)}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Treasury - Cash Position & Settlement Funding
   Pure read/aggregation over the workflow store: no new state.
   ───────────────────────────────────────────────────────────── */

export function TreasuryCash() {
  const { dealSlips, register } = useWorkflow();

  const fundingRows = useMemo<FRow[]>(() => {
    return dealSlips
      .filter((s) => s.status === "Approved" || s.status === "Pending Settlement")
      .map((s) => ({
        id: s.id,
        instrumentName: s.economics.instrumentName,
        counterparty: s.economics.counterparty,
        custodian: s.economics.custodian ?? "-",
        settlementDate: s.economics.settlementDate,
        daysToSettlement: daysBetween(TODAY, s.economics.settlementDate),
        cashAmount: s.economics.faceValue * s.economics.purchasePriceDecimal,
        currency: s.economics.currency,
        settlementStatus: s.settlement.status,
      }))
      .sort((a, b) => a.settlementDate.localeCompare(b.settlementDate));
  }, [dealSlips]);

  const deployedRows = useMemo<DRow[]>(() => {
    return register
      .filter((r) => r.status === "Active")
      .map((r) => {
        const slip = dealSlips.find((s) => s.id === r.dealSlipId);
        const cashAmount = slip ? slip.economics.faceValue * slip.economics.purchasePriceDecimal : r.faceValue;
        return {
          id: r.id,
          dealSlipId: r.dealSlipId,
          instrumentName: r.instrumentName,
          issuer: r.issuer,
          currency: r.currency,
          cashAmount,
          settledAt: r.settledAt,
        };
      });
  }, [register, dealSlips]);

  const within7 = useMemo(() => fundingRows.filter((r) => r.daysToSettlement <= 7), [fundingRows]);
  const within30 = useMemo(() => fundingRows.filter((r) => r.daysToSettlement <= 30), [fundingRows]);
  const failedCount = useMemo(() => dealSlips.filter((s) => s.settlement.status === "Failed").length, [dealSlips]);

  const within7ByCcy = useMemo(() => sumByCcy(within7), [within7]);
  const within30ByCcy = useMemo(() => sumByCcy(within30), [within30]);
  const fundingByCcy = useMemo(() => sumByCcy(fundingRows), [fundingRows]);
  const deployedByCcy = useMemo(() => sumByCcy(deployedRows), [deployedRows]);

  const fundingCols: DataTableColumn<FRow>[] = [
    { key: "id", header: "Deal Slip", width: "110px", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "instrumentName", header: "Instrument" },
    { key: "counterparty", header: "Counterparty" },
    { key: "custodian", header: "Custodian" },
    { key: "settlementDate", header: "Settlement Date", render: (r) => fmtDate(r.settlementDate) },
    {
      key: "daysToSettlement",
      header: "Days to Settlement",
      align: "right",
      render: (r) => {
        const cls =
          r.daysToSettlement < 0
            ? "font-bold text-danger"
            : r.daysToSettlement <= 7
              ? "font-bold text-amber-600"
              : r.daysToSettlement <= 30
                ? "font-semibold text-amber-600/70"
                : "text-dark-gray/70";
        return <span className={cls}>{r.daysToSettlement}</span>;
      },
    },
    {
      key: "cashAmount",
      header: "Cash Amount",
      align: "right",
      render: (r) => <span className="font-medium text-dark-gray">{fmtCcy(r.cashAmount, r.currency)}</span>,
    },
    { key: "currency", header: "CCY", width: "60px" },
    {
      key: "settlementStatus",
      header: "Settlement Status",
      render: (r) => (
        <Badge variant={SETTLEMENT_BADGE[r.settlementStatus]} size="sm">
          {r.settlementStatus}
        </Badge>
      ),
    },
  ];

  const deployedCols: DataTableColumn<DRow>[] = [
    { key: "id", header: "Register Ref", width: "120px", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "dealSlipId", header: "Deal Slip", render: (r) => <span className="font-mono text-xs">{r.dealSlipId}</span> },
    { key: "instrumentName", header: "Instrument" },
    { key: "issuer", header: "Issuer" },
    { key: "currency", header: "CCY", width: "60px" },
    {
      key: "cashAmount",
      header: "Cash Deployed",
      align: "right",
      render: (r) => <span className="font-medium text-dark-gray">{fmtCcy(r.cashAmount, r.currency)}</span>,
    },
    { key: "settledAt", header: "Settled", render: (r) => fmtDate(r.settledAt.slice(0, 10)) },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray flex items-center gap-2">
          <Landmark className="h-6 w-6 text-primary" />
          Treasury - Cash Position &amp; Settlement Funding
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Cash that will move soon (Approved / Pending Settlement deal slips) alongside capital already deployed to
          active register positions · Reference date {fmtDate(TODAY)}
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Funding Required - Next 7 Days"
          value={fmtMultiCcy(within7ByCcy)}
          subtitle={`${within7.length} deal slip${within7.length === 1 ? "" : "s"} settling`}
          variant={within7.length > 0 ? "danger" : "default"}
        />
        <StatCard
          title="Funding Required - Next 30 Days"
          value={fmtMultiCcy(within30ByCcy)}
          subtitle={`${within30.length} deal slip${within30.length === 1 ? "" : "s"} settling`}
          variant={within30.length > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Failed Settlements Awaiting Retry"
          value={String(failedCount)}
          subtitle="Settlement instructions marked Failed"
          variant={failedCount > 0 ? "danger" : "default"}
        />
        <StatCard
          title="Total Deployed Capital"
          value={fmtMultiCcy(deployedByCcy)}
          subtitle={`${deployedRows.length} active position${deployedRows.length === 1 ? "" : "s"} · per currency, no FX blend`}
          variant="highlight"
        />
      </StatCardGrid>

      <SectionCard
        title="Settlement Funding Calendar"
        description="Approved and Pending Settlement deal slips, sorted by settlement date - rows settling within 7 days need urgent funding"
      >
        <DataTable<FRow>
          columns={fundingCols}
          data={fundingRows}
          keyExtractor={(r) => r.id}
          emptyMessage="No deal slips are Approved or Pending Settlement - no cash movement upcoming"
          pageSize={15}
          rowClassName={(r) =>
            r.daysToSettlement < 0 ? "bg-red-50/70" : r.daysToSettlement <= 7 ? "bg-amber-50/70" : ""
          }
        />
        <CurrencyBreakdown byCcy={fundingByCcy} emptyMessage="No currency exposure - nothing awaiting funding" />
      </SectionCard>

      <SectionCard
        title="Deployed Capital - Active Register Positions"
        description="Cash already moved: active positions in the investment register, joined back to their deal slip's economics for the actual consideration paid"
      >
        <DataTable<DRow>
          columns={deployedCols}
          data={deployedRows}
          keyExtractor={(r) => r.id}
          emptyMessage="No active positions yet - the register only fills once a deal slip is Settled"
          pageSize={15}
        />
        <CurrencyBreakdown byCcy={deployedByCcy} emptyMessage="No deployed capital yet" />
      </SectionCard>
    </div>
  );
}
