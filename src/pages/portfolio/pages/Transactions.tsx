import { useState } from "react";
import { Search, Download } from "lucide-react";

const TX_TYPES = [
  "All",
  "Buy",
  "Sell",
  "Maturity",
  "Dividend",
  "Coupon",
  "Rebalance",
];

const TRANSACTIONS = [
  {
    id: "TXN-0241",
    date: "25 May 2026",
    type: "Buy",
    asset: "FGN Bond 2033",
    quantity: "1,000 units",
    price: "₦23,500",
    amount: "₦2.35B",
    status: "Settled",
  },
  {
    id: "TXN-0240",
    date: "25 May 2026",
    type: "Sell",
    asset: "Access Holdings",
    quantity: "50,000,000 shares",
    price: "₦16.0",
    amount: "₦800M",
    status: "Settled",
  },
  {
    id: "TXN-0239",
    date: "24 May 2026",
    type: "Rebalance",
    asset: "Real Estate Portfolio",
    quantity: "—",
    price: "—",
    amount: "—",
    status: "Processing",
  },
  {
    id: "TXN-0238",
    date: "23 May 2026",
    type: "Dividend",
    asset: "Dangote Cement Plc",
    quantity: "—",
    price: "—",
    amount: "₦420M",
    status: "Settled",
  },
  {
    id: "TXN-0237",
    date: "22 May 2026",
    type: "Coupon",
    asset: "FGN Bond 2031",
    quantity: "—",
    price: "—",
    amount: "₦1.18B",
    status: "Settled",
  },
  {
    id: "TXN-0236",
    date: "20 May 2026",
    type: "Buy",
    asset: "MTN Nigeria Comm.",
    quantity: "10,000,000 shares",
    price: "₦93.5",
    amount: "₦935M",
    status: "Settled",
  },
  {
    id: "TXN-0235",
    date: "19 May 2026",
    type: "Maturity",
    asset: "T-Bills 91-day",
    quantity: "—",
    price: "—",
    amount: "₦5.2B",
    status: "Settled",
  },
  {
    id: "TXN-0234",
    date: "15 May 2026",
    type: "Buy",
    asset: "Zenith Bank Plc",
    quantity: "20,000,000 shares",
    price: "₦22.8",
    amount: "₦456M",
    status: "Settled",
  },
];

const TYPE_COLOURS: Record<string, string> = {
  Buy: "bg-pale-red text-primary",
  Sell: "bg-red-50 text-danger",
  Dividend: "bg-teal-50 text-success",
  Coupon: "bg-teal-50 text-success",
  Maturity: "bg-blue-50 text-blue-700",
  Rebalance: "bg-gray-100 text-gray-600",
};

const STATUS_COLOURS: Record<string, string> = {
  Settled: "bg-teal-50 text-success",
  Processing: "bg-yellow-50 text-yellow-700",
  Failed: "bg-red-50 text-danger",
};

export function Transactions() {
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("All");

  const filtered = TRANSACTIONS.filter((t) => {
    const matchType = activeType === "All" || t.type === activeType;
    const matchSearch =
      t.asset.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="p-6 xl:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Full trade and cash event history
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-gray-600 shadow-sm hover:border-primary hover:text-primary">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions…"
            className="rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {TX_TYPES.map((t) => (
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
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-gray-50">
            <tr>
              {["Ref", "Date", "Type", "Asset", "Amount", "Status"].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr
                key={t.id}
                className="border-b border-border/50 last:border-0 hover:bg-pale-red/30"
              >
                <td className="px-5 py-3.5 text-xs font-mono text-gray-400">
                  {t.id}
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-500">{t.date}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_COLOURS[t.type] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {t.type}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-medium text-dark-gray text-xs">
                  {t.asset}
                </td>
                <td className="px-5 py-3.5 text-xs font-medium">{t.amount}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOURS[t.status] ?? "bg-gray-100"}`}
                  >
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
