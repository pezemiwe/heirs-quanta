/**
 * Heirs Quanta — Deal Slip State Machine
 *
 * The single authority on which status a deal slip may move to next, and
 * which persona tier is permitted to drive that edge. Every mutation in
 * store.tsx must go through assertTransition() before it touches state —
 * nothing else in the codebase should special-case a status change.
 */

import type { DealSlipStatus } from "../types";

/** Role tiers as already established by context/governance.ts's ROLE_TIER map. */
export type RoleTier = "maker" | "checker" | "viewer" | "admin";

/** Non-viewer tiers — anyone who can actually act on a deal slip. */
const ACTOR_TIERS: RoleTier[] = ["maker", "checker", "admin"];
/** Tiers that can create/edit/submit a deal slip (front office). */
const TRADER_TIERS: RoleTier[] = ["maker", "admin"];
/** Tiers that can review/approve/reject/return a deal slip (risk & control). */
const REVIEWER_TIERS: RoleTier[] = ["checker", "admin"];

/**
 * The transition graph: from status -> allowed next statuses.
 * This is the ONLY place the graph is defined — no other file should encode
 * "can X become Y" logic.
 */
export const TRANSITIONS: Record<DealSlipStatus, DealSlipStatus[]> = {
  Draft: ["Submitted"],
  Submitted: ["Under Review"],
  "Under Review": ["Approved", "Rejected", "Returned for Amendment"],
  "Returned for Amendment": ["Submitted"],
  Rejected: [],
  Approved: ["Pending Settlement"],
  "Pending Settlement": ["Settled"],
  Settled: ["Active"],
  Active: ["Matured/Sold/Rolled Over"],
  "Matured/Sold/Rolled Over": [],
};

/** Statuses a trader may edit the underlying deal economics in. */
export const EDITABLE_STATUSES: DealSlipStatus[] = ["Draft", "Returned for Amendment"];

export function isEditable(status: DealSlipStatus): boolean {
  return EDITABLE_STATUSES.includes(status);
}

export function isTerminal(status: DealSlipStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

export function canTransition(from: DealSlipStatus, to: DealSlipStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** The required actor tier for each edge in the graph, keyed "from->to". */
const EDGE_TIER: Record<string, RoleTier[]> = {
  "Draft->Submitted": TRADER_TIERS,
  "Returned for Amendment->Submitted": TRADER_TIERS,
  "Submitted->Under Review": REVIEWER_TIERS,
  "Under Review->Approved": REVIEWER_TIERS,
  "Under Review->Rejected": REVIEWER_TIERS,
  "Under Review->Returned for Amendment": REVIEWER_TIERS,
  // Settlement raise/confirm are gated by "settlement.raise"/"settlement.confirm"
  // permissions at the store layer (any non-viewer tier), plus a hard
  // maker-must-not-equal-checker identity rule enforced there. Both ends of
  // the settlement edges are open to any actor tier here.
  "Approved->Pending Settlement": ACTOR_TIERS,
  "Pending Settlement->Settled": ACTOR_TIERS,
  // Settled -> Active fires automatically the instant settlement is
  // confirmed — no separate human actor drives this edge.
  "Settled->Active": [...ACTOR_TIERS, "viewer"],
  "Active->Matured/Sold/Rolled Over": ACTOR_TIERS,
};

export interface TransitionCheckResult {
  ok: boolean;
  reason?: string;
}

/**
 * Validates both state-graph legality AND actor-tier legality for a
 * proposed transition. Does not know about settlement-specific identity
 * rules (raiser != confirmer) — that's a store-layer concern since it needs
 * the actual persona name, not just their tier.
 */
export function checkTransition(
  from: DealSlipStatus,
  to: DealSlipStatus,
  actorTier: RoleTier,
): TransitionCheckResult {
  if (!canTransition(from, to)) {
    return {
      ok: false,
      reason: `"${from}" cannot move directly to "${to}". Valid next statuses: ${
        TRANSITIONS[from].length ? TRANSITIONS[from].join(", ") : "none — this is a terminal status"
      }.`,
    };
  }
  const allowedTiers = EDGE_TIER[`${from}->${to}`] ?? ACTOR_TIERS;
  if (!allowedTiers.includes(actorTier)) {
    return {
      ok: false,
      reason: `Your role does not have permission to move a deal slip from "${from}" to "${to}".`,
    };
  }
  return { ok: true };
}

/** Throws if the transition is not allowed — used by store.tsx mutations. */
export function assertTransition(
  from: DealSlipStatus,
  to: DealSlipStatus,
  actorTier: RoleTier,
): void {
  const result = checkTransition(from, to, actorTier);
  if (!result.ok) throw new Error(result.reason);
}

/** All statuses reachable in one hop from the given status — drives UI action buttons. */
export function nextStatuses(status: DealSlipStatus): DealSlipStatus[] {
  return TRANSITIONS[status];
}
