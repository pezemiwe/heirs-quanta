import { useMemo, useState } from "react";
import { ArrowLeftRight, CheckCircle2, Clock, XCircle } from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge, type BadgeVariant } from "../../../components/shared/badge";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { RowDetailModal } from "../../../components/shared/row-detail-modal";
import { useWorkflow } from "../../workflow/store";
import type { SettlementStatus } from "../../workflow/types";
import { fmtDate } from "../../portfolio/engine/book-compute";

/* ─────────────────────────────────────────────────────────────
   Settlements - settlement-instruction status for every deal slip
   that has reached Approved or later. Pure read/aggregation over
   the workflow store (dealSlips): no separate data source, no
   fictional "mark settled" action - raising and confirming a
   settlement instruction happens on the deal slip itself (Trade
   Blotter → Settlement panel), this page is the audit view.
   ───────────────────────────────────────────────────────────── */

const SETTLEMENT_BADGE: Record<SettlementStatus, BadgeVariant> = {
  "Not Raised": "neutral",
  "Instruction Raised": "info",
  Confirmed: "success",
  Failed: "danger",
};

interface SettlementRow {
  id: string;
  dealSlipId: string;
  name: string;
  issuer: string;
  counterparty: string;
  custodian: string;
  faceValue: number;
  currency: string;
  settlementDate: string;
  settlementStatus: SettlementStatus;
  raisedBy: string;
  confirmedBy: string;
  failReason: string;
}

type Row = SettlementRow & Record<string, unknown>;

export function Settlements() {
  const { dealSlips } = useWorkflow();
  const [selected, setSelected] = useState<Row | null>(null);

  const { rows, totalFace, awaiting, confirmed, failed } = useMemo(() => {
    const result: SettlementRow[] = dealSlips
      .filter((s) =>
        ["Approved", "Pending Settlement", "Settled", "Active"].includes(
          s.status,
        ),
      )
      .map((s) => ({
        id: s.id,
        dealSlipId: s.id,
        name: s.economics.instrumentName,
        issuer: s.economics.issuer,
        counterparty: s.settlement.counterparty ?? s.economics.counterparty,
        custodian: s.settlement.custodian ?? s.economics.custodian ?? "-",
        faceValue: s.economics.faceValue,
        currency: s.economics.currency,
        settlementDate: s.settlement.settlementDate,
        settlementStatus: s.settlement.status,
        raisedBy: s.settlement.raisedBy?.name ?? "-",
        confirmedBy: s.settlement.confirmedBy?.name ?? "-",
        failReason: s.settlement.failReason ?? "",
      }))
      .sort((a, b) => a.settlementDate.localeCompare(b.settlementDate));

    return {
      rows: result as Row[],
      totalFace: result.reduce((s, r) => s + r.faceValue, 0),
      awaiting: result.filter(
        (r) =>
          r.settlementStatus === "Not Raised" ||
          r.settlementStatus === "Instruction Raised",
      ).length,
      confirmed: result.filter((r) => r.settlementStatus === "Confirmed")
        .length,
      failed: result.filter((r) => r.settlementStatus === "Failed").length,
    };
  }, [dealSlips]);

  const cols: DataTableColumn<Row>[] = [
    { key: "id", header: "Deal Slip", width: "110px", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "name", header: "Instrument" },
    { key: "counterparty", header: "Counterparty" },
    { key: "custodian", header: "Custodian" },
    { key: "currency", header: "CCY", width: "60px" },
    {
      key: "faceValue",
      header: "Face Value",
      align: "right",
      render: (r) => r.faceValue.toLocaleString(),
    },
    {
      key: "settlementDate",
      header: "Settlement Date",
      render: (r) => fmtDate(r.settlementDate),
    },
    {
      key: "settlementStatus",
      header: "Status",
      render: (r) => (
        <Badge variant={SETTLEMENT_BADGE[r.settlementStatus]} size="sm">
          {r.settlementStatus}
        </Badge>
      ),
    },
    { key: "raisedBy", header: "Raised By" },
    { key: "confirmedBy", header: "Confirmed By" },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray flex items-center gap-2">
          <ArrowLeftRight className="h-6 w-6 text-primary" />
          Settlements - Settlement Instructions
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Settlement instruction status for every deal slip that has reached Approved or later - raise and confirm
          settlement instructions from the deal slip's Settlement panel in the Trade Blotter
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Awaiting Settlement"
          value={String(awaiting)}
          subtitle="Instruction not yet raised or awaiting confirmation"
          variant={awaiting > 0 ? "warning" : "default"}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          title="Confirmed"
          value={String(confirmed)}
          subtitle="Settlement instruction confirmed"
          variant="highlight"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          title="Failed"
          value={String(failed)}
          subtitle="Settlement instruction failed"
          variant={failed > 0 ? "danger" : "default"}
          icon={<XCircle className="h-4 w-4" />}
        />
        <StatCard
          title="Total Face Value"
          value={totalFace.toLocaleString()}
          subtitle="Across all settlement-relevant deal slips"
          variant="default"
        />
      </StatCardGrid>

      <SectionCard
        title="Settlement Schedule"
        description="Deal slips Approved or later, sorted by settlement date"
      >
        <DataTable<Row>
          columns={cols}
          data={rows}
          keyExtractor={(r) => r.id}
          emptyMessage="No deal slips have reached Approved yet - settlement instructions can only be raised once a deal slip is approved"
          pageSize={20}
          onRowClick={setSelected}
        />
      </SectionCard>

      <RowDetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Settlement Detail"}
        subtitle={selected?.dealSlipId}
        fields={
          selected
            ? [
                { label: "Deal Slip", value: selected.dealSlipId },
                { label: "Issuer", value: selected.issuer },
                { label: "Counterparty", value: selected.counterparty },
                { label: "Custodian", value: selected.custodian },
                { label: "Currency", value: selected.currency },
                { label: "Face Value", value: selected.faceValue.toLocaleString() },
                { label: "Settlement Date", value: fmtDate(selected.settlementDate) },
                {
                  label: "Status",
                  value: (
                    <Badge variant={SETTLEMENT_BADGE[selected.settlementStatus]} size="sm">
                      {selected.settlementStatus}
                    </Badge>
                  ),
                },
                { label: "Raised By", value: selected.raisedBy },
                { label: "Confirmed By", value: selected.confirmedBy },
                ...(selected.failReason
                  ? [{ label: "Fail Reason", value: selected.failReason }]
                  : []),
              ]
            : []
        }
      />
    </div>
  );
}
