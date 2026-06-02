export interface Integration {
  id: string;
  name: string;
  category:
    | "market-data"
    | "erp-gl"
    | "insurance"
    | "actuarial"
    | "settlement"
    | "regulatory"
    | "upload"
    | "api";
  vendor: string;
  description: string;
  status: "active" | "configured" | "scheduled" | "available" | "error";
  lastSync: string;
  syncFrequency: string;
  dataFlows: string[];
  endpoint?: string;
}

export type FilterType = "all" | Integration["category"];
