import { INTEGRATIONS } from "./config";
import type { FilterType, Integration } from "./types";

export function filterIntegrations(catFilter: FilterType): Integration[] {
  return catFilter === "all"
    ? INTEGRATIONS
    : INTEGRATIONS.filter((i) => i.category === catFilter);
}

export function countByStatus(status: Integration["status"]): number {
  return INTEGRATIONS.filter((i) => i.status === status).length;
}
