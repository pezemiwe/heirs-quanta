import { useState } from "react";
import { Search, Plus, ChevronDown, X } from "lucide-react";
import { usePortfolio } from "../store";
import { fmtNGN, fmtDate, TX_BADGE, STATUS_BADGE } from "../utils";
import type { TxType, Transaction } from "../engine/types";

const TYPE_FILTERS: ("All" | TxType)[] = [
  "All",
  "Buy",
  "Sell",
  "Dividend",
  "Coupon",
  "Maturity",
  "Rebalance",
  "Capital Call",
];

export function PortfolioTransactions() {
  const { transactions, holdings, addTransaction } = usePortfolio();
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<"All" | TxType>("All");
  const [showForm, setShowForm] = useState(false);

  // Draft transaction
  const [draft, setDraft] = useState<Partial<Transaction>>({
    date: new Date().toISOString().slice(0, 10),
    type: "Buy",
    status: "Processing",
    amount: 0,
  });

  const filtered = transactions.filter((t) => {
    const matchType = activeType === "All" || t.type === activeType;
    const matchSearch =
      t.assetName.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      (t.notes ?? "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const totalBuys = transactions
    .filter((t) => t.type === "Buy")
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalSells = transactions
    .filter((t) => t.type === "Sell")
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalIncome = transactions
    .filter((t) => t.type === "Dividend" || t.type === "Coupon")
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  function handleAddTx() {
    if (!draft.holdingId || !draft.assetName || !draft.type) return;
    const tx: Transaction = {
      id: `TXN-${String(Date.now()).slice(-6)}`,
      date: draft.date ?? new Date().toISOString().slice(0, 10),
      type: draft.type as TxType,
      holdingId: draft.holdingId,
      assetName: draft.assetName,
      quantity: draft.quantity,
      price: draft.price,
      amount: draft.amount ?? 0,
      status: "Processing",
      notes: draft.notes,
    };
    addTransaction(tx);
    setShowForm(false);
    setDraft({
      date: new Date().toISOString().slice(0, 10),
      type: "Buy",
      status: "Processing",
      amount: 0,
    });
  }

  return (
    <div className="p-6 xl:p-8 space-y-6">
      {/* header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">
            {transactions.length} recorded transactions
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-mid-red"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Add Transaction"}
        </button>
      </div>

      {/* summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Total Purchases",
            value: fmtNGN(totalBuys),
            color: "text-primary",
          },
          {
            label: "Total Sales",
            value: fmtNGN(totalSells),
            color: "text-danger",
          },
          {
            label: "Total Income Received",
            value: fmtNGN(totalIncome),
            color: "text-success",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`mt-1 text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* add transaction form */}
      {showForm && (
        <div className="rounded-xl border border-primary/30 bg-pale-red/30 p-5 shadow-sm space-y-4">
          <p className="text-sm font-semibold text-dark-gray">
            New Transaction
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="text-xs text-gray-500">Date</label>
              <input
                type="date"
                value={draft.date?.slice(0, 10) ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, date: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Type</label>
              <select
                value={draft.type ?? "Buy"}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, type: e.target.value as TxType }))
                }
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {(
                  [
                    "Buy",
                    "Sell",
                    "Dividend",
                    "Coupon",
                    "Maturity",
                    "Rebalance",
                    "Capital Call",
                  ] as TxType[]
                ).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500">Holding</label>
              <select
                value={draft.holdingId ?? ""}
                onChange={(e) => {
                  const h = holdings.find((x) => x.id === e.target.value);
                  setDraft((d) => ({
                    ...d,
                    holdingId: e.target.value,
                    assetName: h?.name ?? "",
                  }));
                }}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">Select holding…</option>
                {holdings.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Quantity</label>
              <input
                type="number"
                placeholder="0"
                value={draft.quantity ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, quantity: Number(e.target.value) }))
                }
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Price (₦)</label>
              <input
                type="number"
                placeholder="0.00"
                value={draft.price ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, price: Number(e.target.value) }))
                }
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Amount (₦M)</label>
              <input
                type="number"
                placeholder="0.0"
                value={draft.amount ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, amount: Number(e.target.value) }))
                }
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Notes</label>
              <input
                type="text"
                placeholder="Optional memo…"
                value={draft.notes ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, notes: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-gray-600 hover:border-primary"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTx}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-mid-red"
            >
              Record Transaction
            </button>
          </div>
        </div>
      )}

      {/* filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search asset, reference…"
            className="rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeType === t
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-pale-red hover:text-primary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-gray-400">
          {filtered.length} results
        </span>
      </div>

      {/* table */}
      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-gray-50">
            <tr>
              {[
                "Reference",
                "Date",
                "Type",
                "Asset",
                "Amount (₦M)",
                "Status",
                "Notes",
              ].map((col) => (
                <th
                  key={col}
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr
                key={t.id}
                className="border-b border-border/50 last:border-0 hover:bg-pale-red/10"
              >
                <td className="px-5 py-3.5 text-xs font-mono text-gray-500">
                  {t.id}
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-500">
                  {fmtDate(t.date)}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TX_BADGE[t.type] ?? "bg-gray-100"}`}
                  >
                    {t.type}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm font-medium text-dark-gray">
                  {t.assetName}
                </td>
                <td
                  className={`px-5 py-3.5 text-sm font-bold ${t.amount > 0 ? "text-success" : t.amount < 0 ? "text-primary" : "text-gray-500"}`}
                >
                  {t.amount !== 0
                    ? (t.amount > 0 ? "+" : "") + fmtNGN(t.amount)
                    : "—"}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[t.status] ?? "bg-gray-100"}`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-400 max-w-xs truncate">
                  {t.notes ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-gray-400">
            No transactions match the current filter.
          </div>
        )}
      </div>
    </div>
  );
}
