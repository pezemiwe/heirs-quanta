import { Download } from "lucide-react";

export function BlotterHeader({
  rowCount,
  totalCount,
  onExport,
}: {
  rowCount: number;
  totalCount: number;
  onExport: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Trade Blotter
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          {rowCount} of {totalCount} instruments · Portfolio Management book ·
          28 May 2026
        </p>
      </div>
      <button
        onClick={onExport}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-dark-gray/70 hover:border-primary hover:text-primary"
      >
        <Download className="h-4 w-4" /> Export CSV
      </button>
    </div>
  );
}
