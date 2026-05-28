import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePersona } from "../context/persona";
import {
  BarChart2,
  Calculator,
  LineChart,
  ChevronRight,
  LogOut,
  Shield,
  Activity,
  FileText,
  Database,
  TrendingUp,
  PieChart,
  Check,
  AlertTriangle,
  ShieldCheck,
  ArrowLeftRight,
  Lock,
} from "lucide-react";

/* ── Module definitions ─────────────────────────────────────── */
const MODULES = [
  {
    id: "portfolio",
    live: true,
    icon: BarChart2,
    title: "Portfolio Management",
    subtitle: "Real-time investment portfolio analytics & monitoring",
    description:
      "Complete visibility into the Heirs Holdings investment portfolio. Monitor security performance, track allocations, analyse concentration risk, and generate board-level reports in real time.",
    features: [
      { icon: Database, label: "Securities ingestion & classification" },
      { icon: PieChart, label: "Concentration & sector analysis" },
      { icon: Activity, label: "Allocation targets & limit monitoring" },
      { icon: TrendingUp, label: "Portfolio trend reporting" },
      { icon: AlertTriangle, label: "Early warning & watch list" },
    ],
    accent: "#CC0000",
    lightBg: "#FFF5F5",
    tag: "Live",
  },
  {
    id: "deal-capture",
    live: false,
    icon: ArrowLeftRight,
    title: "Deal Capture & Trade Management",
    subtitle: "End-to-end trade lifecycle & settlement workflow",
    description:
      "Capture, validate, and manage the full lifecycle of investment trades — from order entry and counterparty confirmation through settlement and post-trade reconciliation — with real-time blotter and STP support.",
    features: [
      { icon: Database, label: "Order entry & pre-trade validation" },
      { icon: Activity, label: "Counterparty & broker management" },
      { icon: Check, label: "Settlement & custodian reconciliation" },
      { icon: FileText, label: "Real-time trade blotter" },
      { icon: TrendingUp, label: "Corporate actions processing" },
    ],
    accent: "#B30000",
    lightBg: "#FDF0F0",
    tag: "Coming Soon",
  },
  {
    id: "market-data",
    live: false,
    icon: Activity,
    title: "Market Data & Trend Analytics",
    subtitle: "Live prices, yields, indices & macro signals",
    description:
      "Aggregate and normalise market data across asset classes — government bonds, equities, FX, and money market rates — and overlay macro-economic trend signals to inform investment decisions.",
    features: [
      { icon: TrendingUp, label: "Government bond yield curve construction" },
      { icon: Activity, label: "Equity price & index feeds" },
      { icon: Database, label: "FX rates & money market benchmarks" },
      { icon: AlertTriangle, label: "Macro-economic signal overlays" },
      { icon: PieChart, label: "Historical trend analytics" },
    ],
    accent: "#1A6B8A",
    lightBg: "#EFF7FA",
    tag: "Coming Soon",
  },
  {
    id: "valuation",
    live: true,
    icon: LineChart,
    title: "Valuation Engine",
    subtitle: "Fair value & investment instrument valuation",
    description:
      "Compute fair values across the investment portfolio — bonds, equities, mutual funds and money market instruments — using industry-standard models with IFRS 13 hierarchy disclosures.",
    features: [
      { icon: Calculator, label: "Discounted cash flow (DCF)" },
      { icon: Activity, label: "Yield curve & benchmark feeds" },
      { icon: Shield, label: "IFRS 13 fair value hierarchy" },
      { icon: PieChart, label: "Investment securities pricing" },
      { icon: TrendingUp, label: "Mark-to-market reporting" },
    ],
    accent: "#5C0000",
    lightBg: "#F0EDED",
    tag: "Live",
  },
  {
    id: "ifrs9",
    live: true,
    icon: Calculator,
    title: "IFRS 9 — Expected Credit Loss",
    subtitle: "Automated ECL computation aligned to CBN guidelines",
    description:
      "Automate the full IFRS 9 impairment lifecycle — from SICR detection and stage allocation through PD/LGD/EAD parameterisation to ECL charge computation aligned with CBN prudential guidelines.",
    features: [
      { icon: AlertTriangle, label: "Automated SICR detection & staging" },
      { icon: Calculator, label: "PD · LGD · EAD parameters" },
      { icon: FileText, label: "12-month & lifetime ECL" },
      { icon: TrendingUp, label: "Macro-economic overlays" },
      { icon: Shield, label: "CBN regulatory reporting" },
    ],
    accent: "#800000",
    lightBg: "#F5F0F0",
    tag: "Live",
  },
  {
    id: "performance",
    live: false,
    icon: TrendingUp,
    title: "Return & Performance Analytics",
    subtitle: "Attribution, benchmarking & return decomposition",
    description:
      "Measure and decompose investment returns at fund, asset class, and security level. Run attribution analysis against benchmarks and generate GIPS-aligned performance reports for the investment committee.",
    features: [
      { icon: Activity, label: "Time-weighted & money-weighted returns" },
      { icon: PieChart, label: "Attribution analysis by asset class" },
      { icon: TrendingUp, label: "Benchmark comparison & tracking error" },
      { icon: FileText, label: "GIPS-aligned performance reporting" },
      { icon: Database, label: "Historical performance trend charts" },
    ],
    accent: "#1A7A4A",
    lightBg: "#EFF8F3",
    tag: "Coming Soon",
  },
  {
    id: "duration-risk",
    live: false,
    icon: ShieldCheck,
    title: "Duration & Risk Analytics",
    subtitle: "Interest rate sensitivity, VaR & stress testing",
    description:
      "Quantify and manage portfolio risk exposures — duration, convexity, value-at-risk, and credit spread sensitivity — and run stress scenarios across interest rate and FX shock assumptions.",
    features: [
      { icon: Calculator, label: "Modified duration & convexity" },
      { icon: Activity, label: "DV01 & PV01 sensitivity measures" },
      { icon: AlertTriangle, label: "Value-at-Risk (VaR) computation" },
      { icon: Shield, label: "Stress testing & scenario analysis" },
      { icon: TrendingUp, label: "Credit spread & FX risk exposure" },
    ],
    accent: "#3A3A6A",
    lightBg: "#F0F0F8",
    tag: "Coming Soon",
  },
  {
    id: "accounting",
    live: false,
    icon: FileText,
    title: "Accounting & GL Integration",
    subtitle: "Automated journal entries & general ledger sync",
    description:
      "Generate IFRS-compliant accounting entries for all investment transactions — purchases, disposals, accruals, fair value adjustments, and impairment charges — and sync directly to the general ledger.",
    features: [
      { icon: FileText, label: "IFRS-compliant journal entry generation" },
      { icon: Calculator, label: "Fair value & amortised cost accounting" },
      { icon: AlertTriangle, label: "Impairment charge posting" },
      { icon: Database, label: "Accrued income & amortisation schedules" },
      { icon: Check, label: "GL system integration & reconciliation" },
    ],
    accent: "#7A5A1A",
    lightBg: "#FAF5EF",
    tag: "Coming Soon",
  },
  {
    id: "reporting",
    live: false,
    icon: PieChart,
    title: "Reporting & Dashboard",
    subtitle: "Board, ALCO & regulatory reporting suite",
    description:
      "Generate Investment Committee packs, ALCO reports, CBN/SEC regulatory submissions, and interactive management dashboards — all from a single reporting hub with scheduled distribution.",
    features: [
      { icon: FileText, label: "Investment Committee report packs" },
      { icon: PieChart, label: "ALCO & board-level dashboards" },
      { icon: Database, label: "CBN / SEC regulatory submissions" },
      { icon: Activity, label: "Scheduled report distribution" },
      { icon: TrendingUp, label: "Cross-module consolidated analytics" },
    ],
    accent: "#4A4A8A",
    lightBg: "#F0F0F8",
    tag: "Coming Soon",
  },
];

