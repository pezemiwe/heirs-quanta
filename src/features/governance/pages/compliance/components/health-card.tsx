import { SectionCard } from "../../../../../components/shared/section-card";
import { CATEGORIES, COMPLIANCE_ITEMS } from "../config";

interface HealthCardProps {
  score: number;
  compliantCount: number;
  exceptionCount: number;
  pendingCount: number;
  breachCount: number;
  catFilter: string;
  setCatFilter: (c: string) => void;
}

export function HealthCard({
  score,
  compliantCount,
  exceptionCount,
  pendingCount,
  breachCount,
  catFilter,
  setCatFilter,
}: HealthCardProps) {
  return (
    <SectionCard
      title="Overall Compliance Health"
      description="Aggregate view across all regulatory and internal checks"
    >
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="font-medium text-dark-gray">Compliance Score</span>
          <span className="font-bold text-emerald-700">{score}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-dark-gray/10">
          <div
            className="h-3 rounded-full bg-emerald-500 transition-all"
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="mt-2 flex gap-4 text-xs">
          <span className="text-emerald-600">{compliantCount} Compliant</span>
          <span className="text-amber-600">{exceptionCount} Exceptions</span>
          <span className="text-blue-600">{pendingCount} Pending</span>
          {breachCount > 0 && (
            <span className="text-red-600">{breachCount} Breach</span>
          )}
        </div>
      </div>

      {/* Category summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.slice(1).map((cat) => {
          const catItems = COMPLIANCE_ITEMS.filter((c) => c.category === cat);
          const catOK = catItems.filter((c) => c.status === "compliant").length;
          const catIssues = catItems.filter(
            (c) => c.status !== "compliant",
          ).length;
          return (
            <button
              key={cat}
              onClick={() => setCatFilter(cat === catFilter ? "All" : cat)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                catFilter === cat
                  ? "border-primary bg-pale-red"
                  : "border-border bg-surface hover:bg-pale-red/40"
              }`}
            >
              <p className="text-xs font-semibold text-dark-gray">{cat}</p>
              <p className="mt-0.5 text-xs text-dark-gray/60">
                {catOK}/{catItems.length} OK
                {catIssues > 0 && (
                  <span className="ml-1 text-amber-600">
                    {catIssues} issues
                  </span>
                )}
              </p>
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}
