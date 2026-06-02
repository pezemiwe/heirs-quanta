import { VAR_METRICS } from "../config";
import { StatusBadge } from "./status-badge";

export function VarSection() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {VAR_METRICS.map((v) => (
        <div
          key={v.label}
          className="rounded-xl border border-border bg-surface p-4 shadow-sm"
        >
          <p className="text-xs text-gray-400">{v.label}</p>
          <p className="mt-2 text-xl font-bold text-dark-gray">{v.value}</p>
          <p className="text-xs text-gray-400">{v.pct} of AuM</p>
          <div className="mt-2">
            <StatusBadge status={v.status} />
          </div>
        </div>
      ))}
    </div>
  );
}
