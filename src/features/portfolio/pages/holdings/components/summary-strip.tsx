import type { HoldingRow } from "../types";

export function SummaryStrip({ rows }: { rows: HoldingRow[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        {
          label: "Amortised Cost",
          value: rows.filter((r) => r.classification === "AC").length,
        },
        {
          label: "Fair Value (OCI)",
          value: rows.filter((r) => r.classification === "FVOCI").length,
        },
        {
          label: "Fair Value (P&L)",
          value: rows.filter((r) => r.classification === "FVTPL").length,
        },
        {
          label: "Stage 2/3 Watch",
          value: rows.filter((r) => r.stage !== "Stage 1").length,
        },
      ].map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-border bg-surface p-4 shadow-sm"
        >
          <p className="text-xs text-dark-gray/50 font-medium">{s.label}</p>
          <p className="mt-1 text-xl font-bold text-dark-gray">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
