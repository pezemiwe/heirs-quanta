import { Pencil, ChevronRight, BarChart2, DollarSign } from "lucide-react";
import type { Portfolio } from "../../../portfolio-registry";
import { TYPE_COLORS, STATUS_COLORS } from "../config";

export function DetailPanel({
  portfolio,
  onClose,
  onEdit,
}: {
  portfolio: Portfolio;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="flex w-80 shrink-0 flex-col border-l border-border bg-surface overflow-y-auto animate-in slide-in-from-right-4 duration-150">
      {/* header */}
      <div className="flex items-start justify-between p-5 border-b border-border">
        <div>
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              TYPE_COLORS[portfolio.type]
            }`}
          >
            {portfolio.type}
          </span>
          <h3 className="mt-1.5 text-sm font-bold text-dark-gray">
            {portfolio.name}
          </h3>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              STATUS_COLORS[portfolio.status]
            }`}
          >
            {portfolio.status}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-400 hover:text-dark-gray hover:bg-gray-100"
          aria-label="Close panel"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-3 p-4 border-b border-border">
        <div className="rounded-lg border border-border bg-surface-muted p-3">
          <div className="flex items-center gap-1.5 text-xs text-dark-gray/50 mb-1">
            <BarChart2 className="h-3.5 w-3.5" />
            Instruments
          </div>
          <p className="text-lg font-bold text-dark-gray">
            {portfolio.instrumentCount ?? "-"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface-muted p-3">
          <div className="flex items-center gap-1.5 text-xs text-dark-gray/50 mb-1">
            <DollarSign className="h-3.5 w-3.5" />
            Currency
          </div>
          <p className="text-lg font-bold text-dark-gray">
            {portfolio.baseCurrency}
          </p>
        </div>
      </div>

      {/* fields */}
      <div className="flex-1 p-4 space-y-4 text-sm">
        {portfolio.description && (
          <div>
            <p className="text-xs font-semibold uppercase text-dark-gray/40 tracking-wide mb-1">
              Description
            </p>
            <p className="text-dark-gray/80">{portfolio.description}</p>
          </div>
        )}
        {portfolio.manager && (
          <div>
            <p className="text-xs font-semibold uppercase text-dark-gray/40 tracking-wide mb-1">
              Portfolio Manager
            </p>
            <p className="text-dark-gray/80">{portfolio.manager}</p>
          </div>
        )}
        {portfolio.mandatedBy && (
          <div>
            <p className="text-xs font-semibold uppercase text-dark-gray/40 tracking-wide mb-1">
              Mandated By
            </p>
            <p className="text-dark-gray/80">{portfolio.mandatedBy}</p>
          </div>
        )}
        {portfolio.strategy && (
          <div>
            <p className="text-xs font-semibold uppercase text-dark-gray/40 tracking-wide mb-1">
              Strategy
            </p>
            <p className="text-dark-gray/80">{portfolio.strategy}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold uppercase text-dark-gray/40 tracking-wide mb-1">
            Created
          </p>
          <p className="text-dark-gray/80">{portfolio.createdAt}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-dark-gray/40 tracking-wide mb-1">
            ID
          </p>
          <p className="font-mono text-xs text-dark-gray/60">{portfolio.id}</p>
        </div>
      </div>

      {/* footer actions */}
      <div className="p-4 border-t border-border">
        <button
          onClick={onEdit}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Portfolio
        </button>
      </div>
    </div>
  );
}
