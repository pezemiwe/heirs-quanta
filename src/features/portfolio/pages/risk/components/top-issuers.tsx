import { fmtCompact, fmtPct, sortedIssuers, totalBSV } from "../config";

export function TopIssuers() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-dark-gray">
        Top Issuer Exposures
      </h2>
      <div className="space-y-2">
        {sortedIssuers.slice(0, 8).map(([issuer, bsv]) => {
          const pct = bsv / totalBSV;
          return (
            <div key={issuer} className="flex items-center gap-3">
              <span className="w-52 truncate text-xs text-gray-500">
                {issuer}
              </span>
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{
                    width: `${Math.min(((pct * 100) / 15) * 100, 100)}%`,
                  }}
                />
              </div>
              <span className="w-16 text-right text-xs font-semibold text-dark-gray">
                {fmtPct(pct)}
              </span>
              <span className="w-20 text-right text-xs text-gray-400">
                {fmtCompact(bsv)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
