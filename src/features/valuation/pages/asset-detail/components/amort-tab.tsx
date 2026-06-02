import { SectionCard } from "../../../../../components/shared/section-card";
import { fmtMoney, fmtNumber, fmtPct } from "../../../utils";
import type { TabProps } from "../types";
import { Row } from "./row";

export function AmortTab({ inst, val }: TabProps) {
  const ccy = inst.currency;
  const isZero = inst.couponFrequency === "Zero";
  return (
    <div className="space-y-5">
      <SectionCard title={isZero ? "Discount Amortisation" : "EIR Summary"}>
        <div className="grid gap-x-8 gap-y-1 md:grid-cols-2">
          <Row
            label="Purchase Price"
            value={fmtMoney(inst.purchasePrice, ccy)}
            mono
          />
          <Row label="Face Value" value={fmtMoney(inst.faceValue, ccy)} mono />
          <Row
            label="Discount at Purchase"
            value={fmtMoney(val.discountAtPurchase, ccy)}
            mono
          />
          <Row
            label="Effective Interest Rate (EIR)"
            value={fmtPct(val.eir, 4)}
            mono
            emphasis
          />
          {!isZero && (
            <Row
              label="Stated Coupon Rate"
              value={fmtPct(inst.couponRate, 4)}
              mono
            />
          )}
        </div>
      </SectionCard>

      {!isZero && val.amortSchedule.length > 0 && (
        <SectionCard title="Amortisation Schedule" noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2.5 text-left">Per</th>
                  <th className="px-4 py-2.5 text-left">Date</th>
                  <th className="px-4 py-2.5 text-right">Opening Bal</th>
                  <th className="px-4 py-2.5 text-right">EIR Income</th>
                  <th className="px-4 py-2.5 text-right">Coupon CF</th>
                  <th className="px-4 py-2.5 text-right">Amort</th>
                  <th className="px-4 py-2.5 text-right">Closing Bal</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {val.amortSchedule.map((r) => (
                  <tr
                    key={r.period}
                    className={`border-b border-border/60 font-mono text-xs ${
                      r.status === "Current"
                        ? "bg-pale-red/30 font-semibold"
                        : r.status === "Future"
                          ? ""
                          : "text-gray-400"
                    }`}
                  >
                    <td className="px-4 py-2">{r.period}</td>
                    <td className="px-4 py-2">{r.date}</td>
                    <td className="px-4 py-2 text-right">
                      {fmtNumber(r.openingBalance, 0)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {fmtNumber(r.eirIncome, 0)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {fmtNumber(r.couponCF, 0)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {fmtNumber(r.amortisation, 0)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {fmtNumber(r.closingBalance, 0)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          r.status === "Past"
                            ? "bg-gray-100 text-gray-500"
                            : r.status === "Current"
                              ? "bg-pale-red text-primary"
                              : "bg-teal-50 text-success"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {inst.classification === "FVOCI" && val.ociMovement.length > 0 && (
        <SectionCard title="OCI Reserve Movement" noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2.5 text-left">Per</th>
                  <th className="px-4 py-2.5 text-left">Date</th>
                  <th className="px-4 py-2.5 text-right">AC Carrying Val</th>
                  <th className="px-4 py-2.5 text-right">Fair Value (Est.)</th>
                  <th className="px-4 py-2.5 text-right">OCI Reserve</th>
                </tr>
              </thead>
              <tbody>
                {val.ociMovement.map((r) => (
                  <tr
                    key={r.period}
                    className="border-b border-border/60 font-mono text-xs"
                  >
                    <td className="px-4 py-2">{r.period}</td>
                    <td className="px-4 py-2">{r.date}</td>
                    <td className="px-4 py-2 text-right">
                      {fmtNumber(r.acCarryingValue, 0)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {fmtNumber(r.fairValueEst, 0)}
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-semibold ${
                        r.ociReserve >= 0 ? "text-success" : "text-primary"
                      }`}
                    >
                      {fmtNumber(r.ociReserve, 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
