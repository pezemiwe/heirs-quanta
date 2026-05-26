import type { ReactNode } from "react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

type SectionCardProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  noPadding?: boolean;
  className?: string;
};

export const SectionCard = ({
  title,
  description,
  actions,
  children,
  noPadding = false,
  className,
}: SectionCardProps) => {
  const hasHeader = !!(title || description || actions);
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.05)]",
        className,
      )}
    >
      {hasHeader && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h3 className="text-sm font-semibold text-dark-gray">{title}</h3>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-dark-gray/55">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </div>
  );
};
