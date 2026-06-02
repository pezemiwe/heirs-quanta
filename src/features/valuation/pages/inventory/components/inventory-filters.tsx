import { Search } from "lucide-react";
import { ALL_TYPES, ALL_CLASSES } from "../config";
import type { Classification, InstrumentType } from "../types";

export function InventoryFilters({
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  classFilter,
  setClassFilter,
}: {
  search: string;
  setSearch: (v: string) => void;
  typeFilter: "All" | InstrumentType;
  setTypeFilter: (v: "All" | InstrumentType) => void;
  classFilter: "All" | Classification;
  setClassFilter: (v: "All" | Classification) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ID, name, issuer or sector…"
          className="w-72 rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <select
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {ALL_TYPES.map((t) => (
          <option key={t} value={t}>
            {t === "All" ? "All Types" : t}
          </option>
        ))}
      </select>
      <select
        value={classFilter}
        onChange={(e) => setClassFilter(e.target.value as typeof classFilter)}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {ALL_CLASSES.map((c) => (
          <option key={c} value={c}>
            {c === "All"
              ? "All Classifications"
              : c === "AC"
                ? "AC \u2014 Amortised Cost"
                : c === "FVOCI"
                  ? "FVOCI \u2014 Fair Value (OCI)"
                  : c === "FVTPL"
                    ? "FVTPL \u2014 Fair Value (P&L)"
                    : c}
          </option>
        ))}
      </select>
    </div>
  );
}
