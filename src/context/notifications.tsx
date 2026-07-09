/**
 * Heirs Quanta — Platform-Wide Notifications
 *
 * Surfaces four live signals, aggregated across every module, not scoped to
 * any one page:
 *   - open exceptions (breaches, overrides, failed settlements)
 *   - deal slips sitting on an unresolved limit watch/breach
 *   - pending approvals (governance queue + deal slips awaiting review)
 *   - instruments maturing soon
 *
 * Every notification is derived live from state that already lives in
 * useWorkflow() / useGovernance() / useInstrumentBook() — nothing here is a
 * new source of truth, it's a read/aggregation layer. Only the "last seen"
 * marker (used to compute the unread badge) is its own small piece of
 * per-persona state, persisted to localStorage.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useInstrumentBook } from "./instrument-book";
import { usePersona } from "./persona";
import { useGovernance } from "./governance";
import { useWorkflow } from "../features/workflow/store";

export type NotificationSeverity = "info" | "warning" | "critical";
export type NotificationCategory =
  | "exception"
  | "limit-breach"
  | "pending-approval"
  | "maturity";

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  detail: string;
  /** ISO timestamp — when this condition arose / is anchored to. */
  at: string;
  /** Route to navigate to when the notification is clicked. */
  linkTo: string;
}

const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  exception: "Exception",
  "limit-breach": "Limit Breach",
  "pending-approval": "Pending Approval",
  maturity: "Upcoming Maturity",
};

const MATURITY_WINDOW_DAYS = 30;
const MATURITY_CRITICAL_DAYS = 7;

function daysFromNow(iso: string): number {
  const target = new Date(iso + "T00:00:00Z").getTime();
  const now = Date.now();
  return Math.round((target - now) / 86_400_000);
}

/* ─────────────────────────────────────────────────────────────
   "Last seen" persistence — per persona, localStorage only. The
   notification list itself is always live/derived, so there's nothing to
   sync cross-tab here beyond what useWorkflow/useGovernance/useInstrumentBook
   already do.
   ───────────────────────────────────────────────────────────── */

const LS_KEY = "hq_notifications_seen_v1";

function loadSeenMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

function saveSeenMap(map: Record<string, string>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {
    // ignore quota / private-mode errors
  }
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isUnread: (n: AppNotification) => boolean;
  markAllRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { persona } = usePersona();
  const { exceptions, dealSlips } = useWorkflow();
  const { approvals } = useGovernance();
  const { instruments } = useInstrumentBook();
  const [seenMap, setSeenMap] = useState<Record<string, string>>(loadSeenMap);

  const notifications = useMemo<AppNotification[]>(() => {
    const items: AppNotification[] = [];

    /* ── Open exceptions ─────────────────────────────────────── */
    for (const e of exceptions) {
      if (e.status === "Closed") continue;
      const overdue = e.dueDate ? new Date(e.dueDate + "T23:59:59").getTime() < Date.now() : false;
      items.push({
        id: `exc-${e.id}`,
        category: "exception",
        severity: overdue ? "critical" : "warning",
        title: e.title,
        detail: overdue
          ? `Overdue — ${e.detail}`
          : e.owner
            ? `Assigned to ${e.owner.name} — ${e.detail}`
            : `Unassigned — ${e.detail}`,
        at: e.raisedAt,
        linkTo: "/deal-capture/exceptions",
      });
    }

    /* ── Deal slips sitting on an unresolved limit watch/breach ── */
    for (const s of dealSlips) {
      const limitIssues = s.checks.filter(
        (c) => c.type === "limit" && (c.status === "watch" || c.status === "breach"),
      );
      for (const c of limitIssues) {
        items.push({
          id: `lim-${s.id}-${c.type}`,
          category: "limit-breach",
          severity: c.status === "breach" ? "critical" : "warning",
          title: `${c.label} — ${s.economics.instrumentName}`,
          detail: c.detail,
          at: s.updatedAt,
          linkTo: "/deal-capture/blotter",
        });
      }
    }

    /* ── Pending approvals — governance queue + deal slips awaiting review ── */
    for (const a of approvals) {
      if (a.status !== "pending") continue;
      items.push({
        id: `appr-${a.id}`,
        category: "pending-approval",
        severity: a.priority === "high" ? "warning" : "info",
        title: a.title,
        detail: `${a.module} — awaiting ${a.requiredApprover}`,
        at: a.submittedAt,
        linkTo: "/governance/approvals",
      });
    }
    for (const s of dealSlips) {
      if (s.status !== "Submitted" && s.status !== "Under Review") continue;
      items.push({
        id: `slip-${s.id}`,
        category: "pending-approval",
        severity: "info",
        title: `${s.economics.instrumentName} — ${s.status}`,
        detail: `Deal slip ${s.id}, booked by ${s.createdBy.name}, awaiting ${
          s.status === "Submitted" ? "review" : "an approval decision"
        }`,
        at: s.updatedAt,
        linkTo: "/deal-capture/blotter",
      });
    }

    /* ── Upcoming maturities ──────────────────────────────────── */
    for (const inst of instruments) {
      if (inst.status !== "Active" || !inst.maturityDate) continue;
      const days = daysFromNow(inst.maturityDate);
      if (days < 0 || days > MATURITY_WINDOW_DAYS) continue;
      items.push({
        id: `mat-${inst.id}`,
        category: "maturity",
        severity: days <= MATURITY_CRITICAL_DAYS ? "critical" : "warning",
        title: `${inst.name} matures in ${days} day${days === 1 ? "" : "s"}`,
        detail: `${inst.issuer} — ${inst.instrumentType} — maturity ${inst.maturityDate}`,
        at: inst.maturityDate,
        linkTo: "/deal-capture/treasury-cash",
      });
    }

    const severityRank: Record<NotificationSeverity, number> = { critical: 0, warning: 1, info: 2 };
    return items.sort(
      (a, b) => severityRank[a.severity] - severityRank[b.severity] || b.at.localeCompare(a.at),
    );
  }, [exceptions, dealSlips, approvals, instruments]);

  const lastSeenAt = persona.name ? seenMap[persona.name] : undefined;

  const isUnread = useCallback((n: AppNotification) => !lastSeenAt || n.at > lastSeenAt, [lastSeenAt]);

  const unreadCount = useMemo(() => notifications.filter(isUnread).length, [notifications, isUnread]);

  const markAllRead = useCallback(() => {
    if (!persona.name) return;
    setSeenMap((prev) => {
      const next = { ...prev, [persona.name]: new Date().toISOString() };
      saveSeenMap(next);
      return next;
    });
  }, [persona.name]);

  const value: NotificationsContextValue = {
    notifications,
    unreadCount,
    isUnread,
    markAllRead,
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
}

export { CATEGORY_LABEL };
