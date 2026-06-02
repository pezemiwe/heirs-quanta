import { LogOut } from "lucide-react";
import { usePersona } from "../../../context/persona";

interface TopNavProps {
  onLogout: () => void;
}

export function TopNav({ onLogout }: TopNavProps) {
  const { persona } = usePersona();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 lg:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img
            src="/Heirs.png"
            alt="Heirs Holdings"
            className="h-8 w-8 object-contain"
            draggable={false}
          />
          <div>
            <p className="text-sm font-bold text-primary">Heirs Quanta</p>
            <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-dark-gray/40">
              Financial Analytics
            </p>
          </div>
        </div>

        {/* User + logout */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 sm:flex">
            <div className="text-right">
              <p className="text-sm font-semibold text-dark-gray">
                {persona.name}
              </p>
              <p className="text-xs text-dark-gray/45">{persona.role}</p>
            </div>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black text-white shadow-sm"
              style={{ background: "#CC0000" }}
            >
              {persona.avatar}
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-dark-gray/50 transition-all hover:bg-surface-muted hover:text-dark-gray"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
