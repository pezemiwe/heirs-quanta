import { AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import type { ComplianceItem } from "./types";

export const COMPLIANCE_ITEMS: ComplianceItem[] = [
  {
    id: "c001",
    category: "Investment Limits",
    check: "NAICOM Asset Allocation Compliance",
    regulation: "NAICOM Guidelines 2022",
    status: "compliant",
    detail:
      "All asset class allocations within prescribed limits. FGN bonds 62.4% ≥ 25% min. Equities 18.7% < 20% max.",
    owner: "Ngozi Adeyemi",
  },
  {
    id: "c002",
    category: "Investment Limits",
    check: "Single Issuer Concentration",
    regulation: "NAICOM Prudential §7.2",
    status: "exception",
    detail:
      "FGN sovereign exposure at 62.4% — exceeds 10% single issuer cap. NAICOM exempts FGN bonds from concentration limit.",
    dueDate: "2026-06-30",
    owner: "Ngozi Adeyemi",
  },
  {
    id: "c003",
    category: "Reporting",
    check: "Monthly CBN Investment Return (Form A)",
    regulation: "CBN Investment Regulations 2019",
    status: "compliant",
    detail: "May 2026 return filed 29 May 2026. Ref: CBN-2026-05-29-001",
    owner: "Ngozi Adeyemi",
  },
  {
    id: "c004",
    category: "Reporting",
    check: "NAICOM Quarterly Investment Return",
    regulation: "NAICOM Returns Circular 2021",
    status: "pending",
    detail: "Q2 2026 return due 31 July 2026. Data preparation in progress.",
    dueDate: "2026-07-31",
    owner: "Amaka Osei",
  },
  {
    id: "c005",
    category: "Reporting",
    check: "IFRS 9 ECL Disclosure (IFRS 7)",
    regulation: "IFRS 7 / IFRS 9",
    status: "compliant",
    detail:
      "H1 2026 ECL disclosures prepared. Staging migration table and sensitivity analysis complete.",
    owner: "Chidi Okafor",
  },
  {
    id: "c006",
    category: "Risk Management",
    check: "Investment Policy Statement (IPS) Review",
    regulation: "NAICOM Guidelines §3",
    status: "compliant",
    detail: "IPS last reviewed March 2026. Annual review due February 2027.",
    owner: "Emeka Nwosu",
  },
  {
    id: "c007",
    category: "Risk Management",
    check: "Stress Test — Quarterly Interest Rate Shock",
    regulation: "CBN Risk Management Framework",
    status: "compliant",
    detail:
      "Q1 2026 stress test completed. 200bps shock produces MTM loss of ₦2.3B (within tolerance).",
    owner: "Emeka Nwosu",
  },
  {
    id: "c008",
    category: "Audit & Controls",
    check: "Segregation of Duties — Maker-Checker",
    regulation: "NAICOM Internal Controls §8",
    status: "compliant",
    detail:
      "All deal bookings and journal entries pass through maker-checker workflow. No conflicts identified.",
    owner: "Tunde Bello",
  },
  {
    id: "c009",
    category: "Audit & Controls",
    check: "Quarterly Internal Audit of Investment Book",
    regulation: "NAICOM Internal Audit Circular",
    status: "pending",
    detail:
      "Q2 2026 audit scheduled for 15 June 2026. Scope: deal capture, valuation, ECL staging.",
    dueDate: "2026-06-15",
    owner: "Tunde Bello",
  },
  {
    id: "c010",
    category: "Valuation",
    check: "Independent Price Verification (IPV)",
    regulation: "IFRS 13 / NAICOM Guidelines",
    status: "compliant",
    detail:
      "Monthly IPV completed for all Level 2 and Level 3 instruments. 2 Level 3 overrides approved with documentation.",
    owner: "Chidi Okafor",
  },
  {
    id: "c011",
    category: "Valuation",
    check: "IFRS 13 Fair Value Hierarchy Classification",
    regulation: "IFRS 13",
    status: "compliant",
    detail:
      "94.7% Level 1/2 assets. Level 3 at 5.3% — below 20% threshold requiring additional disclosure.",
    owner: "Chidi Okafor",
  },
  {
    id: "c012",
    category: "AML / KYC",
    check: "Counterparty KYC Refresh (Annual)",
    regulation: "CBN AML/CFT Regulations 2022",
    status: "exception",
    detail:
      "3 counterparties have KYC documents expiring within 30 days. Renewal requests sent.",
    dueDate: "2026-06-10",
    owner: "Ngozi Adeyemi",
  },
  {
    id: "c013",
    category: "AML / KYC",
    check: "Transaction Monitoring — Unusual Patterns",
    regulation: "NFIU/CBN Guidelines",
    status: "compliant",
    detail:
      "No suspicious transactions flagged in May 2026 monitoring run. 204 transactions reviewed.",
    owner: "Ngozi Adeyemi",
  },
  {
    id: "c014",
    category: "Governance",
    check: "Investment Committee Meeting (Monthly)",
    regulation: "NAICOM Governance Framework",
    status: "compliant",
    detail:
      "May 2026 IC meeting held 22 May 2026. Minutes and investment decisions documented.",
    owner: "Amaka Osei",
  },
  {
    id: "c015",
    category: "Governance",
    check: "Board Risk Committee Reporting",
    regulation: "NAICOM Corporate Governance 2018",
    status: "pending",
    detail:
      "Q2 2026 board pack preparation in progress. Due to board risk committee 5 June 2026.",
    dueDate: "2026-06-05",
    owner: "Amaka Osei",
  },
];

export const STATUS_META = {
  compliant: {
    icon: CheckCircle,
    label: "Compliant",
    cls: "text-emerald-600",
    bg: "bg-emerald-100 text-emerald-700",
  },
  exception: {
    icon: AlertTriangle,
    label: "Exception",
    cls: "text-amber-600",
    bg: "bg-amber-100 text-amber-700",
  },
  breach: {
    icon: XCircle,
    label: "Breach",
    cls: "text-red-600",
    bg: "bg-red-100 text-red-700",
  },
  pending: {
    icon: Clock,
    label: "Pending",
    cls: "text-blue-600",
    bg: "bg-blue-100 text-blue-700",
  },
};

export const CATEGORIES = [
  "All",
  "Investment Limits",
  "Reporting",
  "Risk Management",
  "Audit & Controls",
  "Valuation",
  "AML / KYC",
  "Governance",
];
