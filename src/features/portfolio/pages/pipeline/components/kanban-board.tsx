import { Calendar } from "lucide-react";
import {
  PRIORITY_CONFIG,
  SECTOR_COLORS,
  STAGES,
  STAGE_CONFIG,
} from "../config";
import { fmtSize, initials } from "../utils";
import type { Deal, Stage } from "../types";

interface Props {
  dealsByStage: (s: Stage) => Deal[];
  selectedId: string | null;
  onSelect: (d: Deal | null) => void;
}

export const KanbanBoard = ({ dealsByStage, selectedId, onSelect }: Props) => (
  <div className="overflow-x-auto pb-2">
    <div className="flex gap-3" style={{ minWidth: "980px" }}>
      {STAGES.map((stage) => {
        const stageDeals = dealsByStage(stage);
        const cfg = STAGE_CONFIG[stage];
        const stageTotal = stageDeals.reduce((s, d) => s + d.size, 0);
        return (
          <div
            key={stage}
            className={`flex-1 rounded-xl border-t-4 border border-border bg-surface shadow-sm ${cfg.border}`}
          >
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between">
                <p
                  className={`text-xs font-bold uppercase tracking-wider ${cfg.label}`}
                >
                  {stage}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.label}`}
                >
                  {stageDeals.length}
                </span>
              </div>
              {stageDeals.length > 0 && (
                <p className="mt-0.5 text-xs text-dark-gray/40">
                  ₦
                  {stageDeals
                    .filter((d) => d.currency === "NGN")
                    .reduce((s, d) => s + d.size, 0)
                    .toFixed(1)}
                  B NGN
                  {stageDeals.some((d) => d.currency === "USD") &&
                    ` · $${stageDeals
                      .filter((d) => d.currency === "USD")
                      .reduce((s, d) => s + d.size, 0)
                      .toFixed(1)}B USD`}
                </p>
              )}
            </div>

            <div className="p-2 space-y-2 min-h-32">
              {stageDeals.length === 0 && (
                <p className="py-8 text-center text-xs text-dark-gray/20">
                  No deals
                </p>
              )}
              {stageDeals.map((deal) => {
                const isActive = selectedId === deal.id;
                const pc = PRIORITY_CONFIG[deal.priority];
                return (
                  <button
                    key={deal.id}
                    onClick={() => onSelect(isActive ? null : deal)}
                    className={`group relative w-full rounded-lg border text-left transition-all overflow-hidden ${
                      isActive
                        ? "border-primary bg-pale-red/20 shadow-md"
                        : "border-border bg-white hover:border-primary/40 hover:shadow-sm"
                    }`}
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${pc.bar}`}
                    />
                    <div className="pl-4 pr-3 pt-3 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-dark-gray leading-tight line-clamp-2">
                          {deal.name}
                        </p>
                        <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {initials(deal.lead || "?")}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${SECTOR_COLORS[deal.sector] ?? "bg-gray-100 text-gray-500"}`}
                        >
                          {deal.sector}
                        </span>
                        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-dark-gray/50 border border-border">
                          {deal.investmentType}
                        </span>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between">
                        <span className="text-sm font-bold text-success">
                          {deal.irr}%{" "}
                          <span className="text-xs font-normal text-dark-gray/40">
                            IRR
                          </span>
                        </span>
                        <span className="text-xs font-semibold text-dark-gray/70">
                          {fmtSize(deal.size, deal.currency)}
                        </span>
                      </div>
                      {deal.targetClose && (
                        <p className="mt-1.5 flex items-center gap-1 text-xs text-dark-gray/40">
                          <Calendar className="h-3 w-3" />
                          Close {deal.targetClose}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {stageDeals.length > 0 && (
              <div className="px-4 py-2 border-t border-border">
                <p className="text-xs text-dark-gray/40">
                  Total: ₦{stageTotal.toFixed(1)}B equiv.
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);
