import { CalendarDays } from "lucide-react";
import { fmtNGN, fmtNum } from "../utils";
import type { ActivityRow } from "../types";

type Props = {
  activityRows: ActivityRow[];
  hasData: boolean;
};

export function ActivityBreakdown({ activityRows, hasData }: Props) {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-dark-gray">
          Activity Breakdown
        </h3>
      </div>
      {hasData ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-muted">
                {[
                  "Activity",
                  "Requests",
                  "Requested",
                  "Disbursed",
                  "Completion",
                ].map((h, i) => (
                  <th
                    key={h}
                    className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 ${i === 0 ? "text-left" : "text-right"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activityRows.map((row) => (
                <tr
                  key={row.activity}
                  className="hover:bg-surface-muted/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-dark-gray">
                    {row.activity}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    {fmtNum(row.requests)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    {fmtNGN(Math.round(row.requested))}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    {fmtNGN(Math.round(row.disbursed))}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.min(row.completion, 100).toFixed(1)}%`,
                          }}
                        />
                      </div>
                      <span className="text-gray-600 w-12 text-right">
                        {row.completion.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarDays className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-400">
            No transaction data in selected date range.
          </p>
          <p className="text-xs text-gray-300 mt-1">
            Adjust the start and end date to view activity.
          </p>
        </div>
      )}
    </div>
  );
}
