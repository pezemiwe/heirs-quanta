import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import type { InstrumentValuation } from "../../engine/book-compute";
import type { ActivityRow, ReportStats } from "./types";

export function fmtNGN(v: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(v);
}

export function fmtNum(v: number) {
  return new Intl.NumberFormat("en-NG").format(v);
}

export function parseDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

type ExportArgs = {
  activeWindow: string;
  stats: ReportStats;
  activityRows: ActivityRow[];
  filteredValuations: InstrumentValuation[];
  startDate: string;
};

export function exportExcel({
  activeWindow,
  stats,
  activityRows,
  filteredValuations,
  startDate,
}: ExportArgs) {
  const data: (string | number)[][] = [
    ["Portfolio Report", activeWindow],
    [],
    ["SUMMARY"],
    ["Transactions", stats.transactions],
    ["Total Requested (NGN)", stats.totalRequested],
    ["Total Disbursed (NGN)", +stats.totalDisbursed.toFixed(0)],
    ["Pending Drafts", stats.pending],
    [],
    ["ACTIVITY BREAKDOWN"],
    [
      "Asset Class",
      "Transactions",
      "Requested (NGN)",
      "Disbursed (NGN)",
      "Completion %",
    ],
    ...activityRows.map((r) => [
      r.activity,
      r.requests,
      +r.requested.toFixed(0),
      +r.disbursed.toFixed(0),
      +r.completion.toFixed(1),
    ]),
    [],
    ["INSTRUMENT DETAIL"],
    [
      "ID",
      "Name",
      "Asset Class",
      "Face Value",
      "Dirty Price",
      "Settlement Date",
    ],
    ...filteredValuations.map((v) => [
      v.instrument.id,
      v.instrument.name,
      v.instrument.instrumentType,
      +v.instrument.faceValue.toFixed(0),
      +v.dirtyFairValue.toFixed(0),
      v.instrument.purchaseDate,
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Portfolio Report");
  XLSX.writeFile(wb, `portfolio-report-${startDate}.xlsx`);
}

export function exportPDF({
  activeWindow,
  stats,
  activityRows,
  startDate,
}: ExportArgs) {
  const topClass = activityRows[0];
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 20;
  const usableW = pageW - margin * 2; // 170mm
  const date = new Date().toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // PDF-safe number formatters (no ₦ symbol — Helvetica doesn't support it)
  const pdfFull = (v: number) =>
    "NGN " + new Intl.NumberFormat("en-NG").format(Math.round(v));
  const pdfCompact = (v: number) => {
    if (v >= 1e9) return `NGN ${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `NGN ${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `NGN ${(v / 1e3).toFixed(0)}K`;
    return `NGN ${Math.round(v)}`;
  };

  // PDF-safe insight (replace fmtNGN output with ASCII-safe version)
  const pctStr =
    stats.totalRequested > 0
      ? ((stats.totalDisbursed / stats.totalRequested) * 100).toFixed(1)
      : "0.0";
  const pdfInsight =
    activityRows.length === 0
      ? "No transaction data in selected date range."
      : `During ${activeWindow}, ${stats.transactions} instrument${stats.transactions !== 1 ? "s" : ""} settled with a total face value of ${pdfFull(stats.totalRequested)}. Net disbursed amount was ${pdfFull(stats.totalDisbursed)} (${pctStr}% of requested).${topClass ? ` ${topClass.activity} was the most active class with ${topClass.requests} transactions totalling ${pdfFull(topClass.requested)}.` : ""}`;

  // ── Header bar ──────────────────────────────────────────────
  doc.setFillColor(200, 16, 46);
  doc.rect(0, 0, pageW, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Heirs Quanta - Portfolio Management", margin, 12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(date, pageW - margin - 22, 12);

  // ── Title ────────────────────────────────────────────────────
  doc.setTextColor(26, 26, 46);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Portfolio Report", margin, 30);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 120);
  doc.text(`Active Window: ${activeWindow}`, margin, 38);

  doc.setDrawColor(220, 220, 230);
  doc.line(margin, 42, pageW - margin, 42);

  // ── KPI metrics (2x2) ────────────────────────────────────────
  const kpis = [
    { label: "TRANSACTIONS", value: String(stats.transactions) },
    { label: "TOTAL REQUESTED", value: pdfFull(stats.totalRequested) },
    { label: "TOTAL DISBURSED", value: pdfFull(stats.totalDisbursed) },
    { label: "PENDING DRAFTS", value: String(stats.pending) },
  ];
  const boxW = (usableW - 6) / 2; // ~82mm each
  kpis.forEach((k, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = margin + col * (boxW + 6);
    const y = 47 + row * 22;
    doc.setFillColor(247, 247, 248);
    doc.roundedRect(x, y, boxW, 18, 2, 2, "F");
    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(130, 130, 150);
    doc.text(k.label, x + 4, y + 6);
    // Value — shrink font if needed
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 26, 46);
    const valWidth = doc.getTextWidth(k.value);
    const valFontSize = valWidth > boxW - 8 ? ((boxW - 8) / valWidth) * 10 : 10;
    doc.setFontSize(Math.max(valFontSize, 7));
    doc.text(k.value, x + 4, y + 14);
  });

  // ── Activity breakdown table ─────────────────────────────────
  let y = 100;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(26, 26, 46);
  doc.text("Activity Breakdown", margin, y);
  y += 5;

  // Column positions (fit within usableW=170mm, right edge = 190)
  // Asset Class | Req | Requested       | Disbursed       | Compl.%
  //  20→62 42mm | 4mm | 66→109 43mm     | 109→152 43mm    | 152→190 18mm
  const colX = [margin, margin + 44, margin + 50, margin + 95, margin + 152];
  const colW = [42, 4, 43, 43, 18];
  const tHdrs = [
    "Asset Class",
    "Req.",
    "Requested (NGN)",
    "Disbursed (NGN)",
    "Compl.%",
  ];

  doc.setFillColor(200, 16, 46);
  doc.rect(margin, y, usableW, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  tHdrs.forEach((h, i) => doc.text(h, colX[i] + 1.5, y + 5));
  y += 7;

  if (activityRows.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, usableW, 8, "F");
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 180);
    doc.text("No data in selected date range.", margin + 2, y + 5.5);
    y += 8;
  } else {
    activityRows.forEach((r, idx) => {
      const bg = idx % 2 === 0 ? [255, 255, 255] : [247, 247, 248];
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.rect(margin, y, usableW, 7, "F");
      doc.setTextColor(26, 26, 46);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      const vals = [
        r.activity,
        String(r.requests),
        pdfCompact(r.requested),
        pdfCompact(r.disbursed),
        r.completion.toFixed(1) + "%",
      ];
      vals.forEach((v, i) => {
        // right-align numeric columns (1-4)
        if (i >= 1) {
          const tw = doc.getTextWidth(v);
          doc.text(v, colX[i] + colW[i] - tw - 1, y + 5);
        } else {
          doc.text(v, colX[i] + 1.5, y + 5);
        }
      });
      y += 7;
    });
  }

  // ── Insight block ─────────────────────────────────────────────
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const insightLines = doc.splitTextToSize(
    pdfInsight,
    usableW - 14,
  ) as string[];
  const insightH = insightLines.length * 5.5 + 10;
  doc.setFillColor(253, 245, 245);
  doc.roundedRect(margin, y, usableW, insightH, 2, 2, "F");
  doc.setFillColor(200, 16, 46);
  doc.rect(margin, y, 3, insightH, "F");
  doc.setTextColor(70, 70, 90);
  doc.text(insightLines, margin + 7, y + 7);

  // ── Footer ───────────────────────────────────────────────────
  doc.setDrawColor(220, 220, 230);
  doc.line(margin, 275, pageW - margin, 275);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 180);
  doc.text("Generated by Heirs Quanta - Confidential", margin, 280);
  doc.text("Page 1 of 1", pageW - margin - 14, 280);

  doc.save(`portfolio-report-${startDate}.pdf`);
}
