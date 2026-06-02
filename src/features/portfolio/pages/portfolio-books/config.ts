import type { PortfolioType, PortfolioStatus } from "../../portfolio-registry";
import type { FormValues } from "./types";

export const TYPE_COLORS: Record<PortfolioType, string> = {
  Trading: "bg-blue-100 text-blue-700",
  Banking: "bg-purple-100 text-purple-700",
  HTM: "bg-green-100 text-green-700",
  AFS: "bg-orange-100 text-orange-700",
  Custom: "bg-gray-100 text-gray-600",
};

export const STATUS_COLORS: Record<PortfolioStatus, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Inactive: "bg-yellow-100 text-yellow-700",
  Archived: "bg-gray-100 text-gray-500",
};

export const BLANK: FormValues = {
  name: "",
  type: "Custom",
  baseCurrency: "NGN",
  description: "",
  manager: "",
  mandatedBy: "",
  strategy: "",
  status: "Active",
};

export const CURRENCIES = ["NGN", "USD", "EUR", "GBP", "JPY", "ZAR"];
export const TYPES: PortfolioType[] = [
  "Trading",
  "Banking",
  "HTM",
  "AFS",
  "Custom",
];
export const STATUSES: PortfolioStatus[] = ["Active", "Inactive", "Archived"];
