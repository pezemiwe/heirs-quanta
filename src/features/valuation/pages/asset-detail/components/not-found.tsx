import { ArrowLeft, AlertCircle } from "lucide-react";

export function NotFound({
  id,
  onBack,
}: {
  id: string | undefined;
  onBack: () => void;
}) {
  return (
    <div className="p-8">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to inventory
      </button>
      <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-gray-300" />
        <p className="mt-3 text-sm font-medium text-dark-gray">
          Instrument not found
        </p>
        <p className="mt-1 text-xs text-gray-400">
          The instrument <span className="font-mono">{id}</span> does not exist
          in this portfolio.
        </p>
      </div>
    </div>
  );
}
