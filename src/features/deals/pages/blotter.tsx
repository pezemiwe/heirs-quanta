import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  ArrowRight,
  ChevronRight,
  ShieldAlert,
  XCircle,
  RotateCcw,
  CheckCircle2,
  PlayCircle,
  ArrowUpDown,
  Bookmark,
  BookmarkPlus,
  Trash2,
  FileText,
} from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge, type BadgeVariant } from "../../../components/shared/badge";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { Modal } from "../../../components/shared/modal";
import { ConfirmDialog } from "../../../components/shared/confirm-dialog";
import { usePersona } from "../../../context/persona";
import { useGovernance } from "../../../context/governance";
import { useInstrumentBook } from "../../../context/instrument-book";
import { useWorkflow } from "../../workflow/store";
import { DealSlipWorkspace } from "../../workflow/components/deal-slip-workspace";
import { DealSlipDocumentView } from "../../workflow/components/deal-slip-document-view";
import { ChecksPanel } from "../../workflow/components/checks-panel";
import { SettlementPanel } from "../../workflow/components/settlement-panel";
import { StatusTimeline } from "../../workflow/components/status-timeline";
import { LimitAlerts, LimitAlertsSummary } from "../../workflow/components/limit-alerts";
import { isEditable } from "../../workflow/engine/transitions";
import type { DealSlip, DealSlipStatus, RegisterEntry } from "../../workflow/types";
import type { Currency, Instrument } from "../../valuation/engine/types";
import {
  useSavedBlotterViews,
  type BlotterSortField,
  type SortDirection,
} from "../hooks/use-saved-views";

const STATUS_BADGE: Record<DealSlipStatus, BadgeVariant> = {
  Draft: "neutral",
  Submitted: "info",
  "Under Review": "warning",
  "Returned for Amendment": "warning",
  Rejected: "danger",
  Approved: "success",
  "Pending Settlement": "brand",
  Settled: "success",
  Active: "active",
  "Matured/Sold/Rolled Over": "neutral",
};

const fmtCompact = (n: number): string => {
  if (!isFinite(n)) return "-";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}₦${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}₦${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}₦${(abs / 1e3).toFixed(2)}K`;
  return `${sign}₦${abs.toFixed(0)}`;
};

const fmtCompactCcy = (n: number, symbol: string): string => {
  if (!isFinite(n)) return "-";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}${symbol}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${symbol}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${symbol}${(abs / 1e3).toFixed(2)}K`;
  return `${sign}${symbol}${abs.toFixed(0)}`;
};

const fmtDate = (iso: string) => {
  if (!iso) return "-";
  const d = new Date(iso + "T00:00:00Z");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

type Row = DealSlip & Record<string, unknown>;

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
};

interface BackBookRow {
  id: string;
  name: string;
  type: string;
  issuer: string;
  currency: Currency;
  faceValue: number;
  source: string;
}
type BackBookTableRow = BackBookRow & Record<string, unknown>;

