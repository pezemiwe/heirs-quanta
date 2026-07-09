import { useState } from "react";
import { ArrowRightLeft, CheckCircle2, Lock, ShieldAlert, Clock3, XOctagon, RotateCcw } from "lucide-react";
import { usePersona } from "../../../context/persona";
import { useGovernance } from "../../../context/governance";
import { useWorkflow } from "../store";
import type { DealSlip } from "../types";

function fmtTimestamp(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const inputCls =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray outline-none focus:border-primary focus:ring-1 focus:ring-primary";

export function SettlementPanel({ slip }: { slip: DealSlip }) {
  const { persona } = usePersona();
  const { hasPermission } = useGovernance();
  const { raiseSettlement, confirmSettlement, failSettlement } = useWorkflow();

  const canRaise = hasPermission(persona.role, "settlement.raise");
  const canConfirm = hasPermission(persona.role, "settlement.confirm");

  const [settlementDate, setSettlementDate] = useState(slip.settlement.settlementDate);
  const [custodian, setCustodian] = useState(slip.settlement.custodian ?? "");
  const [counterparty, setCounterparty] = useState(slip.settlement.counterparty ?? "");
  const [paymentReference, setPaymentReference] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [failing, setFailing] = useState(false);
  const [failReason, setFailReason] = useState("");

  const settlementStatus = slip.settlement.status;

  if (settlementStatus === "Not Raised" && slip.status !== "Approved" && slip.status !== "Pending Settlement") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-surface-muted px-4 py-6 text-sm text-dark-gray/50">
        <Clock3 className="h-4 w-4" />
        Settlement becomes available once this deal slip is Approved.
      </div>
    );
  }

  const isSameActor = slip.settlement.raisedBy?.name === persona.name;
  const isRetry = settlementStatus === "Failed";

  const handleRaise = () => {
    setError(null);
    try {
      raiseSettlement(slip.id, {
        settlementDate,
        custodian: custodian || undefined,
        counterparty: counterparty || undefined,
        paymentReference: paymentReference || undefined,
        notes: notes || undefined,
      });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleConfirm = () => {
    setError(null);
    try {
      confirmSettlement(slip.id, notes || undefined);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleFail = () => {
    setError(null);
    try {
      failSettlement(slip.id, failReason.trim());
      setFailing(false);
      setFailReason("");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Failed — shown above the retry form so the reason isn't lost */}
      {settlementStatus === "Failed" && (
        <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-red-800">
            <XOctagon className="h-4 w-4" /> Settlement Failed
          </div>
          <p className="text-xs text-red-700">{slip.settlement.failReason}</p>
          <p className="mt-1 text-xs text-red-700/70">
            This is tracked as an open exception until formally closed — see Exceptions.
          </p>
        </div>
      )}

      {/* Raise / retry — visible while Approved-and-not-raised, or after a failure */}
      {(settlementStatus === "Not Raised" || settlementStatus === "Failed") && slip.status !== "Rejected" && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-dark-gray">
            {isRetry ? <RotateCcw className="h-4 w-4 text-primary" /> : <ArrowRightLeft className="h-4 w-4 text-primary" />}
            {isRetry ? "Re-raise Settlement Instruction" : "Raise Settlement Instruction"}
          </div>
          <p className="mb-3 text-xs text-dark-gray/55">
            Back office maker step — a different user must confirm this instruction before the position goes active.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Settlement Date</label>
              <input type="date" value={settlementDate} onChange={(e) => setSettlementDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Payment Reference</label>
              <input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="e.g. RTGS-2026-000123" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Custodian</label>
              <input value={custodian} onChange={(e) => setCustodian(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Counterparty</label>
              <input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500">Notes</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
            </div>
          </div>
          <button
            type="button"
            disabled={!canRaise}
            onClick={handleRaise}
            title={!canRaise ? `${persona.role} does not have settlement.raise permission` : undefined}
            className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowRightLeft className="h-4 w-4" /> {isRetry ? "Re-raise Instruction" : "Raise Instruction"}
          </button>
        </div>
      )}

      {/* Raised, awaiting confirmation */}
      {settlementStatus === "Instruction Raised" && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-dark-gray">
            <Clock3 className="h-4 w-4 text-indigo-600" /> Settlement Instruction — Awaiting Confirmation
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
            <div>
              <dt className="text-dark-gray/50">Raised by</dt>
              <dd className="font-medium text-dark-gray">{slip.settlement.raisedBy?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-dark-gray/50">Raised at</dt>
              <dd className="font-medium text-dark-gray">{fmtTimestamp(slip.settlement.raisedAt)}</dd>
            </div>
            <div>
              <dt className="text-dark-gray/50">Settlement date</dt>
              <dd className="font-medium text-dark-gray">{slip.settlement.settlementDate || "—"}</dd>
            </div>
            <div>
              <dt className="text-dark-gray/50">Custodian</dt>
              <dd className="font-medium text-dark-gray">{slip.settlement.custodian || "—"}</dd>
            </div>
            <div>
              <dt className="text-dark-gray/50">Counterparty</dt>
              <dd className="font-medium text-dark-gray">{slip.settlement.counterparty || "—"}</dd>
            </div>
          </dl>

          <div className="mt-4 border-t border-indigo-200/60 pt-3">
            {isSameActor && (
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-amber-700">
                <Lock className="h-3.5 w-3.5" /> You raised this instruction — a different user must confirm it.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!canConfirm || isSameActor}
                onClick={handleConfirm}
                title={
                  isSameActor
                    ? "Maker and checker must be different users"
                    : !canConfirm
                      ? `${persona.role} does not have settlement.confirm permission`
                      : undefined
                }
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" /> Confirm Settlement
              </button>
              {!failing ? (
                <button
                  type="button"
                  disabled={!canConfirm}
                  onClick={() => setFailing(true)}
                  className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <XOctagon className="h-4 w-4" /> Mark as Failed
                </button>
              ) : (
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <input
                    value={failReason}
                    onChange={(e) => setFailReason(e.target.value)}
                    placeholder="Failure reason (required) — e.g. custodian rejected, funds unavailable"
                    className="min-w-64 flex-1 rounded-md border border-border bg-white px-2.5 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    disabled={!failReason.trim()}
                    onClick={handleFail}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Confirm Failure
                  </button>
                  <button type="button" onClick={() => setFailing(false)} className="text-xs text-dark-gray/50 hover:text-dark-gray">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmed */}
      {settlementStatus === "Confirmed" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4" /> Settlement Confirmed — Position Active
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-dark-gray/50">Raised by</dt>
              <dd className="font-medium text-dark-gray">{slip.settlement.raisedBy?.name}</dd>
            </div>
            <div>
              <dt className="text-dark-gray/50">Raised at</dt>
              <dd className="font-medium text-dark-gray">{fmtTimestamp(slip.settlement.raisedAt)}</dd>
            </div>
            <div>
              <dt className="text-dark-gray/50">Confirmed by</dt>
              <dd className="font-medium text-dark-gray">{slip.settlement.confirmedBy?.name}</dd>
            </div>
            <div>
              <dt className="text-dark-gray/50">Confirmed at</dt>
              <dd className="font-medium text-dark-gray">{fmtTimestamp(slip.settlement.confirmedAt)}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
