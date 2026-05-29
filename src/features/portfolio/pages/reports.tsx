import { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  FileText,
  CalendarDays,
  TrendingUp,
  ArrowDownUp,
  Wallet,
  Clock,
} from "lucide-react";
import {
  BOOK_VALUATIONS,
  VALUATION_DATE,
  fmtCompact,
  fmtDate,
} from "../engine/book-compute";

/* ── helpers ─────────────────────────────────────────────────── */
function fmtNGN(v: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtNum(v: number) {
  return new Intl.NumberFormat("en-NG").format(v);
}

function parseDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

type ActivityRow = {
  activity: string;
  requests: number;
  requested: number;
  disbursed: number;
  completion: number;
};

/* ── main component ───────────────────────────────────────────── */
export function PortfolioReports() {
  const vDate = parseDate(VALUATION_DATE);
  const firstOfMonth = isoDate(
    new Date(Date.UTC(vDate.getUTCFullYear(), vDate.getUTCMonth(), 1)),
  );

  const [mode, setMode] = useState<
    "Monthly" | "Quarterly" | "Annual" | "Custom"
  >("Monthly");
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(VALUATION_DATE);

  const activeWindow = useMemo(() => {
    const s = parseDate(startDate);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    if (mode === "Monthly")
      return `${months[s.getUTCMonth()]} ${s.getUTCFullYear()}`;
    if (mode === "Quarterly") {
      const q = Math.floor(s.getUTCMonth() / 3) + 1;
      return `Q${q} ${s.getUTCFullYear()}`;
    }
    if (mode === "Annual") return `FY ${s.getUTCFullYear()}`;
    return `${fmtDate(startDate)} \u2013 ${fmtDate(endDate)}`;
  }, [mode, startDate, endDate]);

  const filteredValuations = useMemo(() => {
    const s = parseDate(startDate);
    const e = parseDate(endDate);
    return BOOK_VALUATIONS.filter((v) => {
      const d = parseDate(v.instrument.purchaseDate);
      return d >= s && d <= e;
    });
  }, [startDate, endDate]);

  const stats = useMemo(() => {
    const transactions = filteredValuations.length;
    const totalRequested = filteredValuations.reduce(
      (acc, v) => acc + v.instrument.faceValue,
      0,
    );
    const totalDisbursed = filteredValuations.reduce(
      (acc, v) => acc + v.dirtyFairValue,
      0,
    );
    const pending = filteredValuations.filter(
      (v) => v.instrument.status !== "Active",
    ).length;
    return { transactions, totalRequested, totalDisbursed, pending };
  }, [filteredValuations]);

  const activityRows: ActivityRow[] = useMemo(() => {
    const map = new Map<
      string,
      { requests: number; requested: number; disbursed: number }
    >();
    for (const v of filteredValuations) {
      const cls = v.instrument.instrumentType;
      const cur = map.get(cls) ?? { requests: 0, requested: 0, disbursed: 0 };
      cur.requests += 1;
      cur.requested += v.instrument.faceValue;
      cur.disbursed += v.dirtyFairValue;
      map.set(cls, cur);
    }
    return Array.from(map.entries())
      .map(([activity, d]) => ({
        activity,
        requests: d.requests,
        requested: d.requested,
        disbursed: d.disbursed,
        completion: d.requested > 0 ? (d.disbursed / d.requested) * 100 : 0,
      }))
      .sort((a, b) => b.requested - a.requested);
  }, [filteredValuations]);

  const topClass = activityRows[0];
  const insight = useMemo(() => {
    if (activityRows.length === 0)
      return "No transaction data in selected date range.";
    const pct =
      stats.totalRequested > 0
        ? ((stats.totalDisbursed / stats.totalRequested) * 100).toFixed(1)
        : "0.0";
    return `During ${activeWindow}, ${stats.transactions} instrument${stats.transactions !== 1 ? "s" : ""} settled with a total face value of ${fmtNGN(stats.totalRequested)}. Net disbursed amount was ${fmtNGN(stats.totalDisbursed)} (${pct}% of requested).${topClass ? ` ${topClass.activity} was the most active class with ${topClass.requests} transactions totalling ${fmtNGN(topClass.requested)}.` : ""}`;
  }, [activityRows, stats, activeWindow, topClass]);

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

  const downloadBlob = (content: string, filename: string, mime: string) => {
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

  const handleExcel = () => {
    const rows: (string | number)[][] = [
      ["Portfolio Report", activeWindow],
      [],
      ["SUMMARY"],
      ["Transactions", stats.transactions],
      ["Total Requested (NGN)", stats.totalRequested],
      ["Total Disbursed (NGN)", stats.totalDisbursed.toFixed(0)],
      ["Pending Drafts", stats.pending],
      [],
      ["ACTIVITY BREAKDOWN"],
      [
        "Asset Class",
        "Transactions",
        "Requested (NGN)",
        "Disbursed (NGN)",
        "Completion %",
      ],
      ...activityRows.map((r) => [
        r.activity,
        r.requests,
        r.requested.toFixed(0),
        r.disbursed.toFixed(0),
        r.completion.toFixed(1),
      ]),
      [],
      ["INSTRUMENT DETAIL"],
      [
        "ID",
        "Name",
        "Asset Class",
        "Face Value",
        "Dirty Price",
        "Settlement Date",
      ],
      ...filteredValuations.map((v) => [
        v.instrument.id,
        v.instrument.name,
        v.instrument.instrumentType,
        v.instrument.faceValue.toFixed(0),
        v.dirtyFairValue.toFixed(0),
        v.instrument.purchaseDate,
      ]),
    ];
    downloadBlob(toCSV(rows), `portfolio-report-${startDate}.csv`, "text/csv");
  };

  const handlePDF = () => {
    const tableRows = activityRows
      .map(
        (r) =>
          `<tr><td>${r.activity}</td><td>${r.requests}</td><td>\u20a6${fmtNum(Math.round(r.requested))}</td><td>\u20a6${fmtNum(Math.round(r.disbursed))}</td><td>${r.completion.toFixed(1)}%</td></tr>`,
      )
      .join("");
    const html = `<!DOCTYPE html><html><head><title>Portfolio Report \u2014 ${activeWindow}</title>
<style>body{font-family:Arial,sans-serif;padding:32px;color:#1a1a2e}h1{color:#CC0000;margin-bottom:4px}.sub{color:#666;margin-bottom:24px;font-size:13px}.kpis{display:flex;gap:16px;margin-bottom:24px}.kpi{background:#f7f7f8;border-radius:8px;padding:16px 20px;flex:1}.kpi-val{font-size:22px;font-weight:700;color:#1a1a2e}.kpi-lbl{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-top:4px}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#f0f0f0;padding:8px 12px;text-align:left;font-weight:600;border-bottom:2px solid #ddd}td{padding:8px 12px;border-bottom:1px solid #eee}.insight{margin-top:24px;background:#f7f7f8;border-left:4px solid #CC0000;padding:14px 18px;border-radius:4px;font-size:13px;color:#444;line-height:1.6}.footer{margin-top:32px;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:12px}</style>
</head><body><h1>Portfolio Report</h1>
<div class="sub">Active Window: ${activeWindow} &nbsp;\u00b7&nbsp; Generated: ${new Date().toLocaleDateString()}</div>
<div class="kpis"><div class="kpi"><div class="kpi-val">${stats.transactions}</div><div class="kpi-lbl">Transactions</div></div><div class="kpi"><div class="kpi-val">\u20a6${fmtNum(Math.round(stats.totalRequested))}</div><div class="kpi-lbl">Total Requested</div></div><div class="kpi"><div class="kpi-val">\u20a6${fmtNum(Math.round(stats.totalDisbursed))}</div><div class="kpi-lbl">Total Disbursed</div></div><div class="kpi"><div class="kpi-val">${stats.pending}</div><div class="kpi-lbl">Pending Drafts</div></div></div>
<h3 style="margin-bottom:12px">Activity Breakdown</h3>
<table><thead><tr><th>Asset Class</th><th>Requests</th><th>Requested</th><th>Disbursed</th><th>Completion</th></tr></thead>
<tbody>${tableRows || '<tr><td colspan="5" style="text-align:center;color:#aaa;padding:24px">No data</td></tr>'}</tbody></table>
<div class="insight">${insight}</div>
<div class="footer">Exports include all filtered transactions and summary totals. Generated by Heirs Quanta.</div>
</body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.print();
    }
  };

  const hasData = activityRows.length > 0;

  return (
    <div className="p-6 xl:p-8 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate weekly, monthly, or custom performance reports
        </p>
      </div>

      {/* Filter card */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Report Filters
            </p>
            <h2 className="text-base font-semibold text-dark-gray">
              Generate Professional Financial Reports
            </h2>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleExcel}
              className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-dark-gray shadow-sm transition-all hover:border-green-500 hover:text-green-700"
            >
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              Excel
            </button>
            <button
              onClick={handlePDF}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90"
            >
              <FileText className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              Mode
            </label>
            <select
              value={mode}
              onChange={(e) => {
                const m = e.target.value as typeof mode;
                setMode(m);
                const now = parseDate(VALUATION_DATE);
                if (m === "Monthly") {
                  setStartDate(
                    isoDate(
                      new Date(
                        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
                      ),
                    ),
                  );
                  setEndDate(VALUATION_DATE);
                } else if (m === "Quarterly") {
                  const q = Math.floor(now.getUTCMonth() / 3);
                  setStartDate(
                    isoDate(new Date(Date.UTC(now.getUTCFullYear(), q * 3, 1))),
                  );
                  setEndDate(VALUATION_DATE);
                } else if (m === "Annual") {
                  setStartDate(
                    isoDate(new Date(Date.UTC(now.getUTCFullYear(), 0, 1))),
                  );
                  setEndDate(VALUATION_DATE);
                }
              }}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option>Monthly</option>
              <option>Quarterly</option>
              <option>Annual</option>
              <option>Custom</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setMode("Custom");
              }}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setMode("Custom");
              }}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              Active Window
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm font-medium text-dark-gray">
              <CalendarDays className="h-4 w-4 text-primary shrink-0" />
              {activeWindow}
            </div>
          </div>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            {
              label: "Transactions",
              value: fmtNum(stats.transactions),
              icon: <ArrowDownUp className="h-5 w-5" />,
              color: "text-primary",
              bg: "bg-pale-red",
            },
            {
              label: "Total Requested",
              value:
                stats.totalRequested > 0
                  ? fmtCompact(stats.totalRequested)
                  : "\u20a60",
              icon: <Wallet className="h-5 w-5" />,
              color: "text-blue-700",
              bg: "bg-blue-50",
            },
            {
              label: "Total Disbursed",
              value:
                stats.totalDisbursed > 0
                  ? fmtCompact(stats.totalDisbursed)
                  : "\u20a60",
              icon: <TrendingUp className="h-5 w-5" />,
              color: "text-green-700",
              bg: "bg-green-50",
            },
            {
              label: "Pending Drafts",
              value: fmtNum(stats.pending),
              icon: <Clock className="h-5 w-5" />,
              color: "text-yellow-700",
              bg: "bg-yellow-50",
            },
          ] as const
        ).map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-4 rounded-xl border border-border bg-white p-5 shadow-sm"
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.bg} ${s.color}`}
            >
              {s.icon}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">{s.label}</p>
              <p className="text-xl font-bold text-dark-gray">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Breakdown */}
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-dark-gray">
            Activity Breakdown
          </h3>
        </div>
        {hasData ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-muted">
                  {[
                    "Activity",
                    "Requests",
                    "Requested",
                    "Disbursed",
                    "Completion",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 ${i === 0 ? "text-left" : "text-right"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activityRows.map((row) => (
                  <tr
                    key={row.activity}
                    className="hover:bg-surface-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-dark-gray">
                      {row.activity}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {fmtNum(row.requests)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {fmtNGN(Math.round(row.requested))}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {fmtNGN(Math.round(row.disbursed))}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${Math.min(row.completion, 100).toFixed(1)}%`,
                            }}
                          />
                        </div>
                        <span className="text-gray-600 w-12 text-right">
                          {row.completion.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-400">
              No transaction data in selected date range.
            </p>
            <p className="text-xs text-gray-300 mt-1">
              Adjust the start and end date to view activity.
            </p>
          </div>
        )}
      </div>

      {/* Report Insight */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-dark-gray">
          Report Insight
        </h3>
        <p className="text-sm leading-relaxed text-gray-600">{insight}</p>
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-400 border-t border-border pt-4">
        Exports include all filtered transactions and summary totals. Data
        sourced from the canonical instrument book as at{" "}
        {fmtDate(VALUATION_DATE)}.
      </p>
    </div>
  );
}
