import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Layers,
  Building2,
  Database,
} from "lucide-react";
import { useValuation } from "../store";
import {
  fmtNGN,
  fmtPct,
  ASSET_TYPE_LABEL,
  ASSET_TYPE_COLOR,
  IFRS13_BADGE,
} from "../utils";

export function ValuationOverview() {
  const v = useValuation();

  if (!v.hasData) {
    return (
      <div className="p-6 xl:p-8">
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
          <Database className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-dark-gray">
            No valuation data loaded
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Head to{" "}
            <span className="font-medium text-primary">Data Manager</span> to
            upload or load the sample portfolio.
          </p>
        </div>
      </div>
    );
  }

  const r = v.result;
  const upliftPositive = r.totalUplift >= 0;

  const KPIS = [
    {
      label: "Total Carrying Value",
      value: fmtNGN(r.totalCarryingValue),
      icon: <Wallet className="h-4 w-4" />,
      accent: "#5C0000",
    },
    {
      label: "Total Fair Value",
      value: fmtNGN(r.totalFairValue),
      icon: <TrendingUp className="h-4 w-4" />,
      accent: "#CC0000",
    },
    {
      label: "Unrealised Uplift",
      value: fmtNGN(r.totalUplift),
      sub: fmtPct(r.totalUpliftPct),
      icon: upliftPositive ? (
        <TrendingUp className="h-4 w-4" />
      ) : (
        <TrendingDown className="h-4 w-4" />
      ),
      accent: upliftPositive ? "#0f766e" : "#b91c1c",
    },
    {
      label: "Assets Valued",
      value: v.assets.length.toString(),
      sub: `${r.byType.length} asset classes`,
      icon: <Building2 className="h-4 w-4" />,
      accent: "#800000",
    },
  ];

  const total = r.totalFairValue || 1;

  return (
    <div className="p-6 xl:p-8 space-y-6">
      {/* header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">
            Valuation Overview
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Group-wide fair value at{" "}
            <span className="font-medium text-dark-gray">
              {v.assumptions.valuationDate}
            </span>
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-pale-red px-3 py-1 text-xs font-medium text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          {v.assets.length} assets · live recalc
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-border bg-surface p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
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
            {k.sub && <p className="mt-1 text-xs text-gray-400">{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* fair value range bar */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-dark-gray">
            Fair Value Range (Low / Base / High)
          </h2>
          <span className="text-xs text-gray-400">
            Spread: {fmtNGN(r.totalFairValueHigh - r.totalFairValueLow)}
          </span>
        </div>
        <div className="relative h-8 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-linear-to-r from-pale-red via-primary to-deep-red"
            style={{ width: "100%" }}
          />
          <div className="absolute inset-y-0 flex items-center justify-center w-full text-xs font-semibold text-white">
            Base: {fmtNGN(r.totalFairValue)}
          </div>
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>Low: {fmtNGN(r.totalFairValueLow)}</span>
          <span>High: {fmtNGN(r.totalFairValueHigh)}</span>
        </div>
      </div>

      {/* split: by-type + IFRS 13 levels */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* by-type composition */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">
            Composition by Asset Type
          </h2>
          <div className="space-y-3">
            {r.byType
              .slice()
              .sort((a, b) => b.fair - a.fair)
              .map((t) => {
                const pct = (t.fair / total) * 100;
                return (
                  <div key={t.type}>
                    <div className="mb-1 flex justify-between text-xs text-gray-500">
                      <span>
                        {ASSET_TYPE_LABEL[t.type]}{" "}
                        <span className="text-gray-300">({t.count})</span>
                      </span>
                      <span className="font-medium text-dark-gray">
                        {fmtNGN(t.fair)} · {pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: ASSET_TYPE_COLOR[t.type],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* IFRS 13 levels */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-dark-gray">
              IFRS 13 Hierarchy
            </h2>
          </div>
          {(["Level 1", "Level 2", "Level 3"] as const).map((lvl) => {
            const val =
              lvl === "Level 1"
                ? r.level1Total
                : lvl === "Level 2"
                  ? r.level2Total
                  : r.level3Total;
            const pct = total ? (val / total) * 100 : 0;
            return (
              <div key={lvl} className="mb-3 last:mb-0">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${IFRS13_BADGE[lvl]}`}
                  >
                    {lvl}
                  </span>
                  <span className="font-medium text-dark-gray">
                    {fmtNGN(val)}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-0.5 text-xs text-gray-400">
                  {pct.toFixed(1)}% of total fair value
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* sector heatmap */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">By Sector</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {r.bySector
            .slice()
            .sort((a, b) => b.fair - a.fair)
            .map((s) => {
              const uplift = s.fair - s.carrying;
              const upliftPct = s.carrying > 0 ? uplift / s.carrying : 0;
              return (
                <div
                  key={s.sector}
                  className="rounded-lg border border-border bg-surface-muted p-3"
                >
                  <p className="text-xs font-medium text-dark-gray">
                    {s.sector}
                  </p>
                  <p className="mt-1 text-sm font-bold text-primary">
                    {fmtNGN(s.fair)}
                  </p>
                  <p
                    className={`text-xs ${uplift >= 0 ? "text-success" : "text-danger"}`}
                  >
                    {uplift >= 0 ? "+" : ""}
                    {fmtPct(upliftPct)} vs carrying
                  </p>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
