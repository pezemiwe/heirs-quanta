import { SectionCard } from "../../../../../components/shared/section-card";
import { fmtMoney, fmtNumber } from "../../../utils";
import type { TabProps } from "../types";
import { Row } from "./row";

export function RiskTab({ inst, val }: TabProps) {
  const ccy = inst.currency;
  const r = val.risk;
  return (
    <SectionCard title="Risk Metrics">
      <div className="grid gap-x-8 md:grid-cols-2">
        <Row
          label="Remaining Tenor (Yrs)"
          value={r.remainingTenorYears.toFixed(2)}
          mono
        />
        <Row
          label="Macaulay Duration"
          value={r.macaulayDuration.toFixed(2)}
          mono
        />
        <Row
          label="Modified Duration"
          value={r.modifiedDuration.toFixed(2)}
          mono
        />
        <Row label="DV01 (per bp)" value={fmtNumber(r.dv01, 2)} mono />
        <Row label="Convexity" value={r.convexity.toFixed(4)} mono />
        {r.nextCouponDate && (
          <>
            <Row label="Next Coupon Date" value={r.nextCouponDate} mono />
            <Row
              label="Next Coupon Amount"
              value={fmtMoney(r.nextCouponAmount, ccy)}
              mono
            />
            <Row
              label="Days to Next Coupon"
              value={r.daysToNextCoupon ?? "—"}
              mono
            />
          </>
        )}
      </div>
    </SectionCard>
  );
}