/* ── Greeting ───────────────────────────────────────────────── */
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

/* ── Modules Page ───────────────────────────────────────────── */
export function ModulesPage() {
  const { persona, setPersona } = usePersona();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);

  const handleLogout = () => {
    setPersona({ name: "", role: "", avatar: "" });
    navigate("/");
  };

  return (
    <div
      className="flex min-h-screen flex-col font-sans antialiased"
      style={{ background: "#F7F7F8" }}
    >
      {/* ── Top nav ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/Heirs.png"
              alt="Heirs Holdings"
              className="h-8 w-8 object-contain"
              draggable={false}
            />
            <div>
              <p className="text-sm font-bold text-primary">Heirs Quanta</p>
              <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-dark-gray/40">
                Financial Analytics
              </p>
            </div>
          </div>

          {/* User + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-right">
                <p className="text-sm font-semibold text-dark-gray">
                  {persona.name}
                </p>
                <p className="text-xs text-dark-gray/45">{persona.role}</p>
              </div>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black text-white shadow-sm"
                style={{ background: "#CC0000" }}
              >
                {persona.avatar}
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-dark-gray/50 transition-all hover:bg-surface-muted hover:text-dark-gray"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero text ─────────────────────────────────────────── */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary/70">
            Module Selection
          </p>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-dark-gray lg:text-3xl">
            {greeting()},{" "}
            <span className="text-primary">{persona.name.split(" ")[0]}</span>.
          </h1>
          <p className="text-sm text-dark-gray/50">
            Select a module below to begin your session.
          </p>
        </div>
      </div>

      {/* ── Module cards ──────────────────────────────────────── */}
      <main className="flex-1 py-10 lg:py-14">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {MODULES.map((m) => {
              const Icon = m.icon;
              const isHovered = hovered === m.id;
              return (
                <div
                  key={m.id}
                  onMouseEnter={() => setHovered(m.id)}
                  onMouseLeave={() => setHovered(null)}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-all duration-300"
                  style={{
                    boxShadow: isHovered
                      ? `0 20px 48px rgba(0,0,0,0.10), 0 0 0 2px ${m.accent}22`
                      : "0 1px 4px rgba(0,0,0,0.05)",
                    transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                  }}
                >
                  {/* Card header */}
                  <div
                    className="relative overflow-hidden px-8 pt-8 pb-6"
                    style={{ background: m.lightBg }}
                  >
                    {/* Background pattern */}
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        backgroundImage: `radial-gradient(circle at 80% 20%, ${m.accent}18 0%, transparent 60%)`,
                      }}
                    />
                    <div className="relative">
                      {/* Tag */}
                      <span
                        className="mb-4 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                        style={{ background: m.accent }}
                      >
                        {m.tag}
                      </span>

                      {/* Icon */}
                      <div
                        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md"
                        style={{ background: m.accent }}
                      >
                        <Icon className="h-7 w-7" />
                      </div>

                      <h2 className="mb-1 text-xl font-bold text-dark-gray">
                        {m.title}
                      </h2>
                      <p
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: m.accent }}
                      >
                        {m.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="flex flex-1 flex-col px-8 py-6">
                    <p className="mb-6 text-sm leading-relaxed text-dark-gray/60">
                      {m.description}
                    </p>

                    {/* Features */}
                    <ul className="mb-8 flex-1 space-y-2.5">
                      {m.features.map(({ icon: FIcon, label }) => (
                        <li key={label} className="flex items-center gap-3">
                          <span
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                            style={{ background: m.lightBg }}
                          >
                            <Check
                              className="h-3 w-3"
                              style={{ color: m.accent }}
                            />
                          </span>
                          <span className="text-sm text-dark-gray/65">
                            {label}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    {m.live ? (
                      <button
                        onClick={() => navigate(`/${m.id}`)}
                        className="group/btn flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all duration-200"
                        style={{
                          background: isHovered
                            ? `linear-gradient(135deg, ${m.accent} 0%, #1a1a1a 100%)`
                            : m.accent,
                          boxShadow: isHovered
                            ? `0 6px 20px ${m.accent}44`
                            : "none",
                        }}
                      >
                        Open Module
                        <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white/70 transition-all duration-200 cursor-not-allowed"
                        style={{ background: `${m.accent}55` }}
                      >
                        <Lock className="h-4 w-4" />
                        Coming Soon
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-white py-5">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-dark-gray/30">
              © {new Date().getFullYear()} Heirs Holdings Group. For authorised
              internal use only.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-dark-gray/30">
              <Shield className="h-3 w-3" />
              <span>CBN Compliant · IFRS 9 Ready · Audit-Trail Enabled</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
