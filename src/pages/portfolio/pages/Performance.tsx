import { TrendingUp, TrendingDown } from "lucide-react";

const PERIODS = ["1M", "3M", "6M", "YTD", "1Y", "3Y", "Inception"];

const METRICS = [
  {
    label: "Total Return (YTD)",
    value: "11.8%",
    benchmark: "9.4%",
    alpha: "+2.4%",
    pos: true,
  },
  {
    label: "Annualised Return (3Y)",
    value: "14.2%",
    benchmark: "11.7%",
    alpha: "+2.5%",
    pos: true,
  },
  {
    label: "Sharpe Ratio",
    value: "1.42",
    benchmark: "1.18",
    alpha: "+0.24",
    pos: true,
  },
  {
    label: "Sortino Ratio",
    value: "1.87",
    benchmark: "1.56",
    alpha: "+0.31",
    pos: true,
  },
  {
    label: "Max Drawdown",
    value: "-4.1%",
    benchmark: "-6.8%",
    alpha: "+2.7%",
    pos: true,
  },
  {
    label: "Tracking Error",
    value: "2.3%",
    benchmark: "—",
    alpha: "—",
    pos: true,
  },
  {
    label: "Information Ratio",
    value: "1.04",
    benchmark: "—",
    alpha: "—",
    pos: true,
  },
  {
    label: "Beta",
    value: "0.82",
    benchmark: "1.00",
    alpha: "-0.18",
    pos: true,
  },
];

const MONTHLY = [
  { month: "Jan", port: 2.1, bench: 1.8 },
  { month: "Feb", port: 1.4, bench: 1.2 },
  { month: "Mar", port: -0.3, bench: -0.8 },
  { month: "Apr", port: 2.8, bench: 2.1 },
  { month: "May", port: 1.9, bench: 1.6 },
];

export function PerformanceAnalytics() {
  return (
    <div className="p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">
          Performance Analytics
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Returns, risk-adjusted metrics and benchmark attribution
        </p>
      </div>

      {/* period selector */}
      <div className="flex items-center gap-1 flex-wrap">
        {PERIODS.map((p, i) => (
          <button
            key={p}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              i === 3
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-500 hover:bg-pale-red hover:text-primary"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* monthly returns mini-chart */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">
          Monthly Returns vs Benchmark (YTD)
        </h2>
        <div className="flex items-end gap-4 h-28">
          {MONTHLY.map((m) => (
            <div
              key={m.month}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div className="flex items-end gap-1 h-20">
                <div
                  title={`Portfolio: ${m.port}%`}
                  className="w-5 rounded-t"
                  style={{
                    height: `${Math.abs(m.port) * 15}px`,
                    background: m.port >= 0 ? "#CC0000" : "#b91c1c",
                  }}
                />
                <div
                  title={`Benchmark: ${m.bench}%`}
                  className="w-5 rounded-t"
                  style={{
                    height: `${Math.abs(m.bench) * 15}px`,
                    background: "#E2E2E2",
                  }}
                />
              </div>
              <span className="text-xs text-gray-400">{m.month}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="h-2 w-4 rounded bg-primary inline-block" />{" "}
            Portfolio
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-4 rounded bg-gray-200 inline-block" />{" "}
            Benchmark (NGSE ASI)
          </span>
        </div>
      </div>

      {/* metrics table */}
      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                Metric
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                Portfolio
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                Benchmark
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                Alpha / Diff
              </th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m) => (
              <tr
                key={m.label}
                className="border-b border-border/50 last:border-0 hover:bg-pale-red/30"
              >
                <td className="px-5 py-3.5 font-medium text-dark-gray">
                  {m.label}
                </td>
                <td className="px-5 py-3.5 text-right font-semibold text-primary">
                  {m.value}
                </td>
                <td className="px-5 py-3.5 text-right text-gray-500">
                  {m.benchmark}
                </td>
                <td
                  className={`px-5 py-3.5 text-right font-semibold text-xs flex items-center justify-end gap-1 ${m.alpha === "—" ? "text-gray-300" : m.pos ? "text-success" : "text-danger"}`}
                >
                  {m.alpha !== "—" &&
                    (m.pos ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    ))}
                  {m.alpha}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
