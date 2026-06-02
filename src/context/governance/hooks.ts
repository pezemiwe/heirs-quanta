import { useContext } from "react";
import { GovernanceContext } from "./provider";

export function useGovernance() {
  const ctx = useContext(GovernanceContext);
  if (!ctx)
    throw new Error("useGovernance must be used inside GovernanceProvider");
  return ctx;
}
