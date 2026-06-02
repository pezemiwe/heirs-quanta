import { useState } from "react";
import type { Task } from "./types";
import { INITIAL_TASKS, NEXT_STATUS } from "./config";
import { TasksHeader } from "./components/tasks-header";
import { TaskRow } from "./components/task-row";
import { TaskFormModal } from "./components/task-form-modal";
import { DeleteTaskModal } from "./components/delete-task-modal";

export function PortfolioTasks() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  function openAdd() {
    setEditingTask(null);
    setFormOpen(true);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setFormOpen(true);
  }

  function saveTask(data: Omit<Task, "id">) {
    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? { ...t, ...data } : t)),
      );
    } else {
      const id = `T${String(tasks.length + 1).padStart(3, "0")}`;
      setTasks((prev) => [{ id, ...data }, ...prev]);
    }
    setFormOpen(false);
    setEditingTask(null);
  }

  function confirmDelete() {
    if (!deletingTask) return;
    setTasks((prev) => prev.filter((t) => t.id !== deletingTask.id));
    setDeletingTask(null);
  }

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
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <TasksHeader open={open} overdue={overdue} onAdd={openAdd} />

      <div className="space-y-2">
        {sortedTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            isExpanded={expanded === task.id}
            onToggleExpand={() =>
              setExpanded(expanded === task.id ? null : task.id)
            }
            onCycleStatus={() => cycleStatus(task.id)}
            onEdit={() => openEdit(task)}
            onDelete={() => setDeletingTask(task)}
          />
        ))}
      </div>

      {formOpen && (
        <TaskFormModal
          initial={editingTask ?? undefined}
          onSave={saveTask}
          onClose={() => {
            setFormOpen(false);
            setEditingTask(null);
          }}
        />
      )}

      {deletingTask && (
        <DeleteTaskModal
          task={deletingTask}
          onCancel={() => setDeletingTask(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
