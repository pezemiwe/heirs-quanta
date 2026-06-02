import { SectionCard } from "../../../../../components/shared/section-card";
import { fmtMoney, fmtNumber } from "../../../utils";
import type { TabProps } from "../types";

export function CashFlowTab({ inst, val }: TabProps) {
  const ccy = inst.currency;
  const totalFuture = val.cashFlowSchedule
    .filter((r) => r.status === "Future")
    .reduce((s, r) => s + r.amount, 0);
  return (
    <SectionCard title="Cash Flow Schedule" noPadding>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2.5 text-left">#</th>
              <th className="px-4 py-2.5 text-left">Date</th>
              <th className="px-4 py-2.5 text-left">Type</th>
              <th className="px-4 py-2.5 text-right">Amount</th>
              <th className="px-4 py-2.5 text-right">Days to CF</th>
              <th className="px-4 py-2.5 text-right">PV of CF</th>
              <th className="px-4 py-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {val.cashFlowSchedule.map((r) => (
              <tr
                key={r.period}
                className={`border-b border-border/60 font-mono text-xs ${
                  r.status === "Past" ? "text-gray-400" : ""
                }`}
              >
                <td className="px-4 py-2">{r.period}</td>
                <td className="px-4 py-2">{r.date}</td>
                <td className="px-4 py-2 font-sans">{r.type}</td>
                <td className="px-4 py-2 text-right">
                  {fmtNumber(r.amount, 0)}
                </td>
                <td className="px-4 py-2 text-right">{r.daysToCF}</td>
                <td className="px-4 py-2 text-right">
                  {r.pvOfCF != null ? fmtMoney(r.pvOfCF, ccy, 2) : "—"}
                </td>
                <td className="px-4 py-2 text-center">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      r.status === "Past"
                        ? "bg-gray-100 text-gray-500"
                        : "bg-teal-50 text-success"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-mono text-xs font-bold">
              <td
                colSpan={3}
                className="px-4 py-2.5 text-right font-sans uppercase text-gray-500"
              >
                Total Future
              </td>
              <td className="px-4 py-2.5 text-right">
                {fmtNumber(totalFuture, 0)}
              </td>
              <td />
              <td className="px-4 py-2.5 text-right">
                {fmtMoney(val.totalFuturePV, ccy, 2)}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
