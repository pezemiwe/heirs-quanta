const ALLOCATION = [
  {
    label: "Fixed Income",
    pct: 38,
    value: "₦321.8B",
    color: "#CC0000",
    change: "+1.2pp",
  },
  {
    label: "Equities",
    pct: 27,
    value: "₦228.8B",
    color: "#800000",
    change: "-0.5pp",
  },
  {
    label: "Real Estate",
    pct: 14,
    value: "₦118.6B",
    color: "#5C0000",
    change: "+0.3pp",
  },
  {
    label: "Cash & Equivalents",
    pct: 11,
    value: "₦93.2B",
    color: "#B30000",
    change: "-0.2pp",
  },
  {
    label: "Private Equity",
    pct: 7,
    value: "₦59.3B",
    color: "#E05050",
    change: "+0.8pp",
  },
  {
    label: "Alternatives",
    pct: 3,
    value: "₦25.4B",
    color: "#F4B8B8",
    change: "-0.0pp",
  },
];

const GEO = [
  { label: "Nigeria", pct: 72, color: "#CC0000" },
  { label: "Pan-Africa", pct: 18, color: "#800000" },
  { label: "International", pct: 10, color: "#5C0000" },
];

const CURRENCY = [
  { label: "NGN", pct: 74, color: "#CC0000" },
  { label: "USD", pct: 17, color: "#800000" },
  { label: "GBP", pct: 6, color: "#5C0000" },
  { label: "EUR", pct: 3, color: "#E05050" },
];

function BarChart({
  data,
}: {
  data: { label: string; pct: number; color: string }[];
}) {
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{d.label}</span>
            <span className="font-semibold text-dark-gray">{d.pct}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${d.pct}%`, background: d.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AssetAllocation() {
  return (
    <div className="p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">Asset Allocation</h1>
        <p className="mt-1 text-sm text-gray-500">
          Strategic and tactical allocation breakdown across all dimensions
        </p>
      </div>

      {/* asset class breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">
            By Asset Class
          </h2>
          <div className="space-y-3">
            {ALLOCATION.map((a) => (
              <div key={a.label} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{a.label}</span>
                    <span className="font-semibold text-dark-gray">
                      {a.pct}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${a.pct}%`, background: a.color }}
                    />
                  </div>
                </div>
                <div className="text-right min-w-fit">
                  <p className="text-xs font-medium text-dark-gray">
                    {a.value}
                  </p>
                  <p
                    className={`text-xs ${a.change.startsWith("+") ? "text-success" : "text-gray-400"}`}
                  >
                    {a.change} QoQ
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* summary cards */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-dark-gray">
              Geographic Exposure
            </h2>
            <BarChart data={GEO} />
          </div>
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-dark-gray">
              Currency Exposure
            </h2>
            <BarChart data={CURRENCY} />
          </div>
        </div>
      </div>

      {/* drift alert */}
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm font-semibold text-yellow-800">
          Allocation Drift Alert
        </p>
        <p className="mt-1 text-xs text-yellow-700">
          Private Equity is 0.8pp above its strategic target of 6.2%. Consider
          rebalancing within the next 30 days.
        </p>
      </div>
    </div>
  );
}
