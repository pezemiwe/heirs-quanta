import { STRESS } from "../config";
import { SeverityBadge } from "./severity-badge";

export function StressTests() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-dark-gray">
        Stress Test Scenarios
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-gray-400">
            <th className="pb-2 text-left font-medium">Scenario</th>
            <th className="pb-2 text-right font-medium">P&L Impact (?)</th>
            <th className="pb-2 text-right font-medium">% of AuM</th>
            <th className="pb-2 text-right font-medium">Severity</th>
          </tr>
        </thead>
        <tbody>
          {STRESS.map((s) => (
            <tr
              key={s.scenario}
              className="border-b border-border/40 last:border-0 hover:bg-pale-red/20"
            >
              <td className="py-3 text-dark-gray">{s.scenario}</td>
              <td className="py-3 text-right font-semibold text-danger">
                {s.impact}
              </td>
              <td className="py-3 text-right text-danger">{s.pct}</td>
              <td className="py-3 text-right">
                <SeverityBadge s={s.severity} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
