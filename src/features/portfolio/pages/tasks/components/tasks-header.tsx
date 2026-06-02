import { Plus } from "lucide-react";

export function TasksHeader({
  open,
  overdue,
  onAdd,
}: {
  open: number;
  overdue: number;
  onAdd: () => void;
}) {
  return (
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
      <div className="flex items-center gap-3">
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-mid-red"
        >
          <Plus className="h-3.5 w-3.5" /> Add Task
        </button>
        <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
          {open}
        </span>
      </div>
    </div>
  );
}
