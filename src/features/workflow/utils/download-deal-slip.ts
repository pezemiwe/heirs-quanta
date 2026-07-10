import jsPDF from "jspdf";
import type { DealSlip } from "../types";
import {
  approvedByName,
  dealNotional,
  dealSlipLabel,
  economicsFields,
  slipVersion,
  submittedDate,
} from "../engine/slip-fields";

const HEIRS_RED: [number, number, number] = [204, 0, 0];
const GRAY: [number, number, number] = [100, 100, 100];

function fmtMoney(n: number, currency: string): string {
  return `${currency} ${n.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
}

export function downloadDealSlipPdf(slip: DealSlip): void {
  const e = slip.economics;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 14;
  const pageW = doc.internal.pageSize.getWidth();
  let y = margin;

  doc.setFillColor(...HEIRS_RED);
  doc.rect(0, 0, pageW, 8, "F");
  y = 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  doc.text("HEIRS QUANTA · INVESTMENT DEAL SLIP", margin, y);
  y += 6;

  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text(dealSlipLabel(e), margin, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...HEIRS_RED);
  doc.text(slip.id, margin, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(`Status: ${slip.status}`, margin + 42, y);
  y += 7;

  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  const meta: [string, string][] = [
    ["Portfolio book", e.portfolioBook],
    ["Asset class", e.assetClass],
    ["Created by", `${slip.createdBy.name} (${slip.createdBy.role})`],
    ["Created", slip.createdAt.slice(0, 10)],
    ["Version", `v${slipVersion(slip)}`],
    ["Notional", fmtMoney(dealNotional(e), e.currency)],
    ["Submitted", submittedDate(slip)],
    ["Approved by", approvedByName(slip)],
    ["Settlement", slip.settlement.status],
    ["Register ref", slip.registerId ?? "—"],
  ];

  doc.setFontSize(9);
  for (const [label, value] of meta) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GRAY);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(value, pageW - margin - 52) as string[];
    doc.text(lines, margin + 48, y);
    y += Math.max(5, lines.length * 4.5);
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text("Economics & terms", margin, y);
  y += 5;

  const fields = economicsFields(e);
  doc.setFontSize(8.5);
  for (const f of fields) {
    if (y > 265) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(f.label, margin, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    const valLines = doc.splitTextToSize(f.value, pageW - margin - 55) as string[];
    doc.text(valLines, margin + 52, y);
    y += Math.max(5, valLines.length * 4);
    doc.setDrawColor(240, 240, 240);
    doc.line(margin, y - 1, pageW - margin, y - 1);
  }

  if (slip.documents.length > 0) {
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Attachments", margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    for (const d of slip.documents) {
      doc.text(`• ${d.name}`, margin, y);
      y += 4;
    }
  }

  y += 8;
  if (y > 250) {
    doc.addPage();
    y = margin;
  }

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text(
    "This deal slip is system-generated from Heirs Quanta. Official records are maintained in the investment register after approved settlement.",
    margin,
    y,
    { maxWidth: pageW - margin * 2 },
  );
  y += 12;

  const sigY = Math.min(y + 10, 270);
  doc.setDrawColor(180, 180, 180);
  doc.line(margin, sigY, margin + 55, sigY);
  doc.line(margin + 75, sigY, margin + 130, sigY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Trader / Originator", margin, sigY + 4);
  doc.text("Authorised signatory", margin + 75, sigY + 4);

  doc.save(`${slip.id}-deal-slip.pdf`);
}
