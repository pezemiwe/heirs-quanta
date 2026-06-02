import {
  DataTable,
  type DataTableColumn,
} from "../../../../../components/shared/data-table";
import { SectionCard } from "../../../../../components/shared/section-card";
import { Badge } from "../../../../../components/shared/badge";
import {
  StatCard,
  StatCardGrid,
} from "../../../../../components/shared/stat-card";
import { fmtPct } from "../../../../portfolio/engine/book-compute";
import type { MRow } from "../types";

interface MetricsSectionProps {
  rows: MRow[];
  wAvgTWR: number;
  wAvgMWR: number;
  wAvgProjected: number;
  onRowClick: (r: MRow) => void;
}

export function MetricsSection({
  rows,
  wAvgTWR,
  wAvgMWR,
  wAvgProjected,
  onRowClick,
}: MetricsSectionProps) {
  const metricsCols: DataTableColumn<MRow>[] = [
    { key: "id", header: "ID", width: "90px" },
    { key: "name", header: "Instrument" },
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
      key: "holdingYears",
      header: "Hold Period",
      align: "right",
      render: (r) => `${r.holdingYears.toFixed(1)}y`,
    },
    {
      key: "hpr",
      header: "HPR",
      align: "right",
      render: (r) => (
        <span
          className={
            r.hpr >= 0
              ? "text-emerald-600 font-medium"
              : "text-primary font-medium"
          }
        >
          {(r.hpr >= 0 ? "+" : "") + fmtPct(r.hpr)}
        </span>
      ),
    },
    {
      key: "twr",
      header: "TWR (ann.)",
      align: "right",
      render: (r) => (
        <span
          className={
            r.twr >= 0
              ? "text-emerald-600 font-semibold"
              : "text-primary font-semibold"
          }
        >
          {(r.twr >= 0 ? "+" : "") + fmtPct(r.twr)}
        </span>
      ),
    },
    {
      key: "mwr",
      header: "MWR (EIR)",
      align: "right",
      render: (r) => (
        <span className="text-primary font-medium">{fmtPct(r.mwr)}</span>
      ),
    },
    {
      key: "projected",
      header: "Projected (1yr)",
      align: "right",
      render: (r) => fmtPct(r.projected),
    },
  ];

  return (
    <SectionCard
      title="Return Metrics by Instrument"
      description="HPR, TWR (annualised), MWR (EIR-proxy), and 1-year projected return for all instruments"
    >
      <StatCardGrid className="mb-4">
        <StatCard
          title="Avg TWR (ann.)"
          value={fmtPct(wAvgTWR)}
          subtitle="Time-weighted annualised return"
          variant="highlight"
        />
        <StatCard
          title="Wtd-Avg MWR"
          value={fmtPct(wAvgMWR)}
          subtitle="EIR-weighted by book value"
          variant="default"
        />
        <StatCard
          title="Avg Projected (1yr)"
          value={fmtPct(wAvgProjected)}
          subtitle="EIR × remaining year fraction"
          variant="default"
        />
        <StatCard
          title="Instruments Tracked"
          value={String(rows.length)}
          subtitle="With positive carrying value"
          variant="default"
        />
      </StatCardGrid>
      <DataTable<MRow>
        columns={metricsCols}
        data={rows}
        keyExtractor={(r) => r.id}
        emptyMessage="No return metrics available"
        pageSize={20}
        onRowClick={onRowClick}
      />
    </SectionCard>
  );
}
