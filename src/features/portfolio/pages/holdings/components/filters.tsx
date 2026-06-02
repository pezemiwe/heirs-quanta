import { Search, SlidersHorizontal } from "lucide-react";
import { ALL_TYPES, ALL_CLASSIFICATIONS, CLASS_LABEL } from "../config";

export function HoldingsFilters({
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  classFilter,
  setClassFilter,
}: {
  search: string;
  setSearch: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  classFilter: string;
  setClassFilter: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-gray/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, issuer, ID…"
          className="rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm outline-none focus:border-primary w-72"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <SlidersHorizontal className="h-3.5 w-3.5 text-dark-gray/40" />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface py-2 px-3 text-sm outline-none focus:border-primary"
        >
          {ALL_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface py-2 px-3 text-sm outline-none focus:border-primary"
        >
          {ALL_CLASSIFICATIONS.map((c) => (
            <option key={c} value={c}>
              {c === "All" ? "All Classifications" : (CLASS_LABEL[c] ?? c)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
