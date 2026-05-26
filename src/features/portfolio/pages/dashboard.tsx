import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  BarChart2,
  Percent,
  ArrowRight,
} from "lucide-react";
import { usePortfolio } from "../store";
import {
  fmtNGN,
  fmtPct,
  fmtDelta,
  fmtDate,
  CLASS_BADGE,
  TX_BADGE,
} from "../utils";

interface Props {
  persona: { name: string; role: string; avatar: string };
}

export function PortfolioDashboard({ persona }: Props) {
  const { metrics, transactions, holdings } = usePortfolio();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = persona.name.split(" ")[0];

  const KPIS = [
    {
      label: "Total Portfolio NAV",
      value: fmtNGN(metrics.totalNav),
      change: fmtDelta(metrics.unrealisedPnLPct),
      positive: metrics.unrealisedPnL >= 0,
      sub: `${fmtNGN(metrics.unrealisedPnL)} unrealised gain`,
      icon: <DollarSign className="h-5 w-5" />,
      accent: "#CC0000",
    },
    {
      label: "YTD Return",
      value: fmtPct(metrics.ytdReturn),
      change: fmtDelta(metrics.alpha),
      positive: metrics.alpha >= 0,
      sub: `vs benchmark ${fmtPct(metrics.benchmarkReturn)}`,
      icon: <TrendingUp className="h-5 w-5" />,
      accent: "#800000",
    },
    {
      label: "1-Day VaR (95%)",
      value: fmtNGN(metrics.var95_1d),
      change: fmtPct(metrics.var95_1d / metrics.totalNav),
      positive: true,
      sub: "Within policy limit",
      icon: <Activity className="h-5 w-5" />,
      accent: "#5C0000",
    },
    {
      label: "Asset Classes",
      value: metrics.byClass.length.toString(),
      change: `β ${metrics.beta.toFixed(2)}`,
      positive: true,
      sub: metrics.byClass
        .map((c) => c.label)
        .slice(0, 3)
        .join(" · "),
      icon: <BarChart2 className="h-5 w-5" />,
      accent: "#B30000",
    },
  ];

  const recentTx = transactions.slice(0, 5);

  return (
    <div className="p-6 xl:p-8 space-y-6">
      {/* header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">
            {greeting}, {firstName}.
          </p>
          <h1 className="mt-0.5 text-2xl font-bold text-dark-gray">
            Portfolio Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            As of{" "}
            <span className="font-medium text-dark-gray">
              26 May 2026, 09:00 WAT
            </span>
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-pale-red px-3 py-1 text-xs font-medium text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Live · {metrics.topHoldings.length > 0 ? holdings.length : 19}{" "}
          positions
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-border bg-surface p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {k.label}
              </p>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                style={{ background: k.accent }}
              >
                {k.icon}
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-dark-gray">{k.value}</p>
            <div className="mt-1 flex items-center gap-1.5">
              {k.positive ? (
                <TrendingUp className="h-3.5 w-3.5 text-success" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-danger" />
              )}
              <span
                className={`text-xs font-semibold ${k.positive ? "text-success" : "text-danger"}`}
              >
                {k.change}
              </span>
              <span className="text-xs text-gray-400">{k.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* middle row: allocation + top holdings */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* allocation bars */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">
            Asset Allocation
          </h2>
          <div className="space-y-3">
            {metrics.byClass.map((c) => (
              <div key={c.label}>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{c.label}</span>
                  <span className="font-semibold text-dark-gray">
                    {c.pct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${c.pct}%`, background: c.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* top holdings */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">
            Top Holdings
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-gray-400">
                <th className="pb-2 text-left font-medium">Asset</th>
                <th className="pb-2 text-left font-medium hidden sm:table-cell">
                  Class
                </th>
                <th className="pb-2 text-right font-medium">Value</th>
                <th className="pb-2 text-right font-medium hidden md:table-cell">
                  Weight
                </th>
                <th className="pb-2 text-right font-medium">YTD</th>
              </tr>
            </thead>
            <tbody>
              {metrics.topHoldings.map((h) => (
                <tr
                  key={h.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-2.5 font-medium text-dark-gray text-xs">
                    {h.name}
                  </td>
                  <td className="py-2.5 hidden sm:table-cell">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${CLASS_BADGE[h.assetClass] ?? "bg-gray-100"}`}
                    >
                      {h.assetClass}
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-xs font-medium">
                    {fmtNGN(h.marketValue)}
                  </td>
                  <td className="py-2.5 text-right text-xs text-gray-500 hidden md:table-cell">
                    {h.weight.toFixed(1)}%
                  </td>
                  <td
                    className={`py-2.5 text-right text-xs font-semibold ${h.ytdReturn >= 0 ? "text-success" : "text-danger"}`}
                  >
                    {fmtDelta(h.ytdReturn)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* bottom row: monthly perf bars + recent activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* monthly returns */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">
            Monthly Returns vs Benchmark (YTD)
          </h2>
          <div className="flex items-end gap-4 h-28">
            {metrics.monthlyReturns.map((m) => (
              <div
                key={m.period}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div className="flex items-end gap-1 h-20">
                  <div
                    title={`Portfolio: ${fmtPct(m.portfolioReturn)}`}
                    className="w-5 rounded-t"
                    style={{
                      height: `${Math.abs(m.portfolioReturn) * 500}px`,
                      background:
                        m.portfolioReturn >= 0 ? "#CC0000" : "#b91c1c",
                    }}
                  />
                  <div
                    title={`Benchmark: ${fmtPct(m.benchmarkReturn)}`}
                    className="w-5 rounded-t"
                    style={{
                      height: `${Math.abs(m.benchmarkReturn) * 500}px`,
                      background: "#E2E2E2",
                    }}
                  />
                </div>
                <span className="text-xs text-gray-400">{m.period}</span>
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
              Benchmark (NGSE)
            </span>
          </div>
        </div>

        {/* recent activity */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentTx.map((t) => (
              <div
                key={t.id}
                className="flex items-start justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TX_BADGE[t.type] ?? "bg-gray-100"}`}
                  >
                    {t.type}
                  </span>
                  <div>
                    <p className="text-xs font-medium text-dark-gray">
                      {t.assetName}
                    </p>
                    <p className="text-xs text-gray-400">{fmtDate(t.date)}</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold ${t.amount >= 0 ? "text-success" : "text-primary"}`}
                >
                  {t.amount !== 0
                    ? (t.amount > 0 ? "+" : "") + fmtNGN(t.amount)
                    : "—"}
                </span>
              </div>
            ))}
          </div>
          <button className="mt-4 flex items-center gap-1 text-xs text-primary hover:underline">
            View all transactions <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
