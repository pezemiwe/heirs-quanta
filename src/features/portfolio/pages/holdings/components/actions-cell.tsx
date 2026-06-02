import { Pencil, Trash2 } from "lucide-react";
import type { HoldingRow } from "../types";

export function ActionsCell({
  row,
  onEdit,
  onDelete,
}: {
  row: HoldingRow;
  onEdit: (r: HoldingRow) => void;
  onDelete: (r: HoldingRow) => void;
}) {
  return (
    <div
      className="flex items-center justify-end gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => onEdit(row)}
        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary"
        title="Edit"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onDelete(row)}
        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-danger"
        title="Delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
