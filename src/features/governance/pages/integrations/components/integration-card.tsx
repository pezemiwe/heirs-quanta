import { RefreshCw } from "lucide-react";
import { CATEGORY_LABELS, STATUS_META } from "../config";
import type { Integration } from "../types";

interface IntegrationCardProps {
  int: Integration;
  isSyncing: boolean;
  onSync: (id: string) => void;
}

export function IntegrationCard({
  int,
  isSyncing,
  onSync,
}: IntegrationCardProps) {
  const sm = STATUS_META[int.status];
  return (
    <div
      key={int.id}
      className={`rounded-xl border p-5 transition-shadow hover:shadow-md ${
        int.status === "error"
          ? "border-red-200 bg-red-50/20"
          : int.status === "active"
            ? "border-emerald-200 bg-surface"
            : "border-border bg-surface"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-dark-gray">{int.name}</p>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${sm.bg}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${sm.dot} ${isSyncing ? "animate-pulse" : ""}`}
              />
              {isSyncing ? "Syncing…" : sm.label}
            </span>
          </div>
          <p className="text-xs text-dark-gray/50 mt-0.5">
            {int.vendor} · {CATEGORY_LABELS[int.category]}
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {int.status === "active" || int.status === "configured" ? (
            <button
              onClick={() => onSync(int.id)}
              className="flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-dark-gray/70 hover:bg-pale-red hover:text-primary transition-colors"
            >
              <RefreshCw
                className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`}
              />
              Sync
            </button>
          ) : (
            <button className="flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-dark-gray/70 hover:bg-pale-red hover:text-primary transition-colors">
              Configure
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-dark-gray/60 mb-3">{int.description}</p>

      {/* Data flows */}
      <div className="mb-3">
        <p className="text-xs font-medium text-dark-gray/50 mb-1.5">
          Data Flows
        </p>
        <div className="flex flex-wrap gap-1.5">
          {int.dataFlows.map((d) => (
            <span
              key={d}
              className="rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-dark-gray/70"
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-dark-gray/40 pt-2 border-t border-border">
        <span>
          Last sync: <span className="text-dark-gray/60">{int.lastSync}</span>
        </span>
        <span>
          Frequency:{" "}
          <span className="text-dark-gray/60">{int.syncFrequency}</span>
        </span>
      </div>
      {int.endpoint && (
        <p className="mt-1.5 font-mono text-xs text-dark-gray/30 truncate">
          {int.endpoint}
        </p>
      )}
    </div>
  );
}
