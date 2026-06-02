import { SectionCard } from "../../../../../components/shared/section-card";
import {
  fmtMoney,
  fmtNumber,
  fmtPct,
  fmtDate,
  CLASSIFICATION_LABEL,
} from "../../../utils";
import type { Instrument } from "../../../engine/types";
import type { Valuation } from "../types";
import { Row } from "./row";

export function SummaryTab({
  inst,
  val,
  valuationDate,
}: {
  inst: Instrument;
  val: Valuation;
  valuationDate: string;
}) {
  const ccy = inst.currency;
  const isAC = inst.classification === "AC";
  const isFVOCI = inst.classification === "FVOCI";
  const isFVTPL = inst.classification === "FVTPL";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard title="Instrument Profile">
        <Row label="Instrument ID" value={inst.id} mono />
        <Row label="Name" value={inst.name} />
        <Row label="Type" value={inst.instrumentType} />
        <Row label="Issuer" value={inst.issuer} />
        <Row label="Sector" value={inst.sector} />
        <Row
          label="Classification"
          value={CLASSIFICATION_LABEL[inst.classification]}
        />
        <Row label="IFRS 13 Level" value={inst.ifrs13Level} />
        <Row label="Currency" value={ccy} />
        <Row label="Coupon Frequency" value={inst.couponFrequency} />
        <Row label="Status" value={inst.status} />
      </SectionCard>

      <SectionCard title="Key Dates & Pricing">
        <Row label="Face Value" value={fmtMoney(inst.faceValue, ccy)} mono />
        <Row
          label="Purchase Price"
          value={fmtMoney(inst.purchasePrice, ccy)}
          mono
        />
        <Row label="Purchase Date" value={fmtDate(inst.purchaseDate)} mono />
        <Row label="Maturity Date" value={fmtDate(inst.maturityDate)} mono />
        <Row label="Coupon Rate" value={fmtPct(inst.couponRate)} mono />
        <Row label="Valuation Date" value={fmtDate(valuationDate)} mono />
      </SectionCard>

      <SectionCard title="Carrying & Fair Value" className="lg:col-span-2">
        <div className="grid gap-x-8 gap-y-1 md:grid-cols-2">
          {isAC && (
            <>
              <Row
                label="Carrying Value (Today)"
                value={fmtMoney(val.acCarryingValue, ccy)}
                mono
                emphasis
              />
              <Row
                label="Accrued Interest"
                value={fmtMoney(val.accruedInterest, ccy)}
                mono
              />
              <Row
                label="Total Book Value (Dirty)"
                value={fmtMoney(val.totalBookValueDirty, ccy)}
                mono
                emphasis
              />
              <Row
                label="Fair Value (Informational)"
                value={fmtMoney(val.cleanFairValue, ccy)}
                mono
              />
            </>
          )}
          {isFVOCI && (
            <>
              <Row
                label="AC Carrying Value"
                value={fmtMoney(val.acCarryingValue, ccy)}
                mono
              />
              <Row
                label="Fair Value (Balance Sheet)"
                value={fmtMoney(val.cleanFairValue, ccy)}
                mono
                emphasis
              />
              <Row
                label="OCI Reserve (FV − AC)"
                value={fmtMoney(val.ociReserve, ccy)}
                mono
                emphasis
              />
              <Row
                label="Accrued Interest"
                value={fmtMoney(val.accruedInterest, ccy)}
                mono
              />
              <Row
                label="Total Carrying Value (Dirty)"
                value={fmtMoney(val.dirtyFairValue, ccy)}
                mono
              />
            </>
          )}
          {isFVTPL && (
            <>
              <Row
                label="Fair Value (Balance Sheet)"
                value={fmtMoney(val.cleanFairValue, ccy)}
                mono
                emphasis
              />
              <Row
                label="Purchase Price"
                value={fmtMoney(inst.purchasePrice, ccy)}
                mono
              />
              <Row
                label="Unrealised Gain / (Loss)"
                value={fmtMoney(val.unrealisedGL, ccy)}
                mono
                emphasis
              />
              <Row
                label="Accrued Interest / Income"
                value={fmtMoney(val.accruedInterest, ccy)}
                mono
              />
            </>
          )}
          {ccy !== "NGN" && (
            <>
              <Row
                label="FX Rate (vs NGN)"
                value={fmtNumber(
                  val.balanceSheetValueNGN / (val.cleanFairValue || 1),
                  2,
                )}
                mono
              />
              <Row
                label="Balance Sheet Value (NGN)"
                value={`₦${val.balanceSheetValueNGN.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
                mono
                emphasis
              />
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
