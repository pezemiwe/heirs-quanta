import * as XLSX from "xlsx";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  Search,
  Filter,
  Download,
  Pencil,
  Trash2,
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Database,
  ChevronRight,
  RefreshCw,
  Layers,
} from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge } from "../../../components/shared/badge";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { AcronymTip } from "../../../components/shared/acronym-tip";
import { RowDetailModal } from "../../../components/shared/row-detail-modal";
import { Modal } from "../../../components/shared/modal";
import { FileUploadLoader } from "../../../components/shared/file-upload-loader";
import { useInstrumentBook } from "../../../context/instrument-book";
import {
  BOOK_INSTRUMENTS,
  BOOK_COMPUTED,
  fmtCompact,
  fmtPct,
  fmtDate,
} from "../../portfolio/engine/book-compute";
import type { Instrument } from "../../portfolio/engine/book-compute";

const CLF_COLOR: Record<string, "info" | "success" | "warning"> = {
  AC: "info",
  FVOCI: "success",
  FVTPL: "warning",
};

type Row = Instrument & Record<string, unknown>;

/* ─────────────────────────────────────────────────────────────
   Import Book Modal
   ───────────────────────────────────────────────────────────── */

function ImportBookModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { importWorkbook, loadDemo, importState, source } = useInstrumentBook();
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const phase = importState.phase;
  const isProcessing =
    phase === "reading" || phase === "parsing" || phase === "validating";
  const isDone = phase === "done";
  const isError = phase === "error";

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) importWorkbook(f);
    },
    [importWorkbook],
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) importWorkbook(f);
    e.target.value = "";
  };

  const progressTone: "error" | "success" | "neutral" =
    isError ? "error" : isDone ? "success" : "neutral";

  const totalParsed = importState.summary.reduce(
    (s, sh) => s + sh.rowsParsed,
    0,
  );
  const totalWarnings = importState.summary.reduce(
    (s, sh) => s + sh.warnings.length,
    0,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={isProcessing ? () => {} : onClose}
      title="Import Portfolio Book"
      description="Upload the Heirs Holdings investment workbook (.xlsx) or a single sheet (.csv) to populate all platform modules."
      size="lg"
      closeOnOverlay={!isProcessing}
    >
      <div className="space-y-5 px-4 pb-4 sm:px-6 sm:pb-6 pt-2">

        {(phase === "idle" || phase === "error") && (
          <>
            <div
              ref={dropRef}
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
                  .xlsx (full workbook) or .csv (single sheet) · Max 50 MB
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

            <div className="rounded-lg border border-border bg-light-gray/30 p-4">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-dark-gray/50">
                Recognised Sheets
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-4">
                {["FGN Bonds","State Bonds","Corporate Bonds","Treasury Bills","Placements USD","Placements <90d","Quoted Equity"].map((s) => (
                  <div key={s} className="flex items-center gap-1.5 text-xs text-dark-gray/70">
                    <ChevronRight className="h-3 w-3 text-primary/60" />
                    {s}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
              <Database className="h-5 w-5 shrink-0 text-dark-gray/40" />
              <div className="flex-1">
                <p className="text-sm font-medium text-dark-gray">Use demo dataset</p>
                <p className="text-xs text-dark-gray/50">
                  Load the built-in reference portfolio ({BOOK_INSTRUMENTS.length} instruments) across all modules.
                </p>
              </div>
              <button
                onClick={() => { loadDemo(); onClose(); }}
                className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-dark-gray/70 hover:border-primary hover:text-primary"
              >
                Load demo
              </button>
            </div>
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
                <p className="text-sm font-semibold text-dark-gray">{importState.currentStep}</p>
                <p className="mt-1 text-xs text-dark-gray/50">{importState.fileName}</p>
              </div>
            </div>
            <FileUploadLoader
              progress={importState.progress}
              label={importState.currentStep}
              tone={progressTone}
              className="mx-auto max-w-sm"
            />
            <div className="flex items-center justify-center gap-2">
              {(["reading", "parsing", "validating"] as const).map((p) => (
                <span
                  key={p}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium capitalize transition-colors ${
                    phase === p
                      ? "bg-primary text-white"
                      : importState.progress > (p === "reading" ? 25 : p === "parsing" ? 80 : 95)
                        ? "bg-success/15 text-success"
                        : "bg-light-gray text-dark-gray/40"
                  }`}
                >
                  {p === "reading" ? "Reading" : p === "parsing" ? "Parsing" : "Validating"}
                </span>
              ))}
            </div>
          </div>
        )}

        {isDone && importState.summary.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/5 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
              <div>
                <p className="text-sm font-semibold text-dark-gray">
                  {totalParsed} instruments imported successfully
                </p>
                <p className="text-xs text-dark-gray/60">
                  {importState.fileName} · {totalWarnings > 0 ? `${totalWarnings} warning${totalWarnings > 1 ? "s" : ""}` : "No warnings"} · All modules updated
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-light-gray/50">
                    <th className="py-2.5 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-dark-gray/50">Sheet</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-dark-gray/50">Detected as</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-dark-gray/50">Parsed</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-dark-gray/50">Skipped</th>
                    <th className="py-2.5 pl-3 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-dark-gray/50">Warns</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {importState.summary.map((sh) => (
                    <tr key={sh.sheetName} className="hover:bg-light-gray/20">
                      <td className="py-2.5 pl-4 pr-3 font-medium text-dark-gray">{sh.sheetName}</td>
                      <td className="px-3 py-2.5 text-dark-gray/70">{sh.detectedType}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-dark-gray">{sh.rowsParsed}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-dark-gray/50">{sh.rowsSkipped > 0 ? sh.rowsSkipped : "—"}</td>
                      <td className="py-2.5 pl-3 pr-4 text-right">
                        {sh.warnings.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-amber-600">
                            <AlertTriangle className="h-3 w-3" />{sh.warnings.length}
                          </span>
                        ) : (
                          <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-success" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-light-gray/40">
                    <td colSpan={2} className="py-2.5 pl-4 pr-3 text-xs font-semibold text-dark-gray/60">Total</td>
                    <td className="px-3 py-2.5 text-right text-xs font-semibold font-mono text-dark-gray">{totalParsed}</td>
                    <td colSpan={2} className="px-3 py-2.5 text-right text-xs text-dark-gray/40">{totalWarnings > 0 ? `${totalWarnings} warnings` : "Clean"}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="rounded-lg border border-border bg-light-gray/30 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-dark-gray/50">Live in all modules</p>
              <div className="flex flex-wrap gap-2">
                {["Portfolio","IFRS 9","Valuation","Duration Risk","Accounting","Reporting"].map((m) => (
                  <span key={m} className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                    <CheckCircle2 className="h-3 w-3" />{m}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs text-dark-gray/60 hover:border-primary hover:text-primary"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Upload a different file
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onFileChange} className="sr-only" />
          </div>
        )}

        {isDone && importState.summary.length === 0 && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/5 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
              <div>
                <p className="text-sm font-semibold text-dark-gray">Portfolio book is loaded</p>
                <p className="text-xs text-dark-gray/60">
                  Source: {importState.fileName} · {source === "demo" ? "Demo dataset" : "Imported"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs font-medium text-dark-gray/70 hover:border-primary hover:text-primary"
              >
                <Upload className="h-3.5 w-3.5" /> Upload new file
              </button>
              <button
                onClick={() => { loadDemo(); onClose(); }}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs font-medium text-dark-gray/70 hover:border-primary hover:text-primary"
              >
                <Database className="h-3.5 w-3.5" /> Reload demo
              </button>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onFileChange} className="sr-only" />
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

/* ─────────────────────────────────────────────────────────────
   Trade Blotter
   ───────────────────────────────────────────────────────────── */

export function DealBlotter() {
  const book = useInstrumentBook();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [clfFilter, setClfFilter] = useState("All");
  const [selected, setSelected] = useState<Row | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    if (book.instruments.length > 0) {
      setInstruments(book.instruments as Instrument[]);
    } else {
      setInstruments([...BOOK_INSTRUMENTS]);
    }
  }, [book.instruments]);

  const types = useMemo(
    () => ["All", ...Array.from(new Set(instruments.map((i) => i.instrumentType))).sort()],
    [instruments],
  );

  const rows = useMemo<Row[]>(() => {
    return instruments.filter((i) => {
      const matchType = typeFilter === "All" || i.instrumentType === typeFilter;
      const matchClf = clfFilter === "All" || i.classification === clfFilter;
      const q = search.toLowerCase();
      return matchType && matchClf && (!q || i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q) || i.issuer.toLowerCase().includes(q));
    }) as Row[];
  }, [instruments, search, typeFilter, clfFilter]);

  const totals = BOOK_COMPUTED.totals;

  const cols: DataTableColumn<Row>[] = [
    { key: "id", header: "ID", width: "90px" },
    { key: "name", header: "Instrument Name" },
    { key: "instrumentType", header: "Type", render: (r) => <Badge variant="neutral" size="sm">{r.instrumentType}</Badge> },
    { key: "issuer", header: "Issuer / Counterparty" },
    {
      key: "classification", header: "Classification",
      render: (r) => (
        <AcronymTip term={r.classification}>
          <Badge variant={CLF_COLOR[r.classification]} size="sm">{r.classification}</Badge>
        </AcronymTip>
      ),
    },
    { key: "currency", header: "CCY", width: "60px" },
    { key: "faceValue", header: "Face Value", align: "right", render: (r) => fmtCompact(r.faceValue) },
    {
      key: "couponRate", header: "Coupon", align: "right",
      render: (r) => r.couponRate > 0 ? fmtPct(r.couponRate) : <span className="text-gray-400">Disc.</span>,
    },
    { key: "couponFrequency", header: "Freq", width: "80px" },
    { key: "purchaseDate", header: "Purchase", render: (r) => fmtDate(r.purchaseDate) },
    { key: "maturityDate", header: "Maturity", render: (r) => fmtDate(r.maturityDate) },
    {
      key: "impairmentStage", header: "Stage",
      render: (r) => {
        const stage = r.impairmentStage ?? "N/A";
        const v = stage === "Stage 1" ? "stage1" : stage === "Stage 2" ? "stage2" : stage === "Stage 3" ? "stage3" : "neutral";
        return <Badge variant={v as never} size="sm">{stage}</Badge>;
      },
    },
    { key: "status", header: "Status", render: (r) => <Badge variant="performing" size="sm">{r.status}</Badge> },
    {
      key: "_actions" as never, header: "", width: "72px",
      render: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setEditing(r)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary" title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setDeleting(r)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-danger" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const exportXlsx = () => {
    const headers = ["ID","Instrument","Issuer","Type","Sector","Classification","Currency","Face Value","Purchase Price","Purchase Date","Maturity Date","Coupon Rate %","Coupon Frequency","Status","Stage"];
    const data = rows.map((r) => [r.id,r.name,r.issuer,r.instrumentType,r.sector,r.classification,r.currency,r.faceValue,r.purchasePrice,r.purchaseDate,r.maturityDate,r.couponRate > 0 ? +(r.couponRate * 100).toFixed(4) : 0,r.couponFrequency,r.status,r.impairmentStage ?? ""]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trade Blotter");
    XLSX.writeFile(wb, `trade-blotter-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const sourceLabel = book.source === "demo" ? "Demo dataset" : book.source === "uploaded" ? (book.importState.fileName ?? "Uploaded book") : "No book loaded";

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">Trade Blotter</h1>
          <p className="mt-1 text-sm text-dark-gray/60">
            {rows.length} of {instruments.length} instruments ·{" "}
            <span className={`font-medium ${book.source === "uploaded" ? "text-success" : "text-dark-gray/50"}`}>{sourceLabel}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red"
          >
            <Layers className="h-4 w-4" />
            {book.hasData ? "Manage Book" : "Import Portfolio Book"}
          </button>
          <button
            onClick={exportXlsx}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-dark-gray/70 hover:border-primary hover:text-primary"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {!book.hasData && (
        <div
          onClick={() => setImportOpen(true)}
          className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 hover:border-primary/50 transition-colors"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Import your Portfolio Book to get started</p>
            <p className="text-xs text-dark-gray/50">Upload the Heirs Holdings .xlsx workbook or load the demo dataset — all modules populate automatically.</p>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-primary/60 shrink-0" />
        </div>
      )}

      <StatCardGrid>
        <StatCard title="Total Instruments" value={String(instruments.length)} subtitle={book.source === "uploaded" ? "Imported from workbook" : "Portfolio Management book"} variant="highlight" />
        <StatCard title="Total Face Value" value={fmtCompact(totals.totalFaceValueNGN)} subtitle="NGN equivalent" variant="default" />
        <StatCard title="Total Book Value" value={fmtCompact(totals.totalBSValueNGN)} subtitle="Balance-sheet carrying amount" variant="default" />
        <StatCard title="Filtered Rows" value={String(rows.length)} subtitle="After current filters" variant="default" />
      </StatCardGrid>

      <SectionCard title="Instrument Book">
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, name or issuer…"
              className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-sm text-dark-gray placeholder-gray-400 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray focus:border-primary focus:outline-none">
              {types.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select value={clfFilter} onChange={(e) => setClfFilter(e.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray focus:border-primary focus:outline-none">
              <option value="All">All Classifications</option>
              <option value="AC">AC — Amortised Cost</option>
              <option value="FVOCI">FVOCI — Fair Value (OCI)</option>
              <option value="FVTPL">FVTPL — Fair Value (P&L)</option>
            </select>
          </div>
        </div>
        <DataTable<Row> columns={cols} data={rows} keyExtractor={(r) => r.id} emptyMessage="No instruments match your filters" pageSize={20} onRowClick={setSelected} />
      </SectionCard>

      <ImportBookModal isOpen={importOpen} onClose={() => setImportOpen(false)} />

      <RowDetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Instrument Detail"}
        subtitle={selected?.id}
        fields={selected ? [
          { label: "ID", value: selected.id },
          { label: "Type", value: <Badge variant="neutral" size="sm">{selected.instrumentType}</Badge> },
          { label: "Issuer / Counterparty", value: selected.issuer },
          { label: "Classification", value: <AcronymTip term={selected.classification}><Badge variant={CLF_COLOR[selected.classification]} size="sm">{selected.classification}</Badge></AcronymTip> },
          { label: "Currency", value: selected.currency },
          { label: "Face Value", value: fmtCompact(selected.faceValue) },
          { label: "Coupon Rate", value: selected.couponRate > 0 ? fmtPct(selected.couponRate) : "Discount" },
          { label: "Coupon Frequency", value: selected.couponFrequency },
          { label: "Purchase Date", value: fmtDate(selected.purchaseDate) },
          { label: "Maturity Date", value: fmtDate(selected.maturityDate) },
          { label: "Stage", value: selected.impairmentStage ?? "N/A" },
          { label: "Status", value: <Badge variant="performing" size="sm">{selected.status}</Badge> },
        ] : []}
      />

      {editing && (
        <EditBlotterDrawer
          row={editing}
          onSave={(patch) => { setInstruments((prev) => prev.map((i) => (i.id === editing.id ? { ...i, ...patch } : i))); setEditing(null); }}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleting(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-dark-gray">Remove Trade</h3>
            <p className="mt-2 text-sm text-gray-500">
              Remove <span className="font-medium text-dark-gray">{String(deleting.name)}</span> ({String(deleting.id)}) from the blotter?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setDeleting(null)} className="rounded-lg border border-border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => { setInstruments((prev) => prev.filter((i) => i.id !== String(deleting.id))); setDeleting(null); }}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red"
              >Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── edit blotter drawer ───────────────────────────────── */
const inputCls = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

function EditBlotterDrawer({ row, onSave, onClose }: { row: Row; onSave: (patch: Partial<Instrument>) => void; onClose: () => void }) {
  const [name, setName] = useState(String(row.name ?? ""));
  const [issuer, setIssuer] = useState(String(row.issuer ?? ""));
  const [faceValue, setFaceValue] = useState(Number(row.faceValue ?? 0));
  const [couponRate, setCouponRate] = useState(Number(row.couponRate ?? 0));
  const [stage, setStage] = useState(String(row.impairmentStage ?? "Stage 1"));
  const [status, setStatus] = useState(String(row.status ?? "Active"));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-dark-gray">Edit Trade</h3>
            <p className="mt-0.5 text-xs text-gray-500">{String(row.id)}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Instrument Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Issuer / Counterparty</label>
            <input value={issuer} onChange={(e) => setIssuer(e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Face Value (NGN)</label>
              <input type="number" value={faceValue} onChange={(e) => setFaceValue(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Coupon Rate</label>
              <input type="number" step="0.001" value={couponRate} onChange={(e) => setCouponRate(Number(e.target.value))} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Impairment Stage</label>
              <select value={stage} onChange={(e) => setStage(e.target.value)} className={inputCls}>
                <option>Stage 1</option><option>Stage 2</option><option>Stage 3</option><option>N/A</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                <option>Active</option><option>Matured</option><option>Disposed</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onSave({ name, issuer, faceValue, couponRate, impairmentStage: stage as never, status: status as never })}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red"
          >Save Changes</button>
        </div>
      </div>
    </div>
  );
}
