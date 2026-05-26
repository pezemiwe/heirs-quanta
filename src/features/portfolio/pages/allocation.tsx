import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Modal } from "../../../components/shared/modal";
import { usePortfolio } from "../store";
import { fmtNGN } from "../utils";
import type { AllocationTarget } from "../engine/types";

export function PortfolioAllocation() {
  const { metrics, targets, setTargets } = usePortfolio();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<AllocationTarget[]>(targets);

  const targetMap = new Map(targets.map((t) => [t.assetClass, t]));

  return (
    <div className="p-6 xl:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">
            Asset Allocation
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Exposure breakdown across class, geography, currency and sector ·
            NAV {fmtNGN(metrics.totalNav)}
          </p>
        </div>
        <button
          onClick={() => {
            setDraft(targets);
            setEditing(true);
          }}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-gray-600 shadow-sm hover:border-primary hover:text-primary"
        >
          <Settings2 className="h-4 w-4" /> Edit Targets &amp; Limits
        </button>
      </div>

      {/* Drift alerts */}
      {metrics.byClass.some((c) => {
        const t = targetMap.get(c.label as never);
        return t && c.pct > t.limitPct;
      }) && (
        <div className="rounded-xl border border-danger bg-red-50 px-5 py-4">
          <p className="text-sm font-semibold text-danger">
            Allocation drift detected
          </p>
          <p className="mt-0.5 text-xs text-red-600">
            One or more asset classes exceed policy limits. Review and rebalance
            as required.
          </p>
        </div>
      )}

      {/* By Asset Class */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-dark-gray">By Asset Class</h2>
        <div className="space-y-4">
          {metrics.byClass.map((c) => {
            const t = targetMap.get(c.label as never);
            const isOver = t && c.pct > t.limitPct;
            const isNear = t && !isOver && c.pct > t.limitPct * 0.9;
            return (
              <div key={c.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-dark-gray">{c.label}</span>
                  <span className="flex items-center gap-3 text-gray-500">
                    <span className="font-semibold text-dark-gray">
                      {c.pct.toFixed(1)}%
                    </span>
                    <span className="text-gray-400">{fmtNGN(c.value)}</span>
                    {t && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          isOver
                            ? "bg-red-100 text-danger"
                            : isNear
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        Target {t.targetPct}% · Limit {t.limitPct}%
                      </span>
                    )}
                  </span>
                </div>
                <div className="relative h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(c.pct, 100)}%`,
                      background: c.color,
                    }}
                  />
                  {t && (
                    <div
                      className="absolute top-0 h-full w-0.5 bg-dark-gray/30"
                      style={{ left: `${t.targetPct}%` }}
                      title={`Target: ${t.targetPct}%`}
                    />
                  )}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>
                    P&amp;L:{" "}
                    <span
                      className={
                        c.pnl >= 0
                          ? "text-success font-medium"
                          : "text-danger font-medium"
                      }
                    >
                      {c.pnl >= 0 ? "+" : ""}
                      {fmtNGN(c.pnl)}
                    </span>
                  </span>
                  <span>Cost: {fmtNGN(c.costBasis)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3-col grid: Geo + Currency + Sector */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Geography */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">
            Geographic Exposure
          </h2>
          <div className="space-y-3">
            {metrics.byGeo.map((g) => (
              <div key={g.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">{g.label}</span>
                  <span className="font-semibold text-dark-gray">
                    {g.pct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${g.pct}%`, background: g.color }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {fmtNGN(g.value)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Currency */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">
            Currency Exposure
          </h2>
          <div className="space-y-3">
            {metrics.byCurrency.map((c) => (
              <div key={c.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">{c.label}</span>
                  <span className="font-semibold text-dark-gray">
                    {c.pct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.pct}%`, background: c.color }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {fmtNGN(c.value)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Sector */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">
            Sector Breakdown
          </h2>
          <div className="space-y-3">
            {metrics.bySector.slice(0, 8).map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">{s.label}</span>
                  <span className="font-semibold text-dark-gray">
                    {s.pct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/60"
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit targets modal */}
      <Modal
        isOpen={editing}
        onClose={() => setEditing(false)}
        size="lg"
        title="Strategic Allocation Targets"
        description="Adjust IPS target weights and hard concentration limits per asset class. Changes flow into drift alerts and concentration monitoring."
        footer={
          <>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-gray-600 hover:border-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setTargets(draft);
                setEditing(false);
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red"
            >
              Save Targets
            </button>
          </>
        }
      >
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Asset Class
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Current
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Target %
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Limit %
                </th>
              </tr>
            </thead>
            <tbody>
              {draft.map((t, i) => {
                const current = metrics.byClass.find(
                  (c) => c.label === t.assetClass,
                );
                return (
                  <tr key={t.assetClass} className="border-t border-border/50">
                    <td className="px-4 py-2.5 font-medium text-dark-gray">
                      {t.assetClass}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-500">
                      {current ? `${current.pct.toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <input
                        type="number"
                        step="0.5"
                        value={t.targetPct}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setDraft((prev) =>
                            prev.map((p, idx) =>
                              idx === i ? { ...p, targetPct: v } : p,
                            ),
                          );
                        }}
                        className="w-20 rounded-md border border-border px-2 py-1 text-right text-sm outline-none focus:border-primary"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <input
                        type="number"
                        step="0.5"
                        value={t.limitPct}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setDraft((prev) =>
                            prev.map((p, idx) =>
                              idx === i ? { ...p, limitPct: v } : p,
                            ),
                          );
                        }}
                        className="w-20 rounded-md border border-border px-2 py-1 text-right text-sm outline-none focus:border-primary"
                      />
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-border bg-pale-red/20 font-semibold">
                <td className="px-4 py-2.5">Total</td>
                <td className="px-4 py-2.5 text-right text-xs">100%</td>
                <td className="px-4 py-2.5 text-right text-xs">
                  {draft.reduce((s, t) => s + t.targetPct, 0).toFixed(1)}%
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Tip: target weights should sum to 100%. Limits represent the policy
          ceiling and drive drift alerts.
        </p>
      </Modal>
    </div>
  );
}
