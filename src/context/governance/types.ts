export type Permission =
  | "deal.view"
  | "deal.create"
  | "deal.approve"
  | "deal.reject"
  | "ecl.view"
  | "ecl.modify"
  | "ecl.approve"
  | "journal.view"
  | "journal.post"
  | "journal.approve"
  | "valuation.view"
  | "valuation.override"
  | "limits.view"
  | "limits.manage"
  | "audit.view"
  | "compliance.view"
  | "report.generate"
  | "portfolio.view"
  | "portfolio.manage"
  | "admin.access";

export type RoleKey =
  | "Chief Financial Officer"
  | "Chief Risk Officer"
  | "Portfolio Analyst"
  | "Risk Manager"
  | "Compliance Officer"
  | "Internal Auditor";

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  module: string;
  action: string;
  detail: string;
  status: "success" | "warning" | "blocked";
  ip: string;
}

export interface ApprovalItem {
  id: string;
  type:
    | "deal"
    | "ecl"
    | "journal"
    | "valuation"
    | "limit-exception"
    | "counterparty";
  title: string;
  description: string;
  amount: number;
  maker: string;
  makerRole: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  module: string;
  priority: "high" | "medium" | "low";
  requiredApprover: RoleKey;
}

export interface InvestmentLimit {
  id: string;
  name: string;
  regulation: string;
  limitPct: number;
  currentPct: number;
  currentNGN: number;
  status: "ok" | "warning" | "breach";
  direction: "max" | "min";
}

export interface GovernanceContextValue {
  auditLog: AuditEntry[];
  logAction: (entry: Omit<AuditEntry, "id" | "timestamp">) => void;
  approvals: ApprovalItem[];
  decideApproval: (id: string, decision: "approved" | "rejected") => void;
  hasPermission: (role: string, perm: Permission) => boolean;
  getTier: (role: string) => "maker" | "checker" | "viewer" | "admin";
  pendingCount: number;
}
