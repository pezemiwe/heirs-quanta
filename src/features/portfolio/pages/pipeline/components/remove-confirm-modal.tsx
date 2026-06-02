import { Trash2 } from "lucide-react";
import type { Deal } from "../types";

interface Props {
  deal: Deal | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export const RemoveConfirmModal = ({ deal, onCancel, onConfirm }: Props) => {
  if (!deal) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
          <Trash2 className="h-5 w-5 text-danger" />
        </div>
        <h3 className="mt-3 text-base font-semibold text-dark-gray">
          Remove Deal
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Remove <span className="font-medium text-dark-gray">{deal.name}</span>{" "}
          from the pipeline? This cannot be undone.
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
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};
