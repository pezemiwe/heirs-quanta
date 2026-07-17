import { useMemo, useState } from "react";
import {
  AlertOctagon,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  ShieldQuestion,
  XOctagon,
} from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge, type BadgeVariant } from "../../../components/shared/badge";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { Modal } from "../../../components/shared/modal";
import { usePersona } from "../../../context/persona";
import { useGovernance } from "../../../context/governance";
import { PERSONAS } from "../../../pages/login";
import { useWorkflow } from "../../workflow/store";
import type {
  ExceptionRecord,
  ExceptionStatus,
  ExceptionType,
} from "../../workflow/types";

const TYPE_META: Record<ExceptionType, { label: string; icon: React.ElementType }> = {
  "check-breach": { label: "Control Breach", icon: XOctagon },
  "check-override": { label: "Override", icon: ShieldQuestion },
  "settlement-failure": { label: "Settlement Failure", icon: AlertOctagon },
};

const STATUS_BADGE: Record<ExceptionStatus, BadgeVariant> = {
  Open: "danger",
  "In Progress": "warning",
  Closed: "success",
};

const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtDateTime = (iso: string | null | undefined) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

function isOverdue(e: ExceptionRecord): boolean {
  if (e.status === "Closed" || !e.dueDate) return false;
  return new Date(e.dueDate + "T23:59:59").getTime() < Date.now();
}

type Row = ExceptionRecord & Record<string, unknown>;

