import type { Task, TaskPriority, TaskStatus } from "./types";

export const PRIORITY_BADGE: Record<TaskPriority, string> = {
  high: "bg-red-100 text-danger",
  medium: "bg-yellow-50 text-yellow-700",
  low: "bg-gray-100 text-gray-500",
};

export const STATUS_BADGE: Record<TaskStatus, string> = {
  pending: "bg-gray-100 text-gray-500",
  "in-progress": "bg-blue-50 text-blue-700",
  done: "bg-teal-50 text-success",
};

export const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  pending: "in-progress",
  "in-progress": "done",
  done: "pending",
};

export const INITIAL_TASKS: Task[] = [
  {
    id: "T001",
    title: "Respond to UCA dividend accrual query",
    source: "Group Finance",
    due: "2026-05-28",
    priority: "high",
    status: "in-progress",
    notes:
      "Finance flagged a discrepancy between Q1 accrual (₦1.2B) and actual dividend payout (₦980M). Confirm treatment with CFO.",
  },
  {
    id: "T002",
    title: "IC meeting prep — May investment pipeline review",
    source: "Group Executive",
    due: "2026-05-28",
    priority: "medium",
    status: "done",
  },
  {
    id: "T003",
    title: "Review Heirs Energies revised capex assumptions",
    source: "Finance",
    due: "2026-05-29",
    priority: "medium",
    status: "pending",
    notes:
      "Finance submitted updated WACC (14.8% → 15.2%) and terminal growth rate (4.5% → 4.0%). Impact on valuation ~-₦3.2B.",
  },
  {
    id: "T004",
    title: "Submit May 2026 portfolio commentary",
    source: "Group Finance",
    due: "2026-06-03",
    priority: "high",
    status: "pending",
    notes:
      "Required for IC board pack. Commentary should cover YTD outperformance (+142bps alpha), Heritage Bank watch status, and pipeline highlights.",
  },
  {
    id: "T005",
    title: "Comment on Transcorp Hotels Q1 variance",
    source: "Group Executive",
    due: "2026-06-02",
    priority: "high",
    status: "pending",
    notes:
      "RevPAR 12% below budget. Executive requested PM commentary explaining drivers and whether guidance should be revised.",
  },
  {
    id: "T006",
    title: "Update IRR model — Afropay acquisition",
    source: "Investment Committee",
    due: "2026-06-05",
    priority: "medium",
    status: "pending",
    notes:
      "IC requested sensitivity table on USD/NGN rate assumptions (±15% corridor).",
  },
];

export const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
