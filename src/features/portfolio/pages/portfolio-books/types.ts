import type { PortfolioType, PortfolioStatus } from "../../portfolio-registry";

export interface FormValues {
  name: string;
  type: PortfolioType;
  baseCurrency: string;
  description: string;
  manager: string;
  mandatedBy: string;
  strategy: string;
  status: PortfolioStatus;
}
