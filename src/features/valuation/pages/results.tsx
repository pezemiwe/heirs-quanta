import { Download } from "lucide-react";
import { useValuation } from "../store";
import { fmtNGN, fmtPct, ASSET_TYPE_LABEL, IFRS13_BADGE } from "../utils";

export function ValuationResults() {
  const v = useValuation();

  if (!v.hasData) {
    return (
      <div className="p-6 xl:p-8">
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm font-medium text-dark-gray">No results yet</p>
          <p className="mt-1 text-xs text-gray-400">
            Load data on Data Manager to compute results.
          </p>
        </div>
      </div>
    );
  }

  function downloadCSV() {
    const header = [
      "id",
      "name",
      "type",
      "sector",
      "holdingPct",
      "method",
      "ifrs13Level",
      "carryingValue",
      "fairValueLow",
      "fairValue",
      "fairValueHigh",
      "uplift",
      "upliftPct",
    ];
    const rows = v.assets.map((a) => {
      const val = v.result.valuations.find((x) => x.assetId === a.id)!;
      return [
        a.id,
        a.name,
        a.type,
        a.sector,
        a.holdingPct,
        val.method,
        val.ifrs13Level,
        a.carryingValue.toFixed(2),
        val.fairValueLow.toFixed(2),
        val.fairValue.toFixed(2),
        val.fairValueHigh.toFixed(2),
        val.uplift.toFixed(2),
        (val.upliftPct * 100).toFixed(2) + "%",
      ];
    });
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `aegis-valuation-${v.assumptions.valuationDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const r = v.result;

  return (
    <div className="p-6 xl:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">
            Valuation Results
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Final fair value per asset, method applied, and IFRS 13
            classification.
          </p>
        </div>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-gray-500 hover:border-primary hover:text-primary"
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-gray-50">
            <tr>
              {[
                "Asset",
                "Method",
                "Level",
                "Carrying",
                "Low",
                "Fair Value",
                "High",
                "Uplift",
                "Notes",
              ].map((h) => (
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
            {v.assets.map((a) => {
              const val = r.valuations.find((x) => x.assetId === a.id);
              if (!val) return null;
              const isPos = val.uplift >= 0;
              return (
                <tr
                  key={a.id}
                  className="border-b border-border/50 last:border-0 hover:bg-pale-red/20"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-dark-gray">{a.name}</p>
                    <p className="text-xs text-gray-400">
                      {ASSET_TYPE_LABEL[a.type]}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-xs">{val.method}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${IFRS13_BADGE[val.ifrs13Level]}`}
                    >
                      {val.ifrs13Level}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs">
                    {fmtNGN(a.carryingValue)}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">
                    {fmtNGN(val.fairValueLow)}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-primary">
                    {fmtNGN(val.fairValue)}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">
                    {fmtNGN(val.fairValueHigh)}
                  </td>
                  <td
                    className={`px-5 py-3.5 text-xs font-semibold ${isPos ? "text-success" : "text-danger"}`}
                  >
                    {isPos ? "+" : ""}
                    {fmtNGN(val.uplift)}
                    <span className="ml-1 text-gray-400">
                      ({fmtPct(val.upliftPct)})
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 max-w-100">
                    {val.notes}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-border bg-pale-red/30">
            <tr>
              <td
                className="px-5 py-4 text-sm font-bold text-dark-gray"
                colSpan={3}
              >
                Group Total
              </td>
              <td className="px-5 py-4 text-xs font-semibold">
                {fmtNGN(r.totalCarryingValue)}
              </td>
              <td className="px-5 py-4 text-xs">
                {fmtNGN(r.totalFairValueLow)}
              </td>
              <td className="px-5 py-4 text-sm font-bold text-primary">
                {fmtNGN(r.totalFairValue)}
              </td>
              <td className="px-5 py-4 text-xs">
                {fmtNGN(r.totalFairValueHigh)}
              </td>
              <td
                className={`px-5 py-4 text-sm font-bold ${r.totalUplift >= 0 ? "text-success" : "text-danger"}`}
              >
                {r.totalUplift >= 0 ? "+" : ""}
                {fmtNGN(r.totalUplift)} ({fmtPct(r.totalUpliftPct)})
              </td>
              <td className="px-5 py-4" />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* IFRS 13 footnote */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-800">
        <p className="font-semibold">IFRS 13 Disclosure Summary</p>
        <p className="mt-1">
          Level 1: {fmtNGN(r.level1Total)} (
          {fmtPct(r.level1Total / (r.totalFairValue || 1))}) · Level 2:{" "}
          {fmtNGN(r.level2Total)} (
          {fmtPct(r.level2Total / (r.totalFairValue || 1))}) · Level 3:{" "}
          {fmtNGN(r.level3Total)} (
          {fmtPct(r.level3Total / (r.totalFairValue || 1))})
        </p>
      </div>
    </div>
  );
}
