import { useState } from "react";
import { CheckCircle2, Circle, Clock, ChevronDown } from "lucide-react";

type TaskStatus = "pending" | "in-progress" | "done";
type TaskPriority = "high" | "medium" | "low";

interface Task {
  id: string;
  title: string;
  source: string;
  due: string;
  priority: TaskPriority;
  status: TaskStatus;
  notes?: string;
}

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  high: "bg-red-100 text-danger",
  medium: "bg-yellow-50 text-yellow-700",
  low: "bg-gray-100 text-gray-500",
};

const STATUS_BADGE: Record<TaskStatus, string> = {
  pending: "bg-gray-100 text-gray-500",
  "in-progress": "bg-blue-50 text-blue-700",
  done: "bg-teal-50 text-success",
};

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  pending: "in-progress",
  "in-progress": "done",
  done: "pending",
};

const INITIAL_TASKS: Task[] = [
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

function fmtDue(iso: string): { label: string; cls: string } {
  const d = new Date(iso);
  const today = new Date("2026-05-26");
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0)
    return {
      label: `${Math.abs(diff)}d overdue`,
      cls: "text-danger font-semibold",
    };
  if (diff === 0)
    return { label: "Due today", cls: "text-danger font-semibold" };
  if (diff <= 2)
    return { label: `${diff}d left`, cls: "text-yellow-600 font-medium" };
  return {
    label: d.toLocaleDateString("en-NG", { day: "numeric", month: "short" }),
    cls: "text-gray-400",
  };
}

export function PortfolioTasks() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [expanded, setExpanded] = useState<string | null>(null);

  function cycleStatus(id: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: NEXT_STATUS[t.status] } : t,
      ),
    );
  }

  const open = tasks.filter((t) => t.status !== "done").length;
  const overdue = tasks.filter((t) => {
    const diff = Math.round(
      (new Date(t.due).getTime() - new Date("2026-05-26").getTime()) /
        86_400_000,
    );
    return diff < 0 && t.status !== "done";
  }).length;

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (b.status === "done" && a.status !== "done") return -1;
    const pa = a.priority === "high" ? 0 : a.priority === "medium" ? 1 : 2;
    const pb = b.priority === "high" ? 0 : b.priority === "medium" ? 1 : 2;
    if (pa !== pb) return pa - pb;
    return a.due.localeCompare(b.due);
  });

  return (
    <div className="p-6 xl:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">Tasks</h1>
          <p className="mt-1 text-sm text-gray-500">
            {open} open
            {overdue > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-danger">
                  {overdue} overdue
                </span>
              </>
            )}
            {" · "}Click status icon to cycle
          </p>
        </div>
        <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
          {open}
        </span>
      </div>

      <div className="space-y-2">
        {sortedTasks.map((task) => {
          const due = fmtDue(task.due);
          const isExpanded = expanded === task.id;
          const isDone = task.status === "done";

          return (
            <div
              key={task.id}
              className={`rounded-xl border bg-surface shadow-sm transition-all ${
                isDone
                  ? "border-border/50 opacity-55"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-3 px-4 py-3.5">
                {/* status cycle button */}
                <button
                  onClick={() => cycleStatus(task.id)}
                  title="Cycle: pending → in-progress → done"
                  className="shrink-0"
                >
                  {task.status === "done" ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : task.status === "in-progress" ? (
                    <Clock className="h-5 w-5 text-blue-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300 hover:text-gray-400" />
                  )}
                </button>

                {/* title */}
                <p
                  className={`flex-1 text-sm font-medium ${
                    isDone ? "line-through text-gray-400" : "text-dark-gray"
                  }`}
                >
                  {task.title}
                </p>

                {/* meta */}
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_BADGE[task.priority]}`}
                  >
                    {task.priority}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[task.status]}`}
                  >
                    {task.status}
                  </span>
                  <span className={`text-xs ${due.cls}`}>{due.label}</span>
                  <span className="hidden text-xs text-gray-400 sm:inline">
                    {task.source}
                  </span>
                  {task.notes && (
                    <button
                      onClick={() => setExpanded(isExpanded ? null : task.id)}
                      className="text-gray-300 hover:text-gray-500"
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>
              </div>

              {/* expanded notes */}
              {isExpanded && task.notes && (
                <div className="border-t border-border/50 bg-gray-50/50 px-4 pb-3 pt-2.5 rounded-b-xl">
                  <p className="text-xs leading-relaxed text-gray-500">
                    {task.notes}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Assigned by: {task.source}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
