import { ArrowDownUp, Clock, TrendingUp, Wallet } from "lucide-react";
import { fmtCompact } from "../../../engine/book-compute";
import { fmtNum } from "../utils";
import type { ReportStats } from "../types";

type Props = { stats: ReportStats };

export function KpiTiles({ stats }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {(
        [
          {
            label: "Transactions",
            value: fmtNum(stats.transactions),
            icon: <ArrowDownUp className="h-5 w-5" />,
            color: "text-primary",
            bg: "bg-pale-red",
          },
          {
            label: "Total Requested",
            value:
              stats.totalRequested > 0
                ? fmtCompact(stats.totalRequested)
                : "\u20a60",
            icon: <Wallet className="h-5 w-5" />,
            color: "text-blue-700",
            bg: "bg-blue-50",
          },
          {
            label: "Total Disbursed",
            value:
              stats.totalDisbursed > 0
                ? fmtCompact(stats.totalDisbursed)
                : "\u20a60",
            icon: <TrendingUp className="h-5 w-5" />,
            color: "text-green-700",
            bg: "bg-green-50",
          },
          {
            label: "Pending Drafts",
            value: fmtNum(stats.pending),
            icon: <Clock className="h-5 w-5" />,
            color: "text-yellow-700",
            bg: "bg-yellow-50",
          },
        ] as const
      ).map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-4 rounded-xl border border-border bg-white p-5 shadow-sm"
        >
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.bg} ${s.color}`}
          >
            {s.icon}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400">{s.label}</p>
            <p className="text-xl font-bold text-dark-gray">{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
