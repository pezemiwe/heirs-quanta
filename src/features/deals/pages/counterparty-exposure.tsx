/**
 * Heirs Quanta — Counterparty Exposure
 *
 * Limit utilisation by counterparty, issuer, rating, sector, and currency —
 * a pure read/aggregation view over the investment register (the workflow
 * store's single source of truth for live positions). Only register entries
 * with status "Active" are considered; each is joined back to its originating
 * deal slip to recover counterparty / sector / credit rating (the register
 * entry itself only carries issuer, face value, and currency directly).
 *
 * Two of the five breakdowns below reuse the exact NAICOM 10% / 8% single-
 * issuer concentration thresholds already enforced by
 * `runLimitCheck` in `workflow/engine/checks.ts`, so the two stay consistent.
 * The counterparty (20%/15%) and sector (25%/18%) thresholds are internal
 * risk heuristics only — there is no formal regulatory limit for either
 * elsewhere in this app, and they are labelled as such throughout.
 *
 * Percentages in the counterparty / issuer / rating / sector breakdowns are
 * computed against total active-position face value pooled across
 * currencies — the same simplification `runLimitCheck` already makes
 * (it sums face value without FX conversion). The currency breakdown shows
 * the actual FX split directly, and the headline "Total Exposure" stat is
 * NGN-only (with a note) precisely because that pooled number isn't a
 * currency-safe amount.
 */
import { useMemo } from "react";
import { Gauge } from "lucide-react";
import { useWorkflow } from "../../workflow/store";
import { LimitAlertsSummary } from "../../workflow/components/limit-alerts";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge, type BadgeVariant } from "../../../components/shared/badge";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { EmptyState } from "../../../components/shared/empty-state";
import { fmtCompact, fmtPct } from "../../portfolio/engine/book-compute";
import type { DealEconomics, RegisterEntry } from "../../workflow/types";

/* ─────────────────────────────────────────────────────────────
   Aggregation primitives
   ───────────────────────────────────────────────────────────── */

interface Position {
  entry: RegisterEntry;
  /** Joined economics from the originating deal slip — null if it couldn't be found (shouldn't happen). */
  economics: DealEconomics | null;
}

interface Bucket {
  label: string;
  faceValue: number;
  count: number;
  /** Share of total active-position face value (pooled across currencies). */
  pct: number;
}

function groupBy(positions: Position[], total: number, keyFn: (p: Position) => string | undefined): Bucket[] {
  const map = new Map<string, { faceValue: number; count: number }>();
  for (const p of positions) {
    const key = keyFn(p)?.trim() || "Unknown";
    const cur = map.get(key) ?? { faceValue: 0, count: 0 };
    cur.faceValue += p.entry.faceValue;
    cur.count += 1;
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .map(([label, v]) => ({ label, faceValue: v.faceValue, count: v.count, pct: total > 0 ? v.faceValue / total : 0 }))
    .sort((a, b) => b.faceValue - a.faceValue);
}

/* ─────────────────────────────────────────────────────────────
   Threshold flagging — shared red/amber/green styling used by
   the checks panel elsewhere in this module (danger/warning/success).
   ───────────────────────────────────────────────────────────── */

type FlagLevel = "breach" | "watch" | "fine";

const FLAG_COLOR: Record<FlagLevel, string> = {
  breach: "#DC2626", // red-600
  watch: "#F59E0B", // amber-500
  fine: "#10B981", // emerald-500
};

const FLAG_BADGE: Record<FlagLevel, { variant: BadgeVariant; label: string }> = {
  breach: { variant: "danger", label: "Breach" },
  watch: { variant: "warning", label: "Watch" },
  fine: { variant: "success", label: "Pass" },
};

interface ExposureRow extends Bucket {
  color: string;
  badge?: { variant: BadgeVariant; label: string };
}

function flagRows(buckets: Bucket[], breachAt: number, watchAt: number): ExposureRow[] {
  return buckets.map((b) => {
    const level: FlagLevel = b.pct > breachAt ? "breach" : b.pct > watchAt ? "watch" : "fine";
    return { ...b, color: FLAG_COLOR[level], badge: FLAG_BADGE[level] };
  });
}

/** Fixed-order categorical palette, reused verbatim from portfolio/pages/allocation.tsx for visual consistency. */
const CATEGORICAL_COLORS = ["#C8102E", "#1E3A5F", "#5C0000", "#E8563A", "#92400E", "#6B7280", "#10B981", "#F59E0B", "#8B5CF6"];

function categoricalRows(buckets: Bucket[]): ExposureRow[] {
  return buckets.map((b, i) => ({ ...b, color: CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length] }));
}

