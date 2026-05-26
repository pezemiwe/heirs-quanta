import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { usePersona } from "../../context/persona";

/** Redirects to /login if no persona is set (not logged in). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { persona } = usePersona();
  if (!persona.name) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
