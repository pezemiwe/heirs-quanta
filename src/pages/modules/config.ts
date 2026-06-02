import {
  BarChart2,
  Calculator,
  LineChart,
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
  Eye,
  Shield,
} from "lucide-react";
import type { ModuleDefinition } from "./types";

export const MODULES: ModuleDefinition[] = [
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
  },
  {
    id: "deal-capture",
    live: true,
    icon: ArrowLeftRight,
    title: "Deal Capture & Trade Management",
    subtitle: "End-to-end trade lifecycle & settlement workflow",
    description:
      "Capture, validate, and manage the full lifecycle of investment trades from order entry and counterparty confirmation through settlement and post-trade reconciliation with real-time blotter and STP support.",
    features: [
      { icon: Database, label: "Order entry & pre-trade validation" },
      { icon: Activity, label: "Counterparty & broker management" },
      { icon: Check, label: "Settlement & custodian reconciliation" },
      { icon: FileText, label: "Real-time trade blotter" },
      { icon: TrendingUp, label: "Corporate actions processing" },
    ],
    accent: "#B30000",
    lightBg: "#FDF0F0",
  },
  {
    id: "market-data",
    live: true,
    icon: Activity,
    title: "Market Data & Trend Analytics",
    subtitle: "Live prices, yields, indices & macro signals",
    description:
      "Aggregate and normalise market data across asset classes government bonds, equities, FX, and money market rates and overlay macro-economic trend signals to inform investment decisions.",
    features: [
      { icon: TrendingUp, label: "Government bond yield curve construction" },
      { icon: Activity, label: "Equity price & index feeds" },
      { icon: Database, label: "FX rates & money market benchmarks" },
      { icon: AlertTriangle, label: "Macro-economic signal overlays" },
      { icon: PieChart, label: "Historical trend analytics" },
    ],
    accent: "#1A6B8A",
    lightBg: "#EFF7FA",
  },
  {
    id: "valuation",
    live: true,
    icon: LineChart,
    title: "Valuation Engine",
    subtitle: "Fair value & investment instrument valuation",
    description:
      "Compute fair values across the investment portfolio bonds, equities, mutual funds and money market instruments using industry-standard models with IFRS 13 hierarchy disclosures.",
    features: [
      { icon: Calculator, label: "Discounted cash flow (DCF)" },
      { icon: Activity, label: "Yield curve & benchmark feeds" },
      { icon: Shield, label: "IFRS 13 fair value hierarchy" },
      { icon: PieChart, label: "Investment securities pricing" },
      { icon: TrendingUp, label: "Mark-to-market reporting" },
    ],
    accent: "#5C0000",
    lightBg: "#F0EDED",
  },
  {
    id: "ifrs9",
    live: true,
    icon: Calculator,
    title: "IFRS 9 — Expected Credit Loss",
    subtitle: "Automated ECL computation aligned to CBN guidelines",
    description:
      "Automate the full IFRS 9 impairment lifecycle from SICR detection and stage allocation through PD/LGD/EAD parameterisation to ECL charge computation aligned with CBN prudential guidelines.",
    features: [
      { icon: AlertTriangle, label: "Automated SICR detection & staging" },
      { icon: Calculator, label: "PD · LGD · EAD parameters" },
      { icon: FileText, label: "12-month & lifetime ECL" },
      { icon: TrendingUp, label: "Macro-economic overlays" },
      { icon: Shield, label: "CBN regulatory reporting" },
    ],
    accent: "#800000",
    lightBg: "#F5F0F0",
  },
  {
    id: "performance",
    live: true,
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
  },
  {
    id: "duration-risk",
    live: true,
    icon: ShieldCheck,
    title: "Duration & Risk Analytics",
    subtitle: "Interest rate sensitivity, VaR & stress testing",
    description:
      "Quantify and manage portfolio risk exposures duration, convexity, value-at-risk, and credit spread sensitivity and run stress scenarios across interest rate and FX shock assumptions.",
    features: [
      { icon: Calculator, label: "Modified duration & convexity" },
      { icon: Activity, label: "DV01 & PV01 sensitivity measures" },
      { icon: AlertTriangle, label: "Value-at-Risk (VaR) computation" },
      { icon: Shield, label: "Stress testing & scenario analysis" },
      { icon: TrendingUp, label: "Credit spread & FX risk exposure" },
    ],
    accent: "#3A3A6A",
    lightBg: "#F0F0F8",
  },
  {
    id: "accounting",
    live: true,
    icon: FileText,
    title: "Accounting & GL Integration",
    subtitle: "Automated journal entries & general ledger sync",
    description:
      "Generate IFRS-compliant accounting entries for all investment transactions purchases, disposals, accruals, fair value adjustments, and impairment charges — and sync directly to the general ledger.",
    features: [
      { icon: FileText, label: "IFRS-compliant journal entry generation" },
      { icon: Calculator, label: "Fair value & amortised cost accounting" },
      { icon: AlertTriangle, label: "Impairment charge posting" },
      { icon: Database, label: "Accrued income & amortisation schedules" },
      { icon: Check, label: "GL system integration & reconciliation" },
    ],
    accent: "#7A5A1A",
    lightBg: "#FAF5EF",
  },
  {
    id: "reporting",
    live: true,
    icon: PieChart,
    title: "Reporting & Dashboard",
    subtitle: "Board, ALCO & regulatory reporting suite",
    description:
      "Generate Investment Committee packs, ALCO reports, CBN/SEC regulatory submissions, and interactive management dashboards all from a single reporting hub with scheduled distribution.",
    features: [
      { icon: FileText, label: "Investment Committee report packs" },
      { icon: PieChart, label: "ALCO & board-level dashboards" },
      { icon: Database, label: "CBN / SEC regulatory submissions" },
      { icon: Activity, label: "Scheduled report distribution" },
      { icon: TrendingUp, label: "Cross-module consolidated analytics" },
    ],
    accent: "#4A4A8A",
    lightBg: "#F0F0F8",
  },
  {
    id: "governance",
    live: true,
    icon: ShieldCheck,
    title: "Governance & Controls",
    subtitle: "RBAC, approvals, audit trail & compliance",
    description:
      "Centralised governance hub for role-based access control, maker-checker approval workflows, NAICOM investment limit monitoring, immutable audit trail, compliance monitoring, and external system integrations.",
    features: [
      { icon: Lock, label: "Role-based access & segregation of duties" },
      { icon: Check, label: "Maker-checker approval workflows" },
      { icon: Shield, label: "Immutable system audit trail" },
      { icon: AlertTriangle, label: "Investment limit controls (NAICOM/CBN)" },
      { icon: Eye, label: "External integrations hub" },
    ],
    accent: "#2D4A8A",
    lightBg: "#EFF2FA",
  },
];

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};
