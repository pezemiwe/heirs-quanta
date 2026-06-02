import { useState } from "react";
import { X } from "lucide-react";
import type { Task, TaskPriority, TaskStatus } from "../types";
import { inputCls } from "../config";

export function TaskFormModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Task;
  onSave: (data: Omit<Task, "id">) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [source, setSource] = useState(initial?.source ?? "");
  const [due, setDue] = useState(
    initial?.due ?? new Date().toISOString().slice(0, 10),
  );
  const [priority, setPriority] = useState<TaskPriority>(
    initial?.priority ?? "medium",
  );
  const [status, setStatus] = useState<TaskStatus>(
    initial?.status ?? "pending",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [err, setErr] = useState<string | null>(null);

  function submit() {
    if (!title.trim()) {
      setErr("Title is required.");
      return;
    }
    onSave({
      title: title.trim(),
      source: source.trim(),
      due,
      priority,
      status,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-base font-semibold text-dark-gray">
            {initial ? "Edit Task" : "New Task"}
          </h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {err && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-primary">
            {err}
          </p>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              placeholder="Task description…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Source
              </label>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className={inputCls}
                placeholder="e.g. Group Finance"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Due Date
              </label>
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className={inputCls}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className={inputCls}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={inputCls}
              placeholder="Additional context or details…"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red"
          >
            {initial ? "Save Changes" : "Add Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
