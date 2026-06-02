import { SectionCard } from "../../../../../components/shared/section-card";
import { fmtMoney } from "../../../utils";
import type { TabProps } from "../types";
import { Row } from "./row";

export function AuditTab({ inst, val }: TabProps) {
  const ccy = inst.currency;
  const valuationModel =
    inst.classification === "AC" ? "EIR Amortisation" : "DCF / Market Price";
  return (
    <SectionCard title="Audit Trail">
      <Row label="Booked By" value={inst.bookedBy ?? inst.status} />
      <Row label="Initial Classification" value={inst.classification} />
      <Row label="Reclassification History" value="None" />
      <Row label="Last Valuation Run" value="2026-05-28 08:00 AM" mono />
      <Row label="Valuation Model" value={valuationModel} />
      <Row label="IFRS 13 Level" value={inst.ifrs13Level} />
      <Row label="Impairment Stage" value={inst.impairmentStage ?? "N/A"} />
      <Row
        label="ECL Provision"
        value={fmtMoney(inst.eclProvision ?? 0, ccy)}
        mono
      />
      <Row
        label="Annual EIR Income"
        value={fmtMoney(val.annualEIRIncome, ccy)}
        mono
      />
    </SectionCard>
  );
}
