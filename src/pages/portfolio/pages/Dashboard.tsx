import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  BarChart2,
  Activity,
  Clock,
} from "lucide-react";

interface Props {
  persona: { name: string; role: string; avatar: string };
}

const KPI_CARDS = [
  {
    label: "Total Portfolio Value",
    value: "₦847.3B",
    change: "+2.4%",
    positive: true,
    sub: "vs. prior quarter",
    icon: <DollarSign className="h-5 w-5" />,
    accent: "#CC0000",
  },
  {
    label: "YTD Return",
    value: "11.8%",
    change: "+1.2pp",
    positive: true,
    sub: "above benchmark",
    icon: <TrendingUp className="h-5 w-5" />,
    accent: "#800000",
  },
  {
    label: "Portfolio Risk (VaR 95%)",
    value: "₦6.1B",
    change: "-0.3%",
    positive: true,
    sub: "1-day VaR",
    icon: <Activity className="h-5 w-5" />,
    accent: "#5C0000",
  },
  {
    label: "Asset Classes",
    value: "7",
    change: "Diversified",
    positive: true,
    sub: "Equities · Bonds · RE · Cash",
    icon: <BarChart2 className="h-5 w-5" />,
    accent: "#B30000",
  },
];

const ALLOCATION = [
  { label: "Fixed Income", pct: 38, color: "#CC0000" },
  { label: "Equities", pct: 27, color: "#800000" },
  { label: "Real Estate", pct: 14, color: "#5C0000" },
  { label: "Cash & Equivalents", pct: 11, color: "#B30000" },
  { label: "Private Equity", pct: 7, color: "#E05050" },
  { label: "Alternatives", pct: 3, color: "#F4B8B8" },
];

const TOP_HOLDINGS = [
  {
    name: "FGN Bond 2031",
    type: "Fixed Income",
    value: "₦78.4B",
    weight: "9.3%",
    ytd: "+6.2%",
    pos: true,
  },
  {
    name: "Dangote Cement Plc",
    type: "Equity",
    value: "₦61.2B",
    weight: "7.2%",
    ytd: "+18.4%",
    pos: true,
  },
  {
    name: "Transcorp Hotels REIT",
    type: "Real Estate",
    value: "₦42.7B",
    weight: "5.0%",
    ytd: "+9.1%",
    pos: true,
  },
  {
    name: "GTCO Holdings",
    type: "Equity",
    value: "₦38.9B",
    weight: "4.6%",
    ytd: "-2.3%",
    pos: false,
  },
  {
    name: "MTN Nigeria Comm.",
    type: "Equity",
    value: "₦35.5B",
    weight: "4.2%",
    ytd: "+11.7%",
    pos: true,
  },
];

const RECENT_ACTIVITY = [
  {
    action: "Buy",
    asset: "FGN Bond 2033",
    amount: "₦2.5B",
    time: "Today, 10:22 AM",
  },
  {
    action: "Sell",
    asset: "Access Holdings",
    amount: "₦800M",
    time: "Today, 09:15 AM",
  },
  {
    action: "Rebalance",
    asset: "Real Estate Portfolio",
    amount: "—",
    time: "Yesterday, 4:00 PM",
  },
  {
    action: "Dividend",
    asset: "Dangote Cement",
    amount: "₦420M",
    time: "May 23, 2026",
  },
];

export function PortfolioDashboard({ persona }: Props) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = persona.name.split(" ")[0];

  return (
    <div className="p-6 xl:p-8 space-y-6">
      {/* page header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">
            {greeting}, {firstName}.
          </p>
          <h1 className="mt-0.5 text-2xl font-bold text-dark-gray">
            Portfolio Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            As of{" "}
            <span className="font-medium text-dark-gray">
              25 May 2026, 12:00 PM WAT
            </span>
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-pale-red px-3 py-1 text-xs font-medium text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Live data
        </span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_CARDS.map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-border bg-surface p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {k.label}
              </p>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                style={{ background: k.accent }}
              >
                {k.icon}
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-dark-gray">{k.value}</p>
            <div className="mt-1 flex items-center gap-1.5">
              {k.positive ? (
                <TrendingUp className="h-3.5 w-3.5 text-success" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-danger" />
              )}
              <span
                className={`text-xs font-semibold ${k.positive ? "text-success" : "text-danger"}`}
              >
                {k.change}
              </span>
              <span className="text-xs text-gray-400">{k.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* middle row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* allocation chart */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">
            Asset Allocation
          </h2>
          {/* simple bar chart */}
          <div className="space-y-2.5">
            {ALLOCATION.map((a) => (
              <div key={a.label}>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{a.label}</span>
                  <span className="font-medium text-dark-gray">{a.pct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${a.pct}%`, background: a.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* top holdings */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">
            Top Holdings
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-gray-400">
                <th className="pb-2 text-left font-medium">Asset</th>
                <th className="pb-2 text-left font-medium hidden sm:table-cell">
                  Type
                </th>
                <th className="pb-2 text-right font-medium">Value</th>
                <th className="pb-2 text-right font-medium hidden md:table-cell">
                  Weight
                </th>
                <th className="pb-2 text-right font-medium">YTD</th>
              </tr>
            </thead>
            <tbody>
              {TOP_HOLDINGS.map((h) => (
                <tr
                  key={h.name}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-2.5 font-medium text-dark-gray text-xs">
                    {h.name}
                  </td>
                  <td className="py-2.5 text-xs text-gray-400 hidden sm:table-cell">
                    {h.type}
                  </td>
                  <td className="py-2.5 text-right text-xs font-medium">
                    {h.value}
                  </td>
                  <td className="py-2.5 text-right text-xs text-gray-400 hidden md:table-cell">
                    {h.weight}
                  </td>
                  <td
                    className={`py-2.5 text-right text-xs font-semibold ${h.pos ? "text-success" : "text-danger"}`}
                  >
                    {h.ytd}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* recent activity */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">
          Recent Activity
        </h2>
        <div className="divide-y divide-border">
          {RECENT_ACTIVITY.map((a) => (
            <div
              key={a.time + a.asset}
              className="flex items-center gap-4 py-3"
            >
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  a.action === "Buy"
                    ? "bg-pale-red text-primary"
                    : a.action === "Sell"
                      ? "bg-red-50 text-danger"
                      : a.action === "Dividend"
                        ? "bg-teal-50 text-success"
                        : "bg-gray-100 text-gray-500"
                }`}
              >
                {a.action}
              </span>
              <p className="flex-1 text-sm text-dark-gray">{a.asset}</p>
              <p className="text-sm font-medium text-dark-gray">{a.amount}</p>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                {a.time}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
