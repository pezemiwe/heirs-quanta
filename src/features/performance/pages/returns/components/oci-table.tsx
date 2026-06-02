import {
  DataTable,
  type DataTableColumn,
} from "../../../../../components/shared/data-table";
import { SectionCard } from "../../../../../components/shared/section-card";
import { Badge } from "../../../../../components/shared/badge";
import { fmtCompact, fmtPct } from "../../../../portfolio/engine/book-compute";
import type { Row } from "../types";

interface OciTableProps {
  rows: Row[];
  onRowClick: (r: Row) => void;
}

export function OciTable({ rows, onRowClick }: OciTableProps) {
  const ociCols: DataTableColumn<Row>[] = [
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
      header: "AC Carrying",
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
      key: "ociReserve",
      header: "OCI Reserve",
      align: "right",
      render: (r) => {
        const cls =
          r.ociReserve >= 0
            ? "text-emerald-600 font-semibold"
            : "text-primary font-semibold";
        return <span className={cls}>{fmtCompact(r.ociReserve)}</span>;
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
      title="FVOCI — OCI Reserve Movements"
      description="Fair value changes accumulated in equity (OCI)"
    >
      <DataTable<Row>
        columns={ociCols}
        data={rows}
        keyExtractor={(r) => r.id}
        emptyMessage="No FVOCI instruments"
        pageSize={20}
        onRowClick={onRowClick}
      />
    </SectionCard>
  );
}
