import { forwardRef } from "react";
import { CollapsedLogo } from "../../../components/shared/logo";
import type { DealSlip } from "../types";
import {
  approvedByName,
  dealNotional,
  dealSlipTitle,
  documentEconomicsFields,
  fmtNotionalCurrency,
  HEIRS_BRAND_HEX,
  registerRef,
  settlementDate,
  slipVersionLabel,
  submittedDate,
} from "../engine/slip-fields";
import { DealSlipStatusBadge } from "./status-badge";

export const DealSlipDocument = forwardRef<HTMLDivElement, { slip: DealSlip }>(
  function DealSlipDocument({ slip }, ref) {
    const e = slip.economics;
    const economics = documentEconomicsFields(e);
    const notional = dealNotional(e);

    return (
      <div
        ref={ref}
        className="deal-slip-document mx-auto w-full max-w-[520px] bg-[#FFFBFB] shadow-[0_4px_24px_rgba(0,0,0,0.08),0_0_0_1px_rgba(200,16,46,0.1)]"
        style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
      >
        {/* Accent bar - solid brand colour */}
        <div className="h-2" style={{ backgroundColor: HEIRS_BRAND_HEX }} />

        <div className="border-x border-b border-[#E8E0E0] px-6 pb-6 pt-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-dashed border-[#D4C8C8] pb-4">
            <div className="flex items-center gap-2.5">
              <CollapsedLogo size={36} />
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: HEIRS_BRAND_HEX }}
                >
                  Heirs Quanta
                </p>
                <p className="text-[9px] uppercase tracking-widest text-[#8A7575]">
                  Investment deal slip
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className="font-mono text-lg font-bold tracking-tight text-[#2C2C2C]"
                style={{ fontFamily: "ui-monospace, monospace" }}
              >
                {slip.id}
              </p>
              <p className="mt-0.5 text-[10px] text-[#8A7575]">{slipVersionLabel(slip)}</p>
            </div>
          </div>

          {/* Title + status ribbon */}
          <div className="mt-4">
            <h2 className="text-base font-bold leading-snug text-[#1A1A1A]">
              {dealSlipTitle(e)}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <DealSlipStatusBadge status={slip.status} />
              <span className="text-[11px] text-[#6B6060]">{e.portfolioBook || "-"}</span>
              <span className="text-[#D4C8C8]">·</span>
              <span className="text-[11px] text-[#6B6060]">{e.assetClass}</span>
            </div>
          </div>

          {/* Notional callout */}
          <div
            className="mt-4 rounded border px-4 py-3"
            style={{
              borderColor: "rgba(200, 16, 46, 0.28)",
              backgroundColor: "#FFF5F6",
            }}
          >
            <p
              className="text-[9px] font-bold uppercase tracking-widest"
              style={{ color: HEIRS_BRAND_HEX }}
            >
              Notional amount
            </p>
            <p
              className="mt-0.5 text-2xl font-bold tabular-nums text-[#1A1A1A]"
              style={{ fontFamily: "ui-monospace, monospace" }}
            >
              {fmtNotionalCurrency(notional, e.currency)}
            </p>
          </div>

          {/* Metadata grid */}
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-b border-dashed border-[#D4C8C8] pb-4 text-[11px]">
            {(
              [
                ["Originator", slip.createdBy.name],
                ["Desk", slip.createdBy.role],
                ["Submitted", submittedDate(slip)],
                ["Approved by", approvedByName(slip)],
                ["Settlement", settlementDate(slip)],
                ["Register ref", registerRef(slip)],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="text-[9px] font-bold uppercase tracking-wide text-[#8A7575]">
                  {label}
                </dt>
                <dd className="mt-0.5 font-medium text-[#2C2C2C]">{value}</dd>
              </div>
            ))}
          </dl>

          {/* Economics & terms */}
          <div className="mt-4">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#8A7575]">
              Economics &amp; terms
            </p>
            <table className="w-full border-collapse text-[11px]">
              <tbody>
                {economics.map((f) => (
                  <tr key={f.label} className="border-b border-[#EDE4E4]">
                    <td className="w-[42%] py-2 pr-3 align-top text-[#6B6060]">
                      {f.label}
                    </td>
                    <td
                      className="py-2 align-top font-semibold text-[#1A1A1A]"
                      style={{
                        fontFamily: "ui-monospace, monospace",
                        fontSize: "10px",
                      }}
                    >
                      {f.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {slip.documents.length > 0 && (
            <div className="mt-4 border-t border-dashed border-[#D4C8C8] pt-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#8A7575]">
                Attachments
              </p>
              <ul className="mt-1 space-y-0.5">
                {slip.documents.map((d) => (
                  <li key={d.id} className="text-[10px] text-[#4A4040]">
                    ◦ {d.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-5 text-center text-[8px] leading-relaxed text-[#A89898]">
            System-generated deal slip · Heirs Holdings · For internal use · CBN
            workflow compliant
          </p>
        </div>
      </div>
    );
  },
);
