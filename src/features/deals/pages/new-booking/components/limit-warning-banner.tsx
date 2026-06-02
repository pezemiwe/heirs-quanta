import { AlertTriangle } from "lucide-react";

export function LimitWarningBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <span>{message}</span>
    </div>
  );
}