function ExceptionDetail({ record }: { record: ExceptionRecord }) {
  const { persona } = usePersona();
  const { hasPermission } = useGovernance();
  const { dealSlips, assignException, updateExceptionStatus, closeException } = useWorkflow();
  const canManage = hasPermission(persona.role, "exception.manage");
  const slip = dealSlips.find((s) => s.id === record.dealSlipId);

  const [ownerName, setOwnerName] = useState(record.owner?.name ?? "");
  const [dueDate, setDueDate] = useState(record.dueDate ?? "");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const meta = TYPE_META[record.type];
  const Icon = meta.icon;

  const act = (fn: () => void) => {
    setError(null);
    try {
      fn();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pale-red text-primary">
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-dark-gray">{record.title}</span>
              <Badge variant={STATUS_BADGE[record.status]} size="sm">
                {record.status}
              </Badge>
              {isOverdue(record) && (
                <Badge variant="danger" size="sm" dot>
                  Overdue
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-dark-gray/50">
              {meta.label} · Deal slip{" "}
              <span className="font-mono">{record.dealSlipId}</span>
              {slip && <> - {slip.economics.instrumentName}</>}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="rounded-lg border border-border bg-surface-muted px-4 py-3">
        <p className="text-sm text-dark-gray">{record.detail}</p>
        <p className="mt-2 text-xs text-dark-gray/50">
          Raised {fmtDateTime(record.raisedAt)} by {record.raisedBy.name} ({record.raisedBy.role})
        </p>
      </div>

      {record.status !== "Closed" ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Owner</label>
              <select
                value={ownerName}
                disabled={!canManage}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50"
              >
                <option value="">- Unassigned -</option>
                {PERSONAS.map((p) => (
                  <option key={p.role} value={p.name}>
                    {p.name} · {p.role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Due Date</label>
              <input
                type="date"
                value={dueDate}
                disabled={!canManage}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!canManage || !ownerName}
              onClick={() => {
                const p = PERSONAS.find((x) => x.name === ownerName);
                if (!p) return;
                act(() => assignException(record.id, { name: p.name, role: p.role }, dueDate || null));
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-dark-gray hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save Owner / Due Date
            </button>
            {record.status === "Open" && (
              <button
                type="button"
                disabled={!canManage}
                onClick={() => act(() => updateExceptionStatus(record.id, "In Progress"))}
                className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Mark In Progress
              </button>
            )}
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-dark-gray/50">Close this exception</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Closure comment (required) - what was done / why this is resolved"
              className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray outline-none placeholder:text-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              disabled={!canManage || !comment.trim()}
              onClick={() => act(() => closeException(record.id, comment.trim()))}
              className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" /> Close Exception
            </button>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4" /> Closed
          </div>
          <p className="text-sm text-emerald-900">{record.closureComment}</p>
          <p className="mt-2 text-xs text-emerald-800/70">
            Closed {fmtDateTime(record.closedAt)} by {record.closedBy?.name}
          </p>
        </div>
      )}
    </div>
  );
}

export function Exceptions() {
  const { exceptions } = useWorkflow();
  const [statusFilter, setStatusFilter] = useState<"All" | ExceptionStatus>("All");
  const [typeFilter, setTypeFilter] = useState<"All" | ExceptionType>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? (exceptions.find((e) => e.id === selectedId) ?? null) : null;

  const openCount = exceptions.filter((e) => e.status === "Open").length;
  const inProgressCount = exceptions.filter((e) => e.status === "In Progress").length;
  const closedCount = exceptions.filter((e) => e.status === "Closed").length;
  const overdueCount = exceptions.filter(isOverdue).length;

  const rows = useMemo<Row[]>(() => {
    return exceptions.filter((e) => {
      const matchStatus = statusFilter === "All" || e.status === statusFilter;
      const matchType = typeFilter === "All" || e.type === typeFilter;
      return matchStatus && matchType;
    }) as Row[];
  }, [exceptions, statusFilter, typeFilter]);

  const cols: DataTableColumn<Row>[] = [
    { key: "dealSlipId", header: "Deal Slip", width: "110px", render: (r) => <span className="font-mono text-xs">{r.dealSlipId}</span> },
    {
      key: "type",
      header: "Type",
      render: (r) => (
        <Badge variant="neutral" size="sm">
          {TYPE_META[r.type].label}
        </Badge>
      ),
    },
    { key: "title", header: "Exception" },
    { key: "raisedAt", header: "Raised", render: (r) => fmtDate(r.raisedAt) },
    { key: "owner" as never, header: "Owner", render: (r) => r.owner?.name ?? <span className="text-dark-gray/35">Unassigned</span> },
    {
      key: "dueDate",
      header: "Due",
      render: (r) =>
        r.dueDate ? (
          <span className={isOverdue(r) ? "font-semibold text-danger" : ""}>{fmtDate(r.dueDate)}</span>
        ) : (
          <span className="text-dark-gray/35">-</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <Badge variant={STATUS_BADGE[r.status]} size="sm">
            {r.status}
          </Badge>
          {isOverdue(r) && <Clock3 className="h-3.5 w-3.5 text-danger" />}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">Exceptions</h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Every control breach, override, or failed settlement - nothing is silently dismissed. An exception
          stays visible here until it is assigned, worked, and formally closed with a comment.
        </p>
      </div>

      <StatCardGrid>
        <StatCard title="Open" value={String(openCount)} subtitle="Awaiting triage" variant={openCount > 0 ? "danger" : "default"} />
        <StatCard title="In Progress" value={String(inProgressCount)} subtitle="Assigned and being worked" variant="warning" />
        <StatCard title="Overdue" value={String(overdueCount)} subtitle="Past due date, still open" variant={overdueCount > 0 ? "danger" : "default"} />
        <StatCard title="Closed" value={String(closedCount)} subtitle="Resolved with a closure comment" variant="default" />
      </StatCardGrid>

      <SectionCard title="Exception Log" description="Click a row to assign an owner, set a due date, or close it">
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray focus:border-primary focus:outline-none"
          >
            {(["All", "Open", "In Progress", "Closed"] as const).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray focus:border-primary focus:outline-none"
          >
            <option value="All">All Types</option>
            {(Object.keys(TYPE_META) as ExceptionType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_META[t].label}
              </option>
            ))}
          </select>
          <span className="flex items-center text-xs text-dark-gray/40">{rows.length} of {exceptions.length} exceptions</span>
        </div>
        <DataTable<Row>
          columns={cols}
          data={rows}
          keyExtractor={(r) => r.id}
          emptyMessage="No exceptions - every check has passed and every settlement has confirmed cleanly"
          pageSize={20}
          onRowClick={(r) => setSelectedId(r.id)}
        />
      </SectionCard>

      <Modal isOpen={selected !== null} onClose={() => setSelectedId(null)} title={selected ? "Exception Detail" : undefined} size="lg">
        {selected && <ExceptionDetail record={selected} />}
      </Modal>
    </div>
  );
}
