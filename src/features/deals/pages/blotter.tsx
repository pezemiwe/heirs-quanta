import { useState, useMemo } from "react";
import { Search, Filter, Download } from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge } from "../../../components/shared/badge";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import {
  BOOK_INSTRUMENTS,
  BOOK_COMPUTED,
  fmtCompact,
  fmtPct,
  fmtDate,
} from "../../portfolio/engine/book-compute";
import type { Instrument } from "../../portfolio/engine/book-compute";

const CLF_COLOR: Record<string, "info" | "success" | "warning"> = {
  AC: "info",
  FVOCI: "success",
  FVTPL: "warning",
};

type Row = Instrument & Record<string, unknown>;

export function DealBlotter() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [clfFilter, setClfFilter] = useState("All");

  const types = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(BOOK_INSTRUMENTS.map((i) => i.instrumentType)),
      ).sort(),
    ],
    [],
  );

  const rows = useMemo<Row[]>(() => {
    return BOOK_INSTRUMENTS.filter((i) => {
      const matchType = typeFilter === "All" || i.instrumentType === typeFilter;
      const matchClf = clfFilter === "All" || i.classification === clfFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.issuer.toLowerCase().includes(q);
      return matchType && matchClf && matchSearch;
    }) as Row[];
  }, [search, typeFilter, clfFilter]);

  const totals = BOOK_COMPUTED.totals;

  const cols: DataTableColumn<Row>[] = [
    { key: "id", header: "ID", width: "90px" },
    { key: "name", header: "Instrument Name" },
    {
      key: "instrumentType",
      header: "Type",
      render: (r) => (
        <Badge variant="neutral" size="sm">
          {r.instrumentType}
        </Badge>
      ),
    },
    { key: "issuer", header: "Issuer / Counterparty" },
    {
      key: "classification",
      header: "Class",
      render: (r) => (
        <Badge variant={CLF_COLOR[r.classification]} size="sm">
          {r.classification}
        </Badge>
      ),
    },
    { key: "currency", header: "CCY", width: "60px" },
    {
      key: "faceValue",
      header: "Face Value",
      align: "right",
      render: (r) => fmtCompact(r.faceValue),
    },
    {
      key: "couponRate",
      header: "Coupon",
      align: "right",
      render: (r) =>
        r.couponRate > 0 ? (
          fmtPct(r.couponRate)
        ) : (
          <span className="text-gray-400">Disc.</span>
        ),
    },
    { key: "couponFrequency", header: "Freq", width: "80px" },
    {
      key: "purchaseDate",
      header: "Purchase",
      render: (r) => fmtDate(r.purchaseDate),
    },
    {
      key: "maturityDate",
      header: "Maturity",
      render: (r) => fmtDate(r.maturityDate),
    },
    {
      key: "impairmentStage",
      header: "Stage",
      render: (r) => {
        const stage = r.impairmentStage ?? "N/A";
        const v =
          stage === "Stage 1"
            ? "stage1"
            : stage === "Stage 2"
              ? "stage2"
              : stage === "Stage 3"
                ? "stage3"
                : "neutral";
        return (
          <Badge variant={v as never} size="sm">
            {stage}
          </Badge>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant="performing" size="sm">
          {r.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
            Trade Blotter
          </h1>
          <p className="mt-1 text-sm text-dark-gray/60">
            {rows.length} of {BOOK_INSTRUMENTS.length} instruments · Portfolio
            Management book · 28 May 2026
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-dark-gray/70 hover:border-primary hover:text-primary">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <StatCardGrid>
        <StatCard
          title="Total Instruments"
          value={String(BOOK_INSTRUMENTS.length)}
          subtitle="Portfolio Management book"
          variant="highlight"
        />
        <StatCard
          title="Total Face Value"
          value={fmtCompact(totals.totalFaceValueNGN)}
          subtitle="NGN equivalent"
          variant="default"
        />
        <StatCard
          title="Total Book Value"
          value={fmtCompact(totals.totalBSValueNGN)}
          subtitle="Balance-sheet carrying amount"
          variant="default"
        />
        <StatCard
          title="Filtered Rows"
          value={String(rows.length)}
          subtitle="After current filters"
          variant="default"
        />
      </StatCardGrid>

      <SectionCard title="Instrument Book">
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, name or issuer…"
              className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-sm text-dark-gray placeholder-gray-400 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray focus:border-primary focus:outline-none"
            >
              {types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select
              value={clfFilter}
              onChange={(e) => setClfFilter(e.target.value)}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray focus:border-primary focus:outline-none"
            >
              <option>All</option>
              <option>AC</option>
              <option>FVOCI</option>
              <option>FVTPL</option>
            </select>
          </div>
        </div>

        <DataTable<Row>
          columns={cols}
          data={rows}
          keyExtractor={(r) => r.id}
          emptyMessage="No instruments match your filters"
        />
      </SectionCard>
    </div>
  );
}
