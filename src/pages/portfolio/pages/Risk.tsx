import { AlertTriangle, ShieldCheck, Info } from "lucide-react";

const VAR_METRICS = [
  { label: "1-Day VaR (95%)", value: "₦6.1B", pct: "0.72%", status: "normal" },
  { label: "1-Day VaR (99%)", value: "₦9.4B", pct: "1.11%", status: "normal" },
  { label: "10-Day VaR (95%)", value: "₦19.3B", pct: "2.28%", status: "watch" },
  {
    label: "Expected Shortfall (CVaR 95%)",
    value: "₦8.7B",
    pct: "1.03%",
    status: "normal",
  },
];

const CONCENTRATION = [
  {
    label: "Top 5 holdings as % of portfolio",
    value: "30.3%",
    limit: "35%",
    status: "ok",
  },
  {
    label: "Top 10 holdings as % of portfolio",
    value: "52.6%",
    limit: "60%",
    status: "ok",
  },
  {
    label: "Single issuer limit (FGN Bond 2031)",
    value: "9.3%",
    limit: "10%",
    status: "watch",
  },
  {
    label: "Single sector limit (Equities)",
    value: "27.0%",
    limit: "30%",
    status: "ok",
  },
  {
    label: "Single currency (NGN)",
    value: "74.0%",
    limit: "80%",
    status: "ok",
  },
];

const STRESS = [
  {
    scenario: "2008 Global Financial Crisis",
    impact: "-₦38.4B",
    pct: "-4.5%",
    severity: "high",
  },
  {
    scenario: "2016 Nigeria Recession",
    impact: "-₦29.6B",
    pct: "-3.5%",
    severity: "medium",
  },
  {
    scenario: "Oil Price Crash (−50%)",
    impact: "-₦22.7B",
    pct: "-2.7%",
    severity: "medium",
  },
  {
    scenario: "NGN Devaluation (−30%)",
    impact: "-₦18.4B",
    pct: "-2.2%",
    severity: "low",
  },
  {
    scenario: "CBN Rate Hike (+300bps)",
    impact: "-₦14.2B",
    pct: "-1.7%",
    severity: "low",
  },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "ok" || status === "normal")
    return (
      <span className="flex items-center gap-1 text-success text-xs">
        <ShieldCheck className="h-3.5 w-3.5" /> Within limit
      </span>
    );
  if (status === "watch")
    return (
      <span className="flex items-center gap-1 text-yellow-600 text-xs">
        <Info className="h-3.5 w-3.5" /> Near limit
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-danger text-xs">
      <AlertTriangle className="h-3.5 w-3.5" /> Breached
    </span>
  );
}

function SeverityBadge({ s }: { s: string }) {
  const styles: Record<string, string> = {
    high: "bg-red-100 text-danger",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[s]}`}
    >
      {s}
    </span>
  );
}

export function RiskAnalytics() {
  return (
    <div className="p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">Risk Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Value at Risk, concentration limits, and stress test scenarios
        </p>
      </div>

      {/* VaR */}
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

      {/* concentration limits */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">
          Concentration Limits
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-gray-400">
              <th className="pb-2.5 text-left font-medium">Limit Type</th>
              <th className="pb-2.5 text-right font-medium">Current</th>
              <th className="pb-2.5 text-right font-medium">Limit</th>
              <th className="pb-2.5 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {CONCENTRATION.map((c) => (
              <tr
                key={c.label}
                className="border-b border-border/50 last:border-0"
              >
                <td className="py-3 text-xs text-dark-gray">{c.label}</td>
                <td
                  className={`py-3 text-right text-xs font-semibold ${c.status === "watch" ? "text-yellow-700" : "text-dark-gray"}`}
                >
                  {c.value}
                </td>
                <td className="py-3 text-right text-xs text-gray-400">
                  {c.limit}
                </td>
                <td className="py-3 text-right">
                  <StatusBadge status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* stress testing */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">
          Stress Test Scenarios
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-gray-400">
              <th className="pb-2.5 text-left font-medium">Scenario</th>
              <th className="pb-2.5 text-right font-medium">P&amp;L Impact</th>
              <th className="pb-2.5 text-right font-medium">% of AuM</th>
              <th className="pb-2.5 text-right font-medium">Severity</th>
            </tr>
          </thead>
          <tbody>
            {STRESS.map((s) => (
              <tr
                key={s.scenario}
                className="border-b border-border/50 last:border-0 hover:bg-pale-red/30"
              >
                <td className="py-3 text-xs text-dark-gray">{s.scenario}</td>
                <td className="py-3 text-right text-xs font-semibold text-danger">
                  {s.impact}
                </td>
                <td className="py-3 text-right text-xs text-danger">{s.pct}</td>
                <td className="py-3 text-right">
                  <SeverityBadge s={s.severity} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
