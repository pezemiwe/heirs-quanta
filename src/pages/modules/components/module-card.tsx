import { ChevronRight, Lock, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePersona } from "../../../context/persona";
import { getModuleAccess, type ModuleId } from "../../../context/permissions";
import type { ModuleDefinition } from "../types";

interface ModuleCardProps {
  module: ModuleDefinition;
  hovered: boolean;
  onHoverChange: (id: string | null) => void;
}

export function ModuleCard({
  module: m,
  hovered: isHovered,
  onHoverChange,
}: ModuleCardProps) {
  const { persona } = usePersona();
  const navigate = useNavigate();
  const Icon = m.icon;
  const access = getModuleAccess(persona.role, m.id as ModuleId);
  const isLocked = access === "none";
  const isReadOnly = access === "read-only";
  return (
    <div
      onMouseEnter={() => !isLocked && onHoverChange(m.id)}
      onMouseLeave={() => onHoverChange(null)}
      className={`group flex flex-col overflow-hidden rounded-xl border border-border bg-white transition-all duration-200 ${isLocked ? "opacity-50 grayscale" : ""}`}
      style={{
        boxShadow: isHovered
          ? `0 12px 32px rgba(0,0,0,0.09), 0 0 0 1.5px ${m.accent}33`
          : "0 1px 3px rgba(0,0,0,0.05)",
        transform: isHovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* Accent top stripe */}
      <div
        style={{
          height: 3,
          background: isLocked ? "#9ca3af" : m.accent,
          flexShrink: 0,
        }}
      />

      <div className="flex flex-1 flex-col p-4">
        {/* Icon + status badge */}
        <div className="mb-3 flex items-start justify-between">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
            style={{ background: isLocked ? "#9ca3af" : m.accent }}
          >
            <Icon className="h-4 w-4" />
          </div>
          {isLocked ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-400">
              <Lock className="h-2.5 w-2.5" /> Locked
            </span>
          ) : isReadOnly ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-600">
              <Eye className="h-2.5 w-2.5" /> View
            </span>
          ) : m.live ? (
            <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-600">
              Live
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-dark-gray/35">
              Soon
            </span>
          )}
        </div>

        {/* Module name + subtitle */}
        <h3 className="mb-0.5 text-[13px] font-bold leading-snug text-dark-gray">
          {m.title}
        </h3>
        <p className="mb-3 text-[11px] leading-snug text-dark-gray/45">
          {m.subtitle}
        </p>

        {/* Top 3 capabilities */}
        <div className="mb-4 flex flex-1 flex-col gap-1.5">
          {m.features.slice(0, 3).map(({ label }) => (
            <div key={label} className="flex items-start gap-1.5">
              <div
                className="mt-[3px] h-1 w-1 shrink-0 rounded-full"
                style={{ background: isLocked ? "#9ca3af" : `${m.accent}99` }}
              />
              <span className="text-[10px] leading-snug text-dark-gray/50">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        {isLocked ? (
          <button
            disabled
            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold cursor-not-allowed bg-gray-100 text-gray-400"
          >
            <Lock className="h-3 w-3" /> Access Restricted
          </button>
        ) : isReadOnly ? (
          <button
            onClick={() => navigate(`/${m.id}`)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-bold border border-amber-200 bg-amber-50 text-amber-800 transition-all hover:bg-amber-100"
          >
            <Eye className="h-3 w-3" /> View Module
          </button>
        ) : m.live ? (
          <button
            onClick={() => navigate(`/${m.id}`)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold text-white transition-all duration-200"
            style={{
              background: isHovered
                ? `linear-gradient(90deg, ${m.accent} 0%, ${m.accent}CC 100%)`
                : m.accent,
            }}
          >
            Open Module <ChevronRight className="h-3 w-3" />
          </button>
        ) : (
          <button
            disabled
            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold cursor-not-allowed text-dark-gray/30"
            style={{ background: "#F4F4F6" }}
          >
            <Lock className="h-3 w-3" /> Coming Soon
          </button>
        )}
      </div>
    </div>
  );
}
