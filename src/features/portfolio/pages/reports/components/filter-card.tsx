import { FileSpreadsheet, FileText, CalendarDays } from "lucide-react";
import { VALUATION_DATE } from "../../../engine/book-compute";
import { isoDate, parseDate } from "../utils";
import type { ReportMode } from "../types";

type Props = {
  mode: ReportMode;
  setMode: (m: ReportMode) => void;
  startDate: string;
  setStartDate: (s: string) => void;
  endDate: string;
  setEndDate: (s: string) => void;
  activeWindow: string;
  onExcel: () => void;
  onPDF: () => void;
};

export function FilterCard({
  mode,
  setMode,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  activeWindow,
  onExcel,
  onPDF,
}: Props) {
  return (
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
            onClick={onExcel}
            className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-dark-gray shadow-sm transition-all hover:border-green-500 hover:text-green-700"
          >
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            Excel
          </button>
          <button
            onClick={onPDF}
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
              const m = e.target.value as ReportMode;
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
  );
}
