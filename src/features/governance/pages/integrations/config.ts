import type { Integration, FilterType } from "./types";

export const INTEGRATIONS: Integration[] = [
  {
    id: "int001",
    name: "Bloomberg Terminal",
    category: "market-data",
    vendor: "Bloomberg L.P.",
    description:
      "Real-time bond prices, yield curves, credit ratings and market analytics feeds via Bloomberg API.",
    status: "active",
    lastSync: "Today 09:32",
    syncFrequency: "Real-time",
    dataFlows: [
      "Bond/bill prices",
      "Yield curve data",
      "Credit ratings",
      "FX rates",
    ],
    endpoint: "https://api.bloomberg.com/eap/",
  },
  {
    id: "int002",
    name: "Reuters / Refinitiv Eikon",
    category: "market-data",
    vendor: "Refinitiv (LSEG)",
    description:
      "Market data for bond pricing, equity indices, and macro-economic indicators via Refinitiv Data API.",
    status: "active",
    lastSync: "Today 09:32",
    syncFrequency: "Real-time",
    dataFlows: [
      "NSE/NGX equity prices",
      "Government bond yields",
      "Commodity indices",
      "Macro overlays",
    ],
  },
  {
    id: "int003",
    name: "CBN FMDQ Oracle",
    category: "market-data",
    vendor: "FMDQ Group",
    description:
      "Nigerian fixed income market yields, benchmark rates and money market data direct from FMDQ.",
    status: "active",
    lastSync: "Today 08:00",
    syncFrequency: "Daily (08:00)",
    dataFlows: [
      "FGN bond benchmark yields",
      "T-Bill stop rates",
      "NIBOR overnight rate",
      "FMDQ Secondary market data",
    ],
  },
  {
    id: "int004",
    name: "SAP S/4HANA (ERP/GL)",
    category: "erp-gl",
    vendor: "SAP SE",
    description:
      "Automated journal entry posting, GL code mapping, and financial statement reconciliation via SAP BAPI.",
    status: "configured",
    lastSync: "Yesterday 18:00",
    syncFrequency: "Daily batch (18:00)",
    dataFlows: [
      "Investment journal entries",
      "Coupon accruals",
      "Fair value adjustments",
      "Impairment charges",
    ],
    endpoint: "https://sap.heirsholdings.com:8443/sap/",
  },
  {
    id: "int005",
    name: "Oracle Financials (Secondary GL)",
    category: "erp-gl",
    vendor: "Oracle Corp.",
    description:
      "Secondary GL integration for subsidiary entities using Oracle Fusion Financials.",
    status: "available",
    lastSync: "Not configured",
    syncFrequency: "On-demand",
    dataFlows: ["Inter-company eliminations", "Consolidated GL postings"],
  },
  {
    id: "int006",
    name: "Core Insurance System (Keyman)",
    category: "insurance",
    vendor: "Heirs Life Assurance",
    description:
      "Policy liability data, reserves, and actuarial assumptions feed from the core insurance policy admin system.",
    status: "configured",
    lastSync: "28 May 2026 23:00",
    syncFrequency: "Nightly batch",
    dataFlows: [
      "Policy liability totals by class",
      "Reserve estimates",
      "Premium income flows",
      "Claims outstanding",
    ],
    endpoint: "https://keyman.heirslife.com/api/v2/",
  },
  {
    id: "int007",
    name: "Actuarial Models (Prophet)",
    category: "actuarial",
    vendor: "FIS / Moody's Analytics",
    description:
      "ALM liability benchmarks, duration matching targets, and projected liability cash flows from Prophet actuarial engine.",
    status: "scheduled",
    lastSync: "23 May 2026 (weekly)",
    syncFrequency: "Weekly (Friday 22:00)",
    dataFlows: [
      "Liability duration profile",
      "Asset-liability matching targets",
      "Projected liability CFs",
      "Solvency II SCR estimates",
    ],
  },
  {
    id: "int008",
    name: "Custodian — FirstBank Trustees",
    category: "settlement",
    vendor: "First Bank of Nigeria",
    description:
      "Securities custody, settlement confirmation, corporate action notices, and portfolio position reconciliation.",
    status: "active",
    lastSync: "Today 10:15",
    syncFrequency: "Real-time / T+1",
    dataFlows: [
      "Settlement confirmations",
      "Corporate action notices",
      "Custody position statement",
      "Dividend receipts",
    ],
    endpoint: "wss://custody.firstbank.com.ng/ws/",
  },
  {
    id: "int009",
    name: "Banking Platform — Access Bank",
    category: "settlement",
    vendor: "Access Bank Plc",
    description:
      "Settlement instruction transmission and intraday liquidity management for NGN and USD transactions.",
    status: "active",
    lastSync: "Today 09:45",
    syncFrequency: "Real-time",
    dataFlows: [
      "Payment instructions",
      "Settlement confirmations",
      "Account balances",
      "SWIFT MT103/MT202",
    ],
  },
  {
    id: "int010",
    name: "Banking Platform — Zenith Bank",
    category: "settlement",
    vendor: "Zenith Bank Plc",
    description:
      "Secondary settlement bank for backup settlement and large-value fund transfers.",
    status: "active",
    lastSync: "Today 09:45",
    syncFrequency: "Real-time",
    dataFlows: [
      "Large-value payment instructions",
      "FX purchase/sale settlements",
      "Call money placements",
    ],
  },
  {
    id: "int011",
    name: "CBN / PENCOM Regulatory API",
    category: "regulatory",
    vendor: "CBN / PENCOM",
    description:
      "Automated submission of regulatory investment returns and compliance data to CBN and PENCOM portals.",
    status: "configured",
    lastSync: "29 May 2026 (monthly)",
    syncFrequency: "Monthly / Quarterly",
    dataFlows: [
      "CBN Form A investment return",
      "PENCOM quarterly investment schedule",
      "NAICOM regulatory submissions",
    ],
    endpoint: "https://api.cbn.gov.ng/regulatoryreturns/",
  },
  {
    id: "int012",
    name: "Microsoft Excel Upload",
    category: "upload",
    vendor: "Microsoft Corp.",
    description:
      "Bulk instrument data ingestion, manual override entry, and template-based historical data loading.",
    status: "active",
    lastSync: "28 May 2026 (last upload)",
    syncFrequency: "On-demand",
    dataFlows: [
      "Bulk instrument master data",
      "Historical market prices",
      "Manual PD/LGD parameters",
      "Counterparty static data",
    ],
  },
  {
    id: "int013",
    name: "SWIFT Network",
    category: "settlement",
    vendor: "SWIFT (SCRL)",
    description:
      "Cross-border settlement and correspondent banking instructions for foreign currency investments via SWIFT gpi.",
    status: "configured",
    lastSync: "On-demand (last: 15 May 2026)",
    syncFrequency: "On-demand",
    dataFlows: [
      "MT101 payment instructions",
      "MT548 settlement status",
      "MT950 statement messages",
    ],
  },
  {
    id: "int014",
    name: "REST API Gateway",
    category: "api",
    vendor: "Heirs Holdings IT",
    description:
      "Outbound REST API for third-party data consumers. Provides read access to portfolio analytics, ECL results, and valuations.",
    status: "active",
    lastSync: "Continuously available",
    syncFrequency: "On-demand",
    dataFlows: [
      "Portfolio analytics data",
      "ECL computation results",
      "Valuation outputs",
      "Market data feeds",
    ],
    endpoint: "https://api.heirsholdings.com/quanta/v1/",
  },
];

export const CATEGORY_LABELS: Record<Integration["category"], string> = {
  "market-data": "Market Data",
  "erp-gl": "ERP / GL",
  insurance: "Insurance Core",
  actuarial: "Actuarial",
  settlement: "Settlement & Banking",
  regulatory: "Regulatory",
  upload: "File Uploads",
  api: "API / Outbound",
};

export const STATUS_META = {
  active: {
    label: "Active",
    bg: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
  configured: {
    label: "Configured",
    bg: "bg-blue-100 text-blue-700",
    dot: "bg-blue-400",
  },
  scheduled: {
    label: "Scheduled",
    bg: "bg-amber-100 text-amber-700",
    dot: "bg-amber-400",
  },
  available: {
    label: "Available",
    bg: "bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
  },
  error: { label: "Error", bg: "bg-red-100 text-red-700", dot: "bg-red-500" },
};

export const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "market-data", label: "Market Data" },
  { key: "erp-gl", label: "ERP / GL" },
  { key: "insurance", label: "Insurance" },
  { key: "actuarial", label: "Actuarial" },
  { key: "settlement", label: "Settlement" },
  { key: "regulatory", label: "Regulatory" },
  { key: "upload", label: "Uploads" },
  { key: "api", label: "API" },
];
