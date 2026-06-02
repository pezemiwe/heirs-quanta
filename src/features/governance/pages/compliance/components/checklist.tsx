import { SectionCard } from "../../../../../components/shared/section-card";
import { Badge } from "../../../../../components/shared/badge";
import { CATEGORIES, STATUS_META } from "../config";
import type { ComplianceItem } from "../types";

interface ChecklistProps {
  displayed: ComplianceItem[];
  catFilter: string;
  setCatFilter: (c: string) => void;
}

export function Checklist({
  displayed,
  catFilter,
  setCatFilter,
}: ChecklistProps) {
  return (
    <SectionCard
      title="Compliance Checklist"
      description={
        catFilter === "All" ? "All categories" : `Filtered: ${catFilter}`
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              catFilter === c
                ? "bg-primary text-white"
                : "border border-border bg-surface text-dark-gray/70 hover:bg-pale-red hover:text-primary"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {displayed.map((item) => {
          const meta = STATUS_META[item.status];
          const StatusIcon = meta.icon;
          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 rounded-lg border p-4 ${
                item.status === "breach"
                  ? "border-red-200 bg-red-50/30"
                  : item.status === "exception"
                    ? "border-amber-200 bg-amber-50/20"
                    : item.status === "pending"
                      ? "border-blue-200 bg-blue-50/10"
                      : "border-border bg-surface"
              }`}
            >
              <StatusIcon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.cls}`} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-dark-gray">
                    {item.check}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.bg}`}
                  >
                    {meta.label}
                  </span>
                  <Badge variant="neutral" size="sm">
                    {item.category}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-dark-gray/50">
                  Regulation: {item.regulation}
                </p>
                <p className="mt-1 text-xs text-dark-gray/70">{item.detail}</p>
                <div className="mt-1 flex gap-4 text-xs text-dark-gray/40">
                  <span>
                    Owner:{" "}
                    <span className="font-medium text-dark-gray">
                      {item.owner}
                    </span>
                  </span>
                  {item.dueDate && (
                    <span>
                      Due:{" "}
                      <span className="font-medium text-dark-gray">
                        {item.dueDate}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
