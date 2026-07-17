import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, RotateCcw, Upload, Layers, ArrowRight } from "lucide-react";
import { GovernanceBar } from "../../../components/shared/governance-bar";
import { useInstrumentBook } from "../../../context/instrument-book";
import { ImportBookModal } from "../components/import-book-modal";
import { DealSlipWorkspace } from "../../workflow/components/deal-slip-workspace";
import { DealSlipDocumentView } from "../../workflow/components/deal-slip-document-view";
import { ChecksPanel } from "../../workflow/components/checks-panel";
import { StatusTimeline } from "../../workflow/components/status-timeline";
import type { DealSlip } from "../../workflow/types";

export function NewBooking() {
  const navigate = useNavigate();
  const [importOpen, setImportOpen] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState<DealSlip | null>(null);
  const book = useInstrumentBook();

  if (justSubmitted) {
    return (
      <div className="space-y-6 p-3 sm:p-4 md:p-6 xl:p-8">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-8 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-7 w-7 text-success" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-dark-gray">Deal Slip Submitted for Review</p>
            <p className="mt-1 text-sm text-gray-400">
              {justSubmitted.economics.instrumentName} is now in the maker-checker queue. Reference:{" "}
              <span className="font-mono font-semibold">{justSubmitted.id}</span> - it will not appear in the
              investment register, Valuation, Duration Risk, or Accounting until it has been reviewed, approved,
              and settled.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setJustSubmitted(null)}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-gray-500 hover:bg-pale-red hover:text-primary"
            >
              <RotateCcw className="h-4 w-4" /> Book another deal
            </button>
            <button
              onClick={() => navigate("/deal-capture/blotter")}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red"
            >
              View in Blotter <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <DealSlipDocumentView slip={justSubmitted} embedded />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-dark-gray">Automated Control Checks</h2>
            <ChecksPanel slip={justSubmitted} />
          </div>
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-dark-gray">Status Timeline</h2>
            <StatusTimeline slip={justSubmitted} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8">
      <GovernanceBar
        requiredPermission="deal.create"
        context="maker"
        contextNote="Submit deal slip → Under Review → Approved → Pending Settlement → Settled"
        showPendingApprovals
      />

      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Deal Capture</p>
            <h1 className="mt-1 text-2xl font-bold text-dark-gray">Deal Capture</h1>
            <p className="mt-1 text-sm text-gray-500">
              No investment transaction exists outside a deal slip. Capture the deal below - it enters the
              maker-checker workflow and only reaches the investment register once fully approved and settled.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-dark-gray hover:border-primary hover:text-primary"
          >
            <Upload className="h-4 w-4" /> Import Portfolio Book (opening balances)
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-dark-gray">
          <Layers className="h-4 w-4 text-primary" /> Bulk workbook upload is separate from deal capture
        </div>
        <p className="mt-2 text-sm text-dark-gray/60">
          Use "Import Portfolio Book" only to load an existing back-book of historical holdings - those instruments
          bypass the deal slip workflow because they were not new transactions executed today.
          {book.hasData && (
            <> The shared book currently holds {book.instruments.length} instrument{book.instruments.length === 1 ? "" : "s"} in total.</>
          )}
        </p>
      </div>

      <DealSlipWorkspace onSubmitted={(slip) => setJustSubmitted(slip)} />

      <ImportBookModal isOpen={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
