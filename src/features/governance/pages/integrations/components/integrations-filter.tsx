import { FILTER_OPTIONS } from "../config";
import type { FilterType } from "../types";

interface IntegrationsFilterProps {
  catFilter: FilterType;
  setCatFilter: (f: FilterType) => void;
}

export function IntegrationsFilter({
  catFilter,
  setCatFilter,
}: IntegrationsFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_OPTIONS.map((f) => (
        <button
          key={f.key}
          onClick={() => setCatFilter(f.key)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            catFilter === f.key
              ? "bg-primary text-white"
              : "border border-border bg-surface text-dark-gray/70 hover:bg-pale-red hover:text-primary"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
