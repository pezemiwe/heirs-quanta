import { Building2 } from "lucide-react";
import { FOOTER_LINK_GROUPS } from "../data";

export const Footer = () => (
  <footer className="border-t border-border bg-white">
    <div className="mx-auto max-w-[1440px] px-4 py-12 lg:px-6">
      <div className="grid gap-10 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="mb-4 flex items-center gap-2.5">
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
          <p className="text-xs leading-relaxed text-dark-gray/45">
            Enterprise financial analytics platform for the Heirs Holdings
            Group. Portfolio management, IFRS 9 & ECL, and valuation in one
            integrated environment.
          </p>
        </div>

        {FOOTER_LINK_GROUPS.map(([group, links]) => (
          <div key={group}>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-dark-gray/50">
              {group}
            </p>
            <ul className="list-none space-y-2.5 p-0">
              {links.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-xs text-dark-gray/45 no-underline transition-colors hover:text-dark-gray"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
        <p className="text-xs text-dark-gray/35">
          © {new Date().getFullYear()} Heirs Holdings Group. All rights
          reserved. For internal use only.
        </p>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-1.5">
          <Building2 className="h-3.5 w-3.5 text-dark-gray/35" />
          <span className="text-xs text-dark-gray/40">Built by</span>
          <span className="text-xs font-bold text-dark-gray/65">Deloitte</span>
        </div>
      </div>
    </div>
  </footer>
);
