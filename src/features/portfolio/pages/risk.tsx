import { usePortfolio } from "../store";
import { fmtNGN, fmtPct } from "../utils";

const SEVERITY_BADGE: Record<string, string> = {
  low: "bg-gray-100 text-gray-500",
  moderate: "bg-yellow-50 text-yellow-700",
  severe: "bg-red-100 text-danger",
};

const STATUS_BADGE: Record<string, string> = {
  ok: "bg-teal-50 text-success",
  watch: "bg-yellow-50 text-yellow-700",
  breach: "bg-red-100 text-danger",
};

export function PortfolioRisk() {
  const { metrics } = usePortfolio();
  const nav = metrics.totalNav;

  const VAR_CARDS = [
    {
      label: "1-Day VaR (95%)",
      value: metrics.var95_1d,
      pct: metrics.var95_1d / nav,
      note: "Normal market conditions",
    },
    {
      label: "1-Day VaR (99%)",
      value: metrics.var99_1d,
      pct: metrics.var99_1d / nav,
      note: "Stress scenario threshold",
    },
    {
      label: "10-Day VaR (95%)",
      value: metrics.var95_10d,
      pct: metrics.var95_10d / nav,
      note: "Basel III regulatory VaR",
    },
    {
      label: "CVaR / ES (95%)",
      value: metrics.cvar95,
      pct: metrics.cvar95 / nav,
      note: "Expected shortfall beyond VaR",
    },
  ];

  return (
    <div className="p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">Risk Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Parametric VaR, concentration limits and stress testing · NAV{" "}
          {fmtNGN(nav)}
        </p>
      </div>

      {/* breach alert */}
      {metrics.concentrationLimits.some((c) => c.status === "breach") && (
        <div className="rounded-xl border border-danger bg-red-50 px-5 py-4">
          <p className="text-sm font-semibold text-danger">
            Concentration limit breached
          </p>
          <p className="text-xs text-red-600 mt-0.5">
            One or more limits exceed policy thresholds. Immediate review and
            potential rebalancing required.
          </p>
        </div>
      )}

      {/* VaR cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {VAR_CARDS.map((v) => (
          <div
            key={v.label}
            className="rounded-xl border border-border bg-surface p-5 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              {v.label}
            </p>
            <p className="mt-3 text-2xl font-bold text-primary">
              {fmtNGN(v.value)}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-dark-gray">
              {fmtPct(v.pct)} of NAV
            </p>
            <p className="mt-1 text-xs text-gray-400">{v.note}</p>
          </div>
        ))}
      </div>

      {/* Risk contribution by class */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">
          Risk Contribution by Asset Class
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Weight × daily volatility proxy (proportional, not marginal)
        </p>
        <div className="space-y-3">
          {metrics.byClass.map((c) => {
            const maxPct = Math.max(...metrics.byClass.map((x) => x.pct));
            return (
              <div key={c.label} className="flex items-center gap-3 text-xs">
                <span className="w-36 shrink-0 text-gray-500">{c.label}</span>
                <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(c.pct / maxPct) * 100}%`,
                      background: c.color,
                    }}
                  />
                </div>
                <span className="w-12 text-right font-semibold text-dark-gray">
                  {c.pct.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Concentration limits */}
      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-x-auto">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-dark-gray">
            Concentration Limits
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Measured against Investment Policy Statement thresholds
          </p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Limit Description
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Current
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Policy Limit
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Headroom
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.concentrationLimits.map((cl) => {
              const headroom = cl.limit - cl.current;
              return (
                <tr
                  key={cl.label}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="px-5 py-3.5 text-sm text-dark-gray">
                    {cl.label}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-sm">
                    {cl.current.toFixed(1)}%
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm text-gray-500">
                    {cl.limit.toFixed(0)}%
                  </td>
                  <td
                    className={`px-5 py-3.5 text-right text-sm font-medium ${headroom < 0 ? "text-danger" : headroom < 5 ? "text-yellow-600" : "text-success"}`}
                  >
                    {headroom >= 0 ? "+" : ""}
                    {headroom.toFixed(1)}%
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_BADGE[cl.status]}`}
                    >
                      {cl.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stress tests */}
      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-x-auto">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-dark-gray">
            Stress Test Scenarios
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Historical and hypothetical shock scenarios applied to current
            holdings
          </p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Scenario
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Portfolio Impact
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                % of NAV
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Severity
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.stressTests.map((s) => (
              <tr
                key={s.scenario}
                className="border-b border-border/50 last:border-0"
              >
                <td className="px-5 py-3.5 text-sm font-medium text-dark-gray">
                  {s.scenario}
                </td>
                <td className="px-5 py-3.5 text-right text-sm font-bold text-danger">
                  {fmtNGN(s.impact)}
                </td>
                <td className="px-5 py-3.5 text-right text-sm font-semibold text-danger">
                  {(s.pct * 100).toFixed(1)}%
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${SEVERITY_BADGE[s.severity]}`}
                  >
                    {s.severity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
