import { useState, useMemo } from "react";
import { usePortfolioRegistry } from "../../../portfolio/portfolio-registry";
import { GovernanceBar } from "../../../../components/shared/governance-bar";
import { useGovernance } from "../../../../context/governance";
import { usePersona } from "../../../../context/persona";
import type { FormState } from "./types";
import { EMPTY } from "./config";
import { computeLimitWarning, computeEirApprox } from "./utils";
import { SubmittedView } from "./components/submitted-view";
import { LimitWarningBanner } from "./components/limit-warning-banner";
import { PageHeader } from "./components/page-header";
import { InstrumentDetailsSection } from "./components/instrument-details-section";
import { ClassificationSection } from "./components/classification-section";
import { EconomicsSection } from "./components/economics-section";
import { DatesSection } from "./components/dates-section";
import { CounterpartySection } from "./components/counterparty-section";
import { DocumentsSection } from "./components/documents-section";
import { NotesSection } from "./components/notes-section";
import { ActionBar } from "./components/action-bar";

export function NewBooking() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const { getPortfolioNames } = usePortfolioRegistry();
  const { logAction, hasPermission } = useGovernance();
  const { persona } = usePersona();
  const PORTFOLIOS = getPortfolioNames();

  const canCreate = hasPermission(persona.role, "deal.create");

  const set = (field: keyof FormState) => (v: string) =>
    setForm((f) => ({ ...f, [field]: v }));

  const eirApprox = computeEirApprox(form.purchaseYield, form.couponRate);

  const limitWarning = useMemo(
    () => computeLimitWarning(form.issuer, form.faceValue),
    [form.issuer, form.faceValue],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    setSubmitting(true);
    const ref = `DL-${Date.now().toString().slice(-6)}`;
    logAction({
      user: persona.name,
      role: persona.role,
      module: "Deals",
      action: "New Booking Submitted",
      detail: `${form.instrumentName || form.instrumentType} — ₦${form.faceValue || "0"} face value submitted for checker approval. Ref: ${ref}`,
      status: limitWarning ? "warning" : "success",
      ip: "10.0.1.xx",
    });
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1200);
  };

  if (submitted) {
    return (
      <SubmittedView
        instrumentName={form.instrumentName}
        onReset={() => {
          setForm(EMPTY);
          setSubmitted(false);
        }}
      />
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8">
      <GovernanceBar
        requiredPermission="deal.create"
        context="maker"
        contextNote="Submit booking → awaits CFO checker approval"
        showPendingApprovals
      />

      {limitWarning && <LimitWarningBanner message={limitWarning} />}

      <PageHeader />

      <form onSubmit={handleSubmit} className="space-y-6">
        <InstrumentDetailsSection
          form={form}
          set={set}
          portfolios={PORTFOLIOS}
        />
        <ClassificationSection form={form} set={set} />
        <EconomicsSection form={form} set={set} eirApprox={eirApprox} />
        <DatesSection form={form} set={set} />
        <CounterpartySection form={form} set={set} />
        <DocumentsSection
          attachments={attachments}
          setAttachments={setAttachments}
        />
        <NotesSection value={form.notes} onChange={set("notes")} />
        <ActionBar
          submitting={submitting}
          canCreate={canCreate}
          role={persona.role}
          onReset={() => setForm(EMPTY)}
        />
      </form>
    </div>
  );
}
