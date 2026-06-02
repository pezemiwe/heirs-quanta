import { Loader2 } from "lucide-react";
import { Drawer } from "../../../../../components/shared/drawer";
import { INV_TYPES, SECTORS, STAGES } from "../config";
import type { Deal, InvestmentType, Priority, Stage } from "../types";

interface Props {
  open: boolean;
  draft: Omit<Deal, "id">;
  submitting: boolean;
  onChange: (d: Omit<Deal, "id">) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const NewDealDrawer = ({
  open,
  draft,
  submitting,
  onChange,
  onClose,
  onSubmit,
}: Props) => (
  <Drawer
    isOpen={open}
    onClose={onClose}
    size="md"
    title="New Pipeline Deal"
    description="Register a prospective investment for the deal team to evaluate."
    footer={
      <>
        <button
          onClick={onClose}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-dark-gray/60 hover:border-gray-300"
        >
          Cancel
        </button>
        <button
          disabled={!draft.name.trim() || submitting}
          onClick={onSubmit}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Adding…
            </>
          ) : (
            "Add to Pipeline"
          )}
        </button>
      </>
    }
  >
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold text-dark-gray/60 uppercase tracking-wider">
          Deal Identity
        </label>
        <div className="mt-3 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500">
              Deal Name <span className="text-danger">*</span>
            </label>
            <input
              value={draft.name}
              onChange={(e) => onChange({ ...draft, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="e.g. Lagos Renewable Energy Fund II"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">
                Sector
              </label>
              <select
                value={draft.sector}
                onChange={(e) => onChange({ ...draft, sector: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {SECTORS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Investment Type
              </label>
              <select
                value={draft.investmentType}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    investmentType: e.target.value as InvestmentType,
                  })
                }
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {INV_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-border" />

      <div>
        <label className="text-xs font-semibold text-dark-gray/60 uppercase tracking-wider">
          Economics
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">
              Projected IRR (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={draft.irr}
              onChange={(e) =>
                onChange({ ...draft, irr: Number(e.target.value) })
              }
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">
              Deal Size (Bn)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={draft.size}
              onChange={(e) =>
                onChange({ ...draft, size: Number(e.target.value) })
              }
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">
              Currency
            </label>
            <select
              value={draft.currency}
              onChange={(e) =>
                onChange({
                  ...draft,
                  currency: e.target.value as "NGN" | "USD",
                })
              }
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option>NGN</option>
              <option>USD</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">
              Priority
            </label>
            <select
              value={draft.priority}
              onChange={(e) =>
                onChange({ ...draft, priority: e.target.value as Priority })
              }
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      <hr className="border-border" />

      <div>
        <label className="text-xs font-semibold text-dark-gray/60 uppercase tracking-wider">
          Team &amp; Timeline
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">
              Initial Stage
            </label>
            <select
              value={draft.stage}
              onChange={(e) =>
                onChange({ ...draft, stage: e.target.value as Stage })
              }
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">
              Target Close
            </label>
            <input
              type="date"
              value={draft.targetClose}
              onChange={(e) =>
                onChange({ ...draft, targetClose: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-500">
              Lead Portfolio Manager
            </label>
            <input
              value={draft.lead}
              onChange={(e) => onChange({ ...draft, lead: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="e.g. F. Aliyu"
            />
          </div>
        </div>
      </div>

      <hr className="border-border" />

      <div>
        <label className="text-xs font-medium text-gray-500">
          Investment Thesis / Notes
        </label>
        <textarea
          value={draft.notes}
          onChange={(e) => onChange({ ...draft, notes: e.target.value })}
          rows={3}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary resize-none"
          placeholder="DD progress, regulatory considerations, key risks, co-investors…"
        />
      </div>
    </div>
  </Drawer>
);
