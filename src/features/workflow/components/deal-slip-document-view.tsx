import { useCallback, useEffect, useRef } from "react";
import { Download, Printer, X } from "lucide-react";
import type { DealSlip } from "../types";
import { DealSlipDocument } from "./deal-slip-document";
import { downloadDealSlipPdf } from "../utils/download-deal-slip";

const PRINT_BODY_CLASS = "deal-slip-print-active";

/**
 * Printable deal-slip document with Download PDF and Print actions.
 * Static presentational view only — no workflow actions.
 */
export function DealSlipDocumentView({
  slip,
  onClose,
  embedded = false,
}: {
  slip: DealSlip;
  onClose?: () => void;
  /** When true, renders inline without modal chrome (e.g. post-submit page). */
  embedded?: boolean;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    document.body.classList.add(PRINT_BODY_CLASS);
    window.print();
  }, []);

  useEffect(() => {
    const reset = () => document.body.classList.remove(PRINT_BODY_CLASS);
    window.addEventListener("afterprint", reset);
    return () => {
      window.removeEventListener("afterprint", reset);
      reset();
    };
  }, []);

  const toolbar = (
    <div className="deal-slip-toolbar flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
          Deal slip
        </p>
        <p className="font-mono text-sm font-bold text-dark-gray">{slip.id}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => downloadDealSlipPdf(slip)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-dark-gray shadow-sm hover:border-primary hover:text-primary"
        >
          <Download className="h-3.5 w-3.5" />
          Download PDF
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-dark-gray shadow-sm hover:border-primary hover:text-primary"
        >
          <Printer className="h-3.5 w-3.5" />
          Print
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-dark-gray/50 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );

  const body = (
    <div ref={printRef} className="deal-slip-print-target rounded-xl bg-[#EDECEA] p-4 sm:p-6">
      <DealSlipDocument slip={slip} />
    </div>
  );

  if (embedded) {
    return (
      <div className="deal-slip-document-view space-y-3">
        {toolbar}
        {body}
      </div>
    );
  }

  return (
    <div className="deal-slip-document-view flex max-h-[85vh] flex-col gap-4">
      {toolbar}
      <div className="min-h-0 flex-1 overflow-y-auto">{body}</div>
    </div>
  );
}
