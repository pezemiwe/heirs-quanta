import { ArrowRight } from "lucide-react";
import { STAGES, STAGE_CONFIG } from "../config";
import type { Deal, Stage } from "../types";

interface Props {
  countsByStage: (s: Stage) => Deal[];
}

export const FunnelBar = ({ countsByStage }: Props) => (
  <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
    <p className="mb-3 text-xs font-semibold text-dark-gray/50 uppercase tracking-wider">
      Pipeline Funnel
    </p>
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {STAGES.map((stage, i) => {
        const count = countsByStage(stage).length;
        const cfg = STAGE_CONFIG[stage];
        return (
          <div key={stage} className="flex items-center gap-1 shrink-0">
            <div
              className={`rounded-lg px-4 py-2.5 text-center min-w-[110px] ${cfg.bg}`}
            >
              <p
                className={`text-xs font-bold uppercase tracking-wider ${cfg.label}`}
              >
                {stage}
              </p>
              <p className="mt-0.5 text-xl font-bold text-dark-gray">{count}</p>
              <div className="mt-1 flex justify-center gap-0.5">
                {Array.from({ length: Math.max(count, 0) }).map((_, j) => (
                  <span key={j} className={`h-1 w-1 rounded-full ${cfg.dot}`} />
                ))}
              </div>
            </div>
            {i < STAGES.length - 1 && (
              <ArrowRight className="h-4 w-4 shrink-0 text-dark-gray/20" />
            )}
          </div>
        );
      })}
    </div>
  </div>
);
