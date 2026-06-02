import { useState } from "react";
import { ChevronRight, Menu, X } from "lucide-react";
import { useScrolled } from "../hooks";
import { NAV_LINKS } from "../data";

interface Props {
  onEnter: () => void;
}

export const Navbar = ({ onEnter }: Props) => {
  const scrolled = useScrolled();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
      style={{
        background: "rgba(255,255,255,0.97)",
        borderBottom: "1px solid #E2E2E2",
        boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.07)" : "none",
        backdropFilter: "blur(12px)",
      }}
    >
      <nav className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <img
            src="/Heirs.png"
            alt="Heirs Holdings"
            className="h-9 w-9 object-contain"
            draggable={false}
          />
          <div>
            <p className="text-sm font-bold tracking-tight text-primary">
              Heirs Quanta
            </p>
            <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-dark-gray/45">
              Financial Analytics
            </p>
          </div>
          <div className="ml-3 hidden h-4 w-px bg-border lg:block" />
          <span className="hidden text-[10px] font-medium text-dark-gray/35 lg:block">
            Heirs Holdings Group
          </span>
        </div>

        <ul className="hidden list-none items-center gap-8 lg:flex">
          {NAV_LINKS.map((l) => (
            <li key={l}>
              <a
                href={`#${l.toLowerCase()}`}
                className="text-sm font-medium text-dark-gray/55 no-underline transition-colors hover:text-dark-gray"
              >
                {l}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            onClick={onEnter}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-mid-red"
            style={{ boxShadow: "0 2px 12px rgba(204,0,0,0.22)" }}
          >
            Access Platform
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-dark-gray/60 lg:hidden"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-border bg-white px-5 pb-5 pt-4 lg:hidden">
          {NAV_LINKS.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              onClick={() => setMobileOpen(false)}
              className="block py-3 text-sm font-medium text-dark-gray/65 no-underline"
            >
              {l}
            </a>
          ))}
          <button
            onClick={onEnter}
            className="mt-3 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white"
          >
            Access Platform →
          </button>
        </div>
      )}
    </header>
  );
};
