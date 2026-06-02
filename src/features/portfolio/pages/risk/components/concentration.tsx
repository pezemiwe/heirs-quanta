import { CONCENTRATION } from "../config";
import { StatusBadge } from "./status-badge";

export function Concentration() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-dark-gray">
        Concentration Limits
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-gray-400">
            <th className="pb-2 text-left font-medium">Limit</th>
            <th className="pb-2 text-right font-medium">Current</th>
            <th className="pb-2 text-right font-medium">Limit</th>
            <th className="pb-2 text-right font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {CONCENTRATION.map((c) => (
            <tr
              key={c.label}
              className="border-b border-border/40 last:border-0 hover:bg-pale-red/20"
            >
              <td className="py-3 text-dark-gray">{c.label}</td>
              <td className="py-3 text-right font-semibold text-dark-gray">
                {c.value}
              </td>
              <td className="py-3 text-right text-gray-400">{c.limit}</td>
              <td className="py-3 text-right">
                <StatusBadge status={c.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
