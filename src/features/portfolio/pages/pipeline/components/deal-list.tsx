import { ChevronDown, ChevronUp } from "lucide-react";
import { PRIORITY_CONFIG, SECTOR_COLORS, STAGE_CONFIG } from "../config";
import { fmtSize, initials } from "../utils";
import type { Deal } from "../types";

interface Props {
  deals: Deal[];
  selectedId: string | null;
  onSelect: (d: Deal | null) => void;
  sortField: keyof Deal;
  sortDir: 1 | -1;
  onToggleSort: (field: keyof Deal) => void;
}

export const DealList = ({
  deals,
  selectedId,
  onSelect,
  sortField,
  sortDir,
  onToggleSort,
}: Props) => {
  const SortIcon = ({ field }: { field: keyof Deal }) =>
    sortField === field ? (
      sortDir === 1 ? (
        <ChevronDown className="h-3 w-3" />
      ) : (
        <ChevronUp className="h-3 w-3" />
      )
    ) : null;

  const cols: { field: keyof Deal; label: string }[] = [
    { field: "name", label: "Deal" },
    { field: "sector", label: "Sector" },
    { field: "stage", label: "Stage" },
    { field: "investmentType", label: "Type" },
    { field: "irr", label: "IRR %" },
    { field: "size", label: "Size" },
    { field: "priority", label: "Priority" },
    { field: "targetClose", label: "Target Close" },
    { field: "lead", label: "Lead PM" },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden overflow-x-auto">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-muted">
            {cols.map((col) => (
              <th
                key={col.field}
                onClick={() => onToggleSort(col.field)}
                className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-xs font-semibold text-dark-gray/50 uppercase tracking-wider cursor-pointer hover:text-dark-gray select-none whitespace-nowrap"
              >
                <span className="flex items-center gap-1">
                  {col.label}
                  <SortIcon field={col.field} />
                </span>
              </th>
            ))}
            <th className="px-3 py-2.5 w-10" />
          </tr>
        </thead>
        <tbody>
          {deals.map((deal, i) => {
            const cfg = STAGE_CONFIG[deal.stage];
            const pc = PRIORITY_CONFIG[deal.priority];
            const isActive = selectedId === deal.id;
            return (
              <tr
                key={deal.id}
                onClick={() => onSelect(isActive ? null : deal)}
                className={`border-b border-border transition-colors cursor-pointer ${
                  i % 2 === 0 ? "bg-white" : "bg-surface-muted/50"
                } ${isActive ? "bg-pale-red/20" : "hover:bg-pale-red/10"}`}
              >
                <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                  <p className="font-semibold text-dark-gray text-xs">
                    {deal.name}
                  </p>
                  <p className="text-xs text-dark-gray/40">{deal.id}</p>
                </td>
                <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${SECTOR_COLORS[deal.sector] ?? "bg-gray-100 text-gray-500"}`}
                  >
                    {deal.sector}
                  </span>
                </td>
                <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.label}`}
                  >
                    {deal.stage}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-dark-gray/70">
                  {deal.investmentType}
                </td>
                <td className="px-4 py-3 text-xs font-bold text-success">
                  {deal.irr}%
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-dark-gray">
                  {fmtSize(deal.size, deal.currency)}
                </td>
                <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${pc.badge}`}
                  >
                    {pc.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-dark-gray/60">
                  {deal.targetClose || "—"}
                </td>
                <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {initials(deal.lead || "?")}
                    </span>
                    <span className="text-xs text-dark-gray/60">
                      {deal.lead}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 sm:px-4 sm:py-3" />
              </tr>
            );
          })}
        </tbody>
      </table>
      {deals.length === 0 && (
        <p className="py-10 text-center text-sm text-dark-gray/30">
          No deals match your search
        </p>
      )}
    </div>
  );
};
