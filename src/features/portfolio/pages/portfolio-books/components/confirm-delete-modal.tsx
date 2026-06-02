import type { Portfolio } from "../../../portfolio-registry";

export function ConfirmDeleteModal({
  portfolio,
  onCancel,
  onConfirm,
}: {
  portfolio: Portfolio;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface shadow-xl p-6 mx-4">
        <h2 className="text-base font-bold text-dark-gray mb-2">
          Remove Portfolio?
        </h2>
        <p className="text-sm text-dark-gray/60 mb-5">
          <span className="font-medium text-dark-gray">{portfolio.name}</span>{" "}
          will be removed from the registry. This does not delete any existing
          trade records.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-dark-gray hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
