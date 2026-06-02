import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import { SectionCard } from "../../../../../components/shared/section-card";
import { AcronymTip } from "../../../../../components/shared/acronym-tip";
import { fmtNumber, CLASSIFICATION_BADGE, STAGE_BADGE } from "../../../utils";
import type { Instrument } from "../types";

export function InventoryTable({
  filtered,
  valuations,
  onRowClick,
  onEdit,
  onDelete,
}: {
  filtered: Instrument[];
  valuations: { instrument: { id: string }; balanceSheetValueNGN: number }[];
  onRowClick: (id: string) => void;
  onEdit: (i: Instrument) => void;
  onDelete: (i: Instrument) => void;
}) {
  return (
    <SectionCard noPadding>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2.5 text-left">ID</th>
              <th className="px-4 py-2.5 text-left">Name</th>
              <th className="px-4 py-2.5 text-left">Type</th>
              <th className="px-4 py-2.5 text-left">Classification</th>
              <th className="px-4 py-2.5 text-left">Impairment Stage</th>
              <th className="px-4 py-2.5 text-right">
                Balance Sheet Value (NGN)
              </th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => {
              const valuation = valuations.find(
                (vv) => vv.instrument.id === i.id,
              );
              const bs = valuation?.balanceSheetValueNGN ?? 0;
              return (
                <tr
                  key={i.id}
                  onClick={() => onRowClick(i.id)}
                  className="cursor-pointer border-b border-border/60 hover:bg-pale-red/20 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-dark-gray">
                    {i.id}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-dark-gray">{i.name}</p>
                    <p className="text-xs text-gray-400">
                      {i.issuer} · {i.sector}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {i.instrumentType}
                  </td>
                  <td className="px-4 py-3">
                    <AcronymTip term={i.classification}>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CLASSIFICATION_BADGE[i.classification]}`}
                      >
                        {i.classification}
                      </span>
                    </AcronymTip>
                  </td>
                  <td className="px-4 py-3">
                    {i.impairmentStage && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STAGE_BADGE[i.impairmentStage]}`}
                      >
                        {i.impairmentStage}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {fmtNumber(bs, 0)}
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onEdit(i)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(i)}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-danger"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <ChevronRight className="ml-1 h-4 w-4 text-gray-300" />
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-sm text-gray-400"
                >
                  No instruments match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
