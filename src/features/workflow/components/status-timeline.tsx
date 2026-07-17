import { CheckCircle2, CircleDot, XCircle, RotateCcw, Clock } from "lucide-react";
import type { DealSlip, DealSlipStatus } from "../types";

const STATUS_TONE: Record<DealSlipStatus, { dot: string; text: string }> = {
  Draft: { dot: "bg-gray-400", text: "text-gray-500" },
  Submitted: { dot: "bg-sky-500", text: "text-sky-700" },
  "Under Review": { dot: "bg-amber-500", text: "text-amber-700" },
  "Returned for Amendment": { dot: "bg-orange-500", text: "text-orange-700" },
  Rejected: { dot: "bg-red-600", text: "text-red-700" },
  Approved: { dot: "bg-emerald-500", text: "text-emerald-700" },
  "Pending Settlement": { dot: "bg-indigo-500", text: "text-indigo-700" },
  Settled: { dot: "bg-emerald-600", text: "text-emerald-800" },
  Active: { dot: "bg-primary", text: "text-primary" },
  "Matured/Sold/Rolled Over": { dot: "bg-slate-500", text: "text-slate-600" },
};

function StatusIcon({ status }: { status: DealSlipStatus }) {
  if (status === "Rejected") return <XCircle className="h-4 w-4" />;
  if (status === "Returned for Amendment") return <RotateCcw className="h-4 w-4" />;
  if (status === "Approved" || status === "Settled" || status === "Active") return <CheckCircle2 className="h-4 w-4" />;
  return <CircleDot className="h-4 w-4" />;
}

function fmtTimestamp(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StatusTimeline({ slip }: { slip: DealSlip }) {
  const entries = slip.timeline;

  if (entries.length === 0) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-dark-gray/40">
        <Clock className="h-4 w-4" /> No transitions recorded yet.
      </div>
    );
  }

  return (
    <ol className="relative space-y-0">
      {entries.map((tx, i) => {
        const tone = STATUS_TONE[tx.to];
        const isLast = i === entries.length - 1;
        return (
          <li key={tx.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast && (
              <span
                aria-hidden="true"
                className="absolute left-[13px] top-6 bottom-0 w-px bg-border"
              />
            )}
            <span
              className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${tone.dot}`}
            >
              <StatusIcon status={tx.to} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-sm font-semibold ${tone.text}`}>
                  {tx.from ? `${tx.from} → ${tx.to}` : `Created - ${tx.to}`}
                </span>
                <span className="text-xs text-dark-gray/40">{fmtTimestamp(tx.at)}</span>
              </div>
              <p className="mt-0.5 text-xs text-dark-gray/60">
                <span className="font-medium text-dark-gray/80">{tx.byUser}</span>
                {tx.byRole && <span className="text-dark-gray/40"> · {tx.byRole}</span>}
              </p>
              {tx.reason && (
                <p className="mt-1 rounded-md bg-surface-muted px-2.5 py-1.5 text-xs text-dark-gray/70">
                  {tx.reason}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
