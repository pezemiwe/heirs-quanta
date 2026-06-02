import { ArrowLeft, Trash2 } from "lucide-react";
import { CLASSIFICATION_BADGE, STAGE_BADGE } from "../../../utils";
import type { Instrument } from "../../../engine/types";

export function Header({
  inst,
  onBack,
  onDelete,
}: {
  inst: Instrument;
  onBack: () => void;
  onDelete: () => void;
}) {
  const cls = inst.classification;
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <button
          onClick={onBack}
          className="mb-2 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Asset Inventory
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-bold text-dark-gray">
            {inst.id}
          </h1>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CLASSIFICATION_BADGE[cls]}`}
          >
            {cls}
          </span>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {inst.ifrs13Level}
          </span>
          {inst.impairmentStage && inst.impairmentStage !== "N/A" && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_BADGE[inst.impairmentStage]}`}
            >
              {inst.impairmentStage}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-gray-500">
          {inst.name} · {inst.instrumentType} · {inst.issuer}
        </p>
      </div>
      <button
        onClick={onDelete}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-gray-500 hover:bg-pale-red hover:text-primary hover:border-primary transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </button>
    </div>
  );
}
