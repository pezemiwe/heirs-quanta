import {
  FileText,
  BarChart2,
  ShieldCheck,
  PieChart,
  FileBarChart,
  Zap,
  Download,
} from "lucide-react";
import { usePortfolio } from "../store";
import { fmtNGN } from "../utils";

const REPORTS = [
  {
    id: "monthly-summary",
    title: "Monthly Portfolio Summary",
    description:
      "Full NAV snapshot, performance attribution, sector rotation, and liquidity analysis for the Investment Committee.",
    period: "May 2026",
    status: "Ready",
    icon: <BarChart2 className="h-5 w-5" />,
    color: "#CC0000",
  },
  {
    id: "q1-ic-report",
    title: "Q1 2026 IC Report",
    description:
      "Quarterly Investment Committee report covering strategic allocation review, portfolio performance vs targets, and forward outlook.",
    period: "Q1 2026",
    status: "Ready",
    icon: <FileBarChart className="h-5 w-5" />,
    color: "#800000",
  },
  {
    id: "risk-compliance",
    title: "Risk & Compliance Report",
    description:
      "IPS compliance status, concentration limits, regulatory capital ratios, and escalation summary for the CRO.",
    period: "May 2026",
    status: "Ready",
    icon: <ShieldCheck className="h-5 w-5" />,
    color: "#5C0000",
  },
  {
    id: "attribution",
    title: "Return Attribution Report",
    description:
      "Brinson-Hood-Beebower attribution — allocation effect, selection effect, and interaction effect vs benchmark.",
    period: "YTD 2026",
    status: "Ready",
    icon: <PieChart className="h-5 w-5" />,
    color: "#B30000",
  },
  {
    id: "cbn-regulatory",
    title: "CBN Regulatory Filing",
    description:
      "Statutory report for submission to the Central Bank of Nigeria per Investment and Securities Act requirements.",
    period: "Q1 2026",
    status: "Draft",
    icon: <FileText className="h-5 w-5" />,
    color: "#E05050",
  },
  {
    id: "stress-test",
    title: "Stress Test Report",
    description:
      "Scenario analysis outcomes for GFC replay, NGN devaluation, oil shock, and CBN rate hike, with capital adequacy assessment.",
    period: "May 2026",
    status: "Ready",
    icon: <Zap className="h-5 w-5" />,
    color: "#5C0000",
  },
];

const STATUS: Record<string, string> = {
  Ready: "bg-teal-50 text-success",
  Draft: "bg-yellow-50 text-yellow-700",
  Processing: "bg-blue-50 text-blue-700",
};

export function PortfolioReports() {
  const { holdings, metrics, targets } = usePortfolio();

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

  const handleDownload = (id: string, title: string) => {
    let csv = "";
    switch (id) {
      case "monthly-summary": {
        csv = toCSV([
          ["Section", "Metric", "Value"],
          ["NAV", "Total NAV (NGN)", metrics.totalNav.toFixed(0)],
          ["NAV", "YTD Return (%)", metrics.ytdReturn.toFixed(2)],
          ["NAV", "Holdings Count", holdings.length],
          [],
          ["By Class", "Class", "Value (NGN)"],
          ...metrics.byClass.map((c) => ["", c.label, c.value.toFixed(0)]),
          [],
          ["By Geo", "Geography", "Value (NGN)"],
          ...metrics.byGeo.map((g) => ["", g.label, g.value.toFixed(0)]),
        ]);
        break;
      }
      case "q1-ic-report": {
        csv = toCSV([
          ["IC Report — Q1 2026"],
          [],
          ["Holding", "Class", "Sector", "Market Value", "YTD %"],
          ...holdings.map((h) => [
            h.name,
            h.assetClass,
            h.sector,
            h.marketValue.toFixed(0),
            h.ytdReturn.toFixed(2),
          ]),
        ]);
        break;
      }
      case "risk-compliance": {
        csv = toCSV([
          ["Asset Class", "Current %", "Target %", "Limit %", "Status"],
          ...metrics.byClass.map((c) => {
            const t = targets.find((x) => x.assetClass === c.label);
            const status = t
              ? c.pct > t.limitPct
                ? "BREACH"
                : c.pct > t.limitPct * 0.9
                  ? "NEAR LIMIT"
                  : "OK"
              : "—";
            return [
              c.label,
              c.pct.toFixed(2),
              t?.targetPct ?? "",
              t?.limitPct ?? "",
              status,
            ];
          }),
        ]);
        break;
      }
      case "attribution": {
        csv = toCSV([
          ["Holding", "Class", "Cost", "Market Value", "P&L", "YTD %"],
          ...holdings.map((h) => [
            h.name,
            h.assetClass,
            h.costBasis.toFixed(0),
            h.marketValue.toFixed(0),
            (h.marketValue - h.costBasis).toFixed(0),
            h.ytdReturn.toFixed(2),
          ]),
        ]);
        break;
      }
      case "cbn-regulatory": {
        csv = toCSV([
          ["CBN Regulatory Filing — Draft"],
          ["Total NAV", fmtNGN(metrics.totalNav)],
          ["Reporting Currency", "NGN"],
          [],
          ["Issuer", "Sector", "Geography", "Currency", "Market Value"],
          ...holdings.map((h) => [
            h.issuer,
            h.sector,
            h.geography,
            h.currency,
            h.marketValue.toFixed(0),
          ]),
        ]);
        break;
      }
      case "stress-test": {
        const scenarios = [
          ["GFC Replay (-35%)", -0.35],
          ["NGN Devaluation (-20% FX)", -0.2],
          ["Oil Shock (-15%)", -0.15],
          ["CBN Rate Hike +300bps", -0.08],
        ] as const;
        csv = toCSV([
          ["Scenario", "Shock", "NAV After", "Loss"],
          ...scenarios.map(([n, s]) => {
            const after = metrics.totalNav * (1 + s);
            return [
              n,
              `${(s * 100).toFixed(1)}%`,
              after.toFixed(0),
              (metrics.totalNav - after).toFixed(0),
            ];
          }),
        ]);
        break;
      }
      default:
        csv = toCSV([["Report"], [title]]);
    }
    downloadFile(
      `${id}-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
      "text/csv",
    );
  };

  return (
    <div className="p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Investment Committee, regulatory, and management reports
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((r) => (
          <div
            key={r.id}
            className="group relative flex flex-col rounded-xl border border-border bg-surface p-5 shadow-sm hover:border-primary hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                style={{ background: r.color }}
              >
                {r.icon}
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS[r.status]}`}
              >
                {r.status}
              </span>
            </div>

            <div className="mt-4 flex-1">
              <h3 className="text-sm font-semibold text-dark-gray">
                {r.title}
              </h3>
              <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">
                {r.description}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
              <span className="text-xs font-medium text-gray-400">
                {r.period}
              </span>
              <button
                className="flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                onClick={() => handleDownload(r.id, r.title)}
              >
                <Download className="h-3.5 w-3.5" /> Download CSV
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
