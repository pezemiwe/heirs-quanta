import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge, StageBadge } from "../../../components/shared/badge";
import { useIFRS9 } from "../store";
import { fmtCompact, fmtDate, fmtPct } from "../utils/format";
import type { SecurityComputed } from "../engine/types";

type Row = SecurityComputed & Record<string, unknown>;

export function IFRS9Portfolio() {
  const { result } = useIFRS9();

  const cols: DataTableColumn<Row>[] = [
    { key: "sn", header: "SN", width: "60px" },
    { key: "counterparty", header: "Counterparty" },
    {
      key: "assetSpecification",
      header: "Specification",
      render: (r) => (
        <Badge variant="neutral" size="sm">
          {r.assetSpecification}
        </Badge>
      ),
    },
    { key: "currency", header: "CCY", width: "70px" },
    {
      key: "carryingAmountLcy",
      header: "Carrying (LCY)",
      align: "right",
      render: (r) => fmtCompact(r.carryingAmountLcy),
    },
    {
      key: "maturityDate",
      header: "Maturity",
      render: (r) => fmtDate(r.maturityDate),
    },
    {
      key: "ratingEquivalent",
      header: "Rating",
      render: (r) => (
        <span className="font-mono text-xs font-medium text-dark-gray/80">
          {r.ratingEquivalent}
        </span>
      ),
    },
    {
      key: "performanceStatus",
      header: "Status",
      render: (r) => {
        const map: Record<
          string,
          | "performing"
          | "watch"
          | "substandard"
          | "doubtful"
          | "loss"
          | "default"
        > = {
          Performing: "performing",
          Watchlist: "watch",
          Substandard: "substandard",
          Doubtful: "doubtful",
          Loss: "loss",
          Default: "default",
        };
        return (
          <Badge variant={map[r.performanceStatus] ?? "neutral"} size="sm">
            {r.performanceStatus}
          </Badge>
        );
      },
    },
    {
      key: "daysPastDue",
      header: "DPD",
      align: "right",
      render: (r) => r.daysPastDue,
    },
    {
      key: "finalStage",
      header: "Stage",
      render: (r) => <StageBadge stage={r.finalStage} />,
    },
    {
      key: "ecl",
      header: "ECL",
      align: "right",
      render: (r) => (
        <span className="font-medium text-deep-red">{fmtCompact(r.ecl)}</span>
      ),
    },
    {
      key: "coverageRatio",
      header: "Coverage",
      align: "right",
      render: (r) => fmtPct(r.coverageRatio, 2),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Debt Securities Portfolio
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          {result.rows.length} instruments · live ECL recomputed against current
          assumptions.
        </p>
      </div>

      <SectionCard noPadding>
        <DataTable
          columns={cols}
          data={result.rows as Row[]}
          keyExtractor={(r) => r.sn}
          emptyMessage="No instruments uploaded"
        />
      </SectionCard>
    </div>
  );
}
