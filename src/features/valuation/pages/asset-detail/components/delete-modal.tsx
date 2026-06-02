import type { Instrument } from "../../../engine/types";

export function DeleteModal({
  inst,
  onCancel,
  onConfirm,
}: {
  inst: Instrument;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-dark-gray">
          Delete instrument?
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          You are about to remove <span className="font-mono">{inst.id}</span> —{" "}
          {inst.name}. This action cannot be undone.
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
