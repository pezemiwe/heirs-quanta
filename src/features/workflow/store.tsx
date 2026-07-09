/**
 * Heirs Quanta — Deal Slip Workflow Store
 *
 * dealSlips[] holds every deal ever captured, at whatever status it's
 * currently in. register[] is the single source of truth for active
 * positions — an entry is only ever added when a deal slip reaches
 * "Settled" (at which point the underlying Instrument is also pushed into
 * the shared instrument book, so Valuation / Duration Risk / IFRS 9 /
 * Accounting pick it up). Nothing else in this store, or anywhere else in
 * the app, should call instrumentBook.addManualInstrument() for a deal.
 *
 * State persists to localStorage and is mirrored across browser tabs via
 * BroadcastChannel, so every open persona view converges on the same data.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useInstrumentBook } from "../../context/instrument-book";
import { usePersona } from "../../context/persona";
import { useGovernance, type Permission } from "../../context/governance";
import {
  assertTransition,
  isEditable,
} from "./engine/transitions";
import {
  allChecksPassed,
  runAllChecks,
} from "./engine/checks";
import { dealSlipToInstrument } from "./engine/convert";
import {
  emptySettlementInstruction,
  type ControlCheck,
  type DealApprovalStep,
  type DealDocument,
  type DealEconomics,
  type DealSlip,
  type DealSlipStatus,
  type ExceptionRecord,
  type ExceptionStatus,
  type RegisterEntry,
  type StatusTransition,
  type WorkflowActor,
} from "./types";

/** Attributed actor for system-detected exceptions (control breaches), as
 * distinct from human-raised ones (overrides, settlement failures). */
const SYSTEM_ACTOR: WorkflowActor = { name: "System", role: "Automated Control" };

/* ─────────────────────────────────────────────────────────────
   Persistence + cross-tab sync
   ───────────────────────────────────────────────────────────── */

const LS_KEY = "hq_deal_slips_v1";
const CHANNEL_NAME = "hq_workflow_sync";

interface PersistedState {
  dealSlips: DealSlip[];
  register: RegisterEntry[];
  exceptions: ExceptionRecord[];
}

