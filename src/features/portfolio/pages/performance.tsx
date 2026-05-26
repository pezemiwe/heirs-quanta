import { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { usePortfolio } from "../store";
import { fmtPct, fmtDelta } from "../utils";

const PERIODS = ["1M", "3M", "6M", "YTD", "1Y", "3Y", "Inception"] as const;
type Period = (typeof PERIODS)[number];

const PERF_METRICS = [
  { label: "YTD Return", key: "ytdReturn" as const },
  { label: "Benchmark Return", key: "benchmarkReturn" as const },
  { label: "Alpha (Active Return)", key: "alpha" as const },
  { label: "Sharpe Ratio", key: "sharpeRatio" as const, scalar: true },
  { label: "Sortino Ratio", key: "sortinoRatio" as const, scalar: true },
  { label: "Max Drawdown", key: "maxDrawdown" as const },
  { label: "Tracking Error", key: "trackingError" as const },
  {
    label: "Information Ratio",
    key: "informationRatio" as const,
    scalar: true,
  },
  { label: "Beta", key: "beta" as const, scalar: true },
];

export function PortfolioPerformance() {
  const { metrics } = usePortfolio();
  const [period, setPeriod] = useState<Period>("YTD");

  const maxBar = Math.max(
    ...metrics.monthlyReturns.map((m) =>
      Math.max(Math.abs(m.portfolioReturn), Math.abs(m.benchmarkReturn)),
    ),
  );

  return (
    <div className="p-6 xl:p-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">Performance</h1>
          <p className="mt-1 text-sm text-gray-500">
            Portfolio returns vs NGSE All-Share benchmark
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-surface p-1 shadow-sm">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                period === p
                  ? "bg-primary text-white shadow"
                  : "text-gray-500 hover:text-primary"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Return delta banner */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Portfolio Return",
            value: fmtPct(metrics.ytdReturn),
            positive: metrics.ytdReturn >= 0,
          },
          {
            label: "Benchmark Return",
            value: fmtPct(metrics.benchmarkReturn),
            positive: metrics.benchmarkReturn >= 0,
          },
          {
            label: "Alpha",
            value: fmtDelta(metrics.alpha),
            positive: metrics.alpha >= 0,
          },
          {
            label: "Sharpe Ratio",
            value: metrics.sharpeRatio.toFixed(2),
            positive: metrics.sharpeRatio >= 1,
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <p className="text-xs text-gray-400">{k.label}</p>
            <div className="mt-1 flex items-center gap-1.5">
              {k.positive ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-danger" />
              )}
              <span
                className={`text-xl font-bold ${k.positive ? "text-success" : "text-danger"}`}
              >
                {k.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly bar chart */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold text-dark-gray">
          Monthly Returns (2026 YTD)
        </h2>
        <div className="flex items-end gap-6">
          {metrics.monthlyReturns.map((m) => {
            const portH =
              maxBar > 0 ? (Math.abs(m.portfolioReturn) / maxBar) * 80 : 0;
            const benchH =
              maxBar > 0 ? (Math.abs(m.benchmarkReturn) / maxBar) * 80 : 0;
            return (
              <div
                key={m.period}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div className="flex items-end gap-1 h-20">
                  <div
                    title={`Portfolio: ${fmtPct(m.portfolioReturn)}`}
                    className="w-7 rounded-t transition-all"
                    style={{
                      height: `${portH}px`,
                      background:
                        m.portfolioReturn >= 0 ? "#CC0000" : "#b91c1c",
                    }}
                  />
                  <div
                    title={`Benchmark: ${fmtPct(m.benchmarkReturn)}`}
                    className="w-7 rounded-t"
                    style={{ height: `${benchH}px`, background: "#D1D5DB" }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-500">
                  {m.period}
                </span>
                <span
                  className={`text-xs font-semibold ${m.portfolioReturn >= 0 ? "text-success" : "text-danger"}`}
                >
                  {fmtDelta(m.portfolioReturn)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded inline-block bg-primary" />{" "}
            Portfolio
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded inline-block bg-gray-300" /> NGSE
            All-Share
          </span>
        </div>
      </div>

      {/* Risk-adjusted metrics table */}
      <div className="rounded-xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-dark-gray">
            Risk-Adjusted Metrics
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Relative to NGSE All-Share index · Risk-free rate 14.2% (FGN 10Y)
          </p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Metric
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                YTD
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Assessment
              </th>
            </tr>
          </thead>
          <tbody>
            {PERF_METRICS.map((row) => {
              const raw = metrics[row.key];
              const display = row.scalar
                ? (raw as number).toFixed(2)
                : fmtDelta(raw as number);
              const positive =
                row.key === "maxDrawdown"
                  ? (raw as number) > -0.05
                  : (raw as number) >= 0;
              return (
                <tr
                  key={row.key}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="px-5 py-3.5 text-sm font-medium text-dark-gray">
                    {row.label}
                  </td>
                  <td
                    className={`px-5 py-3.5 text-right text-sm font-bold ${positive ? "text-success" : "text-danger"}`}
                  >
                    {display}
                  </td>
                  <td className="px-5 py-3.5 text-right text-xs text-gray-400">
                    {row.key === "sharpeRatio" &&
                      ((raw as number) > 1.5
                        ? "Strong"
                        : (raw as number) > 1
                          ? "Good"
                          : "Below target")}
                    {row.key === "alpha" &&
                      ((raw as number) > 0
                        ? "Outperforming"
                        : "Underperforming")}
                    {row.key === "maxDrawdown" &&
                      ((raw as number) > -0.03
                        ? "Low"
                        : (raw as number) > -0.06
                          ? "Moderate"
                          : "High")}
                    {row.key === "beta" &&
                      ((raw as number) < 0.9
                        ? "Defensive"
                        : (raw as number) < 1.1
                          ? "Neutral"
                          : "Aggressive")}
                    {row.key === "informationRatio" &&
                      ((raw as number) > 0.5
                        ? "Skilled"
                        : (raw as number) > 0
                          ? "Modest"
                          : "Weak")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Attribution by class */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">
          Return Attribution by Asset Class
        </h2>
        <div className="space-y-3">
          {metrics.byClass.map((c) => {
            const classHoldings = metrics.topHoldings.filter(
              (h) => h.assetClass === c.label,
            );
            const contribution = classHoldings.reduce(
              (s, h) => s + (h.marketValue / metrics.totalNav) * h.ytdReturn,
              0,
            );
            const maxContrib = 0.025;
            const barW = Math.min(Math.abs(contribution) / maxContrib, 1) * 100;
            return (
              <div key={c.label} className="flex items-center gap-3 text-xs">
                <span className="w-36 text-gray-500 shrink-0">{c.label}</span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${barW}%`,
                      background: contribution >= 0 ? "#CC0000" : "#b91c1c",
                    }}
                  />
                </div>
                <span
                  className={`w-14 text-right font-semibold ${contribution >= 0 ? "text-success" : "text-danger"}`}
                >
                  {fmtDelta(contribution)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
