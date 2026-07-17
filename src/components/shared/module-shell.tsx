import { useState, useEffect, useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, Search } from "lucide-react";
import { Logo } from "./logo";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "./notification-bell";
import { usePersona } from "../../context/persona";
import { useInstrumentBook } from "../../context/instrument-book";

function GlobalSearch() {
  const { instruments } = useInstrumentBook();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.toLowerCase();
    return instruments.filter(
      (inst) =>
        inst.id.toLowerCase().includes(q) ||
        inst.name.toLowerCase().includes(q) ||
        inst.issuer.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [query, instruments]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : i));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i > 0 ? i - 1 : 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        navigate(`/valuation/asset/${results[selectedIndex].id}`);
        setOpen(false);
        setQuery("");
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, results, selectedIndex, navigate]);

  return (
    <div className="relative mr-2 hidden sm:block">
      <div className="relative flex items-center">
        <Search className="absolute left-2.5 h-4 w-4 text-dark-gray/40" />
        <input
          type="text"
          placeholder="Search instruments..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          className="h-8 w-64 rounded-md border border-border bg-surface-muted pl-9 pr-3 text-xs text-dark-gray outline-none placeholder:text-dark-gray/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-full rounded-md border border-border bg-surface py-1 shadow-lg z-50">
          {results.map((inst, i) => (
            <button
              key={inst.id}
              onClick={() => {
                navigate(`/valuation/asset/${inst.id}`);
                setOpen(false);
                setQuery("");
              }}
              className={`flex w-full flex-col items-start px-3 py-1.5 text-left text-xs transition-colors ${
                i === selectedIndex ? "bg-pale-red text-primary" : "text-dark-gray hover:bg-gray-50"
              }`}
            >
              <span className="font-semibold">{inst.id}</span>
              <span className="truncate text-[11px] opacity-70">{inst.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when navigating
  useEffect(() => {
    setSidebarOpen(false);
  }, [activePage]);

  // Close sidebar on wide screens if it was toggled open
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setSidebarOpen(false);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const grouped = Object.entries(groups).map(([key, label]) => ({
    groupLabel: label,
    items: nav.filter((n) => n.group === key),
  }));

  const SidebarContent = () => (
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
                <span className={`shrink-0 ${active ? "text-primary" : ""}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex h-screen flex-col bg-surface-muted font-sans text-dark-gray overflow-hidden">
      {/* ── Header ── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-3 sm:px-5 z-20">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile hamburger */}
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-dark-gray/60 hover:bg-surface-muted md:hidden"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <Logo collapsed />
          <div className="h-4 w-px bg-border" />
          <span className="max-w-[160px] truncate text-xs font-semibold text-dark-gray sm:max-w-none">
            {moduleLabel}
          </span>
          {badge && (
            <span className="hidden rounded-full bg-pale-red px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary sm:inline">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <GlobalSearch />
          <NotificationBell />
          <UserMenu
            persona={persona}
            onSwitchModules={() => navigate("/modules")}
            onLogout={() => {
              setPersona({ name: "", role: "", avatar: "" });
              navigate("/");
            }}
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Mobile sidebar overlay ── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-dark-gray/40 backdrop-blur-[2px] md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface overflow-y-auto
            transition-transform duration-200 ease-in-out
            md:static md:w-56 md:translate-x-0 md:z-auto md:shrink-0
            ${sidebarOpen ? "translate-x-0 shadow-[4px_0_24px_rgba(0,0,0,0.12)]" : "-translate-x-full"}
          `}
        >
          {/* Mobile close button */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
            <span className="text-sm font-semibold text-dark-gray">
              {moduleLabel}
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-dark-gray/50 hover:bg-surface-muted"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <SidebarContent />
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
