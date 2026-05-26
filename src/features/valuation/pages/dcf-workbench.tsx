import { useMemo } from "react";
import { Info } from "lucide-react";
import { useValuation } from "../store";
import { runDCF, computeWACC } from "../engine";
import { fmtNGN, fmtPct, ASSET_TYPE_LABEL } from "../utils";
import type { Asset } from "../engine/types";

const DCF_ELIGIBLE: Asset["type"][] = [
  "subsidiary",
  "equity_unlisted",
  "joint_venture",
];

export function ValuationDCFWorkbench() {
  const v = useValuation();

  /* only DCF-eligible assets in the dropdown */
  const eligible = v.assets.filter((a) => DCF_ELIGIBLE.includes(a.type));

  /* default selection if none set or wrong type */
  const selected = useMemo(() => {
    if (v.selectedAssetId) {
      const found = eligible.find((a) => a.id === v.selectedAssetId);
      if (found) return found;
    }
    return eligible[0];
  }, [v.selectedAssetId, eligible]);

  if (!v.hasData) {
    return (
      <div className="p-6 xl:p-8">
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm font-medium text-dark-gray">No assets loaded</p>
          <p className="mt-1 text-xs text-gray-400">
            Load data on Data Manager to start modelling.
          </p>
        </div>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="p-6 xl:p-8">
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm font-medium text-dark-gray">
            No DCF-eligible assets in dataset
          </p>
          <p className="mt-1 text-xs text-gray-400">
            DCF is used for subsidiaries, unlisted equity, and JVs.
          </p>
        </div>
      </div>
    );
  }

  const dcf = runDCF(selected, v.assumptions);
  const wacc = computeWACC(v.assumptions, selected.beta ?? 1);

  function patch(p: Partial<Asset>) {
    v.updateAsset(selected.id, p);
  }

  return (
    <div className="p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">DCF Workbench</h1>
        <p className="mt-1 text-sm text-gray-500">
          Project free cash flows, discount at the asset-specific WACC, and add
          a Gordon-growth terminal value.
        </p>
      </div>

      {/* asset selector */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Active asset
            </label>
            <select
              value={selected.id}
              onChange={(e) => v.setSelectedAssetId(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {eligible.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {ASSET_TYPE_LABEL[a.type]} ({a.holdingPct}%)
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-lg border border-primary/20 bg-pale-red/40 p-3">
            <p className="text-xs text-gray-500">
              Asset WACC (β = {selected.beta ?? 1})
            </p>
            <p className="text-xl font-bold text-primary">{fmtPct(wacc, 2)}</p>
          </div>
        </div>
      </div>

      {/* DCF inputs */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">
          Model Inputs
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              FCF Year 1 (₦M)
            </label>
            <input
              type="number"
              step={100}
              value={selected.freeCashFlowYear1 ?? 0}
              onChange={(e) =>
                patch({ freeCashFlowYear1: Number(e.target.value) })
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Explicit Growth (%)
            </label>
            <input
              type="number"
              step={0.5}
              value={((selected.growthRate ?? 0) * 100).toFixed(1)}
              onChange={(e) =>
                patch({ growthRate: Number(e.target.value) / 100 })
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Terminal Growth (%)
            </label>
            <input
              type="number"
              step={0.25}
              value={((selected.terminalGrowth ?? 0) * 100).toFixed(2)}
              onChange={(e) =>
                patch({ terminalGrowth: Number(e.target.value) / 100 })
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Projection Years
            </label>
            <input
              type="number"
              step={1}
              min={3}
              max={10}
              value={selected.projectionYears ?? 5}
              onChange={(e) =>
                patch({ projectionYears: Number(e.target.value) })
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Beta
            </label>
            <input
              type="number"
              step={0.05}
              value={selected.beta ?? 1}
              onChange={(e) => patch({ beta: Number(e.target.value) })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* projection table */}
      {dcf && (
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm overflow-x-auto">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">
            Cash Flow Projection
          </h2>
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Line
                </th>
                {dcf.years.map((y) => (
                  <th
                    key={y}
                    className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400"
                  >
                    Year {y}
                  </th>
                ))}
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-primary">
                  Terminal
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="px-4 py-3 text-xs font-medium text-dark-gray">
                  Free Cash Flow (₦M)
                </td>
                {dcf.fcfs.map((f, i) => (
                  <td key={i} className="px-4 py-3 text-right text-xs">
                    {f.toLocaleString("en-NG", { maximumFractionDigits: 0 })}
                  </td>
                ))}
                <td className="px-4 py-3 text-right text-xs">—</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-4 py-3 text-xs font-medium text-dark-gray">
                  Discount Factor
                </td>
                {dcf.discountFactors.map((d, i) => (
                  <td
                    key={i}
                    className="px-4 py-3 text-right text-xs text-gray-500"
                  >
                    {d.toFixed(4)}
                  </td>
                ))}
                <td className="px-4 py-3 text-right text-xs">—</td>
              </tr>
              <tr className="border-b border-border bg-pale-red/30">
                <td className="px-4 py-3 text-xs font-semibold text-primary">
                  Present Value (₦M)
                </td>
                {dcf.presentValues.map((pv, i) => (
                  <td
                    key={i}
                    className="px-4 py-3 text-right text-xs font-semibold text-primary"
                  >
                    {pv.toLocaleString("en-NG", { maximumFractionDigits: 0 })}
                  </td>
                ))}
                <td className="px-4 py-3 text-right text-xs font-semibold text-primary">
                  {dcf.terminalPV.toLocaleString("en-NG", {
                    maximumFractionDigits: 0,
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* valuation output */}
      {dcf && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-xs text-gray-400">PV of Explicit Period</p>
            <p className="mt-1 text-lg font-bold text-dark-gray">
              {fmtNGN(dcf.explicitPV)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-xs text-gray-400">PV of Terminal Value</p>
            <p className="mt-1 text-lg font-bold text-dark-gray">
              {fmtNGN(dcf.terminalPV)}
            </p>
            <p className="text-xs text-gray-400">
              {fmtPct(dcf.terminalPV / dcf.enterpriseValue)} of EV
            </p>
          </div>
          <div className="rounded-xl border border-primary/30 bg-pale-red/40 p-4">
            <p className="text-xs text-primary">Enterprise Value (100%)</p>
            <p className="mt-1 text-lg font-bold text-primary">
              {fmtNGN(dcf.enterpriseValue)}
            </p>
          </div>
          <div className="rounded-xl border border-primary bg-primary p-4 text-white">
            <p className="text-xs opacity-80">
              Equity Attributable ({selected.holdingPct}%)
            </p>
            <p className="mt-1 text-lg font-bold">
              {fmtNGN(dcf.equityValueAttributable)}
            </p>
            <p className="text-xs opacity-80">
              vs Carrying {fmtNGN(selected.carryingValue)}
            </p>
          </div>
        </div>
      )}

      {/* methodology note */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-xs text-blue-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">Methodology</p>
          <p className="mt-1">
            FCF grows at the explicit rate for the projection horizon. Year-end
            discount factors use the asset-specific WACC, re-levered by the
            entity's beta. Terminal value follows the Gordon Growth model: TV =
            FCF<sub>n+1</sub> / (WACC − g). Equity attributable to Heirs
            Holdings is Enterprise Value × % held.
          </p>
        </div>
      </div>
    </div>
  );
}
