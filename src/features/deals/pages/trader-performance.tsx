import { useMemo } from "react";
import { Users } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge } from "../../../components/shared/badge";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { useWorkflow } from "../../workflow/store";
import type { DealSlip, DealSlipStatus } from "../../workflow/types";
import { fmtCompact, fmtPct } from "../../portfolio/engine/book-compute";

/* ─────────────────────────────────────────────────────────────
   Statuses that only exist downstream of "Approved" in the
   transition graph (see workflow/engine/transitions.ts) - a slip's
   timeline containing a transition to any of these means it did,
   at some point, get approved.
   ───────────────────────────────────────────────────────────── */
const APPROVED_OR_BEYOND = new Set<DealSlipStatus>([
  "Approved",
  "Pending Settlement",
  "Settled",
  "Active",
  "Matured/Sold/Rolled Over",
]);

/* ─────────────────────────────────────────────────────────────
   Duration formatting - kept local to this page since nothing
   else in the app currently formats hour/day durations for display.
   ───────────────────────────────────────────────────────────── */
function fmtHoursDuration(hours: number | null): string {
  if (hours === null || !isFinite(hours) || hours < 0) return "-";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  let h = Math.floor(hours);
  let m = Math.round((hours - h) * 60);
  if (m === 60) {
    h += 1;
    m = 0;
  }
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function fmtDaysDuration(days: number | null): string {
  if (days === null || !isFinite(days) || days < 0) return "-";
  return `${days.toFixed(1)}d`;
}

/** Hours between the slip's "Submitted" transition and whichever of
 *  "Approved" / "Rejected" comes next in its timeline. Null if the slip was
 *  never submitted, or was submitted but hasn't been resolved yet. */
function reviewTurnaroundHours(slip: DealSlip): number | null {
  const timeline = slip.timeline;
  const submittedIdx = timeline.findIndex((t) => t.to === "Submitted");
  if (submittedIdx === -1) return null;
  for (let i = submittedIdx + 1; i < timeline.length; i++) {
    const tx = timeline[i];
    if (tx.to === "Approved" || tx.to === "Rejected") {
      const startMs = new Date(timeline[submittedIdx].at).getTime();
      const endMs = new Date(tx.at).getTime();
      return (endMs - startMs) / (1000 * 60 * 60);
    }
  }
  return null;
}

/** Days between deal slip creation (the "from: null" timeline entry) and the
 *  transition to "Active". Null if the slip never reached Active. */
function fullCycleDays(slip: DealSlip): number | null {
  const creationTx = slip.timeline.find((t) => t.from === null);
  const activeTx = slip.timeline.find((t) => t.to === "Active");
  if (!creationTx || !activeTx) return null;
  const startMs = new Date(creationTx.at).getTime();
  const endMs = new Date(activeTx.at).getTime();
  return (endMs - startMs) / (1000 * 60 * 60 * 24);
}

interface TraderPerformanceRow {
  name: string;
  role: string;
  slipCount: number;
  totalNotional: number;
  settledNotional: number;
  rejectedCount: number;
  avgReviewTurnaroundHours: number | null;
  avgFullCycleDays: number | null;
  approvalRate: number | null;
}

type Row = TraderPerformanceRow & Record<string, unknown>;

export function TraderPerformance() {
  const { dealSlips } = useWorkflow();

  const traderRows = useMemo<Row[]>(() => {
    const byTrader = new Map<string, { role: string; slips: DealSlip[] }>();
    for (const slip of dealSlips) {
      const key = slip.createdBy.name;
      const bucket = byTrader.get(key);
      if (bucket) bucket.slips.push(slip);
      else byTrader.set(key, { role: slip.createdBy.role, slips: [slip] });
    }

    const rows: Row[] = Array.from(byTrader.entries()).map(([name, { role, slips }]) => {
      const totalNotional = slips.reduce((s, sl) => s + sl.economics.faceValue, 0);
      const settledNotional = slips
        .filter((sl) => sl.status === "Settled" || sl.status === "Active")
        .reduce((s, sl) => s + sl.economics.faceValue, 0);
      const rejectedCount = slips.filter((sl) => sl.status === "Rejected").length;

      const turnarounds = slips
        .map(reviewTurnaroundHours)
        .filter((h): h is number => h !== null);
      const avgReviewTurnaroundHours =
        turnarounds.length > 0
          ? turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length
          : null;

      const cycles = slips.map(fullCycleDays).filter((d): d is number => d !== null);
      const avgFullCycleDays =
        cycles.length > 0 ? cycles.reduce((a, b) => a + b, 0) / cycles.length : null;

      const reachedReview = slips.filter((sl) =>
        sl.timeline.some((t) => t.to === "Under Review"),
      ).length;
      const reachedApprovedOrBeyond = slips.filter((sl) =>
        sl.timeline.some((t) => APPROVED_OR_BEYOND.has(t.to)),
      ).length;
      const approvalRate = reachedReview > 0 ? reachedApprovedOrBeyond / reachedReview : null;

      return {
        name,
        role,
        slipCount: slips.length,
        totalNotional,
        settledNotional,
        rejectedCount,
        avgReviewTurnaroundHours,
        avgFullCycleDays,
        approvalRate,
      };
    });

    return rows.sort((a, b) => b.totalNotional - a.totalNotional);
  }, [dealSlips]);

  const totalTraders = traderRows.length;
  const totalDealSlips = dealSlips.length;
  const totalNotionalBooked = traderRows.reduce((s, r) => s + r.totalNotional, 0);

  const bestTurnaround = traderRows
    .filter((r) => r.avgReviewTurnaroundHours !== null)
    .reduce<Row | null>((best, r) => {
      if (!best) return r;
      return (r.avgReviewTurnaroundHours as number) < (best.avgReviewTurnaroundHours as number)
        ? r
        : best;
    }, null);

  const chartData = traderRows.map((r) => ({ name: r.name, totalNotional: r.totalNotional }));

  const cols: DataTableColumn<Row>[] = [
    { key: "name", header: "Trader" },
    {
      key: "role",
      header: "Role",
      render: (r) => (
        <Badge variant="neutral" size="sm">
          {r.role}
        </Badge>
      ),
    },
    { key: "slipCount", header: "Deal Slips", align: "right" },
    {
      key: "totalNotional",
      header: "Total Notional",
      align: "right",
      render: (r) => fmtCompact(r.totalNotional),
    },
    {
      key: "settledNotional",
      header: "Settled Notional",
      align: "right",
      render: (r) => (
        <span className="font-medium text-dark-gray">{fmtCompact(r.settledNotional)}</span>
      ),
    },
    {
      key: "avgReviewTurnaroundHours",
      header: "Avg Review Turnaround",
      align: "right",
      render: (r) => fmtHoursDuration(r.avgReviewTurnaroundHours),
    },
    {
      key: "avgFullCycleDays",
      header: "Avg Full Cycle Time",
      align: "right",
      render: (r) => fmtDaysDuration(r.avgFullCycleDays),
    },
    {
      key: "approvalRate",
      header: "Approval Rate",
      align: "right",
      render: (r) =>
        r.approvalRate === null ? (
          <span className="text-dark-gray/40">-</span>
        ) : (
          fmtPct(r.approvalRate)
        ),
    },
    {
      key: "rejectedCount",
      header: "Rejected",
      align: "right",
      render: (r) => (
        <span className={r.rejectedCount > 0 ? "font-semibold text-red-600" : "text-dark-gray/50"}>
          {r.rejectedCount}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Trader Performance
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Per-trader booking volume, notional, and turnaround - derived from every deal slip's status
          timeline
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Total Traders"
          value={String(totalTraders)}
          subtitle="Distinct deal slip creators"
          variant="highlight"
        />
        <StatCard
          title="Total Deal Slips"
          value={String(totalDealSlips)}
          subtitle="Across all traders"
          variant="default"
        />
        <StatCard
          title="Total Notional Booked"
          value={fmtCompact(totalNotionalBooked)}
          subtitle="All statuses, all traders"
          variant="default"
        />
        <StatCard
          title="Best Avg Turnaround"
          value={bestTurnaround ? fmtHoursDuration(bestTurnaround.avgReviewTurnaroundHours) : "-"}
          subtitle={bestTurnaround ? bestTurnaround.name : "No resolved reviews yet"}
          variant="default"
        />
      </StatCardGrid>

      <SectionCard
        title="Total Notional by Trader"
        description="Sum of face value across every deal slip a trader has created, any status"
      >
        {chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-dark-gray/50">No deal slips booked yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ left: 0, right: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => fmtCompact(v)} />
              <Tooltip formatter={((v: number) => [fmtCompact(v), "Total Notional"]) as never} contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="totalNotional" fill="#C8102E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      <SectionCard
        title="Trader Performance Detail"
        description="Booking volume, notional, and workflow turnaround by trader"
      >
        <DataTable<Row>
          columns={cols}
          data={traderRows}
          keyExtractor={(r) => r.name}
          emptyMessage="No deal slips booked yet"
          pageSize={20}
        />
      </SectionCard>
    </div>
  );
}
