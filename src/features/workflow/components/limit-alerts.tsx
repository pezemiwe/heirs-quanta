import { AlertTriangle, ShieldAlert } from "lucide-react";
import { useWorkflow } from "../store";
import type { ControlCheck, DealSlip } from "../types";

function limitChecks(checks: ControlCheck[]): ControlCheck[] {
  return checks.filter((c) => c.type === "limit" && (c.status === "watch" || c.status === "breach"));
}

/**
 * Renders a limit alert banner for any watch/breach "limit" checks passed
 * in. This is the low-level building block - used both for a saved deal
 * slip's own checks (`LimitAlerts`) and for a live, not-yet-submitted
 * preview computed straight from the form (see deal-slip-workspace.tsx).
 */
export function LimitAlertsFromChecks({ checks }: { checks: ControlCheck[] }) {
  const alerts = limitChecks(checks);
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((c) => (
        <div
          key={c.id}
          className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${
            c.status === "breach" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {c.status === "breach" ? (
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div>
            <p className="font-medium">
              {c.status === "breach" ? "Limit breach" : "Approaching limit"} - {c.label}
            </p>
            <p className="mt-0.5 text-xs opacity-80">{c.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Per-slip limit alert banner - surfaced anywhere a single deal slip's
 * economics approach or breach a configured limit (currently: single-issuer
 * concentration). Renders nothing if the slip has no open limit alerts.
 */
export function LimitAlerts({ slip }: { slip: DealSlip }) {
  return <LimitAlertsFromChecks checks={slip.checks} />;
}

/**
 * Global aggregator - every deal slip currently sitting on an open (not
 * cleared) limit watch/breach, across the whole pipeline. Surfaced on the
 * blotter and counterparty exposure pages so limit issues are visible
 * wherever someone is looking at the book, not just on the one deal slip
 * that triggered them.
 */
export function LimitAlertsSummary({ onSelect }: { onSelect?: (dealSlipId: string) => void }) {
  const { dealSlips } = useWorkflow();

  const flagged = dealSlips
    .map((s) => ({ slip: s, alerts: limitChecks(s.checks) }))
    .filter((x) => x.alerts.length > 0);

  if (flagged.length === 0) return null;

  const breachCount = flagged.filter((x) => x.alerts.some((a) => a.status === "breach")).length;
  const watchCount = flagged.length - breachCount;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-800">
        <ShieldAlert className="h-4 w-4" />
        Limit Alerts - {flagged.length} deal slip{flagged.length === 1 ? "" : "s"}
        {breachCount > 0 && <span className="text-red-700"> ({breachCount} breach{breachCount === 1 ? "" : "es"})</span>}
        {watchCount > 0 && <span> ({watchCount} watch)</span>}
      </div>
      <div className="space-y-1.5">
        {flagged.map(({ slip, alerts }) => {
          const worst = alerts.some((a) => a.status === "breach") ? "breach" : "watch";
          return (
            <button
              key={slip.id}
              type="button"
              onClick={() => onSelect?.(slip.id)}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-amber-200/70 bg-white px-3 py-2 text-left text-xs hover:border-amber-400"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-dark-gray/50 shrink-0">{slip.id}</span>
                <span className="truncate font-medium text-dark-gray">{slip.economics.instrumentName}</span>
              </span>
              <span className={`shrink-0 font-semibold ${worst === "breach" ? "text-red-700" : "text-amber-700"}`}>
                {alerts[0].actual ?? alerts[0].label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
