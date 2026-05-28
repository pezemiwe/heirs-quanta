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
  fmtCompact,
  fmtPct,
} from "../../portfolio/engine/book-compute";

interface ReturnsRow {
  id: string;
  name: string;
  type: string;
  classification: string;
  fairValue: number;
  acCarrying: number;
  ociReserve: number;
  unrealisedGL: number;
  returnPct: number;
}

type Row = ReturnsRow & Record<string, unknown>;

export function Returns() {
  const { ociRows, fvtplRows, ociTotal, fvtplTotal } = useMemo(() => {
    const oci: ReturnsRow[] = [];
    const fvtpl: ReturnsRow[] = [];

    for (const v of BOOK_COMPUTED.valuations) {
      if (v.instrument.classification === "FVOCI") {
        oci.push({
          id: v.instrument.id,
          name: v.instrument.name,
          type: v.instrument.instrumentType,
          classification: "FVOCI",
          fairValue: v.cleanFairValue,
          acCarrying: v.acCarryingValue,
          ociReserve: v.ociReserve,
          unrealisedGL: 0,
          returnPct:
            v.acCarryingValue > 0 ? v.ociReserve / v.acCarryingValue : 0,
        });
      } else if (v.instrument.classification === "FVTPL") {
        fvtpl.push({
          id: v.instrument.id,
          name: v.instrument.name,
          type: v.instrument.instrumentType,
          classification: "FVTPL",
          fairValue: v.cleanFairValue,
          acCarrying: v.acCarryingValue,
          ociReserve: 0,
          unrealisedGL: v.unrealisedGL,
          returnPct:
            v.acCarryingValue > 0 ? v.unrealisedGL / v.acCarryingValue : 0,
        });
      }
    }

    return {
      ociRows: oci.sort(
        (a, b) => Math.abs(b.ociReserve) - Math.abs(a.ociReserve),
      ) as Row[],
      fvtplRows: fvtpl.sort(
        (a, b) => Math.abs(b.unrealisedGL) - Math.abs(a.unrealisedGL),
      ) as Row[],
      ociTotal: oci.reduce((s, r) => s + r.ociReserve, 0),
      fvtplTotal: fvtpl.reduce((s, r) => s + r.unrealisedGL, 0),
    };
  }, []);

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
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Returns — P&amp;L Analysis
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Unrealised gains and losses by classification · Valuation date 28 May
          2026
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Total OCI Reserve"
          value={fmtCompact(Math.abs(ociTotal))}
          subtitle={
            ociTotal >= 0 ? "Net OCI gain (FVOCI)" : "Net OCI loss (FVOCI)"
          }
          variant={ociTotal >= 0 ? "default" : "warning"}
        />
        <StatCard
          title="FVOCI Instruments"
          value={String(ociRows.length)}
          subtitle="In OCI portfolio"
          variant="default"
        />
        <StatCard
          title="Total FVTPL Unrealised G/(L)"
          value={fmtCompact(Math.abs(fvtplTotal))}
          subtitle={
            fvtplTotal >= 0 ? "Net gain through P&L" : "Net loss through P&L"
          }
          variant={fvtplTotal >= 0 ? "default" : "warning"}
        />
        <StatCard
          title="FVTPL Instruments"
          value={String(fvtplRows.length)}
          subtitle="In FVTPL portfolio"
          variant="default"
        />
      </StatCardGrid>

      <SectionCard
        title="FVOCI — OCI Reserve Movements"
        description="Fair value changes accumulated in equity (OCI)"
      >
        <DataTable<Row>
          columns={ociCols}
          data={ociRows}
          keyExtractor={(r) => r.id}
          emptyMessage="No FVOCI instruments"
        />
      </SectionCard>

      <SectionCard
        title="FVTPL — Unrealised Gains / Losses"
        description="Fair value changes recognised through profit & loss"
      >
        <DataTable<Row>
          columns={fvtplCols}
          data={fvtplRows}
          keyExtractor={(r) => r.id}
          emptyMessage="No FVTPL instruments"
        />
      </SectionCard>
    </div>
  );
}
