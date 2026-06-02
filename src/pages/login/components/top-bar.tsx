import { ArrowLeft } from "lucide-react";

interface TopBarProps {
  onBack: () => void;
}

export function TopBar({ onBack }: TopBarProps) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-8 sm:py-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-dark-gray/50 transition-colors hover:text-dark-gray"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      {/* Logo (mobile only) */}
      <div className="flex items-center gap-2 lg:hidden">
        <img
          src="/Heirs.png"
          alt="Heirs Holdings"
          className="h-7 w-7 object-contain"
          draggable={false}
        />
        <span className="text-sm font-bold text-primary">Heirs Quanta</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        <span className="text-xs font-medium text-dark-gray/45">
          Secure login
        </span>
      </div>
    </div>
  );
}
