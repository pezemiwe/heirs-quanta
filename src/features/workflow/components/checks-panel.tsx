import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock3,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Badge, type BadgeVariant } from "../../../components/shared/badge";
import { useWorkflow } from "../store";
import { allChecksPassed } from "../engine/checks";
import type { CheckResultStatus, ControlCheck, DealSlip } from "../types";

const STATUS_META: Record<CheckResultStatus, { label: string; variant: BadgeVariant; icon: React.ElementType }> = {
  pass: { label: "Pass", variant: "success", icon: CheckCircle2 },
  cleared: { label: "Cleared", variant: "info", icon: ShieldCheck },
  watch: { label: "Watch", variant: "warning", icon: AlertTriangle },
  breach: { label: "Breach", variant: "danger", icon: XCircle },
  pending: { label: "Pending", variant: "neutral", icon: Clock3 },
};

const TYPE_LABEL: Record<ControlCheck["type"], string> = {
  limit: "Limit",
  compliance: "Compliance",
  pricing: "Pricing",
  eligibility: "Eligibility",
  rating: "Rating",
  tenor: "Tenor",
};

function CheckRow({
  check,
  canClear,
  onClear,
}: {
  check: ControlCheck;
  canClear: boolean;
  onClear: (reason: string) => void;
}) {
  const [clearing, setClearing] = useState(false);
  const [reason, setReason] = useState("");
  const meta = STATUS_META[check.status];
  const Icon = meta.icon;
  const needsAttention = check.status === "breach" || check.status === "watch";

  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <Icon
            className={`mt-0.5 h-4 w-4 shrink-0 ${
              check.status === "breach"
                ? "text-red-600"
                : check.status === "watch"
                  ? "text-amber-600"
                  : check.status === "pending"
                    ? "text-gray-400"
                    : "text-emerald-600"
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="neutral" size="sm">
                {TYPE_LABEL[check.type]}
              </Badge>
              <span className="text-sm font-semibold text-dark-gray">{check.label}</span>
            </div>
            <p className="mt-1 text-xs text-dark-gray/60">{check.detail}</p>
            {check.clearedReason && (
              <p className="mt-1 text-xs italic text-dark-gray/50">
                Cleared by {check.checkedBy}: “{check.clearedReason}”
              </p>
            )}
          </div>
        </div>
        <Badge variant={meta.variant} size="sm" dot>
          {meta.label}
        </Badge>
      </div>

      {needsAttention && canClear && (
        <div className="mt-3 border-t border-border/60 pt-3">
          {!clearing ? (
            <button
              type="button"
              onClick={() => setClearing(true)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Clear this check
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for clearing (required)"
                className="min-w-56 flex-1 rounded-md border border-border bg-white px-2.5 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                disabled={!reason.trim()}
                onClick={() => {
                  onClear(reason.trim());
                  setClearing(false);
                  setReason("");
                }}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Confirm Clear
              </button>
              <button
                type="button"
                onClick={() => setClearing(false)}
                className="text-xs text-dark-gray/50 hover:text-dark-gray"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ChecksPanel({ slip, canClear = false }: { slip: DealSlip; canClear?: boolean }) {
  const { rerunChecks, clearCheck } = useWorkflow();
  const passed = allChecksPassed(slip.checks);

  if (slip.checks.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-surface-muted px-4 py-6 text-sm text-dark-gray/50">
        <Clock3 className="h-4 w-4" /> Checks run automatically once this deal slip is submitted.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-sm ${
          passed ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        <span className="flex items-center gap-2 font-medium">
          {passed ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {passed ? "All checks pass - ready for approval" : "One or more checks require attention before approval"}
        </span>
        <button
          type="button"
          onClick={() => rerunChecks(slip.id)}
          className="flex items-center gap-1.5 text-xs font-medium text-dark-gray/60 hover:text-primary"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Re-run checks
        </button>
      </div>

      <div className="space-y-2.5">
        {slip.checks.map((c) => (
          <CheckRow
            key={c.id}
            check={c}
            canClear={canClear}
            onClear={(reason) => clearCheck(slip.id, c.id, reason)}
          />
        ))}
      </div>
    </div>
  );
}
