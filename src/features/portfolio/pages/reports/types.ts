export type ActivityRow = {
  activity: string;
  requests: number;
  requested: number;
  disbursed: number;
  completion: number;
};

export type ReportMode = "Monthly" | "Quarterly" | "Annual" | "Custom";

export type ReportStats = {
  transactions: number;
  totalRequested: number;
  totalDisbursed: number;
  pending: number;
};
