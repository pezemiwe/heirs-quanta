import { useMemo } from "react";
import {
  fmtCompact,
  fmtPct,
} from "../../../features/portfolio/engine/book-compute";
import { AlertTriangle, Layers } from "lucide-react";
import { useValuation } from "../../valuation/store";
import { EmptyState } from "../../../components/shared/empty-state";
import { useNavigate } from "react-router-dom";

const TYPE_COLORS = ["#C8102E","#1E3A5F","#5C0000","#E8563A","#92400E","#6B7280","#10B981","#F59E0B","#8B5CF6"];

function BarChart({ data }: { data: { label: string; pct: number; color: string; value?: number }[] }) {
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex justify-between text-xs text-dark-gray/60 mb-1">
            <span>{d.label}</span>
            <div className="flex items-center gap-2">
              {d.value !== undefined && <span className="text-dark-gray/40">{fmtCompact(d.value)}</span>}
              <span className="font-semibold text-dark-gray">{fmtPct(d.pct)}</span>
            </div>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${d.pct * 100}%`, background: d.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PortfolioAllocation() {
  const v = useValuation();
  const navigate = useNavigate();

  const computed = useMemo(() => {
    if (!v.hasData) return null;
    const { totals, byType, byClassification, bySector } = v.result;

    const ccy: Record<string, number> = {};
    for (const val of v.result.valuations) {
      ccy[val.instrument.currency] = (ccy[val.instrument.currency] ?? 0) + val.balanceSheetValueNGN;
    }
    const totalFV = v.result.totals.totalBSValueNGN;
    const CURRENCY = Object.entries(ccy)
      .sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([label, fv], idx) => ({ label, pct: fv / totalFV, color: ["#C8102E","#1E3A5F","#5C0000","#E8563A","#92400E","#6B7280"][idx] }));

    const largestType = byType.length > 0 ? byType.reduce((a, b) => (a.bsValueNGN > b.bsValueNGN ? a : b)) : null;
    const largestTypePct = largestType ? largestType.bsValueNGN / totals.totalBSValueNGN : 0;

    const typeData = byType.sort((a, b) => b.bsValueNGN - a.bsValueNGN).map((t, i) => ({ label: t.type, pct: t.bsValueNGN / totals.totalBSValueNGN, value: t.bsValueNGN, color: TYPE_COLORS[i % TYPE_COLORS.length] }));
    const classData = byClassification.map((c, i) => ({ label: c.classification, pct: c.bsValueNGN / totals.totalBSValueNGN, value: c.bsValueNGN, color: ["#C8102E","#1E3A5F","#E8563A"][i] ?? "#6B7280" }));
    const sectorTop8 = bySector.sort((a, b) => b.bsValueNGN - a.bsValueNGN).slice(0, 8).map((s, i) => ({ label: s.sector, pct: s.pctOfPortfolio, value: s.bsValueNGN, color: TYPE_COLORS[i % TYPE_COLORS.length] }));

    return { totals, byClassification, CURRENCY, largestType, largestTypePct, typeData, classData, sectorTop8 };
  }, [v.hasData, v.result, v.instruments]);

  if (!v.hasData) {
    return (
      <div className="p-3 sm:p-4 md:p-6 xl:p-8">
        <h1 className="text-2xl font-bold text-dark-gray mb-6">Asset Allocation</h1>
        <EmptyState preset="no-data" title="No allocation data" description="Import the portfolio workbook to view allocation breakdowns."
          action={<button onClick={() => navigate("/deal-capture")} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red"><Layers className="h-4 w-4" /> Go to Deal Capture</button>}
        />
      </div>
    );
  }

  const { totals, byClassification, CURRENCY, largestType, largestTypePct, typeData, classData, sectorTop8 } = computed!;

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">Asset Allocation</h1>
        <p className="mt-1 text-sm text-dark-gray/50">
          Strategic and tactical allocation breakdown across all dimensions{" "}
          <span className="font-medium text-dark-gray">{totals.instruments} instruments</span>{" "}
          Total book value <span className="font-medium text-dark-gray">{fmtCompact(totals.totalBSValueNGN)}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {byClassification.map((c) => (
          <div key={c.classification} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-xs text-dark-gray/50 font-medium">{c.classification} · {c.count} instruments</p>
            <p className="mt-1 text-xl font-bold text-dark-gray">{fmtCompact(c.bsValueNGN)}</p>
            <p className="mt-0.5 text-xs text-dark-gray/40">{fmtPct(c.bsValueNGN / totals.totalBSValueNGN)} of book</p>
          </div>
        ))}
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs text-dark-gray/50 font-medium">Total ECL Provision</p>
          <p className="mt-1 text-xl font-bold text-dark-gray">{fmtCompact(totals.totalECLNGN)}</p>
          <p className="mt-0.5 text-xs text-dark-gray/40">{fmtPct(totals.totalECLNGN / totals.totalBSValueNGN)} coverage</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">By Instrument Type</h2>
          <BarChart data={typeData} />
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-dark-gray">By IFRS 9 Classification</h2>
            <BarChart data={classData} />
          </div>
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-dark-gray">By Currency</h2>
            <BarChart data={CURRENCY} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">Sector Concentration (Top 8)</h2>
        <BarChart data={sectorTop8} />
      </div>

      {largestType && largestTypePct > 0.3 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Concentration Alert</p>
            <p className="mt-0.5 text-xs text-amber-700">
              <span className="font-medium">{largestType.type}</span> is the largest exposure at{" "}
              <span className="font-bold">{fmtPct(largestTypePct)}</span> ({fmtCompact(largestType.bsValueNGN)}) of total book value.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

