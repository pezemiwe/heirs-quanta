import { SectionCard } from "../../../../../components/shared/section-card";
import { fmtMoney } from "../../../utils";
import type { TabProps } from "../types";
import { Row } from "./row";

export function OCITab({ inst, val }: TabProps) {
  const ccy = inst.currency;
  const tax = 0.3;
  const oci = val.ociReserve;
  const taxEffect = -oci * tax;
  const net = oci + taxEffect;
  return (
    <SectionCard title="OCI Recycling Simulation (If sold today)">
      <Row
        label="Current Fair Value"
        value={fmtMoney(val.cleanFairValue, ccy)}
        mono
      />
      <Row
        label="AC Carrying Value"
        value={fmtMoney(val.acCarryingValue, ccy)}
        mono
      />
      <Row
        label="OCI Reserve (to be recycled)"
        value={fmtMoney(oci, ccy)}
        mono
      />
      <Row
        label="Estimated Sale Price (at FV)"
        value={fmtMoney(val.cleanFairValue, ccy)}
        mono
      />
      <Row
        label="P&L Impact on Sale (OCI recycled)"
        value={fmtMoney(oci, ccy)}
        mono
        emphasis
      />
      <Row
        label="Estimated Tax Effect (30%)"
        value={fmtMoney(taxEffect, ccy)}
        mono
      />
      <Row label="Net P&L After Tax" value={fmtMoney(net, ccy)} mono emphasis />
    </SectionCard>
  );
}
