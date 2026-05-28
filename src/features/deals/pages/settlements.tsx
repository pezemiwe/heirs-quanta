import { useMemo } from "react";
import { ArrowLeftRight } from "lucide-react";
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
  fmtDate,
  daysBetween,
} from "../../portfolio/engine/book-compute";

const VALUATION_DATE = "2026-05-28";

interface SettlementRow {
  id: string;
  name: string;
  type: string;
  issuer: string;
  faceValue: number;
  bsValue: number;
  maturityDate: string;
  daysToMaturity: number;
  classification: string;
  currency: string;
}

type Row = SettlementRow & Record<string, unknown>;

export function Settlements() {
  const { rows, totalFace, totalBS } = useMemo(() => {
    const valMap = new Map(
      BOOK_COMPUTED.valuations.map((v) => [v.instrument.id, v]),
    );

    const result: SettlementRow[] = BOOK_INSTRUMENTS.filter(
      (i) => i.maturityDate !== null && i.status === "Active",
    )
      .map((i) => {
        const days = daysBetween(VALUATION_DATE, i.maturityDate!);
        const val = valMap.get(i.id);
        return {
          id: i.id,
          name: i.name,
          type: i.instrumentType,
          issuer: i.issuer,
          faceValue: i.faceValue,
          bsValue: val?.balanceSheetValueNGN ?? i.purchasePrice,
          maturityDate: i.maturityDate!,
          daysToMaturity: days,
          classification: i.classification,
          currency: i.currency,
        };
      })
      .filter((r) => r.daysToMaturity >= 0 && r.daysToMaturity <= 365)
      .sort((a, b) => a.daysToMaturity - b.daysToMaturity);

    return {
      rows: result as Row[],
      totalFace: result.reduce((s, r) => s + r.faceValue, 0),
      totalBS: result.reduce((s, r) => s + r.bsValue, 0),
    };
  }, []);

  const within30 = rows.filter((r) => r.daysToMaturity <= 30).length;
  const within90 = rows.filter((r) => r.daysToMaturity <= 90).length;

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
    { key: "issuer", header: "Issuer" },
    { key: "currency", header: "CCY", width: "60px" },
    {
      key: "faceValue",
      header: "Face Value",
      align: "right",
      render: (r) => fmtCompact(r.faceValue),
    },
    {
      key: "bsValue",
      header: "Book Value (NGN)",
      align: "right",
      render: (r) => (
        <span className="font-medium text-dark-gray">
          {fmtCompact(r.bsValue)}
        </span>
      ),
    },
    {
      key: "maturityDate",
      header: "Maturity Date",
      render: (r) => fmtDate(r.maturityDate),
    },
    {
      key: "daysToMaturity",
      header: "Days to Mat.",
      align: "right",
      render: (r) => {
        const cls =
          r.daysToMaturity <= 30
            ? "font-bold text-primary"
            : r.daysToMaturity <= 90
              ? "font-semibold text-amber-600"
              : "text-dark-gray/70";
        return <span className={cls}>{r.daysToMaturity}</span>;
      },
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
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray flex items-center gap-2">
          <ArrowLeftRight className="h-6 w-6 text-primary" />
          Settlements — Maturing Instruments
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Active instruments maturing within the next 12 months · Reference date
          28 May 2026
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Instruments Maturing ≤ 1Y"
          value={String(rows.length)}
          subtitle="In next 365 days"
          variant="highlight"
        />
        <StatCard
          title="Due Within 30 Days"
          value={String(within30)}
          subtitle="Immediate settlement"
          variant="danger"
        />
        <StatCard
          title="Due Within 90 Days"
          value={String(within90)}
          subtitle="Near-term settlement"
          variant="warning"
        />
        <StatCard
          title="Total Face to Settle"
          value={fmtCompact(totalFace)}
          subtitle="Face value rolling off"
          variant="default"
        />
      </StatCardGrid>

      <SectionCard
        title="Settlement Schedule"
        description="Instruments sorted by days to maturity"
      >
        <DataTable<Row>
          columns={cols}
          data={rows}
          keyExtractor={(r) => r.id}
          emptyMessage="No instruments maturing in this window"
        />
      </SectionCard>
    </div>
  );
}
