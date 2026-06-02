import { SectionCard } from "../../../../../components/shared/section-card";
import { fmtMoney, fmtPct } from "../../../utils";
import type { TabProps } from "../types";
import { Row } from "./row";

export function FairValueTab({ inst, val }: TabProps) {
  const ccy = inst.currency;
  const bps = ((val.marketYieldUsed - inst.couponRate) * 100).toFixed(2);
  return (
    <SectionCard title="Fair Value Detail">
      <Row label="Valuation Method" value="Discounted Cash Flow (DCF)" />
      <Row label="Yield Curve" value={val.yieldCurveLabel} />
      <Row
        label="Interpolated Market Yield"
        value={fmtPct(val.marketYieldUsed, 4)}
        mono
      />
      {inst.couponRate > 0 && (
        <>
          <Row
            label="Purchase Yield / Coupon Rate"
            value={fmtPct(inst.couponRate, 4)}
            mono
          />
          <Row
            label="Yield Movement (market vs coupon)"
            value={`${bps} bps approx`}
            mono
          />
        </>
      )}
      <Row
        label="Clean Fair Value"
        value={fmtMoney(val.cleanFairValue, ccy)}
        mono
        emphasis
      />
      <Row
        label="Accrued Interest"
        value={fmtMoney(val.accruedInterest, ccy)}
        mono
      />
      <Row
        label="Dirty Fair Value"
        value={fmtMoney(val.dirtyFairValue, ccy)}
        mono
      />
      <Row label="IFRS 13 Level" value={inst.ifrs13Level} />
    </SectionCard>
  );
}
