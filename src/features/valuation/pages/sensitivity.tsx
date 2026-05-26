import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useValuation } from "../store";
import { runSensitivity } from "../engine";
import { fmtNGN } from "../utils";

export function ValuationSensitivity() {
  const v = useValuation();

  if (!v.hasData) {
    return (
      <div className="p-6 xl:p-8">
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm font-medium text-dark-gray">
            No data for sensitivity analysis
          </p>
        </div>
      </div>
    );
  }

  const rows = runSensitivity(v.assets, v.assumptions);
  const base = v.result.totalFairValue;
  const maxSwing = Math.max(...rows.map((r) => r.swing), 1);

  /* simple scenario set */
  const bear = rows.reduce((s, r) => s + (r.low - base), 0) * 0.4 + base; // partial overlay
  const bull = rows.reduce((s, r) => s + (r.high - base), 0) * 0.4 + base;

  const scenarios = [
    {
      label: "Bear",
      value: bear,
      sub: "RFR +1.5%, ERP +1%, multiples −1x",
      accent: "#b91c1c",
      icon: <TrendingDown className="h-4 w-4" />,
    },
    {
      label: "Base",
      value: base,
      sub: "Current assumption set",
      accent: "#5C0000",
      icon: <Minus className="h-4 w-4" />,
    },
    {
      label: "Bull",
      value: bull,
      sub: "RFR −1.5%, ERP −1%, multiples +1x",
      accent: "#0f766e",
      icon: <TrendingUp className="h-4 w-4" />,
    },
  ];

  return (
    <div className="p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">
          Sensitivity & Scenarios
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Identify the assumptions that most affect group fair value, and
          stress-test under bull/bear scenarios.
        </p>
      </div>

      {/* scenario cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {scenarios.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-surface p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                {s.label} Case
              </p>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                style={{ background: s.accent }}
              >
                {s.icon}
              </span>
            </div>
            <p className="mt-3 text-xl font-bold text-dark-gray">
              {fmtNGN(s.value)}
            </p>
            <p className="mt-1 text-xs text-gray-400">{s.sub}</p>
            {s.label !== "Base" && (
              <p
                className="mt-1 text-xs font-semibold"
                style={{ color: s.value >= base ? "#0f766e" : "#b91c1c" }}
              >
                {s.value >= base ? "+" : ""}
                {fmtNGN(s.value - base)} vs base
              </p>
            )}
          </div>
        ))}
      </div>

      {/* tornado chart */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-dark-gray">
            Tornado — One-at-a-Time Sensitivity
          </h2>
          <span className="text-xs text-gray-400">Base FV: {fmtNGN(base)}</span>
        </div>
        <div className="space-y-3">
          {rows.map((r) => {
            const lowDelta = r.low - base;
            const highDelta = r.high - base;
            const range = maxSwing;
            const leftPct = (Math.min(0, lowDelta) / range) * 50 + 50; // 50% is center
            const widthLow = (Math.abs(Math.min(0, lowDelta)) / range) * 50;
            const widthHigh = (Math.abs(Math.max(0, highDelta)) / range) * 50;
            return (
              <div key={r.driver}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-dark-gray">{r.driver}</span>
                  <span className="text-gray-500">swing {fmtNGN(r.swing)}</span>
                </div>
                <div className="relative h-5 w-full rounded bg-gray-100">
                  {/* center line */}
                  <div className="absolute inset-y-0 left-1/2 w-px bg-gray-300" />
                  {/* low (bar to left) */}
                  <div
                    className="absolute inset-y-0 rounded-l bg-danger/70"
                    style={{ left: `${leftPct}%`, width: `${widthLow}%` }}
                  />
                  {/* high (bar to right) */}
                  <div
                    className="absolute inset-y-0 rounded-r bg-success/70"
                    style={{ left: "50%", width: `${widthHigh}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span>Low {fmtNGN(r.low)}</span>
                  <span>High {fmtNGN(r.high)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
