import {
  FileText,
  FileSpreadsheet,
  ClipboardCheck,
  BookOpen,
  Download,
} from "lucide-react";
import { useValuation } from "../store";
import { ASSET_TYPE_LABEL } from "../utils";

const REPORTS = [
  {
    id: "group-summary",
    title: "Group Valuation Summary",
    desc: "Executive one-pager: total carrying vs fair value, top movers, IFRS 13 split, sector view.",
    icon: <FileText className="h-5 w-5" />,
    accent: "#5C0000",
  },
  {
    id: "ifrs13-pack",
    title: "IFRS 13 Disclosure Pack",
    desc: "Hierarchy reconciliation, Level 3 inputs & ranges, sensitivity to unobservable inputs.",
    icon: <BookOpen className="h-5 w-5" />,
    accent: "#800000",
  },
  {
    id: "audit-trail",
    title: "Audit Trail",
    desc: "All overrides, manual adjustments, source data hashes, and assumption changes since last close.",
    icon: <ClipboardCheck className="h-5 w-5" />,
    accent: "#B30000",
  },
  {
    id: "sensitivity-report",
    title: "Sensitivity Analysis Report",
    desc: "Tornado, bull/bear scenarios, attribution by driver. Boardroom-ready charts.",
    icon: <FileSpreadsheet className="h-5 w-5" />,
    accent: "#CC0000",
  },
];

export function ValuationReports() {
  const v = useValuation();

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
    a.download = `${id}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const buildCSV = (id: string) => {
    const vals = v.result.valuations;
    const byId = new Map(v.assets.map((a) => [a.id, a]));
    switch (id) {
      case "group-summary":
        return toCSV([
          ["Total Carrying", v.result.totalCarryingValue.toFixed(0)],
          ["Total Fair Value", v.result.totalFairValue.toFixed(0)],
          ["Uplift", v.result.totalUplift.toFixed(0)],
          ["Uplift %", v.result.totalUpliftPct.toFixed(2)],
          [],
          ["Asset", "Type", "Carrying", "Fair Value", "Uplift", "Uplift %"],
          ...vals.map((val) => {
            const a = byId.get(val.assetId);
            return [
              a?.name ?? val.assetId,
              a ? ASSET_TYPE_LABEL[a.type] : "",
              (a?.carryingValue ?? 0).toFixed(0),
              val.fairValue.toFixed(0),
              val.uplift.toFixed(0),
              val.upliftPct.toFixed(2),
            ];
          }),
        ]);
      case "ifrs13-pack":
        return toCSV([
          ["Asset", "Method", "IFRS 13 Level", "Fair Value", "Low", "High"],
          ...vals.map((val) => {
            const a = byId.get(val.assetId);
            return [
              a?.name ?? val.assetId,
              val.method,
              val.ifrs13Level,
              val.fairValue.toFixed(0),
              val.fairValueLow.toFixed(0),
              val.fairValueHigh.toFixed(0),
            ];
          }),
        ]);
      case "audit-trail":
        return toCSV([
          ["Timestamp", new Date().toISOString()],
          ["Reporting Currency", v.assumptions.reportingCurrency],
          ["Valuation Date", v.assumptions.valuationDate],
          [],
          ["Asset", "Method", "Fair Value", "Notes"],
          ...vals.map((val) => {
            const a = byId.get(val.assetId);
            return [
              a?.name ?? val.assetId,
              val.method,
              val.fairValue.toFixed(0),
              val.notes,
            ];
          }),
        ]);
      case "sensitivity-report":
        return toCSV([
          ["Asset", "Fair Value", "Bear (Low)", "Bull (High)", "Range %"],
          ...vals.map((val) => {
            const a = byId.get(val.assetId);
            const pct =
              val.fairValue > 0
                ? ((val.fairValueHigh - val.fairValueLow) / val.fairValue) * 100
                : 0;
            return [
              a?.name ?? val.assetId,
              val.fairValue.toFixed(0),
              val.fairValueLow.toFixed(0),
              val.fairValueHigh.toFixed(0),
              pct.toFixed(2),
            ];
          }),
        ]);
      default:
        return toCSV([["Report"]]);
    }
  };

  return (
    <div className="p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pre-built deliverables for the audit committee, regulator, and
          investor relations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {REPORTS.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-border bg-surface p-5 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
                style={{ background: r.accent }}
              >
                {r.icon}
              </span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-dark-gray">
                  {r.title}
                </h3>
                <p className="mt-1 text-xs text-gray-500">{r.desc}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    disabled={!v.hasData}
                    onClick={() => download(r.id, buildCSV(r.id))}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-mid-red disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Download className="h-3.5 w-3.5" /> Download CSV
                  </button>
                  <button
                    disabled={!v.hasData}
                    onClick={() => {
                      const csv = buildCSV(r.id);
                      const w = window.open("", "_blank");
                      if (w) {
                        w.document.write(
                          `<pre style="font-family:monospace;font-size:12px;padding:16px;">${csv
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")}</pre>`,
                        );
                        w.document.title = r.title;
                      }
                    }}
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-gray-500 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!v.hasData && (
        <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-xs text-gray-400">
          Load a portfolio before generating reports.
        </div>
      )}
    </div>
  );
}
