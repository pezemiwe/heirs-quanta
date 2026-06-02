import { Search, Filter } from "lucide-react";

export function BlotterFilters({
  search,
  onSearchChange,
  typeFilter,
  onTypeChange,
  clfFilter,
  onClfChange,
  types,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  typeFilter: string;
  onTypeChange: (v: string) => void;
  clfFilter: string;
  onClfChange: (v: string) => void;
  types: string[];
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-56">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by ID, name or issuer…"
          className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-sm text-dark-gray placeholder-gray-400 focus:border-primary focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray focus:border-primary focus:outline-none"
        >
          {types.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select
          value={clfFilter}
          onChange={(e) => onClfChange(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray focus:border-primary focus:outline-none"
        >
          <option value="All">All Classifications</option>
          <option value="AC">AC \u2014 Amortised Cost</option>
          <option value="FVOCI">FVOCI \u2014 Fair Value (OCI)</option>
          <option value="FVTPL">FVTPL \u2014 Fair Value (P&L)</option>
        </select>
      </div>
    </div>
  );
}
