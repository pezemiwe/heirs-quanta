import {
  bookInstrumentsLength,
  fmtCompact,
  fmtPct,
  stage2,
  stage3,
  totalDV01,
  wDur,
} from "../config";

export function Kpis() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        {
          label: "Portfolio DV01",
          value: fmtCompact(Math.abs(totalDV01)),
          sub: "₦ per 1bp",
        },
        {
          label: "Modified Duration",
          value: wDur.toFixed(2) + " yrs",
          sub: "weighted avg",
        },
        {
          label: "Stage 2 Instruments",
          value: String(stage2),
          sub: `${fmtPct(stage2 / bookInstrumentsLength)} of book`,
        },
        {
          label: "Stage 3 Instruments",
          value: String(stage3),
          sub: `${fmtPct(stage3 / bookInstrumentsLength)} of book`,
        },
      ].map((k) => (
        <div
          key={k.label}
          className="rounded-xl border border-border bg-surface p-4 shadow-sm"
        >
          <p className="text-xs text-gray-400">{k.label}</p>
          <p className="mt-2 text-xl font-bold text-dark-gray">{k.value}</p>
          <p className="text-xs text-gray-400">{k.sub}</p>
        </div>
      ))}
    </div>
  );
}
