export type TaskStatus = "pending" | "in-progress" | "done";
export type TaskPriority = "high" | "medium" | "low";

export interface Task {
  id: string;
  title: string;
  source: string;
  due: string;
  priority: TaskPriority;
  status: TaskStatus;
  notes?: string;
}
