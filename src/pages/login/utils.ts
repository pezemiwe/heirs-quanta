import { PERSONAS } from "./config";
import type { SimplePersona } from "./types";

export const findPersonaByRole = (role: string) =>
  PERSONAS.find((p) => p.role === role);

export const buildPersonaFromEmail = (email: string): SimplePersona => ({
  name: email.split("@")[0],
  role: "User",
  avatar: email[0]?.toUpperCase() ?? "U",
});
