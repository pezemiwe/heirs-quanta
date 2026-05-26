import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { X } from "lucide-react";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export type ModalSize = "sm" | "md" | "lg" | "xl";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  closeOnOverlay?: boolean;
};

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnOverlay = true,
}: ModalProps) => {
  useEffect(() => {
    if (!isOpen) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-dark-gray/40 backdrop-blur-[2px]"
        onClick={closeOnOverlay ? onClose : undefined}
      />
      <div
        className={cn(
          "relative z-10 flex w-full flex-col rounded-2xl border border-border bg-surface shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] max-h-[calc(100vh-3rem)] overflow-hidden",
          sizeClasses[size],
        )}
      >
        {(title || description) && (
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-5">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="text-base font-semibold text-dark-gray"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-dark-gray/60">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-dark-gray/50 transition-colors hover:bg-pale-red hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/45"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-border px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
