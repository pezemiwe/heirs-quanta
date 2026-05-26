import { FileText, Download } from "lucide-react";

const REPORTS = [
  {
    id: "RPT-001",
    title: "Monthly Portfolio Summary — May 2026",
    type: "Management Report",
    frequency: "Monthly",
    lastGenerated: "25 May 2026",
    pages: 12,
    status: "Ready",
  },
  {
    id: "RPT-002",
    title: "Q1 2026 Investment Committee Report",
    type: "Board Report",
    frequency: "Quarterly",
    lastGenerated: "15 Apr 2026",
    pages: 28,
    status: "Ready",
  },
  {
    id: "RPT-003",
    title: "Risk & Compliance Report — May 2026",
    type: "Regulatory",
    frequency: "Monthly",
    lastGenerated: "24 May 2026",
    pages: 8,
    status: "Ready",
  },
  {
    id: "RPT-004",
    title: "Asset Allocation Attribution — May 2026",
    type: "Analytics Report",
    frequency: "Monthly",
    lastGenerated: "25 May 2026",
    pages: 6,
    status: "Ready",
  },
  {
    id: "RPT-005",
    title: "CBN Regulatory Filing — Q1 2026",
    type: "Regulatory",
    frequency: "Quarterly",
    lastGenerated: "01 Apr 2026",
    pages: 34,
    status: "Submitted",
  },
  {
    id: "RPT-006",
    title: "Stress Test Results — Scenario Analysis",
    type: "Risk Report",
    frequency: "Ad hoc",
    lastGenerated: "20 May 2026",
    pages: 15,
    status: "Ready",
  },
];

const STATUS_STYLES: Record<string, string> = {
  Ready: "bg-teal-50 text-success",
  Submitted: "bg-blue-50 text-blue-700",
  Generating: "bg-yellow-50 text-yellow-700",
};

const TYPE_STYLES: Record<string, string> = {
  "Management Report": "bg-pale-red text-primary",
  "Board Report": "bg-red-100 text-deep-red",
  Regulatory: "bg-blue-50 text-blue-700",
  "Analytics Report": "bg-purple-50 text-purple-700",
  "Risk Report": "bg-yellow-50 text-yellow-700",
};

export function Reports() {
  return (
    <div className="p-6 xl:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Management, regulatory, and analytics reports
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-mid-red">
          <FileText className="h-4 w-4" /> Generate Report
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((r) => (
          <div
            key={r.id}
            className="flex flex-col rounded-xl border border-border bg-surface p-5 shadow-sm hover:border-primary/40 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLES[r.type] ?? "bg-gray-100 text-gray-600"}`}
              >
                {r.type}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status] ?? "bg-gray-100"}`}
              >
                {r.status}
              </span>
            </div>
            <p className="font-semibold text-sm text-dark-gray leading-snug flex-1">
              {r.title}
            </p>
            <div className="mt-3 space-y-1 text-xs text-gray-400">
              <p>
                Last generated:{" "}
                <span className="text-gray-600">{r.lastGenerated}</span>
              </p>
              <p>
                Frequency: <span className="text-gray-600">{r.frequency}</span>{" "}
                · {r.pages} pages
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors">
                <Download className="h-3.5 w-3.5" /> Download PDF
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors">
                <FileText className="h-3.5 w-3.5" /> View
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
