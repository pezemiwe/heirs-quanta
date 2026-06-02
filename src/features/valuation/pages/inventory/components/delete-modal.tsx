import type { Instrument } from "../types";

export function DeleteModal({
  instrument,
  onCancel,
  onConfirm,
}: {
  instrument: Instrument;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-dark-gray">
          Delete Instrument
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Remove{" "}
          <span className="font-medium text-dark-gray">{instrument.name}</span>{" "}
          ({instrument.id}) from the portfolio? This action cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
