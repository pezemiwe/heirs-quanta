import {
  StatCard,
  StatCardGrid,
} from "../../../../../components/shared/stat-card";
import { fmtCompact } from "../../../../portfolio/engine/book-compute";

interface StatsOverviewProps {
  ociTotal: number;
  ociRowsCount: number;
  fvtplTotal: number;
  fvtplRowsCount: number;
}

export function StatsOverview({
  ociTotal,
  ociRowsCount,
  fvtplTotal,
  fvtplRowsCount,
}: StatsOverviewProps) {
  return (
    <StatCardGrid>
      <StatCard
        title="Total OCI Reserve"
        value={fmtCompact(Math.abs(ociTotal))}
        subtitle={
          ociTotal >= 0 ? "Net OCI gain (FVOCI)" : "Net OCI loss (FVOCI)"
        }
        variant={ociTotal >= 0 ? "default" : "warning"}
      />
      <StatCard
        title="FVOCI Instruments"
        value={String(ociRowsCount)}
        subtitle="In OCI portfolio"
        variant="default"
      />
      <StatCard
        title="Total FVTPL Unrealised G/(L)"
        value={fmtCompact(Math.abs(fvtplTotal))}
        subtitle={
          fvtplTotal >= 0 ? "Net gain through P&L" : "Net loss through P&L"
        }
        variant={fvtplTotal >= 0 ? "default" : "warning"}
      />
      <StatCard
        title="FVTPL Instruments"
        value={String(fvtplRowsCount)}
        subtitle="In FVTPL portfolio"
        variant="default"
      />
    </StatCardGrid>
  );
}
