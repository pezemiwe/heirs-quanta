import {
  StatCard,
  StatCardGrid,
} from "../../../../../components/shared/stat-card";
import { fmtCompact } from "../../../../portfolio/engine/book-compute";

export function BlotterStats({
  totalInstruments,
  totalFaceValueNGN,
  totalBSValueNGN,
  filteredCount,
}: {
  totalInstruments: number;
  totalFaceValueNGN: number;
  totalBSValueNGN: number;
  filteredCount: number;
}) {
  return (
    <StatCardGrid>
      <StatCard
        title="Total Instruments"
        value={String(totalInstruments)}
        subtitle="Portfolio Management book"
        variant="highlight"
      />
      <StatCard
        title="Total Face Value"
        value={fmtCompact(totalFaceValueNGN)}
        subtitle="NGN equivalent"
        variant="default"
      />
      <StatCard
        title="Total Book Value"
        value={fmtCompact(totalBSValueNGN)}
        subtitle="Balance-sheet carrying amount"
        variant="default"
      />
      <StatCard
        title="Filtered Rows"
        value={String(filteredCount)}
        subtitle="After current filters"
        variant="default"
      />
    </StatCardGrid>
  );
}
