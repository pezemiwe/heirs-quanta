import {
  DataTable,
  type DataTableColumn,
} from "../../../../../components/shared/data-table";
import { SectionCard } from "../../../../../components/shared/section-card";
import { Badge } from "../../../../../components/shared/badge";
import { fmtCompact, fmtPct } from "../../../../portfolio/engine/book-compute";
import type { Row } from "../types";

interface FvtplTableProps {
  rows: Row[];
  onRowClick: (r: Row) => void;
}

export function FvtplTable({ rows, onRowClick }: FvtplTableProps) {
  const fvtplCols: DataTableColumn<Row>[] = [
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
      key: "acCarrying",
      header: "Cost Basis",
      align: "right",
      render: (r) => fmtCompact(r.acCarrying),
    },
    {
      key: "fairValue",
      header: "Fair Value",
      align: "right",
      render: (r) => fmtCompact(r.fairValue),
    },
    {
      key: "unrealisedGL",
      header: "Unrealised G/(L)",
      align: "right",
      render: (r) => {
        const cls =
          r.unrealisedGL >= 0
            ? "text-emerald-600 font-semibold"
            : "text-primary font-semibold";
        return <span className={cls}>{fmtCompact(r.unrealisedGL)}</span>;
      },
    },
    {
      key: "returnPct",
      header: "Return %",
      align: "right",
      render: (r) => {
        const cls = r.returnPct >= 0 ? "text-emerald-600" : "text-primary";
        return (
          <span className={cls}>
            {(r.returnPct >= 0 ? "+" : "") + fmtPct(r.returnPct)}
          </span>
        );
      },
    },
  ];

  return (
    <SectionCard
      title="FVTPL — Unrealised Gains / Losses"
      description="Fair value changes recognised through profit & loss"
    >
      <DataTable<Row>
        columns={fvtplCols}
        data={rows}
        keyExtractor={(r) => r.id}
        emptyMessage="No FVTPL instruments"
        pageSize={20}
        onRowClick={onRowClick}
      />
    </SectionCard>
  );
}
