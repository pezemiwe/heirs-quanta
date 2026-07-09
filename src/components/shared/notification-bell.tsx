import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ShieldAlert, TrendingDown, Clock3, CheckCircle2, ExternalLink } from "lucide-react";
import {
  useNotifications,
  type AppNotification,
  type NotificationCategory,
} from "../../context/notifications";

const CATEGORY_META: Record<NotificationCategory, { label: string; icon: React.ElementType }> = {
  exception: { label: "Exception", icon: ShieldAlert },
  "limit-breach": { label: "Limit Breach", icon: TrendingDown },
  "pending-approval": { label: "Pending Approval", icon: Clock3 },
  maturity: { label: "Upcoming Maturity", icon: Clock3 },
};

const SEVERITY_DOT: Record<AppNotification["severity"], string> = {
  critical: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-sky-500",
};

function fmtRelative(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const days = Math.round((Date.now() - d.getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days > 1) return `${days}d ago`;
  if (days === -1) return "Tomorrow";
  return `in ${Math.abs(days)}d`;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, isUnread, markAllRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-dark-gray/60 transition-colors hover:bg-surface-muted"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-white shadow-lg sm:w-96">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <p className="text-sm font-semibold text-dark-gray">
              Notifications
              {notifications.length > 0 && (
                <span className="ml-1.5 text-xs font-normal text-dark-gray/40">({notifications.length})</span>
              )}
            </p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <CheckCircle2 className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                <p className="text-sm font-medium text-dark-gray/60">You're all caught up</p>
                <p className="text-xs text-dark-gray/40">
                  No open exceptions, limit breaches, pending approvals, or near-term maturities.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((n) => {
                  const meta = CATEGORY_META[n.category];
                  const Icon = meta.icon;
                  const unread = isUnread(n);
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          navigate(n.linkTo);
                        }}
                        className={`flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-pale-red/20 ${
                          unread ? "bg-pale-red/10" : ""
                        }`}
                      >
                        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_DOT[n.severity]}`} />
                        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dark-gray/40" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`truncate text-xs ${unread ? "font-semibold text-dark-gray" : "font-medium text-dark-gray/80"}`}>
                              {n.title}
                            </p>
                            <span className="shrink-0 text-[10px] text-dark-gray/35">{fmtRelative(n.at)}</span>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-dark-gray/55">{n.detail}</p>
                          <span className="mt-1 inline-block text-[10px] font-medium uppercase tracking-wide text-dark-gray/35">
                            {meta.label}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/deal-capture/exceptions");
                }}
                className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-dark-gray/50 hover:text-primary"
              >
                View exceptions <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
