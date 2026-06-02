import { Info } from "lucide-react";

export function FieldLabel({
  children,
  tip,
}: {
  children: React.ReactNode;
  tip?: string;
}) {
  return (
    <label className="flex items-center gap-1 text-xs font-medium text-gray-500">
      {children}
      {tip && (
        <Info className="h-3 w-3 text-gray-400 cursor-help" aria-label={tip} />
      )}
    </label>
  );
}