const EMPTY_STATE: PersistedState = { dealSlips: [], register: [], exceptions: [] };

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as PersistedState;
    return {
      dealSlips: parsed.dealSlips ?? [],
      register: parsed.register ?? [],
      exceptions: parsed.exceptions ?? [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

function saveState(state: PersistedState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded or private mode — ignore silently
  }
}

/* ─────────────────────────────────────────────────────────────
   Small id / timestamp helpers
   ───────────────────────────────────────────────────────────── */

function nowIso(): string {
  return new Date().toISOString();
}

function rid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function mkTx(
  from: DealSlipStatus,
  to: DealSlipStatus,
  actor: WorkflowActor,
  at: string,
  reason?: string,
): StatusTransition {
  return { id: rid("tx"), from, to, at, byUser: actor.name, byRole: actor.role, reason };
}

/**
 * Auto-raises an Open "check-breach" exception for any breaching check that
 * doesn't already have an open exception tracking it (keyed by check TYPE,
 * not check id — a fresh check-run produces new check ids every time, but
 * there's only ever one check per CheckType per deal slip). Idempotent
 * across repeated calls (submit, re-run checks).
 */
function syncCheckBreachExceptions(
  dealSlipId: string,
  checks: ControlCheck[],
  exceptions: ExceptionRecord[],
  now: string,
): ExceptionRecord[] {
  const additions: ExceptionRecord[] = [];
  for (const check of checks) {
    if (check.status !== "breach") continue;
    const hasOpenTracker = exceptions.some(
      (e) =>
        e.dealSlipId === dealSlipId &&
        e.sourceRef === check.type &&
        (e.type === "check-breach" || e.type === "check-override") &&
        e.status !== "Closed",
    );
    if (!hasOpenTracker) {
      additions.push({
        id: rid("EXC"),
        type: "check-breach",
        dealSlipId,
        sourceRef: check.type,
        title: `${check.label} — breach`,
        detail: check.detail,
        raisedAt: now,
        raisedBy: SYSTEM_ACTOR,
        owner: null,
        dueDate: null,
        status: "Open",
      });
    }
  }
  return additions.length > 0 ? [...exceptions, ...additions] : exceptions;
}

/* ─────────────────────────────────────────────────────────────
   Context shape
   ───────────────────────────────────────────────────────────── */

export interface RaiseSettlementInput {
  settlementDate: string;
  custodian?: string;
  counterparty?: string;
  paymentReference?: string;
  notes?: string;
}

interface WorkflowContextValue {
  dealSlips: DealSlip[];
  register: RegisterEntry[];
  exceptions: ExceptionRecord[];

  getDealSlip: (id: string) => DealSlip | undefined;
  createDealSlip: (economics: DealEconomics, documents?: DealDocument[]) => DealSlip;
  updateEconomics: (id: string, patch: Partial<DealEconomics>) => void;
  removeDraft: (id: string) => void;

  submitDealSlip: (id: string) => void;
  beginReview: (id: string) => void;
  approveDealSlip: (id: string, reason?: string) => void;
  rejectDealSlip: (id: string, reason: string) => void;
  returnForAmendment: (id: string, reason: string) => void;

  raiseSettlement: (id: string, input: RaiseSettlementInput) => void;
  confirmSettlement: (id: string, notes?: string) => void;
  failSettlement: (id: string, reason: string) => void;

  clearCheck: (dealSlipId: string, checkId: string, reason: string) => void;
  rerunChecks: (dealSlipId: string) => void;

  closePosition: (dealSlipId: string, outcome: "Matured" | "Sold" | "Rolled Over", reason?: string) => void;

  assignException: (exceptionId: string, owner: WorkflowActor, dueDate: string | null) => void;
  updateExceptionStatus: (exceptionId: string, status: Exclude<ExceptionStatus, "Closed">) => void;
  closeException: (exceptionId: string, comment: string) => void;
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

/* ─────────────────────────────────────────────────────────────
   Provider
   ───────────────────────────────────────────────────────────── */

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadState);
  // Mirrors `state` synchronously (updated inside the setState updater itself,
  // which React runs immediately when commit() is called). Action functions
  // that create-then-immediately-act-on a slip in the same call stack (e.g.
  // create a Draft then submit it) need this — reading the `state` closure
  // directly would see last render's value, since the re-render triggered by
  // setState hasn't happened yet.
  const stateRef = useRef<PersistedState>(state);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const instrumentBook = useInstrumentBook();
  const { persona } = usePersona();
  const { hasPermission, getTier, logAction } = useGovernance();

  /* Cross-tab sync: rebroadcast on every commit, reload on every message
     from another tab. BroadcastChannel never delivers to its own sender, so
     there's no self-echo to guard against. */
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (ev: MessageEvent<{ type: string }>) => {
      if (ev.data?.type === "update") {
        const next = loadState();
        stateRef.current = next;
        setState(next);
      }
    };
    channelRef.current = channel;
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  const commit = useCallback((updater: (prev: PersistedState) => PersistedState) => {
    // Always derive from stateRef (not React's `prev`) and update it
    // synchronously here — relying on the setState updater callback itself
    // running synchronously is a React internals implementation detail we
    // shouldn't depend on. This guarantees a create-then-immediately-submit
    // sequence (two commit() calls in one synchronous handler) always sees
    // the first commit's result in the second.
    const next = updater(stateRef.current);
    stateRef.current = next;
    saveState(next);
    channelRef.current?.postMessage({ type: "update", at: Date.now() });
    setState(next);
  }, []);

  const actor: WorkflowActor = useMemo(
    () => ({ name: persona.name, role: persona.role }),
    [persona.name, persona.role],
  );

  const requirePermission = useCallback(
    (perm: Permission) => {
      if (!hasPermission(persona.role, perm)) {
        throw new Error(`${persona.role || "This role"} does not have the "${perm}" permission.`);
      }
    },
    [hasPermission, persona.role],
  );

  const getDealSlip = useCallback(
    (id: string) => stateRef.current.dealSlips.find((s) => s.id === id),
    [],
  );

  const getSlipOrThrow = useCallback((id: string): DealSlip => {
    const slip = stateRef.current.dealSlips.find((s) => s.id === id);
    if (!slip) throw new Error(`Deal slip ${id} not found.`);
    return slip;
  }, []);

  const existingBookFaceValueNGN = useMemo(
    () => instrumentBook.instruments.reduce((sum, i) => sum + i.faceValue, 0),
    [instrumentBook.instruments],
  );

  /* ── Create / edit ─────────────────────────────────────────── */

  const createDealSlip = useCallback(
    (economics: DealEconomics, documents: DealDocument[] = []): DealSlip => {
      requirePermission("deal.create");
      const now = nowIso();
      // Creation is the one transition with no "from" status.
      const creationTx: StatusTransition = {
        id: rid("tx"),
        from: null,
        to: "Draft",
        at: now,
        byUser: actor.name,
        byRole: actor.role,
        reason: "Deal slip created",
      };
      const slip: DealSlip = {
        id: rid("DL"),
        status: "Draft",
        createdAt: now,
        createdBy: actor,
        updatedAt: now,
        economics,
        documents,
        checks: [],
        approvals: [],
        settlement: emptySettlementInstruction(
          economics.settlementDate,
          economics.custodian,
          economics.counterparty,
        ),
        timeline: [creationTx],
        registerId: null,
        instrumentId: null,
      };
      commit((prev) => ({ ...prev, dealSlips: [slip, ...prev.dealSlips] }));
      return slip;
    },
    [actor, commit, requirePermission],
  );

  const updateEconomics = useCallback(
    (id: string, patch: Partial<DealEconomics>) => {
      const slip = getSlipOrThrow(id);
      if (!isEditable(slip.status)) {
        throw new Error(`Deal slip ${id} cannot be edited in status "${slip.status}".`);
      }
      requirePermission("deal.create");
      const now = nowIso();
      commit((prev) => ({
        ...prev,
        dealSlips: prev.dealSlips.map((s) =>
          s.id === id ? { ...s, economics: { ...s.economics, ...patch }, updatedAt: now } : s,
        ),
      }));
    },
    [commit, getSlipOrThrow, requirePermission],
  );

  const removeDraft = useCallback(
    (id: string) => {
      const slip = getSlipOrThrow(id);
      if (slip.status !== "Draft") {
        throw new Error("Only a Draft deal slip can be removed — submitted slips are part of the audit trail.");
      }
      commit((prev) => ({ ...prev, dealSlips: prev.dealSlips.filter((s) => s.id !== id) }));
    },
    [commit, getSlipOrThrow],
  );

  /* ── Submission & review ──────────────────────────────────── */

  const submitDealSlip = useCallback(
    (id: string) => {
      requirePermission("deal.create");
      const slip = getSlipOrThrow(id);
      assertTransition(slip.status, "Submitted", getTier(persona.role));
      const now = nowIso();
      const checks = runAllChecks(slip.economics, { existingBookFaceValueNGN });
      const tx = mkTx(slip.status, "Submitted", actor, now);
      commit((prev) => ({
        ...prev,
        dealSlips: prev.dealSlips.map((s) =>
          s.id === id ? { ...s, status: "Submitted", updatedAt: now, checks, timeline: [...s.timeline, tx] } : s,
        ),
        exceptions: syncCheckBreachExceptions(id, checks, prev.exceptions, now),
      }));
      logAction({
        user: actor.name,
        role: actor.role,
        module: "Deals",
        action: "Deal Slip Submitted",
        detail: `${slip.economics.instrumentName} — ${slip.id} submitted for review.`,
        status: "success",
        ip: "10.0.1.xx",
      });
    },
    [actor, commit, existingBookFaceValueNGN, getSlipOrThrow, getTier, logAction, persona.role, requirePermission],
  );

  const beginReview = useCallback(
    (id: string) => {
      requirePermission("deal.review");
      const slip = getSlipOrThrow(id);
      assertTransition(slip.status, "Under Review", getTier(persona.role));
      const now = nowIso();
      const tx = mkTx(slip.status, "Under Review", actor, now);
      const approval: DealApprovalStep = {
        id: rid("ap"),
        action: "Review Started",
        byUser: actor.name,
        byRole: actor.role,
        at: now,
      };
      commit((prev) => ({
        ...prev,
        dealSlips: prev.dealSlips.map((s) =>
          s.id === id
            ? { ...s, status: "Under Review", updatedAt: now, timeline: [...s.timeline, tx], approvals: [...s.approvals, approval] }
            : s,
        ),
      }));
    },
    [actor, commit, getSlipOrThrow, getTier, persona.role, requirePermission],
  );

  const approveDealSlip = useCallback(
    (id: string, reason?: string) => {
      requirePermission("deal.approve");
      const slip = getSlipOrThrow(id);
      assertTransition(slip.status, "Approved", getTier(persona.role));
      if (!allChecksPassed(slip.checks)) {
        throw new Error("All control checks must pass (or be cleared with a reason) before this deal slip can be approved.");
      }
      const now = nowIso();
      const tx = mkTx(slip.status, "Approved", actor, now, reason);
      const approval: DealApprovalStep = {
        id: rid("ap"),
        action: "Approved",
        byUser: actor.name,
        byRole: actor.role,
        at: now,
        reason,
      };
      commit((prev) => ({
        ...prev,
        dealSlips: prev.dealSlips.map((s) =>
          s.id === id
            ? { ...s, status: "Approved", updatedAt: now, timeline: [...s.timeline, tx], approvals: [...s.approvals, approval] }
            : s,
        ),
      }));
      logAction({
        user: actor.name,
        role: actor.role,
        module: "Deals",
        action: "Deal Slip Approved",
        detail: `${slip.economics.instrumentName} — ${slip.id} approved and awaiting settlement.`,
        status: "success",
        ip: "10.0.1.xx",
      });
    },
    [actor, commit, getSlipOrThrow, getTier, logAction, persona.role, requirePermission],
  );

  const rejectDealSlip = useCallback(
    (id: string, reason: string) => {
      if (!reason?.trim()) throw new Error("A rejection reason is required.");
      requirePermission("deal.reject");
      const slip = getSlipOrThrow(id);
      assertTransition(slip.status, "Rejected", getTier(persona.role));
      const now = nowIso();
      const tx = mkTx(slip.status, "Rejected", actor, now, reason);
      const approval: DealApprovalStep = {
        id: rid("ap"),
        action: "Rejected",
        byUser: actor.name,
        byRole: actor.role,
        at: now,
        reason,
      };
      commit((prev) => ({
        ...prev,
        dealSlips: prev.dealSlips.map((s) =>
          s.id === id
            ? { ...s, status: "Rejected", updatedAt: now, timeline: [...s.timeline, tx], approvals: [...s.approvals, approval] }
            : s,
        ),
      }));
      logAction({
        user: actor.name,
        role: actor.role,
        module: "Deals",
        action: "Deal Slip Rejected",
        detail: `${slip.economics.instrumentName} — ${slip.id} rejected: ${reason}`,
        status: "blocked",
        ip: "10.0.1.xx",
      });
    },
    [actor, commit, getSlipOrThrow, getTier, logAction, persona.role, requirePermission],
  );

  const returnForAmendment = useCallback(
    (id: string, reason: string) => {
      if (!reason?.trim()) throw new Error("A reason is required to return a deal slip for amendment.");
      requirePermission("deal.reject");
      const slip = getSlipOrThrow(id);
      assertTransition(slip.status, "Returned for Amendment", getTier(persona.role));
      const now = nowIso();
      const tx = mkTx(slip.status, "Returned for Amendment", actor, now, reason);
      const approval: DealApprovalStep = {
        id: rid("ap"),
        action: "Returned for Amendment",
        byUser: actor.name,
        byRole: actor.role,
        at: now,
        reason,
      };
      commit((prev) => ({
        ...prev,
        dealSlips: prev.dealSlips.map((s) =>
          s.id === id
            ? {
                ...s,
                status: "Returned for Amendment",
                updatedAt: now,
                timeline: [...s.timeline, tx],
                approvals: [...s.approvals, approval],
              }
            : s,
        ),
      }));
      logAction({
        user: actor.name,
        role: actor.role,
        module: "Deals",
        action: "Deal Slip Returned for Amendment",
        detail: `${slip.economics.instrumentName} — ${slip.id} returned to trader: ${reason}`,
        status: "warning",
        ip: "10.0.1.xx",
      });
    },
    [actor, commit, getSlipOrThrow, getTier, logAction, persona.role, requirePermission],
  );

  /* ── Settlement (maker-checker) ───────────────────────────── */

  const raiseSettlement = useCallback(
    (id: string, input: RaiseSettlementInput) => {
      requirePermission("settlement.raise");
      const slip = getSlipOrThrow(id);
      // A retry after a failed settlement doesn't change the deal slip's
      // overall status (it's been "Pending Settlement" the whole time) — only
      // the settlement sub-record resets, so this doesn't go through the
      // Approved -> Pending Settlement graph edge a second time.
      const isRetry = slip.status === "Pending Settlement" && slip.settlement.status === "Failed";
      if (!isRetry) {
        assertTransition(slip.status, "Pending Settlement", getTier(persona.role));
      }
      const now = nowIso();
      const tx = mkTx(
        slip.status,
        "Pending Settlement",
        actor,
        now,
        isRetry ? "Settlement instruction re-raised after failure" : "Settlement instruction raised",
      );
      commit((prev) => ({
        ...prev,
        dealSlips: prev.dealSlips.map((s) =>
          s.id === id
            ? {
                ...s,
                status: "Pending Settlement",
                updatedAt: now,
                timeline: [...s.timeline, tx],
                settlement: {
                  ...s.settlement,
                  settlementDate: input.settlementDate || s.settlement.settlementDate,
                  custodian: input.custodian ?? s.settlement.custodian,
                  counterparty: input.counterparty ?? s.settlement.counterparty,
                  paymentReference: input.paymentReference,
                  notes: input.notes,
                  status: "Instruction Raised",
                  raisedBy: actor,
                  raisedAt: now,
                  failReason: undefined,
                },
              }
            : s,
        ),
      }));
      logAction({
        user: actor.name,
        role: actor.role,
        module: "Deals",
        action: isRetry ? "Settlement Instruction Re-raised" : "Settlement Instruction Raised",
        detail: `${slip.economics.instrumentName} — ${slip.id} settlement instruction ${isRetry ? "re-raised after failure" : "raised"}, awaiting a different user to confirm.`,
        status: "success",
        ip: "10.0.1.xx",
      });
    },
    [actor, commit, getSlipOrThrow, getTier, logAction, persona.role, requirePermission],
  );

  const confirmSettlement = useCallback(
    (id: string, notes?: string) => {
      requirePermission("settlement.confirm");
      const slip = getSlipOrThrow(id);
      assertTransition(slip.status, "Settled", getTier(persona.role));
      if (!slip.settlement.raisedBy) {
        throw new Error("No settlement instruction has been raised for this deal slip yet.");
      }
      if (slip.settlement.raisedBy.name === actor.name) {
        throw new Error(
          "The person who raised this settlement instruction cannot also confirm it — maker and checker must be different users.",
        );
      }
      const now = nowIso();
      const instrument = dealSlipToInstrument(slip);
      const registerId = rid("REG");

      const txSettled = mkTx(slip.status, "Settled", actor, now, notes);
      const txActive = mkTx("Settled", "Active", actor, now, "Auto-activated on settlement confirmation");

      const registerEntry: RegisterEntry = {
        id: registerId,
        dealSlipId: slip.id,
        instrumentId: instrument.id,
        status: "Active",
        assetClass: slip.economics.assetClass,
        instrumentName: slip.economics.instrumentName,
        issuer: slip.economics.issuer,
        faceValue: slip.economics.faceValue,
        currency: slip.economics.currency,
        settledAt: now,
        settledBy: actor,
        closedAt: null,
        closedBy: null,
      };

      commit((prev) => ({
        ...prev,
        dealSlips: prev.dealSlips.map((s) =>
          s.id === id
            ? {
                ...s,
                status: "Active",
                updatedAt: now,
                timeline: [...s.timeline, txSettled, txActive],
                settlement: { ...s.settlement, status: "Confirmed", confirmedBy: actor, confirmedAt: now },
                registerId,
                instrumentId: instrument.id,
              }
            : s,
        ),
        register: [registerEntry, ...prev.register],
      }));

      // The ONLY call site in the whole app that pushes a deal into the
      // shared instrument book — gated entirely behind settlement confirmation.
      instrumentBook.addManualInstrument(instrument);

      logAction({
        user: actor.name,
        role: actor.role,
        module: "Deals",
        action: "Settlement Confirmed — Position Active",
        detail: `${slip.economics.instrumentName} — ${slip.id} settled and posted to the investment register. Ref: ${registerId}`,
        status: "success",
        ip: "10.0.1.xx",
      });
    },
    [actor, commit, getSlipOrThrow, getTier, instrumentBook, logAction, persona.role, requirePermission],
  );

  const failSettlement = useCallback(
    (id: string, reason: string) => {
      if (!reason?.trim()) throw new Error("A reason is required to mark a settlement instruction as failed.");
      requirePermission("settlement.confirm");
      const slip = getSlipOrThrow(id);
      if (slip.settlement.status !== "Instruction Raised") {
        throw new Error("Only a raised settlement instruction awaiting confirmation can be marked as failed.");
      }
      const now = nowIso();
      commit((prev) => ({
        ...prev,
        dealSlips: prev.dealSlips.map((s) =>
          s.id === id
            ? { ...s, updatedAt: now, settlement: { ...s.settlement, status: "Failed", failReason: reason } }
            : s,
        ),
        exceptions: [
          ...prev.exceptions,
          {
            id: rid("EXC"),
            type: "settlement-failure",
            dealSlipId: id,
            sourceRef: "settlement",
            title: "Settlement instruction failed",
            detail: reason,
            raisedAt: now,
            raisedBy: actor,
            owner: null,
            dueDate: null,
            status: "Open",
          },
        ],
      }));
      logAction({
        user: actor.name,
        role: actor.role,
        module: "Deals",
        action: "Settlement Failed",
        detail: `${slip.economics.instrumentName} — ${slip.id} settlement failed: ${reason}`,
        status: "blocked",
        ip: "10.0.1.xx",
      });
    },
    [actor, commit, getSlipOrThrow, logAction, requirePermission],
  );

  /* ── Checks ────────────────────────────────────────────────── */

  const clearCheck = useCallback(
    (dealSlipId: string, checkId: string, reason: string) => {
      if (!reason?.trim()) throw new Error("A reason is required to clear a control check.");
      requirePermission("deal.approve");
      const slip = getSlipOrThrow(dealSlipId);
      const check = slip.checks.find((c) => c.id === checkId);
      const now = nowIso();
      commit((prev) => {
        const dealSlips = prev.dealSlips.map((s) =>
          s.id === dealSlipId
            ? {
                ...s,
                updatedAt: now,
                checks: s.checks.map((c) =>
                  c.id === checkId
                    ? { ...c, status: "cleared" as const, checkedAt: now, checkedBy: actor.name, clearedReason: reason }
                    : c,
                ),
              }
            : s,
        );
        // Clearing a check is itself an exception — the "override" — and it
        // does NOT close on its own; it still needs a formal closure comment
        // from whoever reviews it (compliance/audit). If a breach was already
        // being tracked for this check, evolve it into the override record
        // rather than opening a second one.
        let exceptions = prev.exceptions;
        if (check) {
          const existingIdx = exceptions.findIndex(
            (e) => e.dealSlipId === dealSlipId && e.sourceRef === check.type && e.status !== "Closed",
          );
          if (existingIdx >= 0) {
            exceptions = exceptions.map((e, i) =>
              i === existingIdx
                ? { ...e, type: "check-override" as const, title: `${check.label} — override`, detail: `Override: ${reason}`, raisedBy: actor }
                : e,
            );
          } else {
            exceptions = [
              ...exceptions,
              {
                id: rid("EXC"),
                type: "check-override",
                dealSlipId,
                sourceRef: check.type,
                title: `${check.label} — override`,
                detail: `Override: ${reason}`,
                raisedAt: now,
                raisedBy: actor,
                owner: null,
                dueDate: null,
                status: "Open",
              },
            ];
          }
        }
        return { ...prev, dealSlips, exceptions };
      });
    },
    [actor, commit, getSlipOrThrow, requirePermission],
  );

  const rerunChecks = useCallback(
    (dealSlipId: string) => {
      const slip = getSlipOrThrow(dealSlipId);
      const checks = runAllChecks(slip.economics, { existingBookFaceValueNGN });
      const now = nowIso();
      commit((prev) => ({
        ...prev,
        dealSlips: prev.dealSlips.map((s) => (s.id === dealSlipId ? { ...s, checks, updatedAt: now } : s)),
        exceptions: syncCheckBreachExceptions(dealSlipId, checks, prev.exceptions, now),
      }));
    },
    [commit, existingBookFaceValueNGN, getSlipOrThrow],
  );

  /* ── Lifecycle close-out ──────────────────────────────────── */

  const closePosition = useCallback(
    (dealSlipId: string, outcome: "Matured" | "Sold" | "Rolled Over", reason?: string) => {
      requirePermission("portfolio.manage");
      const slip = getSlipOrThrow(dealSlipId);
      assertTransition(slip.status, "Matured/Sold/Rolled Over", getTier(persona.role));
      const now = nowIso();
      const tx = mkTx(slip.status, "Matured/Sold/Rolled Over", actor, now, reason ?? outcome);
      commit((prev) => ({
        ...prev,
        dealSlips: prev.dealSlips.map((s) =>
          s.id === dealSlipId
            ? { ...s, status: "Matured/Sold/Rolled Over", updatedAt: now, timeline: [...s.timeline, tx] }
            : s,
        ),
        register: prev.register.map((r) =>
          r.dealSlipId === dealSlipId
            ? { ...r, status: outcome, closedAt: now, closedBy: actor, closeReason: reason }
            : r,
        ),
      }));
    },
    [actor, commit, getSlipOrThrow, getTier, persona.role, requirePermission],
  );

  /* ── Exceptions ────────────────────────────────────────────── */

  const assignException = useCallback(
    (exceptionId: string, owner: WorkflowActor, dueDate: string | null) => {
      requirePermission("exception.manage");
      commit((prev) => ({
        ...prev,
        exceptions: prev.exceptions.map((e) =>
          e.id === exceptionId ? { ...e, owner, dueDate, status: e.status === "Open" ? "In Progress" : e.status } : e,
        ),
      }));
    },
    [commit, requirePermission],
  );

  const updateExceptionStatus = useCallback(
    (exceptionId: string, status: Exclude<ExceptionStatus, "Closed">) => {
      requirePermission("exception.manage");
      commit((prev) => ({
        ...prev,
        exceptions: prev.exceptions.map((e) => (e.id === exceptionId ? { ...e, status } : e)),
      }));
    },
    [commit, requirePermission],
  );

  const closeException = useCallback(
    (exceptionId: string, comment: string) => {
      if (!comment?.trim()) throw new Error("A closure comment is required to close an exception.");
      requirePermission("exception.manage");
      const now = nowIso();
      commit((prev) => ({
        ...prev,
        exceptions: prev.exceptions.map((e) =>
          e.id === exceptionId
            ? { ...e, status: "Closed" as const, closureComment: comment, closedAt: now, closedBy: actor }
            : e,
        ),
      }));
    },
    [actor, commit, requirePermission],
  );

  const value: WorkflowContextValue = {
    dealSlips: state.dealSlips,
    register: state.register,
    exceptions: state.exceptions,
    getDealSlip,
    createDealSlip,
    updateEconomics,
    removeDraft,
    submitDealSlip,
    beginReview,
    approveDealSlip,
    rejectDealSlip,
    returnForAmendment,
    raiseSettlement,
    confirmSettlement,
    failSettlement,
    clearCheck,
    rerunChecks,
    closePosition,
    assignException,
    updateExceptionStatus,
    closeException,
  };

  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>;
}

export function useWorkflow(): WorkflowContextValue {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error("useWorkflow must be used inside WorkflowProvider");
  return ctx;
}
