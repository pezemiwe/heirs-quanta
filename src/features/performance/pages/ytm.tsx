import { useMemo } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge } from "../../../components/shared/badge";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import {
  BOOK_COMPUTED,
  BOOK_INSTRUMENTS,
  fmtPct,
  fmtCompact,
  fmtDate,
} from "../../portfolio/engine/book-compute";

interface YTMRow {
  id: string;
  name: string;
  type: string;
  classification: string;
  couponRate: number;
  eir: number;
  marketYield: number;
  yieldSpread: number;
  macaulay: number;
  modified: number;
  dv01: number;
  maturityDate: string | null;
}

type Row = YTMRow & Record<string, unknown>;

export function YTMAnalysis() {
  const rows = useMemo<Row[]>(() => {
    return BOOK_COMPUTED.valuations.map((v) => ({
      id: v.instrument.id,
      name: v.instrument.name,
      type: v.instrument.instrumentType,
      classification: v.instrument.classification,
      couponRate: v.instrument.couponRate,
      eir: v.eir,
      marketYield: v.marketYieldUsed,
      yieldSpread: v.eir > 0 ? v.eir - v.marketYieldUsed : 0,
      macaulay: v.risk.macaulayDuration,
      modified: v.risk.modifiedDuration,
      dv01: v.risk.dv01,
      maturityDate: v.instrument.maturityDate,
    })) as Row[];
  }, []);

  const avgYield = rows.reduce((s, r) => s + r.marketYield, 0) / rows.length;
  const avgEIR =
    rows.filter((r) => r.eir > 0).reduce((s, r) => s + r.eir, 0) /
    (rows.filter((r) => r.eir > 0).length || 1);
  const avgDuration =
    rows.filter((r) => r.modified > 0).reduce((s, r) => s + r.modified, 0) /
    (rows.filter((r) => r.modified > 0).length || 1);
  const totalDV01 = rows.reduce((s, r) => s + r.dv01, 0);

  const cols: DataTableColumn<Row>[] = [
    { key: "id", header: "ID", width: "90px" },
    { key: "name", header: "Instrument" },
    {
      key: "type",
      header: "Type",
      render: (r) => (
        <Badge variant="neutral" size="sm">
          {r.type}
        </Badge>
      ),
    },
    {
      key: "classification",
      header: "Class",
      render: (r) => (
        <Badge
          variant={
            r.classification === "AC"
              ? "info"
              : r.classification === "FVOCI"
                ? "success"
                : "warning"
          }
          size="sm"
        >
          {r.classification}
        </Badge>
      ),
    },
    {
      key: "couponRate",
      header: "Coupon",
      align: "right",
      render: (r) =>
        r.couponRate > 0 ? (
          fmtPct(r.couponRate)
        ) : (
          <span className="text-dark-gray/40">Disc.</span>
        ),
    },
    {
      key: "eir",
      header: "EIR",
      align: "right",
      render: (r) =>
        r.eir > 0 ? (
          <span className="font-medium text-primary">{fmtPct(r.eir)}</span>
        ) : (
          <span className="text-dark-gray/40">—</span>
        ),
    },
    {
      key: "marketYield",
      header: "Market Yield",
      align: "right",
      render: (r) =>
        r.marketYield > 0 ? (
          fmtPct(r.marketYield)
        ) : (
          <span className="text-dark-gray/40">—</span>
        ),
    },
    {
      key: "yieldSpread",
      header: "EIR–Mkt Spread",
      align: "right",
      render: (r) => {
        if (r.eir === 0 || r.marketYield === 0)
          return <span className="text-dark-gray/40">—</span>;
        const cls = r.yieldSpread >= 0 ? "text-emerald-600" : "text-primary";
        const sign = r.yieldSpread >= 0 ? "+" : "";
        return (
          <span className={`font-medium ${cls}`}>
            {sign}
            {fmtPct(r.yieldSpread)}
          </span>
        );
      },
    },
    {
      key: "macaulay",
      header: "Macaulay",
      align: "right",
      render: (r) => (r.macaulay > 0 ? `${r.macaulay.toFixed(2)}y` : "—"),
    },
    {
      key: "modified",
      header: "Mod. Duration",
      align: "right",
      render: (r) => (r.modified > 0 ? `${r.modified.toFixed(2)}y` : "—"),
    },
    {
      key: "dv01",
      header: "DV01 (NGN)",
      align: "right",
      render: (r) => (r.dv01 > 0 ? fmtCompact(r.dv01) : "—"),
    },
    {
      key: "maturityDate",
      header: "Maturity",
      render: (r) => fmtDate(r.maturityDate),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Yield-to-Maturity Analysis
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          EIR, market yield, duration and DV01 for all {BOOK_INSTRUMENTS.length}{" "}
          instruments · Valuation date 28 May 2026
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Avg Market Yield"
          value={fmtPct(avgYield)}
          subtitle="Simple average across book"
          variant="highlight"
        />
        <StatCard
          title="Avg EIR"
          value={fmtPct(avgEIR)}
          subtitle="Effective interest rate"
          variant="default"
        />
        <StatCard
          title="Avg Mod. Duration"
          value={avgDuration.toFixed(2) + " yrs"}
          subtitle="Price sensitivity to yield"
          variant="default"
        />
        <StatCard
          title="Portfolio DV01"
          value={fmtCompact(totalDV01)}
          subtitle="Value change per 1bp yield move"
          variant="default"
        />
      </StatCardGrid>

      <SectionCard title="Yield & Duration Table">
        <DataTable<Row>
          columns={cols}
          data={rows}
          keyExtractor={(r) => r.id}
          emptyMessage="No instruments"
        />
      </SectionCard>
    </div>
  );
}
