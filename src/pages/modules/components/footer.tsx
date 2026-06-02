import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-white py-5">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-dark-gray/30">
            © {new Date().getFullYear()} Heirs Holdings Group. For authorised
            internal use only.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-dark-gray/30">
            <Shield className="h-3 w-3" />
            <span>CBN Compliant · IFRS 9 Ready · Audit-Trail Enabled</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
