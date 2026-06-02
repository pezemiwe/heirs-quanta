import { Plus } from "lucide-react";

export function InventoryHeader({
  filteredCount,
  totalCount,
  onAdd,
}: {
  filteredCount: number;
  totalCount: number;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">Asset Inventory</h1>
        <p className="mt-1 text-sm text-gray-500">
          {filteredCount} of {totalCount} instruments in scope
        </p>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-mid-red"
      >
        <Plus className="h-4 w-4" /> Add Instrument
      </button>
    </div>
  );
}
