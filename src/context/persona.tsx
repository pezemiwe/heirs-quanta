import { createContext, useContext, useState, type ReactNode } from "react";

export interface Persona {
  name: string;
  role: string;
  avatar: string;
}

interface PersonaContextValue {
  persona: Persona;
  setPersona: (p: Persona) => void;
}

const PersonaContext = createContext<PersonaContextValue | null>(null);

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [persona, setPersona] = useState<Persona>({
    name: "",
    role: "",
    avatar: "",
  });

  return (
    <PersonaContext.Provider value={{ persona, setPersona }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error("usePersona must be used inside PersonaProvider");
  return ctx;
}