const SUB_INVESTMENT_GRADE_RATINGS = ["CCC+", "CCC", "CCC-", "CC", "C", "D", "SD"];

/* ─────────────────────────────────────────────────────────────
   Bar list — same visual language as portfolio/pages/allocation.tsx's
   BarChart helper (label row + horizontal fill bar), extended with an
   optional status badge for the threshold-based breakdowns.
   ───────────────────────────────────────────────────────────── */

function ExposureBarList({ rows, emptyMessage }: { rows: ExposureRow[]; emptyMessage: string }) {
  if (rows.length === 0) {
    return <p className="py-4 text-center text-xs text-dark-gray/50">{emptyMessage}</p>;
  }
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-xs font-medium text-dark-gray">
              {r.label}
              {r.badge && (
                <Badge variant={r.badge.variant} size="sm">
                  {r.badge.label}
                </Badge>
              )}
            </span>
            <span className="flex items-center gap-2 text-xs">
              <span className="text-dark-gray/40">
                {r.count} position{r.count === 1 ? "" : "s"}
              </span>
              <span className="text-dark-gray/40">{fmtCompact(r.faceValue)}</span>
              <span className="font-semibold text-dark-gray">{fmtPct(r.pct)}</span>
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, r.pct * 100)}%`, background: r.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────── */

export function CounterpartyExposure() {
  const { dealSlips, register } = useWorkflow();

  const positions = useMemo<Position[]>(
    () =>
      register
        .filter((r) => r.status === "Active")
        .map((entry) => ({
          entry,
          economics: dealSlips.find((s) => s.id === entry.dealSlipId)?.economics ?? null,
        })),
    [register, dealSlips],
  );

  const totalFaceValue = useMemo(() => positions.reduce((s, p) => s + p.entry.faceValue, 0), [positions]);

  const counterpartyBuckets = useMemo(
    () => groupBy(positions, totalFaceValue, (p) => p.economics?.counterparty),
    [positions, totalFaceValue],
  );
  const issuerBuckets = useMemo(
    () => groupBy(positions, totalFaceValue, (p) => p.entry.issuer),
    [positions, totalFaceValue],
  );
  const ratingBuckets = useMemo(
    () => groupBy(positions, totalFaceValue, (p) => p.economics?.creditRating?.trim() || "Unrated"),
    [positions, totalFaceValue],
  );
  const sectorBuckets = useMemo(
    () => groupBy(positions, totalFaceValue, (p) => p.economics?.sector),
    [positions, totalFaceValue],
  );
  const currencyBuckets = useMemo(
    () => groupBy(positions, totalFaceValue, (p) => p.entry.currency),
    [positions, totalFaceValue],
  );

  const counterpartyRows = useMemo(() => flagRows(counterpartyBuckets, 0.2, 0.15), [counterpartyBuckets]);
  const issuerRows = useMemo(() => flagRows(issuerBuckets, 0.1, 0.08), [issuerBuckets]);
  const sectorRows = useMemo(() => flagRows(sectorBuckets, 0.25, 0.18), [sectorBuckets]);
  const ratingRows = useMemo(() => categoricalRows(ratingBuckets), [ratingBuckets]);
  const currencyRows = useMemo(() => categoricalRows(currencyBuckets), [currencyBuckets]);

  const subInvestmentGrade = useMemo(() => {
    const matches = positions.filter((p) =>
      SUB_INVESTMENT_GRADE_RATINGS.includes(p.economics?.creditRating?.trim() || ""),
    );
    const faceValue = matches.reduce((s, p) => s + p.entry.faceValue, 0);
    return { faceValue, count: matches.length, pct: totalFaceValue > 0 ? faceValue / totalFaceValue : 0 };
  }, [positions, totalFaceValue]);

  const ngnBucket = currencyBuckets.find((b) => b.label === "NGN");
  const nonNgnFaceValue = totalFaceValue - (ngnBucket?.faceValue ?? 0);
  const nonNgnPct = totalFaceValue > 0 ? nonNgnFaceValue / totalFaceValue : 0;
  const totalExposureNGN = ngnBucket?.faceValue ?? 0;
  const nonNgnPositionCount = positions.length - (ngnBucket?.count ?? 0);

  const topCounterparty = counterpartyRows[0];
  const topIssuer = issuerRows[0];

  const flagToStatVariant: Record<FlagLevel, "danger" | "warning" | "default"> = {
    breach: "danger",
    watch: "warning",
    fine: "default",
  };
  const flagOf = (row: ExposureRow | undefined): FlagLevel =>
    row?.badge?.label === "Breach" ? "breach" : row?.badge?.label === "Watch" ? "watch" : "fine";

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <LimitAlertsSummary />

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-dark-gray">
          <Gauge className="h-6 w-6 text-primary" />
          Counterparty Exposure
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Limit utilisation by counterparty, issuer, rating, sector, and currency — sourced live from the {positions.length}{" "}
          active position{positions.length === 1 ? "" : "s"} in the investment register.
        </p>
      </div>

      {positions.length === 0 ? (
        <EmptyState
          preset="no-data"
          title="No active positions yet"
          description="This page fills in once a deal slip reaches Settled and lands in the investment register."
        />
      ) : (
        <>
          <StatCardGrid>
            <StatCard title="Total Active Positions" value={String(positions.length)} subtitle="Investment register" variant="highlight" />
            <StatCard
              title="Total Exposure (NGN)"
              value={fmtCompact(totalExposureNGN)}
              subtitle={
                nonNgnPositionCount > 0
                  ? `NGN-denominated only — ${nonNgnPositionCount} position${nonNgnPositionCount === 1 ? "" : "s"} in other currencies, see FX exposure below`
                  : "All active positions are NGN-denominated"
              }
              variant="default"
            />
            <StatCard
              title="Largest Counterparty"
              value={topCounterparty ? fmtPct(topCounterparty.pct) : "—"}
              subtitle={topCounterparty?.label ?? "No positions"}
              variant={flagToStatVariant[flagOf(topCounterparty)]}
            />
            <StatCard
              title="Largest Issuer"
              value={topIssuer ? fmtPct(topIssuer.pct) : "—"}
              subtitle={topIssuer?.label ?? "No positions"}
              variant={flagToStatVariant[flagOf(topIssuer)]}
            />
          </StatCardGrid>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SectionCard
              title="By Counterparty"
              description="Internal risk heuristic, not a regulatory limit — flags above 20% (breach-style) and 15% (watch-style) of active exposure."
            >
              <ExposureBarList rows={counterpartyRows} emptyMessage="No counterparty data" />
            </SectionCard>

            <SectionCard
              title="By Issuer"
              description="NAICOM single-issuer concentration guideline — the same 10% / 8% thresholds used by the deal slip limit check."
            >
              <ExposureBarList rows={issuerRows} emptyMessage="No issuer data" />
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SectionCard
              title="By Sector"
              description="Internal risk heuristic, not a regulatory limit — flags above 25% (breach-style) and 18% (watch-style) of active exposure."
            >
              <ExposureBarList rows={sectorRows} emptyMessage="No sector data" />
            </SectionCard>

            <SectionCard title="By Rating" description="Distribution of active exposure by credit rating — no hard limit, visibility only.">
              <div className="space-y-4">
                <ExposureBarList rows={ratingRows} emptyMessage="No rating data" />
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-amber-800">Sub-Investment Grade Exposure</p>
                    <p className="mt-0.5 text-xs text-amber-700">
                      <span className="font-bold">{fmtCompact(subInvestmentGrade.faceValue)}</span> (
                      {fmtPct(subInvestmentGrade.pct)}) across {subInvestmentGrade.count} position
                      {subInvestmentGrade.count === 1 ? "" : "s"} rated CCC+ or below. Unrated positions are shown separately
                      above and are not counted here.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard title="By Currency" description="Informational FX exposure breakdown — no threshold.">
            <div className="space-y-4">
              <ExposureBarList rows={currencyRows} emptyMessage="No currency data" />
              <div className="flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-sky-800">FX Exposure (Non-NGN)</p>
                  <p className="mt-0.5 text-xs text-sky-700">
                    <span className="font-bold">{fmtCompact(nonNgnFaceValue)}</span> ({fmtPct(nonNgnPct)}) of active exposure
                    is denominated outside NGN.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
