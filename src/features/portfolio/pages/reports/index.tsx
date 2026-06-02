import { useMemo, useState } from "react";
import {
  BOOK_VALUATIONS,
  VALUATION_DATE,
  fmtDate,
} from "../../engine/book-compute";
import { MONTH_LABELS } from "./config";
import { exportExcel, exportPDF, fmtNGN, isoDate, parseDate } from "./utils";
import type { ActivityRow, ReportMode } from "./types";
import { FilterCard } from "./components/filter-card";
import { KpiTiles } from "./components/kpi-tiles";
import { ActivityBreakdown } from "./components/activity-breakdown";
import { ReportInsight } from "./components/report-insight";

export function PortfolioReports() {
  const vDate = parseDate(VALUATION_DATE);
  const firstOfMonth = isoDate(
    new Date(Date.UTC(vDate.getUTCFullYear(), vDate.getUTCMonth(), 1)),
  );

  const [mode, setMode] = useState<ReportMode>("Monthly");
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(VALUATION_DATE);

  const activeWindow = useMemo(() => {
    const s = parseDate(startDate);
    if (mode === "Monthly")
      return `${MONTH_LABELS[s.getUTCMonth()]} ${s.getUTCFullYear()}`;
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

  const handleExcel = () =>
    exportExcel({
      activeWindow,
      stats,
      activityRows,
      filteredValuations,
      startDate,
    });
  const handlePDF = () =>
    exportPDF({
      activeWindow,
      stats,
      activityRows,
      filteredValuations,
      startDate,
    });

  const hasData = activityRows.length > 0;

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate weekly, monthly, or custom performance reports
        </p>
      </div>

      {/* Filter card */}
      <FilterCard
        mode={mode}
        setMode={setMode}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        activeWindow={activeWindow}
        onExcel={handleExcel}
        onPDF={handlePDF}
      />

      {/* KPI tiles */}
      <KpiTiles stats={stats} />

      {/* Activity Breakdown */}
      <ActivityBreakdown activityRows={activityRows} hasData={hasData} />

      {/* Report Insight */}
      <ReportInsight insight={insight} />

      {/* Footer */}
      <p className="text-xs text-gray-400 border-t border-border pt-4">
        Exports include all filtered transactions and summary totals. Data
        sourced from the canonical instrument book as at{" "}
        {fmtDate(VALUATION_DATE)}.
      </p>
    </div>
  );
}
