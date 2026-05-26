import { Search, Filter, Download, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";

const ASSET_TYPES = [
  "All",
  "Fixed Income",
  "Equity",
  "Real Estate",
  "Cash",
  "Private Equity",
  "Alternatives",
];

const HOLDINGS = [
  {
    id: 1,
    name: "FGN Bond 2031",
    type: "Fixed Income",
    issuer: "Federal Govt. of Nigeria",
    quantity: "1,000,000",
    price: "₦78,400",
    value: "₦78.4B",
    weight: "9.3%",
    ytd: "+6.2%",
    pos: true,
  },
  {
    id: 2,
    name: "Dangote Cement Plc",
    type: "Equity",
    issuer: "Dangote Industries",
    quantity: "450,000,000",
    price: "₦136.0",
    value: "₦61.2B",
    weight: "7.2%",
    ytd: "+18.4%",
    pos: true,
  },
  {
    id: 3,
    name: "Transcorp Hotels REIT",
    type: "Real Estate",
    issuer: "Transcorp Hotels Plc",
    quantity: "—",
    price: "—",
    value: "₦42.7B",
    weight: "5.0%",
    ytd: "+9.1%",
    pos: true,
  },
  {
    id: 4,
    name: "GTCO Holdings",
    type: "Equity",
    issuer: "GT Bank Group",
    quantity: "1,200,000,000",
    price: "₦32.4",
    value: "₦38.9B",
    weight: "4.6%",
    ytd: "-2.3%",
    pos: false,
  },
  {
    id: 5,
    name: "MTN Nigeria Comm.",
    type: "Equity",
    issuer: "MTN Group",
    quantity: "380,000,000",
    price: "₦93.5",
    value: "₦35.5B",
    weight: "4.2%",
    ytd: "+11.7%",
    pos: true,
  },
  {
    id: 6,
    name: "FGN Bond 2033",
    type: "Fixed Income",
    issuer: "Federal Govt. of Nigeria",
    quantity: "800,000",
    price: "₦29,250",
    value: "₦23.4B",
    weight: "2.8%",
    ytd: "+5.4%",
    pos: true,
  },
  {
    id: 7,
    name: "Zenith Bank Plc",
    type: "Equity",
    issuer: "Zenith Bank",
    quantity: "950,000,000",
    price: "₦22.8",
    value: "₦21.7B",
    weight: "2.6%",
    ytd: "+4.8%",
    pos: true,
  },
  {
    id: 8,
    name: "T-Bills 182-day",
    type: "Cash",
    issuer: "Central Bank of Nigeria",
    quantity: "—",
    price: "—",
    value: "₦18.2B",
    weight: "2.1%",
    ytd: "+9.0%",
    pos: true,
  },
  {
    id: 9,
    name: "Heritage Bank Bond",
    type: "Fixed Income",
    issuer: "Heritage Bank",
    quantity: "250,000",
    price: "₦68,000",
    value: "₦17.0B",
    weight: "2.0%",
    ytd: "+4.1%",
    pos: true,
  },
  {
    id: 10,
    name: "Heirs Life Annuity Fund",
    type: "Alternatives",
    issuer: "Heirs Life Assurance",
    quantity: "—",
    price: "—",
    value: "₦12.4B",
    weight: "1.5%",
    ytd: "+7.2%",
    pos: true,
  },
];

export function PortfolioHoldings() {
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("All");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function handleSort(col: string) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  const filtered = HOLDINGS.filter((h) => {
    const matchType = activeType === "All" || h.type === activeType;
    const matchSearch =
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.issuer.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  function SortIcon({ col }: { col: string }) {
    if (sortCol !== col) return <ChevronUp className="h-3 w-3 text-gray-300" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 text-primary" />
    ) : (
      <ChevronDown className="h-3 w-3 text-primary" />
    );
  }

  const TH = ({ col, label }: { col: string; label: string }) => (
    <th
      className="cursor-pointer pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-primary"
      onClick={() => handleSort(col)}
    >
      <span className="flex items-center gap-1">
        {label} <SortIcon col={col} />
      </span>
    </th>
  );

  return (
    <div className="p-6 xl:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">Holdings</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filtered.length} instruments · Portfolio value ₦847.3B
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-gray-600 shadow-sm hover:border-primary hover:text-primary">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search holdings…"
            className="rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {ASSET_TYPES.map((t) => (
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
        <button className="ml-auto flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-gray-500 hover:border-primary hover:text-primary">
          <Filter className="h-3.5 w-3.5" /> More filters
        </button>
      </div>

      {/* table */}
      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr className="px-5">
              <th className="pb-3 pl-5 pt-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 w-8">
                #
              </th>
              <TH col="name" label="Instrument" />
              <TH col="type" label="Type" />
              <TH col="issuer" label="Issuer" />
              <TH col="value" label="Market Value" />
              <TH col="weight" label="Weight" />
              <TH col="ytd" label="YTD Return" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((h) => (
              <tr
                key={h.id}
                className="border-b border-border/50 last:border-0 hover:bg-pale-red/30 transition-colors"
              >
                <td className="py-3.5 pl-5 text-xs text-gray-400">{h.id}</td>
                <td className="py-3.5 font-medium text-dark-gray">{h.name}</td>
                <td className="py-3.5">
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                    {h.type}
                  </span>
                </td>
                <td className="py-3.5 text-xs text-gray-500">{h.issuer}</td>
                <td className="py-3.5 font-medium">{h.value}</td>
                <td className="py-3.5 text-xs text-gray-500">{h.weight}</td>
                <td
                  className={`py-3.5 font-semibold text-xs ${h.pos ? "text-success" : "text-danger"}`}
                >
                  {h.ytd}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
