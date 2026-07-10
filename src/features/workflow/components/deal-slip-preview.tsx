import { useRef } from "react";
import { Download, Printer } from "lucide-react";
import type { DealSlip } from "../types";
import { DealSlipDocument } from "./deal-slip-document";
import { downloadDealSlipPdf } from "../utils/download-deal-slip";

export function DealSlipPreview({ slip }: { slip: DealSlip }) {
  const slipRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const el = slipRef.current;
    if (!el) return;
    const win = window.open("", "_blank", "width=640,height=900");
    if (!win) return;
    win.document.write(
      `<!DOCTYPE html><html><head><title>${slip.id} Deal Slip</title>
      <style>
        body{margin:0;padding:24px;background:#f5efef;display:flex;justify-content:center}
        @media print{body{background:white;padding:0}}
      </style></head>
      <body>${el.outerHTML}</body></html>`,
    );
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
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
      </div>
      <div className="rounded-xl bg-[#EDECEA] p-4 sm:p-6">
        <DealSlipDocument ref={slipRef} slip={slip} />
      </div>
    </div>
  );
}
