import type { Integration } from "../types";
import { IntegrationCard } from "./integration-card";

interface IntegrationsGridProps {
  displayed: Integration[];
  syncing: string | null;
  onSync: (id: string) => void;
}

export function IntegrationsGrid({
  displayed,
  syncing,
  onSync,
}: IntegrationsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {displayed.map((int) => (
        <IntegrationCard
          key={int.id}
          int={int}
          isSyncing={syncing === int.id}
          onSync={onSync}
        />
      ))}
    </div>
  );
}
