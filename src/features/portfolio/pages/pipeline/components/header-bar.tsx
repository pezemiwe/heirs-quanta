import { LayoutGrid, List, Plus } from "lucide-react";
import type { ViewMode } from "../types";

interface Props {
  totalDeals: number;
  avgIRR: number;
  highCount: number;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  onNewDeal: () => void;
}

export const HeaderBar = ({
  totalDeals,
  avgIRR,
  highCount,
  view,
  onViewChange,
  onNewDeal,
}: Props) => (
  <div className="flex flex-wrap items-start justify-between gap-4">
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
        Portfolio Management
      </p>
      <h1 className="mt-0.5 text-2xl font-bold text-dark-gray">
        Investment Pipeline
      </h1>
      <p className="mt-1 text-sm text-dark-gray/50">
        {totalDeals} deals &middot; avg IRR{" "}
        <span className="font-semibold text-success">{avgIRR.toFixed(1)}%</span>{" "}
        · {highCount} high-priority
      </p>
    </div>
    <div className="flex items-center gap-2">
      <div className="flex rounded-lg border border-border bg-surface overflow-hidden">
        <button
          onClick={() => onViewChange("kanban")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
            view === "kanban"
              ? "bg-primary text-white"
              : "text-dark-gray/50 hover:text-dark-gray"
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5" /> Board
        </button>
        <button
          onClick={() => onViewChange("list")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
            view === "list"
              ? "bg-primary text-white"
              : "text-dark-gray/50 hover:text-dark-gray"
          }`}
        >
          <List className="h-3.5 w-3.5" /> List
        </button>
      </div>
      <button
        onClick={onNewDeal}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-mid-red"
      >
        <Plus className="h-4 w-4" /> New Deal
      </button>
    </div>
  </div>
);
