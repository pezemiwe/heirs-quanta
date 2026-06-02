import { Save, RotateCcw } from "lucide-react";

export function SubmittedView({
  instrumentName,
  onReset,
}: {
  instrumentName: string;
  onReset: () => void;
}) {
  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8">
      <div className="rounded-xl border border-border bg-surface p-10 flex flex-col items-center gap-4 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <Save className="h-7 w-7 text-success" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-dark-gray">
            Deal Submitted for Approval
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {instrumentName || "New instrument"} has been submitted to the
            maker-checker queue. Reference:{" "}
            <span className="font-mono font-semibold">
              DL-{Date.now().toString().slice(-6)}
            </span>
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-gray-500 hover:bg-pale-red hover:text-primary"
        >
          <RotateCcw className="h-4 w-4" /> Book another deal
        </button>
      </div>
    </div>
  );
}
