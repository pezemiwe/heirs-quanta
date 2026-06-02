import { Save, RotateCcw, Loader2 } from "lucide-react";

export function ActionBar({
  submitting,
  canCreate,
  role,
  onReset,
}: {
  submitting: boolean;
  canCreate: boolean;
  role: string;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-3">
      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-gray-500 hover:bg-pale-red hover:text-primary"
      >
        <RotateCcw className="h-4 w-4" /> Reset
      </button>
      <button
        type="submit"
        disabled={submitting || !canCreate}
        title={
          !canCreate
            ? `${role} does not have deal.create permission`
            : undefined
        }
        className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Booking…
          </>
        ) : (
          <>
            <Save className="h-4 w-4" /> Book Deal
          </>
        )}
      </button>
    </div>
  );
}
