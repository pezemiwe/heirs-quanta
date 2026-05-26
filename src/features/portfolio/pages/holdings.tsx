import { useState } from "react";
import {
  Search,
  Download,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { Drawer } from "../../../components/shared/drawer";
import { usePortfolio } from "../store";
import { fmtNGN, fmtPct, fmtDelta, CLASS_BADGE } from "../utils";
import type { AssetClass, Geography, Currency, Holding } from "../engine/types";

const CLASS_FILTERS: ("All" | AssetClass)[] = [
  "All",
  "Private Equity",
  "Equity",
  "Fixed Income",
  "Real Estate",
  "Cash",
  "Alternatives",
];

type SortCol =
  | "name"
  | "assetClass"
  | "sector"
  | "marketValue"
  | "weight"
  | "ytdReturn"
  | "beta";

export function PortfolioHoldings() {
  const {
    holdings,
    metrics,
    selectedHoldingId,
    setSelectedHoldingId,
    addHolding,
    updateHolding,
    removeHolding,
  } = usePortfolio();
  const [search, setSearch] = useState("");
  const [activeClass, setActiveClass] = useState<"All" | AssetClass>("All");
  const [sortCol, setSortCol] = useState<SortCol>("marketValue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [editing, setEditing] = useState<Holding | null>(null);
  const [drawerMode, setDrawerMode] = useState<"closed" | "add" | "edit">(
    "closed",
  );

  const totalNav = metrics.totalNav;

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("desc");
    }
  }

  const filtered = holdings
    .filter((h) => {
      const matchClass = activeClass === "All" || h.assetClass === activeClass;
      const matchSearch =
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.sector.toLowerCase().includes(search.toLowerCase()) ||
        h.issuer.toLowerCase().includes(search.toLowerCase());
      return matchClass && matchSearch;
    })
    .sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;
      switch (sortCol) {
        case "name":
          av = a.name;
          bv = b.name;
          break;
        case "assetClass":
          av = a.assetClass;
          bv = b.assetClass;
          break;
        case "sector":
          av = a.sector;
          bv = b.sector;
          break;
        case "marketValue":
          av = a.marketValue;
          bv = b.marketValue;
          break;
        case "weight":
          av = totalNav > 0 ? a.marketValue / totalNav : 0;
          bv = totalNav > 0 ? b.marketValue / totalNav : 0;
          break;
        case "ytdReturn":
          av = a.ytdReturn;
          bv = b.ytdReturn;
          break;
        case "beta":
          av = a.beta;
          bv = b.beta;
          break;
      }
      if (typeof av === "string" && typeof bv === "string")
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc"
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number);
    });

  function SortIcon({ col }: { col: SortCol }) {
    if (sortCol !== col) return <ChevronUp className="h-3 w-3 text-gray-300" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 text-primary" />
    ) : (
      <ChevronDown className="h-3 w-3 text-primary" />
    );
  }

  function TH({ col, label }: { col: SortCol; label: string }) {
    return (
      <th
        className="cursor-pointer px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-primary"
        onClick={() => handleSort(col)}
      >
        <span className="flex items-center gap-1">
          {label} <SortIcon col={col} />
        </span>
      </th>
    );
  }

  function downloadCSV() {
    const header = [
      "id",
      "name",
      "assetClass",
      "sector",
      "geography",
      "currency",
      "costBasis",
      "marketValue",
      "weight%",
      "ytdReturn%",
      "beta",
    ];
    const rows = holdings.map((h) => [
      h.id,
      h.name,
      h.assetClass,
      h.sector,
      h.geography,
      h.currency,
      h.costBasis.toFixed(1),
      h.marketValue.toFixed(1),
      (totalNav > 0 ? (h.marketValue / totalNav) * 100 : 0).toFixed(2),
      (h.ytdReturn * 100).toFixed(2),
      h.beta.toFixed(2),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "heirs-holdings-portfolio.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const selected = holdings.find((h) => h.id === selectedHoldingId);

  return (
    <div className="p-6 xl:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">Holdings</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filtered.length} of {holdings.length} positions · Total NAV{" "}
            {fmtNGN(totalNav)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditing(null);
              setDrawerMode("add");
            }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-mid-red"
          >
            <Plus className="h-4 w-4" /> Add Holding
          </button>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-gray-600 shadow-sm hover:border-primary hover:text-primary"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, sector, issuer…"
            className="rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {CLASS_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveClass(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeClass === t
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-pale-red hover:text-primary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* table */}
      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 w-8">
                #
              </th>
              <TH col="name" label="Instrument" />
              <TH col="assetClass" label="Class" />
              <TH col="sector" label="Sector" />
              <TH col="marketValue" label="Market Value" />
              <TH col="weight" label="Weight" />
              <TH col="ytdReturn" label="YTD Return" />
              <TH col="beta" label="Beta" />
              <th className="px-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((h, i) => {
              const weight =
                totalNav > 0 ? (h.marketValue / totalNav) * 100 : 0;
              const unrealised = h.marketValue - h.costBasis;
              const isSelected = selectedHoldingId === h.id;
              return (
                <tr
                  key={h.id}
                  onClick={() => setSelectedHoldingId(isSelected ? null : h.id)}
                  className={`border-b border-border/50 last:border-0 cursor-pointer transition-colors ${
                    isSelected ? "bg-pale-red/40" : "hover:bg-pale-red/20"
                  }`}
                >
                  <td className="px-5 py-3.5 text-xs text-gray-400">{i + 1}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-dark-gray">{h.name}</p>
                    <p className="text-xs text-gray-400">
                      {h.issuer} · {h.geography} · {h.currency}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CLASS_BADGE[h.assetClass] ?? "bg-gray-100"}`}
                    >
                      {h.assetClass}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">
                    {h.sector}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-dark-gray text-xs">
                      {fmtNGN(h.marketValue)}
                    </p>
                    <p
                      className={`text-xs ${unrealised >= 0 ? "text-success" : "text-danger"}`}
                    >
                      {unrealised >= 0 ? "+" : ""}
                      {fmtNGN(unrealised)} vs cost
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-xs">{weight.toFixed(1)}%</td>
                  <td
                    className={`px-5 py-3.5 text-xs font-semibold ${h.ytdReturn >= 0 ? "text-success" : "text-danger"}`}
                  >
                    {fmtDelta(h.ytdReturn)}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">
                    {h.beta.toFixed(2)}
                  </td>
                  <td className="px-3 text-gray-300">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-border bg-pale-red/20">
            <tr>
              <td
                className="px-5 py-3 text-xs font-bold text-dark-gray"
                colSpan={4}
              >
                Portfolio Total
              </td>
              <td className="px-5 py-3 text-xs font-bold text-primary">
                {fmtNGN(totalNav)}
              </td>
              <td className="px-5 py-3 text-xs font-bold">100%</td>
              <td
                className={`px-5 py-3 text-xs font-bold ${metrics.ytdReturn >= 0 ? "text-success" : "text-danger"}`}
              >
                {fmtDelta(metrics.ytdReturn)}
              </td>
              <td className="px-5 py-3 text-xs font-bold">
                {metrics.beta.toFixed(2)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* detail panel */}
      {selected && (
        <div className="rounded-xl border border-primary/30 bg-pale-red/30 p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Position Detail
              </p>
              <h3 className="mt-0.5 text-lg font-bold text-dark-gray">
                {selected.name}
              </h3>
              <p className="text-xs text-gray-500">
                {selected.issuer} · {selected.sector} · {selected.geography} ·{" "}
                {selected.currency}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CLASS_BADGE[selected.assetClass] ?? "bg-gray-100"}`}
              >
                {selected.assetClass}
              </span>
              <button
                onClick={() => {
                  setEditing(selected);
                  setDrawerMode("edit");
                }}
                className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary"
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Remove ${selected.name} from the portfolio?`)) {
                    removeHolding(selected.id);
                    setSelectedHoldingId(null);
                  }
                }}
                className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-danger hover:border-danger"
              >
                <Trash2 className="h-3 w-3" /> Remove
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <div>
              <p className="text-xs text-gray-400">Cost Basis</p>
              <p className="text-sm font-semibold">
                {fmtNGN(selected.costBasis)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Market Value</p>
              <p className="text-sm font-bold text-primary">
                {fmtNGN(selected.marketValue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Unrealised P&amp;L</p>
              <p
                className={`text-sm font-semibold ${selected.marketValue >= selected.costBasis ? "text-success" : "text-danger"}`}
              >
                {fmtNGN(selected.marketValue - selected.costBasis)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Portfolio Weight</p>
              <p className="text-sm font-semibold">
                {fmtPct(totalNav > 0 ? selected.marketValue / totalNav : 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">YTD Return</p>
              <p
                className={`text-sm font-semibold ${selected.ytdReturn >= 0 ? "text-success" : "text-danger"}`}
              >
                {fmtDelta(selected.ytdReturn)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Beta</p>
              <p className="text-sm font-semibold">
                {selected.beta.toFixed(2)}
              </p>
            </div>
          </div>
          {selected.dividendYield && (
            <p className="mt-3 border-t border-primary/20 pt-3 text-xs text-gray-500">
              Income yield:{" "}
              <span className="font-semibold text-dark-gray">
                {fmtPct(selected.dividendYield)}
              </span>{" "}
              · Est. annual income:{" "}
              <span className="font-semibold text-dark-gray">
                {fmtNGN(selected.marketValue * selected.dividendYield)}
              </span>
            </p>
          )}
        </div>
      )}

      <HoldingFormDrawer
        mode={drawerMode}
        initial={editing}
        onClose={() => setDrawerMode("closed")}
        onSubmit={(h) => {
          if (drawerMode === "add") addHolding(h);
          else updateHolding(h.id, h);
          setDrawerMode("closed");
          setSelectedHoldingId(h.id);
        }}
      />
    </div>
  );
}

/* ───────────── Add / Edit Holding Drawer ───────────── */

const CLASS_OPTIONS: AssetClass[] = [
  "Equity",
  "Fixed Income",
  "Real Estate",
  "Cash",
  "Private Equity",
  "Alternatives",
];
const GEO_OPTIONS: Geography[] = ["Nigeria", "Pan-Africa", "International"];
const CCY_OPTIONS: Currency[] = ["NGN", "USD", "GBP", "EUR"];

function HoldingFormDrawer({
  mode,
  initial,
  onClose,
  onSubmit,
}: {
  mode: "closed" | "add" | "edit";
  initial: Holding | null;
  onClose: () => void;
  onSubmit: (h: Holding) => void;
}) {
  const isOpen = mode !== "closed";
  const [draft, setDraft] = useState<Partial<Holding>>(() => initial ?? {});

  // Reset draft when opening for a different holding
  const initialId = initial?.id ?? "";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useStateOnChange(initialId + mode, () => setDraft(initial ?? {}));

  function set<K extends keyof Holding>(k: K, v: Holding[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  const valid =
    !!draft.name &&
    !!draft.assetClass &&
    !!draft.sector &&
    !!draft.geography &&
    !!draft.currency &&
    !!draft.issuer &&
    Number.isFinite(draft.marketValue) &&
    Number.isFinite(draft.costBasis);

  function handleSave() {
    if (!valid) return;
    const next: Holding = {
      id: initial?.id ?? `H-${Date.now().toString(36).toUpperCase()}`,
      name: draft.name!,
      assetClass: draft.assetClass as AssetClass,
      sector: draft.sector!,
      geography: draft.geography as Geography,
      currency: draft.currency as Currency,
      issuer: draft.issuer!,
      quantity: draft.quantity ?? 0,
      costPrice: draft.costPrice ?? 0,
      costBasis: draft.costBasis ?? 0,
      marketValue: draft.marketValue ?? 0,
      marketPrice: draft.marketPrice,
      ytdReturn: draft.ytdReturn ?? 0,
      beta: draft.beta ?? 1,
      dividendYield: draft.dividendYield,
    };
    onSubmit(next);
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={mode === "add" ? "Add Holding" : "Edit Holding"}
      description={
        mode === "add"
          ? "Book a new investment position into the portfolio."
          : `Update attributes for ${initial?.name ?? ""}.`
      }
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-gray-600 hover:border-gray-300"
          >
            Cancel
          </button>
          <button
            disabled={!valid}
            onClick={handleSave}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mode === "add" ? "Add Holding" : "Save Changes"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Instrument name" required>
          <input
            value={draft.name ?? ""}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. FGN 13.98% Feb 2028"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Asset class" required>
            <select
              value={draft.assetClass ?? ""}
              onChange={(e) => set("assetClass", e.target.value as AssetClass)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Select…</option>
              {CLASS_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sector" required>
            <input
              value={draft.sector ?? ""}
              onChange={(e) => set("sector", e.target.value)}
              placeholder="e.g. Financial Services"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </Field>
          <Field label="Issuer" required>
            <input
              value={draft.issuer ?? ""}
              onChange={(e) => set("issuer", e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </Field>
          <Field label="Geography" required>
            <select
              value={draft.geography ?? ""}
              onChange={(e) => set("geography", e.target.value as Geography)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Select…</option>
              {GEO_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Currency" required>
            <select
              value={draft.currency ?? ""}
              onChange={(e) => set("currency", e.target.value as Currency)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Select…</option>
              {CCY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quantity (units / face ₦M)">
            <input
              type="number"
              value={draft.quantity ?? ""}
              onChange={(e) => set("quantity", Number(e.target.value))}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </Field>
          <Field label="Cost basis (₦ millions)" required>
            <input
              type="number"
              value={draft.costBasis ?? ""}
              onChange={(e) => set("costBasis", Number(e.target.value))}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </Field>
          <Field label="Market value (₦ millions)" required>
            <input
              type="number"
              value={draft.marketValue ?? ""}
              onChange={(e) => set("marketValue", Number(e.target.value))}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </Field>
          <Field label="YTD return (decimal)">
            <input
              type="number"
              step="0.001"
              value={draft.ytdReturn ?? ""}
              onChange={(e) => set("ytdReturn", Number(e.target.value))}
              placeholder="e.g. 0.118"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </Field>
          <Field label="Beta">
            <input
              type="number"
              step="0.01"
              value={draft.beta ?? ""}
              onChange={(e) => set("beta", Number(e.target.value))}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </Field>
          <Field label="Dividend yield (decimal, optional)">
            <input
              type="number"
              step="0.001"
              value={draft.dividendYield ?? ""}
              onChange={(e) =>
                set(
                  "dividendYield",
                  e.target.value === "" ? undefined : Number(e.target.value),
                )
              }
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </Field>
        </div>
      </div>
    </Drawer>
  );
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
      <label className="mb-1 block text-xs font-semibold text-gray-500">
        {label}
        {required && <span className="ml-0.5 text-primary">*</span>}
      </label>
      {children}
    </div>
  );
}

/** Reset draft when key changes (open/close/different holding). */
function useStateOnChange(key: string, effect: () => void) {
  const [prev, setPrev] = useState(key);
  if (prev !== key) {
    setPrev(key);
    effect();
  }
}
