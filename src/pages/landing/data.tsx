import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  BarChart2,
  Calculator,
  Database,
  FileText,
  LineChart,
  PieChart,
  Shield,
  TrendingUp,
} from "lucide-react";

export const NAV_LINKS = ["Modules", "Capabilities", "Compliance"];

export interface ModuleEntry {
  id: string;
  number: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  capabilities: string[];
  accent: string;
  bg: string;
}

export const MODULES: ModuleEntry[] = [
  {
    id: "portfolio",
    number: "01",
    icon: <BarChart2 className="h-6 w-6" />,
    title: "Portfolio Management",
    subtitle: "Real-time investment portfolio analytics & monitoring",
    description:
      "Gain complete visibility into the Heirs Holdings investment portfolio. Monitor security performance, track allocations, analyse concentration risk, and generate executive-level portfolio reports all in real time.",
    capabilities: [
      "Securities ingestion & classification",
      "Concentration & sector analysis",
      "Allocation targets & limit monitoring",
      "Portfolio trend reporting",
      "Maturity & redemption tracking",
    ],
    accent: "#CC0000",
    bg: "#FFF5F5",
  },
  {
    id: "deal-capture",
    number: "02",
    icon: <ArrowLeftRight className="h-6 w-6" />,
    title: "Deal Capture & Trade Management",
    subtitle: "End-to-end trade lifecycle & settlement workflow",
    description:
      "Capture, validate, and manage the full lifecycle of investment trades from order entry and counterparty confirmation through settlement and post-trade reconciliation with real-time blotter and STP support.",
    capabilities: [
      "Order entry & pre-trade validation",
      "Counterparty & broker management",
      "Settlement & custodian reconciliation",
      "Real-time trade blotter",
      "Corporate actions processing",
    ],
    accent: "#B30000",
    bg: "#FDF0F0",
  },
  {
    id: "market-data",
    number: "03",
    icon: <Activity className="h-6 w-6" />,
    title: "Market Data & Trend Analytics",
    subtitle: "Live prices, yields, indices & macro signals",
    description:
      "Aggregate and normalise market data across asset classes government bonds, equities, FX, and money market rates and overlay macro-economic trend signals to inform investment decisions.",
    capabilities: [
      "Government bond yield curve construction",
      "Equity price & index feeds",
      "FX rates & money market benchmarks",
      "Macro-economic signal overlays",
      "Historical trend analytics",
    ],
    accent: "#1A6B8A",
    bg: "#EFF7FA",
  },
  {
    id: "valuation",
    number: "04",
    icon: <LineChart className="h-6 w-6" />,
    title: "Valuation Engine",
    subtitle: "Fair value & investment instrument valuation",
    description:
      "Compute fair values across Heirs Holdings' investment portfolio bonds, equities, mutual funds and money market instruments using industry-standard models. Supports IFRS 13 disclosures and mark-to-market reporting.",
    capabilities: [
      "Discounted cash flow (DCF) engine",
      "Yield curve & benchmark rate feeds",
      "IFRS 13 fair value hierarchy",
      "Investment securities valuation",
      "Mark-to-market & mark-to-model",
    ],
    accent: "#5C0000",
    bg: "#F0EDED",
  },
  {
    id: "ifrs9",
    number: "05",
    icon: <Calculator className="h-6 w-6" />,
    title: "IFRS 9 — Expected Credit Loss",
    subtitle: "Automated ECL computation aligned to CBN guidelines",
    description:
      "Automate the full IFRS 9 impairment workflow from SICR detection and stage allocation through PD/LGD/EAD estimation to ECL charge computation. Built to CBN reporting standards, with full audit trail.",
    capabilities: [
      "Automated SICR detection & staging",
      "PD · LGD · EAD parameterisation",
      "12-month & lifetime ECL calculation",
      "Macro-economic overlay inputs",
      "CBN regulatory reporting output",
    ],
    accent: "#800000",
    bg: "#F5F0F0",
  },
  {
    id: "performance",
    number: "06",
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Return & Performance Analytics",
    subtitle: "Attribution, benchmarking & return decomposition",
    description:
      "Measure and decompose investment returns at fund, asset class, and security level. Run attribution analysis against benchmarks and generate GIPS-aligned performance reports for the investment committee.",
    capabilities: [
      "Time-weighted & money-weighted returns",
      "Attribution analysis by asset class",
      "Benchmark comparison & tracking error",
      "GIPS-aligned performance reporting",
      "Historical performance trend charts",
    ],
    accent: "#1A7A4A",
    bg: "#EFF8F3",
  },
  {
    id: "duration-risk",
    number: "07",
    icon: <Shield className="h-6 w-6" />,
    title: "Duration & Risk Analytics",
    subtitle: "Interest rate sensitivity, VaR & stress testing",
    description:
      "Quantify and manage portfolio risk exposures — duration, convexity, value-at-risk, and credit spread sensitivity and run stress scenarios across interest rate and FX shock assumptions.",
    capabilities: [
      "Modified duration & convexity analytics",
      "DV01 & PV01 sensitivity measures",
      "Value-at-Risk (VaR) computation",
      "Stress testing & scenario analysis",
      "Credit spread & FX risk exposure",
    ],
    accent: "#3A3A6A",
    bg: "#F0F0F8",
  },
  {
    id: "accounting",
    number: "08",
    icon: <FileText className="h-6 w-6" />,
    title: "Accounting & GL Integration",
    subtitle: "Automated journal entries & general ledger sync",
    description:
      "Generate IFRS-compliant accounting entries for all investment transactions purchases, disposals, accruals, fair value adjustments, and impairment charges and sync directly to the general ledger.",
    capabilities: [
      "IFRS-compliant journal entry generation",
      "Fair value & amortised cost accounting",
      "Impairment charge posting",
      "Accrued income & amortisation schedules",
      "GL system integration & reconciliation",
    ],
    accent: "#7A5A1A",
    bg: "#FAF5EF",
  },
  {
    id: "reporting",
    number: "09",
    icon: <PieChart className="h-6 w-6" />,
    title: "Reporting & Dashboard",
    subtitle: "Board, ALCO & regulatory reporting suite",
    description:
      "Generate Investment Committee packs, ALCO reports, CBN/SEC regulatory submissions, and interactive management dashboards all from a single reporting hub with scheduled distribution.",
    capabilities: [
      "Investment Committee report packs",
      "ALCO & board-level dashboards",
      "CBN / SEC regulatory submissions",
      "Scheduled report distribution",
      "Cross-module consolidated analytics",
    ],
    accent: "#4A4A8A",
    bg: "#F0F0F8",
  },
];

