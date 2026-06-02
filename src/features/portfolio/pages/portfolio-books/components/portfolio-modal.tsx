import { useState } from "react";
import type {
  PortfolioType,
  PortfolioStatus,
} from "../../../portfolio-registry";
import type { FormValues } from "../types";
import { TYPES, CURRENCIES, STATUSES } from "../config";

export function PortfolioModal({
  initial,
  title,
  onSave,
  onClose,
}: {
  initial: FormValues;
  title: string;
  onSave: (v: FormValues) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormValues>(initial);

  function field(key: keyof FormValues, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-xl p-6 mx-4">
        <h2 className="text-base font-bold text-dark-gray mb-5">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-dark-gray/70 mb-1">
              Portfolio Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => field("name", e.target.value)}
              placeholder="e.g. AFS Fixed Income 2024"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Type */}
            <div>
              <label className="block text-xs font-medium text-dark-gray/70 mb-1">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => field("type", e.target.value as PortfolioType)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs font-medium text-dark-gray/70 mb-1">
                Base Currency
              </label>
              <select
                value={form.baseCurrency}
                onChange={(e) => field("baseCurrency", e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Manager */}
          <div>
            <label className="block text-xs font-medium text-dark-gray/70 mb-1">
              Portfolio Manager
            </label>
            <input
              type="text"
              value={form.manager}
              onChange={(e) => field("manager", e.target.value)}
              placeholder="e.g. Head of Fixed Income"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Mandated by */}
          <div>
            <label className="block text-xs font-medium text-dark-gray/70 mb-1">
              Mandated By
            </label>
            <input
              type="text"
              value={form.mandatedBy}
              onChange={(e) => field("mandatedBy", e.target.value)}
              placeholder="e.g. Investment Committee"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-dark-gray/70 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => field("description", e.target.value)}
              rows={2}
              placeholder="Brief description of the portfolio mandate"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Strategy */}
          <div>
            <label className="block text-xs font-medium text-dark-gray/70 mb-1">
              Strategy
            </label>
            <input
              type="text"
              value={form.strategy}
              onChange={(e) => field("strategy", e.target.value)}
              placeholder="e.g. Buy and hold, Active trading..."
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-dark-gray/70 mb-1">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                field("status", e.target.value as PortfolioStatus)
              }
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-dark-gray hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
            >
              Save Portfolio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
