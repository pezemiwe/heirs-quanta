import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Drawer } from "../../../../../components/shared/drawer";
import { PRIORITY_CONFIG, STAGES, STAGE_CONFIG } from "../config";
import { fmtSize } from "../utils";
import type { Deal } from "../types";

interface Props {
  deal: Deal | null;
  onClose: () => void;
  onMoveStage: (id: string, dir: 1 | -1) => void;
  onRemove: (id: string) => void;
}

export const DealDetailDrawer = ({
  deal,
  onClose,
  onMoveStage,
  onRemove,
}: Props) => (
  <Drawer
    isOpen={!!deal}
    onClose={onClose}
    size="md"
    title={deal?.name ?? ""}
    description={deal ? `${deal.sector} · ${deal.investmentType}` : ""}
    footer={
      deal ? (
        <div className="flex w-full items-center justify-between">
          <button
            onClick={() => onRemove(deal.id)}
            className="flex items-center gap-1.5 rounded-lg border border-danger/30 px-3 py-2 text-xs font-medium text-danger hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onMoveStage(deal.id, -1)}
              disabled={STAGES.indexOf(deal.stage) === 0}
              className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-dark-gray/70 hover:border-primary hover:text-primary disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </button>
            <button
              onClick={() => onMoveStage(deal.id, 1)}
              disabled={STAGES.indexOf(deal.stage) === STAGES.length - 1}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-mid-red disabled:opacity-40"
            >
              Advance <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null
    }
  >
    {deal && (
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-xs font-semibold text-dark-gray/50 uppercase tracking-wider">
            Stage Progress
          </p>
          <div className="flex items-center gap-1">
            {STAGES.map((s, i) => {
              const cfg = STAGE_CONFIG[s];
              const active = s === deal.stage;
              const past = STAGES.indexOf(deal.stage) > i;
              return (
                <div key={s} className="flex items-center gap-1 flex-1">
                  <div
                    className={`flex-1 rounded-full py-1 text-center text-[10px] font-semibold transition-all ${
                      active
                        ? `${cfg.bg} ${cfg.label} ring-2 ring-offset-1 ring-current`
                        : past
                          ? "bg-teal-50 text-teal-600"
                          : "bg-slate-50 text-slate-400"
                    }`}
                  >
                    {s.split(" ")[0]}
                  </div>
                  {i < STAGES.length - 1 && (
                    <div
                      className={`h-0.5 w-3 rounded-full ${
                        STAGES.indexOf(deal.stage) > i
                          ? "bg-teal-400"
                          : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Projected IRR",
              value: `${deal.irr}%`,
              accent: "text-success",
            },
            {
              label: "Deal Size",
              value: fmtSize(deal.size, deal.currency),
              accent: "text-dark-gray",
            },
            {
              label: "Investment Type",
              value: deal.investmentType,
              accent: "text-dark-gray",
            },
            {
              label: "Priority",
              value: PRIORITY_CONFIG[deal.priority].label,
              accent: PRIORITY_CONFIG[deal.priority].badge.includes("danger")
                ? "text-danger"
                : "text-dark-gray",
            },
            {
              label: "Lead PM",
              value: deal.lead || "—",
              accent: "text-dark-gray",
            },
            {
              label: "Target Close",
              value: deal.targetClose || "—",
              accent: "text-dark-gray",
            },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-lg border border-border bg-surface p-3"
            >
              <p className="text-xs text-dark-gray/50">{m.label}</p>
              <p className={`mt-0.5 text-sm font-bold ${m.accent}`}>
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {deal.notes && (
          <div className="rounded-lg border border-border bg-surface-muted p-4">
            <p className="mb-1 text-xs font-semibold text-dark-gray/50 uppercase tracking-wider">
              Deal Notes
            </p>
            <p className="text-sm text-dark-gray/70 leading-relaxed">
              {deal.notes}
            </p>
          </div>
        )}
      </div>
    )}
  </Drawer>
);
