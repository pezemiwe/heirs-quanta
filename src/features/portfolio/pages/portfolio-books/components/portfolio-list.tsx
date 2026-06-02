import { FolderOpen, Plus, Pencil, Trash2 } from "lucide-react";
import type { Portfolio } from "../../../portfolio-registry";
import { TYPE_COLORS, STATUS_COLORS } from "../config";

export function PortfolioList({
  portfolios,
  selected,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}: {
  portfolios: Portfolio[];
  selected: Portfolio | null;
  onSelect: (p: Portfolio | null) => void;
  onAdd: () => void;
  onEdit: (p: Portfolio) => void;
  onDelete: (p: Portfolio) => void;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">Portfolio Books</h1>
          <p className="mt-0.5 text-sm text-dark-gray/50">
            {portfolios.length} portfolio{portfolios.length !== 1 ? "s" : ""}{" "}
            registered
          </p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Portfolio
        </button>
      </div>

      {/* table */}
      <div className="flex-1 overflow-y-auto p-6">
        {portfolios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <FolderOpen className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-dark-gray/60">
              No portfolios yet
            </p>
            <p className="text-xs text-dark-gray/40 mt-1">
              Click "Add Portfolio" to create the first portfolio book.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {portfolios.map((p) => {
              const isSelected = selected?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => onSelect(isSelected ? null : p)}
                  className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary bg-pale-red"
                      : "border-border bg-surface hover:border-primary/30 hover:bg-gray-50"
                  }`}
                >
                  {/* icon */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      TYPE_COLORS[p.type]
                    }`}
                  >
                    <FolderOpen className="h-5 w-5" />
                  </div>

                  {/* name + meta */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-dark-gray truncate">
                        {p.name}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          TYPE_COLORS[p.type]
                        }`}
                      >
                        {p.type}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[p.status]
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-dark-gray/50 truncate">
                      {p.description || "No description"}
                    </p>
                  </div>

                  {/* right meta */}
                  <div className="shrink-0 flex items-center gap-4 text-xs text-dark-gray/50">
                    <span>{p.baseCurrency}</span>
                    {p.instrumentCount != null && (
                      <span>{p.instrumentCount} instruments</span>
                    )}
                    <span>{p.createdAt}</span>
                  </div>

                  {/* actions */}
                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onEdit(p)}
                      className="rounded p-1.5 text-gray-400 hover:text-dark-gray hover:bg-gray-100"
                      aria-label="Edit portfolio"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(p)}
                      className="rounded p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50"
                      aria-label="Delete portfolio"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