export interface CapabilityEntry {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

export const CAPABILITIES: CapabilityEntry[] = [
  {
    icon: <Shield className="h-5 w-5" />,
    title: "CBN Compliance",
    desc: "Outputs aligned to CBN IFRS 9 supervisory guidelines and regulatory filing formats.",
  },
  {
    icon: <Activity className="h-5 w-5" />,
    title: "Real-Time Analytics",
    desc: "Live portfolio dashboards with instant refresh on data ingestion or model re-run.",
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "Audit Trail",
    desc: "Complete, immutable record of every calculation run, override, and data change.",
  },
  {
    icon: <Database className="h-5 w-5" />,
    title: "Data Integration",
    desc: "Direct connectors to core banking systems, data warehouses, and Excel upload workflows.",
  },
  {
    icon: <PieChart className="h-5 w-5" />,
    title: "Board Reporting",
    desc: "Auto-generated board-level and ALCO reports in regulatory-compliant templates.",
  },
  {
    icon: <AlertTriangle className="h-5 w-5" />,
    title: "Early Warning",
    desc: "SICR triggers and watch-list alerts before accounts formally migrate to Stage 2 or 3.",
  },
];

export const COMPLIANCE_ITEMS = [
  {
    label: "IFRS 9 Phase 1–3",
    desc: "Classification, impairment, and hedging fully supported.",
  },
  {
    label: "CBN Prudential Guidelines",
    desc: "Stage labels, provisioning rates, and write-off policies.",
  },
  {
    label: "IFRS 13 Fair Value",
    desc: "Level 1–3 hierarchy disclosures for valuation outputs.",
  },
  {
    label: "SEC Nigeria Reporting",
    desc: "Investment securities and fund valuation statements.",
  },
  {
    label: "Full Audit Trail",
    desc: "Every run, override, and data change is logged and traceable.",
  },
  {
    label: "Role-Based Access",
    desc: "Granular permission model aligned to segregation of duties.",
  },
];

export const ECOSYSTEM_ENTITIES = [
  "Heirs Insurance",
  "United Capital",
  "Heirs Life Assurance",
  "Heirs Oil & Gas",
  "Transcorp Hotels",
  "Heritage Bank",
  "Heirs Holdings",
];

export const FOOTER_LINK_GROUPS: [string, string[]][] = [
  [
    "Platform",
    [
      "Portfolio Module",
      "IFRS 9 & ECL Module",
      "Valuation Engine",
      "Reporting",
    ],
  ],
  ["Compliance", ["CBN Guidelines", "IFRS 9", "IFRS 13", "Audit Trail"]],
  [
    "Organisation",
    [
      "Heirs Holdings Group",
      "About Deloitte",
      "Contact Support",
      "Documentation",
    ],
  ],
];
