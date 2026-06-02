import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useValuation } from "../../store";
import { valueInstrument } from "../../engine";
import { Tabs } from "../../../../components/shared/tabs";
import type { Tab } from "./types";
import { NotFound } from "./components/not-found";
import { Header } from "./components/header";
import { DeleteModal } from "./components/delete-modal";
import { SummaryTab } from "./components/summary-tab";
import { AmortTab } from "./components/amort-tab";
import { CashFlowTab } from "./components/cashflow-tab";
import { IncomeTab } from "./components/income-tab";
import { FairValueTab } from "./components/fairvalue-tab";
import { OCITab } from "./components/oci-tab";
import { RiskTab } from "./components/risk-tab";
import { AuditTab } from "./components/audit-tab";

export function ValuationAssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const v = useValuation();
  const [tab, setTab] = useState<Tab>("summary");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const instrument = v.instruments.find((i) => i.id === id);
  const valuation = useMemo(
    () => (instrument ? valueInstrument(instrument, v.assumptions) : null),
    [instrument, v.assumptions],
  );

  if (!instrument || !valuation) {
    return <NotFound id={id} onBack={() => navigate("/valuation/inventory")} />;
  }

  const inst = instrument;
  const cls = inst.classification;

  const isEquity = inst.instrumentType === "Equity";
  const tabs: { value: Tab; label: string }[] = [
    { value: "summary", label: "Summary" },
    ...(isEquity
      ? []
      : ([
          { value: "amort", label: "EIR & Amortisation" },
          { value: "cashflow", label: "Cash Flows" },
        ] as { value: Tab; label: string }[])),
    { value: "income", label: "Income & P&L" },
    ...(cls !== "AC" && !isEquity
      ? ([{ value: "fairvalue", label: "Fair Value" }] as {
          value: Tab;
          label: string;
        }[])
      : []),
    ...(cls === "FVOCI" && !isEquity
      ? ([{ value: "oci", label: "OCI Recycling" }] as {
          value: Tab;
          label: string;
        }[])
      : []),
    ...(!isEquity ? [{ value: "risk" as Tab, label: "Risk Metrics" }] : []),
    { value: "audit", label: "Audit Trail" },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <Header
        inst={inst}
        onBack={() => navigate("/valuation/inventory")}
        onDelete={() => setConfirmDelete(true)}
      />

      <Tabs<Tab>
        tabs={tabs}
        value={tab}
        onChange={setTab}
        variant="underline"
        size="md"
      />

      {tab === "summary" && (
        <SummaryTab
          inst={inst}
          val={valuation}
          valuationDate={v.assumptions.valuationDate}
        />
      )}
      {tab === "amort" && <AmortTab inst={inst} val={valuation} />}
      {tab === "cashflow" && <CashFlowTab inst={inst} val={valuation} />}
      {tab === "income" && <IncomeTab inst={inst} val={valuation} />}
      {tab === "fairvalue" && <FairValueTab inst={inst} val={valuation} />}
      {tab === "oci" && <OCITab inst={inst} val={valuation} />}
      {tab === "risk" && <RiskTab inst={inst} val={valuation} />}
      {tab === "audit" && <AuditTab inst={inst} val={valuation} />}

      {confirmDelete && (
        <DeleteModal
          inst={inst}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            v.removeInstrument(inst.id);
            navigate("/valuation/inventory");
          }}
        />
      )}
    </div>
  );
}
