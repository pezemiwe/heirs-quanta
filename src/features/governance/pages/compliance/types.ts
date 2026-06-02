export interface ComplianceItem {
  id: string;
  category: string;
  check: string;
  regulation: string;
  status: "compliant" | "exception" | "breach" | "pending";
  detail: string;
  dueDate?: string;
  owner: string;
}
