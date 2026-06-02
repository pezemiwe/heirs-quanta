import { Download } from "lucide-react";
import { fmtCompact } from "../../../engine/book-compute";

export function HoldingsHeader({
  filteredCount,
  totalCount,
  totalBookValue,
  onExport,
}: {
  filteredCount: number;
  totalCount: number;
  totalBookValue: number;
  onExport: () => void;
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">Holdings</h1>
        <p className="mt-1 text-sm text-dark-gray/50">
          {filteredCount} of {totalCount} instruments · Book value{" "}
          <span className="font-semibold text-dark-gray">
            {fmtCompact(totalBookValue)}
          </span>
        </p>
      </div>
      <button
        onClick={onExport}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-dark-gray/60 shadow-sm hover:border-primary hover:text-primary"
      >
        <Download className="h-4 w-4" /> Export
      </button>
    </div>
  );
}
