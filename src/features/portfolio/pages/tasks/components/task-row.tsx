import {
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Task } from "../types";
import { PRIORITY_BADGE, STATUS_BADGE } from "../config";
import { fmtDue } from "../utils";

export function TaskRow({
  task,
  isExpanded,
  onToggleExpand,
  onCycleStatus,
  onEdit,
  onDelete,
}: {
  task: Task;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCycleStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const due = fmtDue(task.due);
  const isDone = task.status === "done";

  return (
    <div
      className={`rounded-xl border bg-surface shadow-sm transition-all ${
        isDone
          ? "border-border/50 opacity-55"
          : "border-border hover:border-primary/30"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* status cycle button */}
        <button
          onClick={onCycleStatus}
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
              onClick={onToggleExpand}
              className="text-gray-300 hover:text-gray-500"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="rounded p-1 text-gray-300 hover:bg-gray-100 hover:text-primary"
            title="Edit task"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-danger"
            title="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* expanded notes */}
      {isExpanded && task.notes && (
        <div className="border-t border-border/50 bg-gray-50/50 px-4 pb-3 pt-2.5 rounded-b-xl">
          <p className="text-xs leading-relaxed text-gray-500">{task.notes}</p>
          <p className="mt-1 text-xs text-gray-400">
            Assigned by: {task.source}
          </p>
        </div>
      )}
    </div>
  );
}
