import { createContext, useCallback, useState, type ReactNode } from "react";
import {
  ROLE_PERMISSIONS,
  ROLE_TIER,
  SEED_APPROVALS,
  SEED_AUDIT,
} from "./initial-data";
import { nextId } from "./reducer";
import type {
  ApprovalItem,
  AuditEntry,
  GovernanceContextValue,
  Permission,
  RoleKey,
} from "./types";

export const GovernanceContext = createContext<GovernanceContextValue | null>(
  null,
);

export function GovernanceProvider({ children }: { children: ReactNode }) {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(SEED_AUDIT);
  const [approvals, setApprovals] = useState<ApprovalItem[]>(SEED_APPROVALS);

  const logAction = useCallback(
    (entry: Omit<AuditEntry, "id" | "timestamp">) => {
      const now = new Date();
      const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      setAuditLog((prev) => [
        { ...entry, id: nextId(), timestamp: ts },
        ...prev,
      ]);
    },
    [],
  );

  const decideApproval = useCallback(
    (id: string, decision: "approved" | "rejected") => {
      setApprovals((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: decision } : a)),
      );
    },
    [],
  );

  const hasPermission = useCallback((role: string, perm: Permission) => {
    const perms = ROLE_PERMISSIONS[role as RoleKey];
    if (!perms) return false;
    return perms.includes(perm);
  }, []);

  const getTier = useCallback((role: string) => {
    return ROLE_TIER[role as RoleKey] ?? "viewer";
  }, []);

  const pendingCount = approvals.filter((a) => a.status === "pending").length;

  return (
    <GovernanceContext.Provider
      value={{
        auditLog,
        logAction,
        approvals,
        decideApproval,
        hasPermission,
        getTier,
        pendingCount,
      }}
    >
      {children}
    </GovernanceContext.Provider>
  );
}
