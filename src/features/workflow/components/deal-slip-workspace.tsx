import { useMemo, useState } from "react";
import { Save, Send, RotateCcw, Paperclip, X, Info, Loader2, ShieldAlert, Trash2, FileText } from "lucide-react";
import { usePersona } from "../../../context/persona";
import { useGovernance } from "../../../context/governance";
import { useInstrumentBook } from "../../../context/instrument-book";
import { usePortfolioRegistry } from "../../portfolio/portfolio-registry";
import { ConfirmDialog } from "../../../components/shared/confirm-dialog";
import { Modal } from "../../../components/shared/modal";
import { useWorkflow } from "../store";
import { isEditable } from "../engine/transitions";
import { runLimitCheck, runDoACheck } from "../engine/checks";
import { LimitAlertsFromChecks } from "./limit-alerts";
import { DealSlipDocumentView } from "./deal-slip-document-view";
import type { AssetClass, DealDocument, DealEconomics, DealSlip } from "../types";

const ASSET_CLASSES: AssetClass[] = [
  "FGN Bond",
  "State Bond",
  "Corporate Bond",
  "Eurobond",
  "Treasury Bill",
  "Commercial Paper",
  "Bank Placement",
  "Fixed Deposit",
  "Equity",
  "Sukuk",
  "Mutual Fund",
];
const CURRENCIES = ["NGN", "USD", "GBP", "EUR"] as const;
const CLASSIFICATIONS = [
  { value: "AC", label: "Amortised Cost (AC)" },
  { value: "FVOCI", label: "Fair Value through OCI (FVOCI)" },
  { value: "FVTPL", label: "Fair Value through P&L (FVTPL)" },
];
const IFRS13_LEVELS = [
  { value: "L1", label: "Level 1" },
  { value: "L2", label: "Level 2" },
  { value: "L3", label: "Level 3" },
];
const FREQ_OPTIONS = ["Monthly", "Quarterly", "Semi", "Annual", "Zero"];
const SECTORS = [
  "Federal Government",
  "Banking",
  "Telecoms",
  "Oil & Gas",
  "Consumer Goods",
  "Real Estate",
  "Infrastructure",
  "Utilities",
];
const RATINGS = ["", "AAA", "AA", "A", "BBB", "BB+", "BB", "BB-", "B+", "B", "B-", "CCC+", "CCC", "CCC-", "D"];

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY_ECONOMICS: DealEconomics = {
  assetClass: "FGN Bond",
  isin: "",
  instrumentName: "",
  issuer: "",
  sector: "Federal Government",
  currency: "NGN",
  classification: "AC",
  ifrs13Level: "L2",
  faceValue: 0,
  purchasePriceDecimal: 1,
  purchaseYield: undefined,
  couponRate: 0,
  couponFrequency: "Semi",
  dayCount: "Actual/365",
  discountRate: undefined,
  purchaseDate: today(),
  maturityDate: "",
  settlementDate: today(),
  custodian: "",
  counterparty: "",
  portfolioBook: "Trading Book",
  creditRating: "",
  notes: "",
};

function toNum(v: string, fallback = 0) {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function FieldLabel({ children, tip }: { children: React.ReactNode; tip?: string }) {
  return (
    <label className="flex items-center gap-1 text-xs font-medium text-gray-500">
      {children}
      {tip && <Info className="h-3 w-3 cursor-help text-gray-400" aria-label={tip} />}
    </label>
  );
}

const inputCls =
  "mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-gray-300 disabled:bg-gray-50 disabled:text-gray-400";

function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls}
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: (string | { value: string; label: string })[];
  disabled?: boolean;
}) {
  return (
    <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      {options.map((o) => {
        const val = typeof o === "string" ? o : o.value;
        const lbl = typeof o === "string" ? o : o.label;
        return (
          <option key={val} value={val}>
            {lbl}
          </option>
        );
      })}
    </select>
  );
}

