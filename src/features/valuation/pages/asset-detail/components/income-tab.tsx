import { SectionCard } from "../../../../../components/shared/section-card";
import { fmtMoney, fmtPct } from "../../../utils";
import type { TabProps } from "../types";
import { Row } from "./row";

export function IncomeTab({ inst, val }: TabProps) {
  const ccy = inst.currency;
  const cls = inst.classification;
  return (
    <div className="space-y-5">
      {cls === "AC" && (
        <SectionCard title="P&L Summary — Amortised Cost">
          <p className="mb-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
            Amortised Cost only EIR interest recognised in P&L. No fair value
            movements recognised.
          </p>
          <Row
            label="EIR (Effective Interest Rate)"
            value={fmtPct(val.eir, 4)}
            mono
          />
          <Row
            label="Carrying Value (Today)"
            value={fmtMoney(val.acCarryingValue, ccy)}
            mono
          />
          <Row
            label="Accrued Interest (today)"
            value={fmtMoney(val.accruedInterest, ccy)}
            mono
          />
          <Row
            label="Estimated Annual EIR Income"
            value={fmtMoney(val.annualEIRIncome, ccy)}
            mono
            emphasis
          />
          <Row
            label="ECL Provision"
            value={fmtMoney(inst.eclProvision ?? 0, ccy)}
            mono
          />
          <Row label="Impairment Stage" value={inst.impairmentStage ?? "N/A"} />
        </SectionCard>
      )}

      {cls === "FVOCI" && (
        <>
          <SectionCard title="P&L Section">
            <p className="mb-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
              Hits Income Statement — EIR interest recognised in P&L.
            </p>
            <Row
              label="EIR Interest Income (annual est.)"
              value={fmtMoney(val.annualEIRIncome, ccy)}
              mono
              emphasis
            />
            <Row
              label="Accrued Interest (today)"
              value={fmtMoney(val.accruedInterest, ccy)}
              mono
            />
            <Row
              label="ECL Charge (P&L)"
              value={fmtMoney(-(inst.eclProvision ?? 0), ccy)}
              mono
            />
          </SectionCard>
          <SectionCard title="OCI Section">
            <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
              Sits in Equity — bypasses P&L. Recycled to P&L upon disposal.
            </p>
            <Row
              label="AC Carrying Value"
              value={fmtMoney(val.acCarryingValue, ccy)}
              mono
            />
            <Row
              label="Fair Value"
              value={fmtMoney(val.cleanFairValue, ccy)}
              mono
            />
            <Row
              label="OCI Reserve (Unrealised)"
              value={fmtMoney(val.ociReserve, ccy)}
              mono
              emphasis
            />
            <Row
              label="OCI Position"
              value={
                <span
                  className={`font-semibold ${
                    val.ociReserve >= 0 ? "text-success" : "text-primary"
                  }`}
                >
                  Unrealised {val.ociReserve >= 0 ? "GAIN" : "LOSS"}
                </span>
              }
            />
            <Row
              label="Impairment Stage"
              value={inst.impairmentStage ?? "N/A"}
            />
          </SectionCard>
        </>
      )}

      {cls === "FVTPL" && (
        <SectionCard title="P&L Summary — FVTPL">
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            FVTPL — ALL fair value movements hit P&L immediately. No OCI. No ECL
            required.
          </p>
          <Row
            label="Purchase Price"
            value={fmtMoney(inst.purchasePrice, ccy)}
            mono
          />
          <Row
            label="Current Fair Value"
            value={fmtMoney(val.cleanFairValue, ccy)}
            mono
          />
          <Row
            label="Unrealised Gain / (Loss) — P&L"
            value={fmtMoney(val.unrealisedGL, ccy)}
            mono
            emphasis
          />
          <Row
            label="Accrued / Coupon Income"
            value={fmtMoney(val.accruedInterest, ccy)}
            mono
          />
          <Row
            label="P&L Position"
            value={
              <span
                className={`font-semibold ${
                  val.unrealisedGL >= 0 ? "text-success" : "text-primary"
                }`}
              >
                {val.unrealisedGL >= 0 ? "GAIN" : "LOSS"} in P&L
              </span>
            }
          />
        </SectionCard>
      )}
    </div>
  );
}
