import { Search, Download, SlidersHorizontal } from "lucide-react";
import { useState, useMemo } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import {
  BOOK_INSTRUMENTS,
  BOOK_COMPUTED,
  fmtCompact,
  fmtPct,
  fmtDate,
} from "../../../features/portfolio/engine/book-compute";

type HoldingRow = {
  id: string;
  name: string;
  instrumentType: string;
  issuer: string;
  sector: string;
  classification: string;
  currency: string;
  faceValue: number;
  bookValueNGN: number;
  eirPct: number;
  couponRate: number;
  maturityDate: string | null;
  stage: string;
  status: string;
  [key: string]: unknown;
};

const valMap = new Map(
  BOOK_COMPUTED.valuations.map((v) => [v.instrument.id, v]),
);

const ALL_ROWS: HoldingRow[] = BOOK_INSTRUMENTS.map((inst) => {
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

const ALL_TYPES = [
  "All",
  ...Array.from(new Set(BOOK_INSTRUMENTS.map((i) => i.instrumentType))),
].sort();
const ALL_CLASSIFICATIONS = ["All", "AC", "FVOCI", "FVTPL"];

const CLASS_STYLE: Record<string, { bg: string; text: string }> = {
  AC: { bg: "#FEE2E2", text: "#C8102E" },
  FVOCI: { bg: "#DBEAFE", text: "#1E3A5F" },
  FVTPL: { bg: "#FEF3C7", text: "#92400E" },
};
const STAGE_STYLE: Record<string, string> = {
  "Stage 1": "bg-emerald-50 text-emerald-700",
  "Stage 2": "bg-amber-50 text-amber-700",
  "Stage 3": "bg-red-50 text-primary",
};

const COLUMNS: DataTableColumn<HoldingRow>[] = [
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
        {r.classification}
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

export function PortfolioHoldings() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [classFilter, setClassFilter] = useState("All");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ALL_ROWS.filter((r) => {
      if (typeFilter !== "All" && r.instrumentType !== typeFilter) return false;
      if (classFilter !== "All" && r.classification !== classFilter)
        return false;
      if (
        q &&
        !r.name.toLowerCase().includes(q) &&
        !r.issuer.toLowerCase().includes(q) &&
        !r.id.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [search, typeFilter, classFilter]);

  const totalBookValue = filtered.reduce((s, r) => s + r.bookValueNGN, 0);

  return (
    <div className="p-6 xl:p-8 space-y-6">
      {/* header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">Holdings</h1>
          <p className="mt-1 text-sm text-dark-gray/50">
            {filtered.length} of {ALL_ROWS.length} instruments · Book value{" "}
            <span className="font-semibold text-dark-gray">
              {fmtCompact(totalBookValue)}
            </span>
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-dark-gray/60 shadow-sm hover:border-primary hover:text-primary">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      {/* summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "AC Instruments",
            value: ALL_ROWS.filter((r) => r.classification === "AC").length,
          },
          {
            label: "FVOCI Instruments",
            value: ALL_ROWS.filter((r) => r.classification === "FVOCI").length,
          },
          {
            label: "FVTPL Instruments",
            value: ALL_ROWS.filter((r) => r.classification === "FVTPL").length,
          },
          {
            label: "Stage 2/3 Watch",
            value: ALL_ROWS.filter((r) => r.stage !== "Stage 1").length,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <p className="text-xs text-dark-gray/50 font-medium">{s.label}</p>
            <p className="mt-1 text-xl font-bold text-dark-gray">{s.value}</p>
          </div>
        ))}
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-gray/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, issuer, ID…"
            className="rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm outline-none focus:border-primary w-72"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-dark-gray/40" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface py-2 px-3 text-sm outline-none focus:border-primary"
          >
            {ALL_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface py-2 px-3 text-sm outline-none focus:border-primary"
          >
            {ALL_CLASSIFICATIONS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable<HoldingRow>
        columns={COLUMNS}
        data={filtered}
        keyExtractor={(r) => r.id}
        pageSize={25}
        emptyMessage="No instruments match your filters"
      />
    </div>
  );
}
