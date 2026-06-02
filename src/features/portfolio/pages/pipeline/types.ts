export type Stage =
  | "Prospecting"
  | "Due Diligence"
  | "Term Sheet"
  | "IC Approval"
  | "Closed";

export type Priority = "high" | "medium" | "low";

export type InvestmentType = "Equity" | "Debt" | "Hybrid" | "Real Assets";

export type ViewMode = "kanban" | "list";

export interface Deal {
  id: string;
  name: string;
  sector: string;
  stage: Stage;
  irr: number;
  size: number;
  currency: "NGN" | "USD";
  lead: string;
  priority: Priority;
  investmentType: InvestmentType;
  targetClose: string;
  notes: string;
}
