import { usePersona } from "../../../context/persona";
import { getModuleAccess, type ModuleId } from "../../../context/permissions";
import { MODULES, greeting } from "../config";

export function Hero() {
  const { persona } = usePersona();
  const accessibleCount = MODULES.filter(
    (m) => getModuleAccess(persona.role, m.id as ModuleId) !== "none",
  ).length;

  return (
    <div className="border-b border-border bg-white">
      <div className="mx-auto max-w-[1440px] px-4 py-8 lg:px-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary/70">
          Module Selection
        </p>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-dark-gray lg:text-3xl">
          {greeting()},{" "}
          <span className="text-primary">{persona.name.split(" ")[0]}</span>.
        </h1>
        <p className="text-sm text-dark-gray/50">
          Select a module below to begin your session.{" "}
          <span className="font-medium text-dark-gray/70">
            {accessibleCount} of {MODULES.length} modules available for your
            role.
          </span>
        </p>
      </div>
    </div>
  );
}
