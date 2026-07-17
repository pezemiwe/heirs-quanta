/**
 * Heirs Quanta - Deal Slip Workflow Types
 *
 * No investment transaction exists outside a deal slip, and no settlement
 * confirmation means no active holding. Every instrument that ends up in the
 * shared instrument book (and therefore in Valuation, Duration Risk, IFRS 9,
 * and Accounting figures) got there by a deal slip reaching "Settled".
 */

import type {
  Classification,
  CouponFrequency,
  Currency,
  IFRS13Level,
} from "../valuation/engine/types";

/* ─────────────────────────────────────────────────────────────
   Status & lifecycle
   ───────────────────────────────────────────────────────────── */

export type DealSlipStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Returned for Amendment"
  | "Rejected"
  | "Approved"
  | "Pending Settlement"
  | "Settled"
  | "Active"
  | "Matured/Sold/Rolled Over";

export type AssetClass =
  | "FGN Bond"
  | "State Bond"
  | "Corporate Bond"
  | "Eurobond"
  | "Treasury Bill"
  | "Commercial Paper"
  | "Bank Placement"
  | "Fixed Deposit"
  | "Equity"
  | "Sukuk"
  | "Mutual Fund";

/* ─────────────────────────────────────────────────────────────
   Control checks
   ───────────────────────────────────────────────────────────── */

export type CheckType =
  | "limit"
  | "compliance"
  | "pricing"
  | "eligibility"
  | "rating"
  | "tenor";

export type CheckResultStatus = "pass" | "watch" | "breach" | "pending" | "cleared";

export interface ControlCheck {
  id: string;
  type: CheckType;
  label: string;
  status: CheckResultStatus;
  detail: string;
  threshold?: string;
  actual?: string;
  checkedAt: string | null;
  checkedBy: string | null; // "System" for automated runs, persona name for manual clears
  clearedReason?: string;
}

/* ─────────────────────────────────────────────────────────────
   Settlement
   ───────────────────────────────────────────────────────────── */

export type SettlementStatus =
  | "Not Raised"
  | "Instruction Raised"
  | "Confirmed"
  | "Failed";

export interface WorkflowActor {
  name: string;
  role: string;
}

export interface SettlementInstruction {
  status: SettlementStatus;
  settlementDate: string;
  custodian?: string;
  counterparty?: string;
  paymentReference?: string;
  notes?: string;
  raisedBy: WorkflowActor | null;
  raisedAt: string | null;
  confirmedBy: WorkflowActor | null;
  confirmedAt: string | null;
  failReason?: string;
}

export function emptySettlementInstruction(
  settlementDate: string,
  custodian?: string,
  counterparty?: string,
): SettlementInstruction {
  return {
    status: "Not Raised",
    settlementDate,
    custodian,
    counterparty,
    raisedBy: null,
    raisedAt: null,
    confirmedBy: null,
    confirmedAt: null,
  };
}

/* ─────────────────────────────────────────────────────────────
   Documents
   ───────────────────────────────────────────────────────────── */

export type DocumentCategory = "Term Sheet" | "IC Memo" | "KYC" | "Other";

export interface DealDocument {
  id: string;
  name: string;
  sizeBytes: number;
  category: DocumentCategory;
  uploadedAt: string;
  uploadedBy: string;
}

/* ─────────────────────────────────────────────────────────────
   Economics - the deal terms captured at booking
   ───────────────────────────────────────────────────────────── */

export interface DealEconomics {
  assetClass: AssetClass;
  isin?: string;
  instrumentName: string;
  issuer: string;
  sector: string;
  currency: Currency;
  classification: Classification;
  ifrs13Level: IFRS13Level;

  faceValue: number;
  /** Clean price as a decimal fraction of par, e.g. 0.985 for 98.5% */
  purchasePriceDecimal: number;
  purchaseYield?: number;
  couponRate: number;
  couponFrequency: CouponFrequency;
  dayCount?: string;
  discountRate?: number;

  purchaseDate: string;
  maturityDate: string;
  settlementDate: string;

  custodian?: string;
  counterparty: string;
  portfolioBook: string;

  /** Optional external credit rating (issuer/counterparty), used by the rating check */
  creditRating?: string;

  notes?: string;
}

/* ─────────────────────────────────────────────────────────────
   Timeline / approvals
   ───────────────────────────────────────────────────────────── */

export interface StatusTransition {
  id: string;
  from: DealSlipStatus | null;
  to: DealSlipStatus;
  at: string; // ISO timestamp
  byUser: string;
  byRole: string;
  reason?: string;
}

export type ApprovalAction =
  | "Review Started"
  | "Approved"
  | "Rejected"
  | "Returned for Amendment";

export interface DealApprovalStep {
  id: string;
  action: ApprovalAction;
  byUser: string;
  byRole: string;
  at: string;
  reason?: string;
}

/* ─────────────────────────────────────────────────────────────
   Deal slip
   ───────────────────────────────────────────────────────────── */

export interface DealSlip {
  id: string;
  status: DealSlipStatus;
  createdAt: string;
  createdBy: WorkflowActor;
  updatedAt: string;

  economics: DealEconomics;
  documents: DealDocument[];
  checks: ControlCheck[];
  approvals: DealApprovalStep[];
  settlement: SettlementInstruction;
  timeline: StatusTransition[];

  /** Set once the slip reaches Settled and is pushed into the register */
  registerId: string | null;
  /** Set once the slip is pushed into the shared instrument book */
  instrumentId: string | null;
}

/* ─────────────────────────────────────────────────────────────
   Exceptions - every control breach, override, or failed settlement is
   tracked here until formally closed. Nothing is silently dismissed:
   clearing a check or retrying a failed settlement does not close the
   exception it created - only a closure comment does.
   ───────────────────────────────────────────────────────────── */

export type ExceptionType = "check-breach" | "check-override" | "settlement-failure";
export type ExceptionStatus = "Open" | "In Progress" | "Closed";

export interface ExceptionRecord {
  id: string;
  type: ExceptionType;
  dealSlipId: string;
  /** Stable key within a deal slip - a CheckType for check-related exceptions, "settlement" otherwise */
  sourceRef: string;
  title: string;
  detail: string;
  raisedAt: string;
  raisedBy: WorkflowActor;
  owner: WorkflowActor | null;
  dueDate: string | null;
  status: ExceptionStatus;
  closureComment?: string;
  closedAt?: string;
  closedBy?: WorkflowActor;
}

/* ─────────────────────────────────────────────────────────────
   Investment register - single source of truth for active positions.
   Only ever gains an entry when a deal slip reaches "Settled".
   ───────────────────────────────────────────────────────────── */

export type RegisterPositionStatus = "Active" | "Matured" | "Sold" | "Rolled Over";

export interface RegisterEntry {
  id: string;
  dealSlipId: string;
  instrumentId: string;
  status: RegisterPositionStatus;
  assetClass: AssetClass;
  instrumentName: string;
  issuer: string;
  faceValue: number;
  currency: Currency;
  settledAt: string;
  settledBy: WorkflowActor;
  closedAt: string | null;
  closedBy: WorkflowActor | null;
  closeReason?: string;
}
