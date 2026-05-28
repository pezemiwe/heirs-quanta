import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
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

interface ApprovalRow {
  id: string;
  name: string;
  type: string;
  issuer: string;
  stage: string;
  classification: string;
  faceValue: number;
  bsValue: number;
  eclProvision: number;
  maturityDate: string | null;
  reason: string;
}

type Row = ApprovalRow & Record<string, unknown>;

const STAGE_REASON: Record<string, string> = {
  "Stage 2": "Significant increase in credit risk — management review required",
  "Stage 3": "Credit-impaired — impairment committee approval required",
};

export function Approvals() {
  const { stage2, stage3, totalECL, totalExposure } = useMemo(() => {
    const valMap = new Map(
      BOOK_COMPUTED.valuations.map((v) => [v.instrument.id, v]),
    );

    const rows: ApprovalRow[] = BOOK_INSTRUMENTS.filter(
      (i) => i.impairmentStage === "Stage 2" || i.impairmentStage === "Stage 3",
    ).map((i) => {
      const val = valMap.get(i.id);
      return {
        id: i.id,
        name: i.name,
        type: i.instrumentType,
        issuer: i.issuer,
        stage: i.impairmentStage ?? "N/A",
        classification: i.classification,
        faceValue: i.faceValue,
        bsValue: val?.balanceSheetValueNGN ?? i.purchasePrice,
        eclProvision: val?.instrument.eclProvision ?? 0,
        maturityDate: i.maturityDate,
        reason: STAGE_REASON[i.impairmentStage ?? ""] ?? "Review pending",
      };
    });

    return {
      stage2: rows.filter((r) => r.stage === "Stage 2"),
      stage3: rows.filter((r) => r.stage === "Stage 3"),
      totalECL: BOOK_COMPUTED.totals.totalECLNGN,
      totalExposure: BOOK_COMPUTED.totals.totalBSValueNGN,
    };
  }, []);

  const allRows = [...stage3, ...stage2] as Row[];

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
    {
      key: "stage",
      header: "Stage",
      render: (r) => (
        <Badge variant={r.stage === "Stage 3" ? "stage3" : "stage2"} size="sm">
          {r.stage}
        </Badge>
      ),
    },
    {
      key: "faceValue",
      header: "Face Value",
      align: "right",
      render: (r) => fmtCompact(r.faceValue),
    },
    {
      key: "bsValue",
      header: "Book Value",
      align: "right",
      render: (r) => fmtCompact(r.bsValue),
    },
    {
      key: "eclProvision",
      header: "ECL Provision",
      align: "right",
      render: (r) => (
        <span className="font-medium text-primary">
          {fmtCompact(r.eclProvision)}
        </span>
      ),
    },
    {
      key: "maturityDate",
      header: "Maturity",
      render: (r) => fmtDate(r.maturityDate),
    },
    {
      key: "reason",
      header: "Action Required",
      render: (r) => (
        <span className="text-xs text-dark-gray/70 max-w-xs line-clamp-2">
          {r.reason}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-primary" />
          Approvals &amp; Credit Reviews
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Instruments requiring management or committee review due to elevated
          credit risk staging
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Stage 3 Instruments"
          value={String(stage3.length)}
          subtitle="Credit-impaired — committee required"
          variant="danger"
        />
        <StatCard
          title="Stage 2 Instruments"
          value={String(stage2.length)}
          subtitle="Elevated risk — management review"
          variant="warning"
        />
        <StatCard
          title="Total ECL Portfolio"
          value={fmtCompact(totalECL)}
          subtitle="Aggregate provision across all stages"
          variant="default"
        />
        <StatCard
          title="Coverage Ratio"
          value={fmtPct(totalECL / totalExposure)}
          subtitle="ECL / total book value"
          variant="default"
        />
      </StatCardGrid>

      {stage3.length > 0 && (
        <SectionCard
          title="Stage 3 — Credit-Impaired"
          description="Impairment committee approval required before any new activity"
        >
          <DataTable<Row>
            columns={cols}
            data={stage3 as Row[]}
            keyExtractor={(r) => r.id}
            emptyMessage="No Stage 3 instruments"
          />
        </SectionCard>
      )}

      <SectionCard
        title="Stage 2 — Significant Credit Risk Increase"
        description="Management review and sign-off required"
      >
        <DataTable<Row>
          columns={cols}
          data={stage2 as Row[]}
          keyExtractor={(r) => r.id}
          emptyMessage="No Stage 2 instruments"
        />
      </SectionCard>
    </div>
  );
}
