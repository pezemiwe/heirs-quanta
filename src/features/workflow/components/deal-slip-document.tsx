import { forwardRef } from "react";
import type { DealSlip } from "../types";
import {
  approvedByName,
  dealNotional,
  dealSlipLabel,
  economicsFields,
  slipVersion,
  submittedDate,
} from "../engine/slip-fields";
import { DealSlipStatusBadge } from "./status-badge";

const HEIRS_RED = "#CC0000";
const HEIRS_RED_DARK = "#990000";

function fmtNotional(n: number, currency: string): string {
  if (!isFinite(n) || n === 0) return "—";
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency === "NGN" ? "NGN" : currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString("en-NG")}`;
  }
}

export const DealSlipDocument = forwardRef<HTMLDivElement, { slip: DealSlip }>(
  function DealSlipDocument({ slip }, ref) {
    const e = slip.economics;
    const fields = economicsFields(e);
    const notional = dealNotional(e);

    return (
      <div
        ref={ref}
        className="deal-slip-print mx-auto w-full max-w-[520px] bg-[#FFFBFB] shadow-[0_4px_24px_rgba(0,0,0,0.08),0_0_0_1px_rgba(204,0,0,0.08)]"
        style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
      >
        {/* Perforated tear strip — Heirs red */}
        <div
          className="relative h-3"
          style={{
            backgroundColor: HEIRS_RED,
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(255,255,255,0.35) 6px, rgba(255,255,255,0.35) 12px)",
          }}
        />

        <div className="border-x border-b border-[#E8E0E0] px-6 pb-6 pt-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-dashed border-[#D4C8C8] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <img
                  src="/Heirs.png"
                  alt=""
                  className="h-8 w-8 rounded-full border border-[#E8E0E0] bg-white object-contain p-0.5"
                />
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.2em]"
                    style={{ color: HEIRS_RED }}
                  >
                    Heirs Quanta
                  </p>
                  <p className="text-[9px] uppercase tracking-widest text-[#8A7575]">
                    Investment deal slip
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p
                className="font-mono text-lg font-bold tracking-tight text-[#2C2C2C]"
                style={{ fontFamily: "ui-monospace, monospace" }}
              >
                {slip.id}
              </p>
              <p className="mt-0.5 text-[10px] text-[#8A7575]">
                v{slipVersion(slip)} · {slip.createdAt.slice(0, 10)}
              </p>
            </div>
          </div>

          {/* Title block */}
          <div className="mt-4">
            <h2 className="text-base font-bold leading-snug text-[#1A1A1A]">
              {dealSlipLabel(e)}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <DealSlipStatusBadge status={slip.status} />
              <span className="text-[11px] text-[#6B6060]">{e.portfolioBook}</span>
              <span className="text-[#D4C8C8]">·</span>
              <span className="text-[11px] text-[#6B6060]">{e.assetClass}</span>
            </div>
          </div>

          {/* Notional highlight — Heirs red accent */}
          <div
            className="mt-4 rounded border px-4 py-3"
            style={{
              borderColor: "rgba(204, 0, 0, 0.25)",
              backgroundColor: "#FFF5F5",
            }}
          >
            <p
              className="text-[9px] font-bold uppercase tracking-widest"
              style={{ color: HEIRS_RED_DARK }}
            >
              Notional amount
            </p>
            <p
              className="mt-0.5 text-2xl font-bold tabular-nums text-[#1A1A1A]"
              style={{ fontFamily: "ui-monospace, monospace" }}
            >
              {fmtNotional(notional, e.currency)}
            </p>
          </div>

          {/* Meta grid */}
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-b border-dashed border-[#D4C8C8] pb-4 text-[11px]">
            {[
              ["Originator", slip.createdBy.name],
              ["Desk", slip.createdBy.role],
              ["Submitted", submittedDate(slip)],
              ["Approved by", approvedByName(slip)],
              ["Settlement", slip.settlement.status],
              ["Register ref", slip.registerId ?? "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[9px] font-bold uppercase tracking-wide text-[#8A7575]">
                  {label}
                </dt>
                <dd className="mt-0.5 font-medium text-[#2C2C2C]">{value}</dd>
              </div>
            ))}
          </dl>

          {/* Economics table */}
          <div className="mt-4">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#8A7575]">
              Economics &amp; terms
            </p>
            <table className="w-full border-collapse text-[11px]">
              <tbody>
                {fields.map((f) => (
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
                    {d.category !== "Other" && (
                      <span className="text-[#8A7575]"> ({d.category})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Signature lines */}
          <div className="mt-6 grid grid-cols-2 gap-6 border-t border-[#D4C8C8] pt-5">
            <div>
              <div className="border-b border-[#2C2C2C] pb-8" />
              <p className="mt-1 text-[9px] uppercase tracking-wide text-[#8A7575]">
                Trader / Originator
              </p>
              <p className="text-[10px] font-medium text-[#4A4040]">
                {slip.createdBy.name}
              </p>
            </div>
            <div>
              <div className="border-b border-[#2C2C2C] pb-8" />
              <p className="mt-1 text-[9px] uppercase tracking-wide text-[#8A7575]">
                Authorised approval
              </p>
              <p className="text-[10px] font-medium text-[#4A4040]">
                {approvedByName(slip) === "—" ? "Pending" : approvedByName(slip)}
              </p>
            </div>
          </div>

          <p className="mt-4 text-center text-[8px] leading-relaxed text-[#A89898]">
            System-generated deal slip · Heirs Holdings · For internal use · CBN
            workflow compliant
          </p>
        </div>

        {/* Bottom perforation */}
        <div
          className="h-2 bg-[#F5EFEF]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 6px 0, transparent 4px, #E8DCDC 4px)",
            backgroundSize: "12px 8px",
            backgroundRepeat: "repeat-x",
          }}
        />
      </div>
    );
  },
);
