import {
  FileText,
  Download,
  FileBarChart2,
  FileSpreadsheet,
} from "lucide-react";
import { SectionCard } from "../../../components/shared/section-card";
import { Button } from "../../../components/shared/button";
import { Badge } from "../../../components/shared/badge";
import { useIFRS9 } from "../store";
import { fmtCompact, fmtPct } from "../utils/format";

const REPORTS = [
  {
    id: "summary",
    icon: <FileText className="h-4 w-4" />,
    title: "ECL Summary Report",
    description: "Single-page board summary with stage & specification totals.",
  },
  {
    id: "detail",
    icon: <FileSpreadsheet className="h-4 w-4" />,
    title: "Per-Instrument Detail",
    description: "Full breakdown including TTM, ratings, EAD[0] and ECL.",
  },
  {
    id: "movement",
    icon: <FileBarChart2 className="h-4 w-4" />,
    title: "Stage Movement Analysis",
    description: "Stage migration vs prior period (placeholder for now).",
  },
];

export function IFRS9Reports() {
  const { result } = useIFRS9();

  const toCSV = (rows: (string | number)[][]) =>
    rows
      .map((r) =>
        r
          .map((c) => {
            const s = String(c ?? "");
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(","),
      )
      .join("\n");

  const download = (id: string, csv: string) => {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ifrs9-${id}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const buildCSV = (id: string) => {
    switch (id) {
      case "summary":
        return toCSV([
          ["IFRS 9 ECL Summary"],
          ["Total Exposure (LCY)", result.totals.exposureLcy.toFixed(2)],
          ["Total ECL (LCY)", result.totals.impairmentLcy.toFixed(2)],
          ["Coverage Ratio", result.totals.coverageRatio.toFixed(6)],
          ["Instrument Count", result.totals.instrumentCount],
          [],
          ["Stage", "Count", "Exposure", "ECL", "Coverage %"],
          ...result.byStage.map((s) => [
            String(s.stage),
            s.count,
            s.exposure.toFixed(2),
            s.impairment.toFixed(2),
            (s.coverageRatio * 100).toFixed(2),
          ]),
        ]);
      case "detail":
        return toCSV([
          [
            "SN",
            "Counterparty",
            "Specification",
            "Currency",
            "Carrying LCY",
            "Rating Eq.",
            "Final Stage",
            "TTM",
            "EAD[0]",
            "LGD[0]",
            "ECL",
            "Coverage",
          ],
          ...result.rows.map((r) => [
            r.sn,
            r.counterparty,
            r.assetSpecification,
            r.currency,
            r.carryingAmountLcy.toFixed(2),
            r.ratingEquivalent,
            r.finalStage,
            r.ttm,
            (r.ead[0] ?? r.carryingAmountLcy).toFixed(2),
            (r.lgd[0] ?? 0).toFixed(4),
            r.ecl.toFixed(2),
            r.coverageRatio.toFixed(6),
          ]),
        ]);
      case "movement":
        return toCSV([
          ["Stage Movement (current-period snapshot)"],
          ["Counterparty", "Model Stage", "Override", "Final Stage"],
          ...result.rows.map((r) => [
            r.counterparty,
            r.modelStage,
            r.qualitativeStagingOverride,
            r.finalStage,
          ]),
        ]);
      default:
        return toCSV([["Report"]]);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Reports
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Generate IFRS 9 disclosures for the debt-securities book.
        </p>
      </div>

      <SectionCard title="Current Run">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-dark-gray/55">Total Exposure</p>
            <p className="mt-1 text-lg font-semibold text-dark-gray">
              {fmtCompact(result.totals.exposureLcy)}
            </p>
          </div>
          <div>
            <p className="text-xs text-dark-gray/55">Total ECL</p>
            <p className="mt-1 text-lg font-semibold text-deep-red">
              {fmtCompact(result.totals.impairmentLcy)}
            </p>
          </div>
          <div>
            <p className="text-xs text-dark-gray/55">Coverage Ratio</p>
            <p className="mt-1 text-lg font-semibold text-dark-gray">
              {fmtPct(result.totals.coverageRatio, 3)}
            </p>
          </div>
          <div>
            <p className="text-xs text-dark-gray/55">Instruments</p>
            <p className="mt-1 text-lg font-semibold text-dark-gray">
              {result.totals.instrumentCount}
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {REPORTS.map((r) => (
          <div
            key={r.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
          >
            <div className="flex items-start justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-pale-red text-primary">
                {r.icon}
              </span>
              <Badge variant="brand" size="sm">
                Live
              </Badge>
            </div>
            <div>
              <p className="text-sm font-semibold text-dark-gray">{r.title}</p>
              <p className="mt-1 text-xs text-dark-gray/60">{r.description}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-3.5 w-3.5" />}
              disabled={result.rows.length === 0}
              onClick={() => download(r.id, buildCSV(r.id))}
            >
              Download CSV
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
