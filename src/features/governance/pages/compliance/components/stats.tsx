import {
  StatCard,
  StatCardGrid,
} from "../../../../../components/shared/stat-card";
import { COMPLIANCE_ITEMS } from "../config";

interface StatsProps {
  score: number;
  compliantCount: number;
  exceptionCount: number;
  pendingCount: number;
}

export function Stats({
  score,
  compliantCount,
  exceptionCount,
  pendingCount,
}: StatsProps) {
  return (
    <StatCardGrid>
      <StatCard
        title="Compliance Score"
        value={`${score}%`}
        subtitle={`${compliantCount} of ${COMPLIANCE_ITEMS.length} checks passing`}
        variant="highlight"
      />
      <StatCard
        title="Compliant"
        value={String(compliantCount)}
        subtitle="No action required"
        variant="default"
      />
      <StatCard
        title="Exceptions"
        value={String(exceptionCount)}
        subtitle="Monitored deviations"
        variant="default"
      />
      <StatCard
        title="Pending Actions"
        value={String(pendingCount)}
        subtitle="Upcoming deadlines"
        variant="default"
      />
    </StatCardGrid>
  );
}
