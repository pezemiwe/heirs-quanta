import {
  StatCard,
  StatCardGrid,
} from "../../../../../components/shared/stat-card";
import { INTEGRATIONS } from "../config";

interface IntegrationsStatsProps {
  activeCount: number;
  configuredCount: number;
}

export function IntegrationsStats({
  activeCount,
  configuredCount,
}: IntegrationsStatsProps) {
  return (
    <StatCardGrid>
      <StatCard
        title="Total Integrations"
        value={String(INTEGRATIONS.length)}
        subtitle="Configured and available"
        variant="highlight"
      />
      <StatCard
        title="Active / Live"
        value={String(activeCount)}
        subtitle="Currently connected"
        variant="default"
      />
      <StatCard
        title="Configured"
        value={String(configuredCount)}
        subtitle="Batch / scheduled"
        variant="default"
      />
      <StatCard
        title="Available"
        value={String(
          INTEGRATIONS.filter((i) => i.status === "available").length,
        )}
        subtitle="Ready to configure"
        variant="default"
      />
    </StatCardGrid>
  );
}
