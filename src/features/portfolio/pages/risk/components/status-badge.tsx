import { AlertTriangle, ShieldCheck, Info } from "lucide-react";

export function StatusBadge({ status }: { status: string }) {
  if (status === "ok" || status === "normal")
    return (
      <span className="flex items-center gap-1 text-success text-xs">
        <ShieldCheck className="h-3.5 w-3.5" /> Within limit
      </span>
    );
  if (status === "watch")
    return (
      <span className="flex items-center gap-1 text-yellow-600 text-xs">
        <Info className="h-3.5 w-3.5" /> Near limit
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-danger text-xs">
      <AlertTriangle className="h-3.5 w-3.5" /> Breached
    </span>
  );
}
