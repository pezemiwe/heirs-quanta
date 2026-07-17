import { useCallback, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  History,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Modal } from "../../../components/shared/modal";
import { FileUploadLoader } from "../../../components/shared/file-upload-loader";
import { useInstrumentBook } from "../../../context/instrument-book";

export function ImportBookModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { importWorkbook, resolveImportConflict, clear, removeBatch, importState, batches } =
    useInstrumentBook();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const phase = importState.phase;
  const isProcessing =
    phase === "reading" || phase === "parsing" || phase === "validating";
  const isDone = phase === "done";
  const isError = phase === "error";
  const isConflict = phase === "conflict";

  const handlePick = useCallback(
    (file: File | null | undefined) => {
      if (file) {
        void importWorkbook(file);
      }
    },
    [importWorkbook],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setDragging(false), []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handlePick(e.dataTransfer.files[0]);
    },
    [handlePick],
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handlePick(e.target.files?.[0]);
    e.target.value = "";
  };

  const totalParsed = importState.summary.reduce(
    (sum, sheet) => sum + sheet.rowsParsed,
    0,
  );
  const latestBatches = [...batches].reverse().slice(0, 5);
  const unrecognizedSheets = importState.unrecognizedSheets;
  const sheetsWithWarnings = importState.summary.filter(
    (sheet) => sheet.warnings.length > 0,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={isProcessing ? () => {} : onClose}
      title="Import Portfolio Book"
      description="Upload an .xlsx workbook or a single .csv sheet from Deal Capture. Each upload is appended as a tracked batch."
      size="lg"
      closeOnOverlay={!isProcessing}
    >
      <div className="space-y-5 px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
        {(phase === "idle" || phase === "error") && (
          <>
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-border bg-light-gray/40 hover:border-primary/60"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-dark-gray">
                  {dragging ? "Drop the file here" : "Drag & drop your workbook"}
                </p>
                <p className="mt-1 text-xs text-dark-gray/50">
                  .xlsx or .csv · each upload is appended as a tracked batch
                </p>
              </div>
              <span className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-dark-gray/70">
                Browse file
              </span>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={onFileChange}
                className="sr-only"
              />
            </div>

            {isError && importState.error && (
              <div className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/5 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                <p className="text-sm text-danger">{importState.error}</p>
              </div>
            )}


          </>
        )}

        {isProcessing && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                <FileSpreadsheet className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-dark-gray">
                  {importState.currentStep}
                </p>
                <p className="mt-1 text-xs text-dark-gray/50">
                  {importState.fileName}
                </p>
              </div>
            </div>
            <FileUploadLoader
              progress={importState.progress}
              label={importState.currentStep}
              tone={isError ? "error" : isDone ? "success" : "neutral"}
              className="mx-auto max-w-sm"
            />
          </div>
        )}

        {isConflict && importState.conflictData && (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Duplicate Instruments Detected
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  {importState.conflictData.overlapCount} of {totalParsed} instruments in this file already exist in the book. Uploading will add duplicates.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => resolveImportConflict("replace")}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-mid-red"
              >
                Replace matching batch
              </button>
              <button
                onClick={() => resolveImportConflict("append")}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-dark-gray hover:border-primary hover:text-primary"
              >
                Import anyway (append)
              </button>
            </div>
          </div>
        )}

        {isDone && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/5 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
              <div>
                <p className="text-sm font-semibold text-dark-gray">
                  {totalParsed} instruments imported successfully
                </p>
                <p className="text-xs text-dark-gray/60">
                  {importState.fileName} · uploaded to the shared platform book
                </p>
              </div>
            </div>

            {importState.summary.length > 0 && (
              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-dark-gray/50">
                  Sheets processed
                </div>
                <ul className="space-y-1 text-xs text-dark-gray/70">
                  {importState.summary.map((sheet) => (
                    <li key={sheet.sheetName} className="flex justify-between gap-3">
                      <span>
                        {sheet.sheetName}{" "}
                        <span className="text-dark-gray/45">({sheet.detectedType})</span>
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {sheet.rowsParsed} parsed
                        {sheet.rowsSkipped > 0 ? ` · ${sheet.rowsSkipped} skipped` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {unrecognizedSheets.length > 0 && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-amber-800">
                    {unrecognizedSheets.length} sheet
                    {unrecognizedSheets.length === 1 ? "" : "s"} not recognized
                    and skipped
                  </p>
                  <ul className="space-y-0.5 text-xs text-amber-700">
                    {unrecognizedSheets.map((sheet) => (
                      <li key={sheet.sheetName}>
                        {sheet.sheetName} ({sheet.rowCount} row
                        {sheet.rowCount === 1 ? "" : "s"})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {sheetsWithWarnings.length > 0 && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" /> Sheet warnings
                </div>
                <div className="space-y-3">
                  {sheetsWithWarnings.map((sheet) => (
                    <div key={sheet.sheetName}>
                      <p className="text-xs font-semibold text-amber-800">
                        {sheet.sheetName}
                      </p>
                      <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-xs text-amber-700">
                        {sheet.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-dark-gray/50">
                <History className="h-3.5 w-3.5" /> Recent batches
              </div>
              {latestBatches.length === 0 ? (
                <p className="text-xs text-dark-gray/50">No upload batches recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {latestBatches.map((batch) => (
                    <div
                      key={batch.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-light-gray/20 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-dark-gray">
                          {batch.fileName}
                        </p>
                        <p className="text-xs text-dark-gray/50">
                          {batch.instrumentsAdded} instruments
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] text-dark-gray/45">
                          {new Date(batch.importedAt).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeBatch(batch.id)}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-danger"
                          title="Delete this batch"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
              <RefreshCw className="h-5 w-5 shrink-0 text-dark-gray/40" />
              <div className="flex-1">
                <p className="text-sm font-medium text-dark-gray">Refresh platform state</p>
                <p className="text-xs text-dark-gray/50">
                  Clear every uploaded batch and return all modules to empty state until a new upload is done.
                </p>
              </div>
              <button
                onClick={() => {
                  clear();
                  onClose();
                }}
                className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-dark-gray/70 hover:border-primary hover:text-primary"
              >
                Refresh
              </button>
            </div>

            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs text-dark-gray/60 hover:border-primary hover:text-primary"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Upload another batch
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={onFileChange}
              className="sr-only"
            />
          </div>
        )}
      </div>

      {!isProcessing && (
        <div className="flex justify-end border-t border-border px-4 py-3 sm:px-6">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-mid-red"
          >
            {isDone ? "Close" : "Cancel"}
          </button>
        </div>
      )}
    </Modal>
  );
}