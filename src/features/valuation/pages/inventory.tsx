import { useState } from "react";
import { Search, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Drawer } from "../../../components/shared/drawer";
import { useValuation } from "../store";
import {
  fmtNGN,
  fmtPct,
  ASSET_TYPE_LABEL,
  ASSET_TYPE_COLOR,
  IFRS13_BADGE,
} from "../utils";
import type { Asset, AssetType, Currency } from "../engine/types";

const TYPE_FILTERS: ("All" | AssetType)[] = [
  "All",
  "subsidiary",
  "equity_listed",
  "equity_unlisted",
  "real_estate",
  "bond",
  "tbill",
  "pe_fund",
  "joint_venture",
];

export function ValuationInventory() {
  const v = useValuation();
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<"All" | AssetType>("All");
  const [adding, setAdding] = useState(false);
  const blank: Asset = {
    id: "",
    name: "",
    type: "equity_listed",
    sector: "",
    currency: "NGN",
    holdingPct: 100,
    carryingValue: 0,
  };
  const [draft, setDraft] = useState<Asset>(blank);

  if (!v.hasData) {
    return (
      <div className="p-6 xl:p-8">
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm font-medium text-dark-gray">
            No assets to display
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Load data on the Data Manager page first, or add an asset manually.
          </p>
          <button
            onClick={() => {
              setDraft(blank);
              setAdding(true);
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red"
          >
            <Plus className="h-4 w-4" /> Add Asset
          </button>
        </div>
        {addAssetDrawer()}
      </div>
    );
  }

  const filtered = v.assets.filter((a) => {
    const matchType = active === "All" || a.type === active;
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.sector.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="p-6 xl:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">Asset Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filtered.length} of {v.assets.length} assets in scope
          </p>
        </div>
        <button
          onClick={() => {
            setDraft(blank);
            setAdding(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-mid-red"
        >
          <Plus className="h-4 w-4" /> Add Asset
        </button>
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search asset or sector…"
            className="rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active === t
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-pale-red hover:text-primary"
              }`}
            >
              {t === "All" ? "All" : ASSET_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {/* table */}
      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-gray-50">
            <tr>
              {[
                "Asset",
                "Type",
                "Sector",
                "% Held",
                "Carrying",
                "Fair Value",
                "Uplift",
                "Level",
              ].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  {h}
                </th>
              ))}
              <th className="px-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const val = v.result.valuations.find((x) => x.assetId === a.id);
              if (!val) return null;
              const isPos = val.uplift >= 0;
              return (
                <tr
                  key={a.id}
                  className={`border-b border-border/50 last:border-0 hover:bg-pale-red/30 cursor-pointer ${
                    v.selectedAssetId === a.id ? "bg-pale-red/40" : ""
                  }`}
                  onClick={() => v.setSelectedAssetId(a.id)}
                >
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-dark-gray">{a.name}</p>
                    <p className="text-xs text-gray-400">
                      {a.id} · {a.currency}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        background: `${ASSET_TYPE_COLOR[a.type]}15`,
                        color: ASSET_TYPE_COLOR[a.type],
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: ASSET_TYPE_COLOR[a.type] }}
                      />
                      {ASSET_TYPE_LABEL[a.type]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">
                    {a.sector}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-medium">
                    {a.holdingPct}%
                  </td>
                  <td className="px-5 py-3.5 text-xs">
                    {fmtNGN(a.carryingValue)}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-primary">
                    {fmtNGN(val.fairValue)}
                  </td>
                  <td
                    className={`px-5 py-3.5 text-xs font-semibold ${isPos ? "text-success" : "text-danger"}`}
                  >
                    {isPos ? "+" : ""}
                    {fmtPct(val.upliftPct)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${IFRS13_BADGE[val.ifrs13Level]}`}
                    >
                      {val.ifrs13Level}
                    </span>
                  </td>
                  <td className="px-3 text-gray-300">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* selected asset detail */}
      {v.selectedAssetId &&
        (() => {
          const a = v.assets.find((x) => x.id === v.selectedAssetId);
          const val = v.result.valuations.find(
            (x) => x.assetId === v.selectedAssetId,
          );
          if (!a || !val) return null;
          return (
            <div className="rounded-xl border border-primary/30 bg-pale-red/30 p-5 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-primary">
                    Selected Asset
                  </p>
                  <h3 className="text-lg font-bold text-dark-gray">{a.name}</h3>
                  <p className="text-xs text-gray-500">
                    {a.sector} · {ASSET_TYPE_LABEL[a.type]} · {a.holdingPct}%
                    holding
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${a.name} from inventory?`)) {
                        v.removeAsset(a.id);
                      }
                    }}
                    className="flex items-center gap-1 rounded-lg border border-danger/30 bg-surface px-2.5 py-1.5 text-xs font-medium text-danger shadow-sm hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${IFRS13_BADGE[val.ifrs13Level]}`}
                  >
                    {val.ifrs13Level}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-400">Method</p>
                  <p className="text-sm font-semibold">{val.method}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Fair Value</p>
                  <p className="text-sm font-bold text-primary">
                    {fmtNGN(val.fairValue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Range</p>
                  <p className="text-xs">
                    {fmtNGN(val.fairValueLow)} → {fmtNGN(val.fairValueHigh)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Uplift vs Carrying</p>
                  <p
                    className={`text-sm font-semibold ${val.uplift >= 0 ? "text-success" : "text-danger"}`}
                  >
                    {val.uplift >= 0 ? "+" : ""}
                    {fmtNGN(val.uplift)} ({fmtPct(val.upliftPct)})
                  </p>
                </div>
              </div>
              <p className="mt-3 border-t border-primary/20 pt-3 text-xs text-gray-600">
                {val.notes}
              </p>
            </div>
          );
        })()}
      {addAssetDrawer()}
    </div>
  );

  function addAssetDrawer() {
    const TYPE_OPTS: AssetType[] = [
      "subsidiary",
      "equity_listed",
      "equity_unlisted",
      "real_estate",
      "bond",
      "tbill",
      "pe_fund",
      "joint_venture",
    ];
    const CCY_OPTS: Currency[] = ["NGN", "USD", "GBP", "EUR"];
    const valid =
      draft.name.trim().length > 0 &&
      draft.sector.trim().length > 0 &&
      draft.carryingValue >= 0;
    return (
      <Drawer
        isOpen={adding}
        onClose={() => setAdding(false)}
        size="md"
        title="Add Asset to Inventory"
        description="Register a new investment asset for valuation. Method-specific inputs can be added afterwards from the workbench."
        footer={
          <>
            <button
              onClick={() => setAdding(false)}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-gray-600 hover:border-gray-300"
            >
              Cancel
            </button>
            <button
              disabled={!valid}
              onClick={() => {
                const id = `A-${Date.now().toString(36).toUpperCase()}`;
                v.addAsset({ ...draft, id });
                v.setSelectedAssetId(id);
                setAdding(false);
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red disabled:opacity-50"
            >
              Add Asset
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Asset Name" required>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="e.g. Heirs Energies Ltd"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Asset Type" required>
              <select
                value={draft.type}
                onChange={(e) =>
                  setDraft({ ...draft, type: e.target.value as AssetType })
                }
                className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {TYPE_OPTS.map((t) => (
                  <option key={t} value={t}>
                    {ASSET_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Currency" required>
              <select
                value={draft.currency}
                onChange={(e) =>
                  setDraft({ ...draft, currency: e.target.value as Currency })
                }
                className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {CCY_OPTS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Sector" required>
              <input
                value={draft.sector}
                onChange={(e) => setDraft({ ...draft, sector: e.target.value })}
                className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="e.g. Energy"
              />
            </Field>
            <Field label="% Held" required>
              <input
                type="number"
                step="0.1"
                value={draft.holdingPct}
                onChange={(e) =>
                  setDraft({ ...draft, holdingPct: Number(e.target.value) })
                }
                className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </Field>
            <Field label="Carrying Value (NGN M)" required>
              <input
                type="number"
                step="1"
                value={draft.carryingValue}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    carryingValue: Number(e.target.value),
                  })
                }
                className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </Field>
          </div>
          <p className="text-xs text-gray-400">
            Tip: method-specific inputs (DCF cash flows, multiples, bond cash
            flows, NOI) can be edited later from the inventory detail panel.
          </p>
        </div>
      </Drawer>
    );
  }
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
