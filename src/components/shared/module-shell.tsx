import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "./logo";
import { UserMenu } from "./user-menu";
import { usePersona } from "../../context/persona";

export interface ModuleNavItem {
  id: string;
  label: string;
  icon: ReactNode;
  group: string;
}

interface ModuleShellProps {
  /** Module display name shown in the header (e.g. "Performance Analytics"). */
  moduleLabel: string;
  /** Optional badge text shown next to the module label (e.g. "Live"). */
  badge?: string;
  /** Base route for child pages, no trailing slash (e.g. "/performance"). */
  basePath: string;
  /** Currently active page id. */
  activePage: string;
  /** Sidebar navigation entries. */
  nav: ModuleNavItem[];
  /** Mapping from group key -> human-readable label. */
  groups: Record<string, string>;
  children: ReactNode;
}

/** Standard chrome (header + grouped sidebar + content area) used by
 *  every feature module. Keeps the look consistent across modules. */
export function ModuleShell({
  moduleLabel,
  badge,
  basePath,
  activePage,
  nav,
  groups,
  children,
}: ModuleShellProps) {
  const { persona, setPersona } = usePersona();
  const navigate = useNavigate();

  const grouped = Object.entries(groups).map(([key, label]) => ({
    groupLabel: label,
    items: nav.filter((n) => n.group === key),
  }));

  return (
    <div className="flex h-screen flex-col bg-surface-muted font-sans text-dark-gray overflow-hidden">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-5 z-10">
        <div className="flex items-center gap-3">
          <Logo collapsed />
          <div className="h-4 w-px bg-border" />
          <span className="text-xs font-semibold text-dark-gray">
            {moduleLabel}
          </span>
          {badge && (
            <span className="ml-2 hidden rounded-full bg-pale-red px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary sm:inline">
              {badge}
            </span>
          )}
        </div>
        <UserMenu
          persona={persona}
          onSwitchModules={() => navigate("/modules")}
          onLogout={() => {
            setPersona({ name: "", role: "", avatar: "" });
            navigate("/");
          }}
        />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface overflow-y-auto">
          <nav className="flex-1 py-4">
            {grouped.map(({ groupLabel, items }) => (
              <div key={groupLabel} className="mb-5">
                <p className="mb-1 px-4 text-xs font-semibold uppercase tracking-widest text-gray-300">
                  {groupLabel}
                </p>
                {items.map((item) => {
                  const active = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(`${basePath}/${item.id}`)}
                      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                        active
                          ? "border-r-2 border-primary bg-pale-red font-medium text-primary"
                          : "text-gray-500 hover:bg-gray-50 hover:text-dark-gray"
                      }`}
                    >
                      <span
                        className={`shrink-0 ${active ? "text-primary" : ""}`}
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
