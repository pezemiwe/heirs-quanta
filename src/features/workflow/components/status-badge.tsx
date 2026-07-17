import type { DealSlipStatus } from "../types";

const STATUS_STYLE: Record<
  DealSlipStatus,
  { pill: string; hint: string }
> = {
  Draft: {
    pill: "bg-slate-100 text-slate-700 border-slate-200",
    hint: "Draft - not yet submitted for review.",
  },
  Submitted: {
    pill: "bg-sky-50 text-sky-800 border-sky-200",
    hint: "Submitted - awaiting a reviewer to begin control checks.",
  },
  "Under Review": {
    pill: "bg-amber-50 text-amber-800 border-amber-200",
    hint: "Under review - control checks are being assessed.",
  },
  "Returned for Amendment": {
    pill: "bg-orange-50 text-orange-800 border-orange-200",
    hint: "Returned to the originator for amendment.",
  },
  Rejected: {
    pill: "bg-red-50 text-red-800 border-red-200",
    hint: "Rejected - this deal slip will not proceed.",
  },
  Approved: {
    pill: "bg-emerald-50 text-emerald-800 border-emerald-200",
    hint: "Approved - pending settlement instruction.",
  },
  "Pending Settlement": {
    pill: "bg-indigo-50 text-indigo-800 border-indigo-200",
    hint: "Settlement instruction raised - awaiting confirmation.",
  },
  Settled: {
    pill: "bg-emerald-50 text-emerald-900 border-emerald-300",
    hint: "Settled - position posted to the investment register.",
  },
  Active: {
    pill: "bg-pale-red text-primary border-primary/20",
    hint: "Active - live position in the investment register.",
  },
  "Matured/Sold/Rolled Over": {
    pill: "bg-slate-100 text-slate-600 border-slate-200",
    hint: "Position closed - matured, sold, or rolled over.",
  },
};

export function DealSlipStatusBadge({ status }: { status: DealSlipStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.pill}`}
    >
      {status}
    </span>
  );
}

export function DealSlipStatusHint({ status }: { status: DealSlipStatus }) {
  return (
    <p className="text-center text-[10px] text-dark-gray/50">{STATUS_STYLE[status].hint}</p>
  );
}