interface DealSlipWorkspaceProps {
  /** Omit / null for create mode. Pass an existing slip to edit it (only Draft / Returned for Amendment are editable). */
  slip?: DealSlip | null;
  onCreated?: (slip: DealSlip) => void;
  onSubmitted?: (slip: DealSlip) => void;
  onSaved?: () => void;
}

export function DealSlipWorkspace({ slip, onCreated, onSubmitted, onSaved }: DealSlipWorkspaceProps) {
  const { persona } = usePersona();
  const { hasPermission } = useGovernance();
  const { getPortfolioNames } = usePortfolioRegistry();
  const { createDealSlip, updateEconomics, submitDealSlip, getDealSlip, removeDraft } = useWorkflow();
  const instrumentBook = useInstrumentBook();

  const canCreate = hasPermission(persona.role, "deal.create");
  const editable = slip ? isEditable(slip.status) : true;
  const portfolios = getPortfolioNames();

  const [form, setForm] = useState<DealEconomics>(slip?.economics ?? EMPTY_ECONOMICS);
  const [attachments, setAttachments] = useState<DealDocument[]>(slip?.documents ?? []);
  const [busy, setBusy] = useState<"draft" | "submit" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showDocument, setShowDocument] = useState(false);

  const set = <K extends keyof DealEconomics>(field: K) => (v: DealEconomics[K]) =>
    setForm((f) => ({ ...f, [field]: v }));

  // Live preview of the single-issuer concentration check - recomputed as the
  // trader types, so a limit issue is visible before they ever submit, not
  // just after the real check run. Same rule the store uses on submit.
  const livePreviewChecks = useMemo(() => {
    const existingBookFaceValueNGN = instrumentBook.instruments.reduce((sum, i) => sum + i.faceValue, 0);
    return [
      runLimitCheck(form, existingBookFaceValueNGN),
      runDoACheck(form, persona.tradingLimit)
    ];
  }, [form, instrumentBook.instruments, persona.tradingLimit]);

  if (slip && !editable) {
    // Read-only summary once the slip has moved past Draft / Returned for Amendment.
    return (
      <>
        <div className="space-y-4">
          {slip.status !== "Draft" && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowDocument(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-dark-gray hover:border-primary hover:text-primary"
              >
                <FileText className="h-3.5 w-3.5" />
                View as Document
              </button>
            </div>
          )}
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
          {[
            ["Asset Class", form.assetClass],
            ["Instrument", form.instrumentName],
            ["Issuer", form.issuer],
            ["Classification", form.classification],
            ["Currency", form.currency],
            ["Face Value", form.faceValue.toLocaleString()],
            ["Clean Price", form.purchasePriceDecimal.toFixed(4)],
            ["Coupon Rate", `${(form.couponRate * 100).toFixed(3)}%`],
            ["Purchase Date", form.purchaseDate],
            ["Maturity Date", form.maturityDate],
            ["Counterparty", form.counterparty || "-"],
            ["Portfolio Book", form.portfolioBook],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-dark-gray/45">{label}</dt>
              <dd className="mt-0.5 text-sm font-medium text-dark-gray">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="rounded-md bg-surface-muted px-3 py-2 text-xs text-dark-gray/50">
          This deal slip is locked for editing while in status "{slip.status}". Only Draft or Returned for
          Amendment slips can be changed by the trader.
        </p>
        </div>

        <Modal
          isOpen={showDocument}
          onClose={() => setShowDocument(false)}
          title={`Deal Slip Document - ${slip.id}`}
          size="lg"
        >
          <DealSlipDocumentView slip={slip} onClose={() => setShowDocument(false)} />
        </Modal>
      </>
    );
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const docs: DealDocument[] = files.map((f) => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: f.name,
      sizeBytes: f.size,
      category: "Other",
      uploadedAt: new Date().toISOString(),
      uploadedBy: persona.name,
    }));
    setAttachments((prev) => [...prev, ...docs]);
    e.target.value = "";
  };

  const save = async (mode: "draft" | "submit") => {
    setError(null);
    setBusy(mode);
    try {
      if (slip) {
        updateEconomics(slip.id, form);
        if (mode === "submit") {
          submitDealSlip(slip.id);
          // Re-fetch - submitDealSlip runs the control checks and updates
          // status, neither of which `slip` (captured before submit) reflects.
          onSubmitted?.(getDealSlip(slip.id) ?? slip);
        } else {
          onSaved?.();
        }
      } else {
        const created = createDealSlip(form, attachments);
        onCreated?.(created);
        if (mode === "submit") {
          submitDealSlip(created.id);
          onSubmitted?.(getDealSlip(created.id) ?? created);
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <LimitAlertsFromChecks checks={form.faceValue > 0 && form.issuer ? livePreviewChecks : []} />

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">Instrument Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <FieldLabel>Asset Class *</FieldLabel>
            <SelectInput value={form.assetClass} onChange={(v) => set("assetClass")(v as AssetClass)} options={ASSET_CLASSES} />
          </div>
          <div>
            <FieldLabel tip="International Securities Identification Number">ISIN</FieldLabel>
            <TextInput value={form.isin ?? ""} onChange={set("isin")} placeholder="e.g. NGFGN00001234" />
          </div>
          <div>
            <FieldLabel>Instrument Name *</FieldLabel>
            <TextInput value={form.instrumentName} onChange={set("instrumentName")} placeholder="e.g. FGN Bond 2031" />
          </div>
          <div>
            <FieldLabel>Issuer *</FieldLabel>
            <TextInput value={form.issuer} onChange={set("issuer")} placeholder="e.g. Federal Government of Nigeria" />
          </div>
          <div>
            <FieldLabel>Sector</FieldLabel>
            <SelectInput value={form.sector} onChange={set("sector")} options={SECTORS} />
          </div>
          <div>
            <FieldLabel>Portfolio Book</FieldLabel>
            <SelectInput value={form.portfolioBook} onChange={set("portfolioBook")} options={portfolios} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">IFRS 9 Classification</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <FieldLabel>Classification *</FieldLabel>
            <SelectInput
              value={form.classification}
              onChange={(v) => set("classification")(v as DealEconomics["classification"])}
              options={CLASSIFICATIONS}
            />
          </div>
          <div>
            <FieldLabel>IFRS 13 Fair Value Level</FieldLabel>
            <SelectInput
              value={form.ifrs13Level}
              onChange={(v) => set("ifrs13Level")(v as DealEconomics["ifrs13Level"])}
              options={IFRS13_LEVELS}
            />
          </div>
          <div>
            <FieldLabel>Currency *</FieldLabel>
            <SelectInput value={form.currency} onChange={(v) => set("currency")(v as DealEconomics["currency"])} options={[...CURRENCIES]} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">Deal Economics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <FieldLabel tip="Nominal / par value in instrument currency">Face Value *</FieldLabel>
            <TextInput value={String(form.faceValue || "")} onChange={(v) => set("faceValue")(toNum(v))} placeholder="e.g. 100000000" />
          </div>
          <div>
            <FieldLabel tip="Clean price as a fraction of par - 0.985 = 98.5%">Purchase Price (decimal) *</FieldLabel>
            <TextInput value={String(form.purchasePriceDecimal ?? "")} onChange={(v) => set("purchasePriceDecimal")(toNum(v, 1))} placeholder="e.g. 0.9850" />
          </div>
          <div>
            <FieldLabel tip="Annual yield to maturity at purchase, decimal">Purchase Yield</FieldLabel>
            <TextInput
              value={form.purchaseYield !== undefined ? String(form.purchaseYield) : ""}
              onChange={(v) => set("purchaseYield")(v ? toNum(v) : undefined)}
              placeholder="e.g. 0.185 for 18.5%"
            />
          </div>
          <div>
            <FieldLabel>Coupon Rate (annual, decimal)</FieldLabel>
            <TextInput value={String(form.couponRate ?? "")} onChange={(v) => set("couponRate")(toNum(v))} placeholder="e.g. 0.1500 for 15%" />
          </div>
          <div>
            <FieldLabel>Coupon Frequency</FieldLabel>
            <SelectInput value={form.couponFrequency} onChange={(v) => set("couponFrequency")(v as DealEconomics["couponFrequency"])} options={FREQ_OPTIONS} />
          </div>
          <div>
            <FieldLabel>Credit Rating</FieldLabel>
            <SelectInput value={form.creditRating ?? ""} onChange={set("creditRating")} options={RATINGS.map((r) => (r === "" ? { value: "", label: "Unrated" } : r))} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">Dates</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <FieldLabel>Trade / Purchase Date *</FieldLabel>
            <TextInput type="date" value={form.purchaseDate} onChange={set("purchaseDate")} />
          </div>
          <div>
            <FieldLabel>Settlement Date</FieldLabel>
            <TextInput type="date" value={form.settlementDate} onChange={set("settlementDate")} />
          </div>
          <div>
            <FieldLabel>Maturity Date *</FieldLabel>
            <TextInput type="date" value={form.maturityDate} onChange={set("maturityDate")} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">Counterparty &amp; Custody</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Custodian</FieldLabel>
            <TextInput value={form.custodian ?? ""} onChange={set("custodian")} placeholder="e.g. First Bank Custodial" />
          </div>
          <div>
            <FieldLabel>Counterparty *</FieldLabel>
            <TextInput value={form.counterparty} onChange={set("counterparty")} placeholder="e.g. Stanbic IBTC Securities" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">Document Attachments</h2>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border bg-gray-50 px-4 py-3 hover:border-primary hover:bg-pale-red/20">
          <Paperclip className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400">Attach term sheet, IC memo, or supporting documents…</span>
          <input type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.xlsx,.csv" onChange={handleFile} />
        </label>
        {attachments.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {attachments.map((d) => (
              <li key={d.id} className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-sm">
                <div className="flex items-center gap-2 text-dark-gray">
                  <Paperclip className="h-3.5 w-3.5 text-gray-400" />
                  <span className="font-medium">{d.name}</span>
                  <span className="text-xs text-gray-400">({(d.sizeBytes / 1024).toFixed(1)} KB)</span>
                </div>
                <button type="button" onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== d.id))} className="text-gray-400 hover:text-danger">
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">Notes / Rationale</h2>
        <textarea
          value={form.notes ?? ""}
          onChange={(e) => set("notes")(e.target.value)}
          rows={3}
          placeholder="Investment rationale, IC approval reference, or other notes..."
          className="block w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray outline-none placeholder:text-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        {slip && slip.status === "Draft" ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-danger hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" /> Delete Draft
          </button>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-3">
          {persona.tradingLimit !== undefined && (
            <div className="mr-2 text-xs font-medium text-gray-500">
              Trading Limit: <span className="text-dark-gray font-semibold">₦{persona.tradingLimit.toLocaleString()}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setForm(slip?.economics ?? EMPTY_ECONOMICS)}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-gray-500 hover:bg-pale-red hover:text-primary"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          <button
            type="button"
            disabled={busy !== null || !canCreate}
            onClick={() => save("draft")}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-dark-gray hover:bg-pale-red hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save as Draft
          </button>
          <button
            type="button"
            disabled={busy !== null || !canCreate}
            onClick={() => save("submit")}
            title={!canCreate ? `${persona.role} does not have deal.create permission` : undefined}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "submit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit for Approval
          </button>
        </div>
      </div>

      {slip && (
        <ConfirmDialog
          isOpen={confirmDelete}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            removeDraft(slip.id);
            setConfirmDelete(false);
          }}
          title="Delete draft deal slip?"
          description={`${slip.id} - ${slip.economics.instrumentName} will be permanently deleted. This cannot be undone.`}
          confirmLabel="Delete"
        />
      )}
    </div>
  );
}