const registerCols: DataTableColumn<RegisterEntry & Record<string, unknown>>[] = [
  { key: "id", header: "Register Ref", width: "120px", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
  { key: "dealSlipId", header: "Deal Slip", render: (r) => <span className="font-mono text-xs">{r.dealSlipId}</span> },
  { key: "instrumentName", header: "Instrument" },
  { key: "issuer", header: "Issuer" },
  { key: "faceValue", header: "Face Value", align: "right", render: (r) => fmtCompact(r.faceValue) },
  {
    key: "status",
    header: "Status",
    render: (r) => (
      <Badge variant={r.status === "Active" ? "active" : "neutral"} size="sm">
        {r.status}
      </Badge>
    ),
  },
  { key: "settledBy", header: "Settled By", render: (r) => r.settledBy.name },
];

/* ─────────────────────────────────────────────────────────────
   Deal slip detail - composes workspace / checks / settlement / timeline
   and the persona-and-status-gated workflow actions.
   ───────────────────────────────────────────────────────────── */
function DealSlipDetail({ slip }: { slip: DealSlip }) {
  const { persona } = usePersona();
  const { hasPermission } = useGovernance();
  const { beginReview, approveDealSlip, rejectDealSlip, returnForAmendment, closePosition } = useWorkflow();
  const [reason, setReason] = useState("");
  const [pendingAction, setPendingAction] = useState<"reject" | "return" | "close" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canReview = hasPermission(persona.role, "deal.review");
  const canApprove = hasPermission(persona.role, "deal.approve");
  const canReject = hasPermission(persona.role, "deal.reject");
  const canClose = hasPermission(persona.role, "portfolio.manage");

  const act = (fn: () => void) => {
    setError(null);
    try {
      fn();
      setPendingAction(null);
      setReason("");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-dark-gray">{slip.id}</span>
            <Badge variant={STATUS_BADGE[slip.status]} size="md">
              {slip.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-dark-gray/60">
            {slip.economics.instrumentName} · {slip.economics.issuer} · Booked by {slip.createdBy.name}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <LimitAlerts slip={slip} />

      {/* Workflow actions for the current status */}
      {slip.status === "Submitted" && (
        <div className="flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50 px-4 py-3">
          <p className="text-sm text-sky-800">Awaiting a reviewer to begin control review.</p>
          <button
            type="button"
            disabled={!canReview}
            onClick={() => act(() => beginReview(slip.id))}
            title={!canReview ? `${persona.role} does not have deal.review permission` : undefined}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlayCircle className="h-4 w-4" /> Begin Review
          </button>
        </div>
      )}

      {slip.status === "Under Review" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="mb-3 text-sm text-amber-800">Reviewer decision - approval requires all control checks to pass or be cleared.</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!canApprove}
              onClick={() => act(() => approveDealSlip(slip.id))}
              title={!canApprove ? `${persona.role} does not have deal.approve permission` : undefined}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" /> Approve
            </button>
            <button
              type="button"
              disabled={!canReject}
              onClick={() => setPendingAction("return")}
              className="flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" /> Return for Amendment
            </button>
            <button
              type="button"
              disabled={!canReject}
              onClick={() => setPendingAction("reject")}
              className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" /> Reject
            </button>
          </div>
          {(pendingAction === "reject" || pendingAction === "return") && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={pendingAction === "reject" ? "Reason for rejection (required)" : "Reason for returning to trader (required)"}
                className="min-w-64 flex-1 rounded-md border border-border bg-white px-2.5 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                disabled={!reason.trim()}
                onClick={() =>
                  act(() =>
                    pendingAction === "reject" ? rejectDealSlip(slip.id, reason.trim()) : returnForAmendment(slip.id, reason.trim()),
                  )
                }
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Confirm
              </button>
              <button type="button" onClick={() => setPendingAction(null)} className="text-xs text-dark-gray/50 hover:text-dark-gray">
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {slip.status === "Active" && (
        <div className="rounded-lg border border-border bg-surface-muted px-4 py-3">
          {pendingAction !== "close" ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-dark-gray/60">Position is live in the investment register.</p>
              <button
                type="button"
                disabled={!canClose}
                onClick={() => setPendingAction("close")}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-dark-gray hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close Position (Matured / Sold / Rolled Over)
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Close-out reason"
                className="min-w-56 flex-1 rounded-md border border-border bg-white px-2.5 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {(["Matured", "Sold", "Rolled Over"] as const).map((outcome) => (
                <button
                  key={outcome}
                  type="button"
                  onClick={() => act(() => closePosition(slip.id, outcome, reason.trim() || outcome))}
                  className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold text-dark-gray hover:border-primary hover:text-primary"
                >
                  {outcome}
                </button>
              ))}
              <button type="button" onClick={() => setPendingAction(null)} className="text-xs text-dark-gray/50 hover:text-dark-gray">
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <SectionCard title="Deal Terms" description={isEditable(slip.status) ? "Editable while Draft / Returned for Amendment" : "Locked"}>
            <DealSlipWorkspace slip={slip} />
          </SectionCard>
        </div>
        <div className="space-y-6">
          <SectionCard title="Control Checks">
            <ChecksPanel slip={slip} canClear={canApprove} />
          </SectionCard>
          <SectionCard title="Settlement">
            <SettlementPanel slip={slip} />
          </SectionCard>
          <SectionCard title="Status Timeline">
            <StatusTimeline slip={slip} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Trade Blotter - the full deal slip pipeline + investment register
   ───────────────────────────────────────────────────────────── */

export function DealBlotter() {
  const navigate = useNavigate();
  const { persona } = usePersona();
  const { dealSlips, register, removeDraft } = useWorkflow();
  const { instruments } = useInstrumentBook();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | DealSlipStatus>("All");
  const [sortBy, setSortBy] = useState<BlotterSortField>("purchaseDate");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [documentSlipId, setDocumentSlipId] = useState<string | null>(null);
  const [viewName, setViewName] = useState("");
  const [showSaveView, setShowSaveView] = useState(false);
  const { views: savedViews, saveView, deleteView } = useSavedBlotterViews(persona.name);
  // Derive the selected slip live from the store on every render, rather than
  // holding a stale snapshot - otherwise the modal wouldn't reflect a status
  // change (e.g. Begin Review) made from inside itself.
  const selected = selectedId ? (dealSlips.find((s) => s.id === selectedId) ?? null) : null;
  const documentSlip = documentSlipId
    ? (dealSlips.find((s) => s.id === documentSlipId) ?? null)
    : null;

  const statuses: (DealSlipStatus | "All")[] = [
    "All",
    "Draft",
    "Submitted",
    "Under Review",
    "Returned for Amendment",
    "Approved",
    "Pending Settlement",
    "Settled",
    "Active",
    "Rejected",
    "Matured/Sold/Rolled Over",
  ];

  const SORT_OPTIONS: { value: BlotterSortField; label: string }[] = [
    { value: "purchaseDate", label: "Trade Date" },
    { value: "faceValue", label: "Face Value" },
    { value: "status", label: "Status" },
    { value: "instrumentName", label: "Instrument Name" },
  ];

  const applyView = (filters: { statusFilter: "All" | DealSlipStatus; search: string; sortBy: BlotterSortField; sortDir: SortDirection }) => {
    setStatusFilter(filters.statusFilter);
    setSearch(filters.search);
    setSortBy(filters.sortBy);
    setSortDir(filters.sortDir);
  };

  const rows = useMemo<Row[]>(() => {
    const filtered = dealSlips.filter((s) => {
      const matchStatus = statusFilter === "All" || s.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        s.economics.instrumentName.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.economics.issuer.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "faceValue":
          return (a.economics.faceValue - b.economics.faceValue) * dir;
        case "status":
          return a.status.localeCompare(b.status) * dir;
        case "instrumentName":
          return a.economics.instrumentName.localeCompare(b.economics.instrumentName) * dir;
        case "purchaseDate":
        default:
          return a.economics.purchaseDate.localeCompare(b.economics.purchaseDate) * dir;
      }
    });
    return sorted as Row[];
  }, [dealSlips, search, statusFilter, sortBy, sortDir]);

  const inWorkflow = dealSlips.filter(
    (s) => !["Settled", "Active", "Rejected", "Matured/Sold/Rolled Over"].includes(s.status),
  ).length;
  const activePositions = register.filter((r) => r.status === "Active").length;
  const registerFaceValue = register.filter((r) => r.status === "Active").reduce((s, r) => s + r.faceValue, 0);

  // Instruments in the shared instrument book with no corresponding active
  // register entry - these bypassed the deal-slip workflow entirely
  // (typically a bulk workbook upload of historical opening balances).
  // Same computation pattern as reconciliation.tsx's `withoutSlip`.
  const withoutSlip = useMemo<Instrument[]>(() => {
    const activeRegister = register.filter((r) => r.status === "Active");
    const activeRegisterByInstrumentId = new Map(
      activeRegister.map((r) => [r.instrumentId, r]),
    );
    return instruments.filter(
      (inst) => !activeRegisterByInstrumentId.has(inst.id),
    );
  }, [register, instruments]);

  const backBookRows: BackBookTableRow[] = withoutSlip.map((inst) => ({
    id: inst.id,
    name: inst.name,
    type: inst.instrumentType,
    issuer: inst.issuer,
    currency: inst.currency,
    faceValue: inst.faceValue,
    source: inst.sourceFileName ?? inst.importBatchLabel ?? "Unknown",
  }));

  const backBookCols: DataTableColumn<BackBookTableRow>[] = [
    { key: "id", header: "ID", width: "100px", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "name", header: "Instrument" },
    {
      key: "type",
      header: "Type",
      render: (r) => (
        <Badge variant="neutral" size="sm">
          {r.type}
        </Badge>
      ),
    },
    { key: "issuer", header: "Issuer / Counterparty" },
    { key: "currency", header: "CCY", width: "70px" },
    {
      key: "faceValue",
      header: "Face Value",
      align: "right",
      render: (r) => fmtCompactCcy(r.faceValue, CURRENCY_SYMBOLS[r.currency]),
    },
    { key: "source", header: "Import Batch" },
  ];

  const cols: DataTableColumn<Row>[] = [
    { key: "id", header: "Ref", width: "110px", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "instrumentName" as never, header: "Instrument", render: (r) => r.economics.instrumentName },
    {
      key: "assetClass" as never,
      header: "Asset Class",
      render: (r) => (
        <Badge variant="neutral" size="sm">
          {r.economics.assetClass}
        </Badge>
      ),
    },
    { key: "issuer" as never, header: "Issuer / Counterparty", render: (r) => r.economics.issuer },
    {
      key: "faceValue" as never,
      header: "Face Value",
      align: "right",
      render: (r) => fmtCompact(r.economics.faceValue),
    },
    { key: "purchaseDate" as never, header: "Trade Date", render: (r) => fmtDate(r.economics.purchaseDate) },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={STATUS_BADGE[r.status]} size="sm">
          {r.status}
        </Badge>
      ),
    },
    { key: "createdBy" as never, header: "Booked By", render: (r) => r.createdBy.name },
    {
      key: "viewDoc" as never,
      header: "",
      width: "130px",
      render: (r) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDocumentSlipId(r.id);
          }}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-medium text-dark-gray hover:border-primary hover:text-primary"
          title="View printable deal slip"
        >
          <FileText className="h-3 w-3" />
          View Deal Slip
        </button>
      ),
    },
    {
      key: "delete" as never,
      header: "",
      width: "48px",
      render: (r) =>
        r.status === "Draft" ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDeleteId(r.id);
            }}
            title="Delete this draft deal slip"
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">Trade Blotter - Deal Slip Pipeline</h1>
          <p className="mt-1 text-sm text-dark-gray/60">
            {rows.length} of {dealSlips.length} deal slips · every transaction here started life as a deal slip
          </p>
        </div>
        <button
          onClick={() => navigate("/deal-capture/new-booking")}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red"
        >
          <ArrowRight className="h-4 w-4" /> Deal Capture
        </button>
      </div>

      {dealSlips.length === 0 && (
        <div
          onClick={() => navigate("/deal-capture/new-booking")}
          className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 hover:border-primary/50 transition-colors"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <ArrowRight className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">No deal slips yet - capture your first deal</p>
            <p className="text-xs text-dark-gray/50">
              Every position in the investment register starts as a deal slip that walks through review, approval, and settlement.
            </p>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-primary/60 shrink-0" />
        </div>
      )}

      <LimitAlertsSummary onSelect={(id) => setSelectedId(id)} />

      <StatCardGrid>
        <StatCard title="Total Deal Slips" value={String(dealSlips.length)} subtitle="All statuses" variant="highlight" />
        <StatCard title="In Workflow" value={String(inWorkflow)} subtitle="Not yet settled, rejected, or closed" variant="default" />
        <StatCard title="Active Positions" value={String(activePositions)} subtitle="Investment register - settled deals only" variant="default" />
        <StatCard title="Register Face Value" value={fmtCompact(registerFaceValue)} subtitle="Sum of active positions" variant="default" />
      </StatCardGrid>

      <SectionCard title="Deal Slips" description="Click a row to review, approve, settle, or amend">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ref, instrument, or issuer…"
              className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-sm text-dark-gray placeholder-gray-400 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray focus:border-primary focus:outline-none"
            >
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as BlotterSortField)}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray focus:border-primary focus:outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  Sort: {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              title={sortDir === "asc" ? "Ascending" : "Descending"}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray hover:border-primary hover:text-primary"
            >
              {sortDir === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>

        {/* Saved views - persisted filter/sort presets per user */}
        <div className="mb-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
          <Bookmark className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-medium text-dark-gray/50">Saved views:</span>
          {savedViews.length === 0 && !showSaveView && (
            <span className="text-xs text-dark-gray/35">None yet</span>
          )}
          {savedViews.map((v) => (
            <span
              key={v.id}
              className="flex items-center gap-1.5 rounded-full border border-border bg-white pl-3 pr-1.5 py-1 text-xs text-dark-gray hover:border-primary"
            >
              <button type="button" onClick={() => applyView(v.filters)} className="font-medium hover:text-primary">
                {v.name}
              </button>
              <button
                type="button"
                onClick={() => deleteView(v.id)}
                title="Delete this saved view"
                className="rounded p-0.5 text-gray-400 hover:bg-red-50 hover:text-danger"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))}
          {!showSaveView ? (
            <button
              type="button"
              onClick={() => setShowSaveView(true)}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <BookmarkPlus className="h-3.5 w-3.5" /> Save current view
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder="View name"
                className="rounded-md border border-border bg-white px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                disabled={!viewName.trim()}
                onClick={() => {
                  saveView(viewName.trim(), { statusFilter, search, sortBy, sortDir });
                  setViewName("");
                  setShowSaveView(false);
                }}
                className="rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Save
              </button>
              <button type="button" onClick={() => setShowSaveView(false)} className="text-xs text-dark-gray/50 hover:text-dark-gray">
                Cancel
              </button>
            </div>
          )}
        </div>

        <DataTable<Row>
          columns={cols}
          data={rows}
          keyExtractor={(r) => r.id}
          emptyMessage="No deal slips match your filters"
          pageSize={20}
          onRowClick={(r) => setSelectedId(r.id)}
        />
      </SectionCard>

      <SectionCard title="Investment Register" description="Single source of truth for active positions - only ever gains an entry when a deal slip reaches Settled">
        <DataTable<RegisterEntry & Record<string, unknown>>
          columns={registerCols}
          data={register as (RegisterEntry & Record<string, unknown>)[]}
          keyExtractor={(r) => r.id}
          emptyMessage="No settled positions yet - the register only fills once a deal slip is Settled"
          pageSize={10}
        />
      </SectionCard>

      <SectionCard
        title="Back-Book Positions (loaded without a deal slip)"
        description={`${withoutSlip.length} instrument${withoutSlip.length === 1 ? "" : "s"} in the shared instrument book with no matching active deal-slip register entry`}
      >
        <p className="mb-3 text-xs text-dark-gray/50">
          These positions were loaded as opening balances from an uploaded workbook and are not subject to
          deal-slip review - new trades booked from today forward go through Deal Capture and full approval.
        </p>
        <DataTable<BackBookTableRow>
          columns={backBookCols}
          data={backBookRows}
          keyExtractor={(r) => r.id}
          emptyMessage="No back-book positions - every instrument in the book has a matching deal slip"
          pageSize={20}
        />
      </SectionCard>

      <Modal isOpen={selected !== null} onClose={() => setSelectedId(null)} title={selected ? `Deal Slip ${selected.id}` : undefined} size="xl">
        {selected && <DealSlipDetail slip={selected} />}
      </Modal>

      <Modal
        isOpen={documentSlip !== null}
        onClose={() => setDocumentSlipId(null)}
        title={documentSlip ? `Deal Slip Document - ${documentSlip.id}` : undefined}
        size="lg"
      >
        {documentSlip && (
          <DealSlipDocumentView slip={documentSlip} onClose={() => setDocumentSlipId(null)} />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) removeDraft(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        title="Delete draft deal slip?"
        description={
          confirmDeleteId
            ? `${confirmDeleteId} - ${dealSlips.find((s) => s.id === confirmDeleteId)?.economics.instrumentName ?? ""} will be permanently deleted. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
      />
    </div>
  );
}
