import { useValuation } from "../store";
import { fmtNGN } from "../utils";

const MULTIPLE_KEYS = [
  {
    key: "peMultiple" as const,
    label: "P/E",
    driverLabel: "Net Income",
    driverField: "netIncome" as const,
    valueField: "fromPE" as const,
  },
  {
    key: "evEbitdaMultiple" as const,
    label: "EV/EBITDA",
    driverLabel: "EBITDA",
    driverField: "ebitda" as const,
    valueField: "fromEvEbitda" as const,
  },
  {
    key: "pbMultiple" as const,
    label: "P/B",
    driverLabel: "Book Value",
    driverField: "bookValue" as const,
    valueField: "fromPB" as const,
  },
  {
    key: "psMultiple" as const,
    label: "P/S",
    driverLabel: "Revenue",
    driverField: "revenue" as const,
    valueField: "fromPS" as const,
  },
];

export function ValuationComparables() {
  const v = useValuation();

  if (!v.hasData) {
    return (
      <div className="p-6 xl:p-8">
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm font-medium text-dark-gray">No assets loaded</p>
        </div>
      </div>
    );
  }

  const eligible = v.assets.filter(
    (a) =>
      a.netIncome != null ||
      a.ebitda != null ||
      a.bookValue != null ||
      a.revenue != null,
  );

  return (
    <div className="p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">
          Comparable Multiples
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Apply trading multiples to financial drivers as a cross-check on
          income approach valuations.
        </p>
      </div>

      {/* multiples panel */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">
          Active Trading Multiples
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {MULTIPLE_KEYS.map((m) => (
            <div key={m.key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {m.label}
              </label>
              <input
                type="number"
                step={0.1}
                value={v.assumptions[m.key]}
                onChange={(e) =>
                  v.setAssumptions({
                    ...v.assumptions,
                    [m.key]: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          ))}
        </div>
      </div>

      {/* implied table */}
      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                Asset
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                Held %
              </th>
              {MULTIPLE_KEYS.map((m) => (
                <th
                  key={m.key}
                  className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  Implied via {m.label}
                </th>
              ))}
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-primary">
                Average
              </th>
            </tr>
          </thead>
          <tbody>
            {eligible.map((a) => {
              const cmp = v.result.valuations.find(
                (x) => x.assetId === a.id,
              )?.comparable;
              if (!cmp) return null;
              return (
                <tr
                  key={a.id}
                  className="border-b border-border/50 last:border-0 hover:bg-pale-red/20"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-dark-gray">{a.name}</p>
                    <p className="text-xs text-gray-400">{a.sector}</p>
                  </td>
                  <td className="px-5 py-3.5 text-right text-xs">
                    {a.holdingPct}%
                  </td>
                  {MULTIPLE_KEYS.map((m) => {
                    const val = cmp[m.valueField];
                    return (
                      <td
                        key={m.key}
                        className="px-5 py-3.5 text-right text-xs"
                      >
                        {val == null ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          <>
                            <p>{fmtNGN(val)}</p>
                            <p className="text-xs text-gray-400">
                              {m.driverLabel} {fmtNGN(a[m.driverField] ?? 0)}
                            </p>
                          </>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-5 py-3.5 text-right text-sm font-bold text-primary">
                    {fmtNGN(cmp.average)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* methodology */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-800">
        <p className="font-semibold">Method</p>
        <p className="mt-1">
          Each driver (Net Income, EBITDA, Book Value, Revenue) is multiplied by
          the active multiple to yield an indicative enterprise or equity value,
          then scaled by Heirs Holdings' ownership %. The simple average of
          available multiples is used as the comparables cross-check in the
          blended fair value.
        </p>
      </div>
    </div>
  );
}
