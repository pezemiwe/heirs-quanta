import { type DataTableColumn } from "../../../../components/shared/data-table";
import {
  BOOK_INSTRUMENTS,
  BOOK_COMPUTED,
  fmtCompact,
  fmtPct,
  fmtDate,
} from "../../engine/book-compute";
import type { HoldingRow } from "./types";

const valMap = new Map(
  BOOK_COMPUTED.valuations.map((v) => [v.instrument.id, v]),
);

export const ALL_ROWS: HoldingRow[] = BOOK_INSTRUMENTS.map((inst) => {
  const v = valMap.get(inst.id);
  return {
    id: inst.id,
    name: inst.name,
    instrumentType: inst.instrumentType as string,
    issuer: inst.issuer,
    sector: inst.sector,
    classification: inst.classification as string,
    currency: inst.currency as string,
    faceValue: inst.faceValue,
    bookValueNGN: v?.balanceSheetValueNGN ?? inst.faceValue,
    eirPct: v?.eir ?? 0,
    couponRate: inst.couponRate,
    maturityDate: inst.maturityDate ?? null,
    stage: inst.impairmentStage ?? "N/A",
    status: inst.status as string,
  } as HoldingRow;
});

export const ALL_TYPES = [
  "All",
  ...Array.from(new Set(BOOK_INSTRUMENTS.map((i) => i.instrumentType))),
].sort();
export const ALL_CLASSIFICATIONS = ["All", "AC", "FVOCI", "FVTPL"];

export const CLASS_STYLE: Record<string, { bg: string; text: string }> = {
  AC: { bg: "#FEE2E2", text: "#C8102E" },
  FVOCI: { bg: "#DBEAFE", text: "#1E3A5F" },
  FVTPL: { bg: "#FEF3C7", text: "#92400E" },
};
export const CLASS_LABEL: Record<string, string> = {
  AC: "Amortised Cost",
  FVOCI: "Fair Value (OCI)",
  FVTPL: "Fair Value (P&L)",
};
export const STAGE_STYLE: Record<string, string> = {
  "Stage 1": "bg-emerald-50 text-emerald-700",
  "Stage 2": "bg-amber-50 text-amber-700",
  "Stage 3": "bg-red-50 text-primary",
};

export const COLUMNS: DataTableColumn<HoldingRow>[] = [
  {
    key: "id",
    header: "ID",
    width: "80px",
    render: (r) => (
      <span className="font-mono text-xs text-dark-gray/50">{r.id}</span>
    ),
  },
  {
    key: "name",
    header: "Instrument",
    render: (r) => (
      <span className="font-medium text-dark-gray text-xs">{r.name}</span>
    ),
  },
  {
    key: "classification",
    header: "Class",
    render: (r) => (
      <span
        className="rounded-full px-2 py-0.5 text-xs font-semibold"
        style={{
          background: CLASS_STYLE[r.classification]?.bg,
          color: CLASS_STYLE[r.classification]?.text,
        }}
      >
        {CLASS_LABEL[r.classification] ?? r.classification}
      </span>
    ),
  },
  {
    key: "instrumentType",
    header: "Type",
    render: (r) => (
      <span className="text-xs text-dark-gray/70">{r.instrumentType}</span>
    ),
  },
  {
    key: "issuer",
    header: "Issuer",
    render: (r) => (
      <span className="text-xs text-dark-gray/70">{r.issuer}</span>
    ),
  },
  {
    key: "currency",
    header: "CCY",
    align: "center",
    render: (r) => (
      <span className="text-xs text-dark-gray/60">{r.currency}</span>
    ),
  },
  {
    key: "bookValueNGN",
    header: "Book Value (₦)",
    align: "right",
    render: (r) => (
      <span className="text-xs font-semibold text-dark-gray">
        {fmtCompact(r.bookValueNGN)}
      </span>
    ),
  },
  {
    key: "eirPct",
    header: "EIR",
    align: "right",
    render: (r) => (
      <span className="text-xs text-dark-gray/70">
        {r.eirPct > 0 ? fmtPct(r.eirPct) : "—"}
      </span>
    ),
  },
  {
    key: "couponRate",
    header: "Coupon",
    align: "right",
    render: (r) => (
      <span className="text-xs text-dark-gray/70">
        {r.couponRate > 0 ? fmtPct(r.couponRate) : "—"}
      </span>
    ),
  },
  {
    key: "maturityDate",
    header: "Maturity",
    render: (r) => (
      <span className="text-xs text-dark-gray/60">
        {fmtDate(r.maturityDate)}
      </span>
    ),
  },
  {
    key: "stage",
    header: "Stage",
    render: (r) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_STYLE[r.stage] ?? "bg-gray-100 text-dark-gray/60"}`}
      >
        {r.stage}
      </span>
    ),
  },
];
