import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  BarChart2,
  Activity,
  Layers,
} from "lucide-react";
import { useMemo } from "react";
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useValuation } from "../../valuation/store";
import { useIFRS9 } from "../../ifrs9/store";
import { fmtCompact, fmtPct } from "../engine/book-compute";
import { EmptyState } from "../../../components/shared/empty-state";
import { useInstrumentBook } from "../../../context/instrument-book";
import { useNavigate } from "react-router-dom";

const CLASSIFICATION_COLORS: Record<string, string> = {
  AC: "#C8102E",
  FVOCI: "#1E3A5F",
  FVTPL: "#E8563A",
};

interface Props {
  persona: { name: string; role: string; avatar: string };
}

export function PortfolioDashboard({ persona }: Props) {
  const v = useValuation();
  const ifrs9 = useIFRS9();
  const book = useInstrumentBook();
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = persona.name.split(" ")[0];

  const computed = useMemo(() => {
    if (!v.hasData) return null;
    const { totals, byClassification, bySector, maturityProfile } = v.result;
    let ws = 0, wt = 0;
    for (const val of v.result.valuations) {
      if (val.marketYieldUsed > 0) {
        ws += val.marketYieldUsed * val.balanceSheetValueNGN;
        wt += val.balanceSheetValueNGN;
      }
    }
    const weightedYield = wt > 0 ? ws / wt : 0;
    const totalAnnualIncome = v.result.valuations.reduce((s, val) => s + val.annualEIRIncome, 0);
    const totalUnrealisedPL = totals.totalOCIReserveNGN + totals.totalFVTPLUnrealisedGLNGN;
    const top5 = [...v.result.valuations]
      .sort((a, b) => b.balanceSheetValueNGN - a.balanceSheetValueNGN)
      .slice(0, 5);
    return { totals, byClassification, bySector, maturityProfile, weightedYield, totalAnnualIncome, totalUnrealisedPL, top5 };
  }, [v.hasData, v.result]);

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-dark-gray/50">{greeting}, {firstName}.</p>
          <h1 className="mt-0.5 text-2xl font-bold text-dark-gray">Portfolio Dashboard</h1>
        </div>
      </div>

      {!v.hasData ? (
        <EmptyState
          preset="no-data"
          title="No portfolio data loaded"
          description="Import the Heirs Holdings workbook via Deal Capture → Trade Blotter to populate the portfolio dashboard."
          action={
            !book.hasData ? (
              <button
                onClick={() => navigate("/deal-capture")}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red"
              >
                <Layers className="h-4 w-4" /> Go to Deal Capture
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total Portfolio Value", value: fmtCompact(computed!.totals.totalBSValueNGN), change: `${computed!.totalUnrealisedPL >= 0 ? "+" : ""}${fmtCompact(computed!.totalUnrealisedPL)}`, positive: computed!.totalUnrealisedPL >= 0, sub: "unrealised P&L", icon: <DollarSign className="h-5 w-5" />, accent: "#C8102E" },
              { label: "Weighted Avg Yield", value: fmtPct(computed!.weightedYield), change: fmtCompact(ifrs9.result.totals.impairmentLcy), positive: true, sub: "ECL provision", icon: <Percent className="h-5 w-5" />, accent: "#1E3A5F" },
              { label: "Total Instruments", value: String(computed!.totals.instruments), change: `${computed!.byClassification.length} IFRS 9 classes`, positive: true, sub: "across the book", icon: <BarChart2 className="h-5 w-5" />, accent: "#5C0000" },
              { label: "Annual Income (EIR)", value: fmtCompact(computed!.totalAnnualIncome), change: fmtCompact(computed!.totalAnnualIncome / 12), positive: true, sub: "monthly run rate", icon: <Activity className="h-5 w-5" />, accent: "#B30000" },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-border bg-surface p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-dark-gray/50 uppercase tracking-wider">{k.label}</p>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: k.accent }}>{k.icon}</span>
                </div>
                <p className="mt-3 text-2xl font-bold text-dark-gray">{k.value}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  {k.positive ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> : <TrendingDown className="h-3.5 w-3.5 text-primary" />}
                  <span className={`text-xs font-semibold ${k.positive ? "text-emerald-600" : "text-primary"}`}>{k.change}</span>
                  <span className="text-xs text-dark-gray/40">{k.sub}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-dark-gray">Maturity Profile - Face Value by Bucket</h2>
              <ResponsiveContainer width="100%" height={180}>
                <ReBarChart data={computed!.maturityProfile} margin={{ left: 0, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `₦${(v / 1e9).toFixed(0)}B`} />
                  <Tooltip formatter={((v: number) => [fmtCompact(v), "Face Value"]) as never} contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="faceValueNGN" fill="#C8102E" radius={[4, 4, 0, 0]} onClick={(data: any) => navigate('/portfolio/holdings?maturityBucket=' + data.bucket)} cursor="pointer" />
                </ReBarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-dark-gray">IFRS 9 Classification</h2>
              <div className="space-y-4">
                {computed!.byClassification.map((b) => (
                  <div key={b.classification} onClick={() => navigate('/portfolio/holdings?classification=' + b.classification)} className="cursor-pointer rounded-lg p-2 hover:bg-black/5 transition-colors -mx-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-dark-gray flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full inline-block" style={{ background: CLASSIFICATION_COLORS[b.classification] }} />
                        {b.classification} <span className="text-dark-gray/40">({b.count})</span>
                      </span>
                      <span className="text-dark-gray/60 font-medium">{fmtPct(b.bsValueNGN / computed!.totals.totalBSValueNGN)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(b.bsValueNGN / computed!.totals.totalBSValueNGN) * 100}%`, background: CLASSIFICATION_COLORS[b.classification] }} />
                    </div>
                    <p className="mt-0.5 text-right text-xs text-dark-gray/50">{fmtCompact(b.bsValueNGN)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border">
                <h2 className="text-sm font-semibold text-dark-gray">Top 5 Holdings by Book Value</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-gray-50">
                    {["Instrument", "Class", "Book Value", "Weight"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-dark-gray/40">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {computed!.top5.map((val, i) => (
                    <tr 
                      key={val.instrument.id} 
                      className="border-b border-border/40 last:border-0 hover:bg-pale-red/20 cursor-pointer"
                      onClick={() => navigate(`/valuation/asset/${val.instrument.id}`)}
                    >
                      <td className="px-4 py-3 text-xs font-medium text-dark-gray">
                        <span className="mr-1.5 text-dark-gray/30 font-mono text-[11px]">{i + 1}.</span>{val.instrument.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: CLASSIFICATION_COLORS[val.instrument.classification] + "22", color: CLASSIFICATION_COLORS[val.instrument.classification] }}>
                          {val.instrument.classification}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-dark-gray">{fmtCompact(val.balanceSheetValueNGN)}</td>
                      <td className="px-4 py-3 text-xs text-dark-gray/60">{fmtPct(val.balanceSheetValueNGN / computed!.totals.totalBSValueNGN)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-dark-gray">Sector Concentration</h2>
              <div className="space-y-2.5">
                {computed!.bySector.slice(0, 8).map((s) => (
                  <div key={s.sector} className="flex items-center gap-3">
                    <span className="w-28 truncate text-xs text-dark-gray/70">{s.sector}</span>
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, s.pctOfPortfolio * 500)}%` }} />
                    </div>
                    <span className="w-12 text-right text-xs font-medium text-dark-gray/70">{fmtPct(s.pctOfPortfolio)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-wrap gap-6">
            <div>
              <p className="text-xs font-semibold text-amber-800">IFRS 9 ECL Summary</p>
              <p className="mt-0.5 text-xs text-amber-700">Total provision: <span className="font-bold">{fmtCompact(ifrs9.result.totals.impairmentLcy)}</span> Coverage: <span className="font-bold">{fmtPct(ifrs9.result.totals.impairmentLcy / computed!.totals.totalBSValueNGN)}</span></p>
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-800">Stage Distribution</p>
              <p className="mt-0.5 text-xs text-amber-700">
                {v.instruments.filter((i) => i.impairmentStage === "Stage 1").length} Stage 1{" "}
                {v.instruments.filter((i) => i.impairmentStage === "Stage 2").length} Stage 2{" "}
                {v.instruments.filter((i) => i.impairmentStage === "Stage 3").length} Stage 3
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-800">OCI &amp; FVTPL</p>
              <p className="mt-0.5 text-xs text-amber-700">OCI: <span className="font-bold">{fmtCompact(computed!.totals.totalOCIReserveNGN)}</span> FVTPL: <span className="font-bold">{fmtCompact(computed!.totals.totalFVTPLUnrealisedGLNGN)}</span></p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
