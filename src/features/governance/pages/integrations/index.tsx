import { useState } from "react";
import { IntegrationsHeader } from "./components/integrations-header";
import { IntegrationsStats } from "./components/integrations-stats";
import { IntegrationsFilter } from "./components/integrations-filter";
import { IntegrationsGrid } from "./components/integrations-grid";
import { countByStatus, filterIntegrations } from "./utils";
import type { FilterType } from "./types";

export function ExternalIntegrations() {
  const [catFilter, setCatFilter] = useState<FilterType>("all");
  const [syncing, setSyncing] = useState<string | null>(null);

  const displayed = filterIntegrations(catFilter);
  const activeCount = countByStatus("active");
  const configuredCount = countByStatus("configured");

  const handleSync = (id: string) => {
    setSyncing(id);
    setTimeout(() => setSyncing(null), 2000);
  };

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <IntegrationsHeader />
      <IntegrationsStats
        activeCount={activeCount}
        configuredCount={configuredCount}
      />
      <IntegrationsFilter catFilter={catFilter} setCatFilter={setCatFilter} />
      <IntegrationsGrid
        displayed={displayed}
        syncing={syncing}
        onSync={handleSync}
      />
    </div>
  );
}
