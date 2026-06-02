import * as XLSX from "xlsx";
import type { HoldingRow } from "./types";

export const exportHoldingsXlsx = (filtered: HoldingRow[]) => {
  const headers = [
    "ID",
    "Instrument",
    "Issuer",
    "Type",
    "Sector",
    "Classification",
    "Currency",
    "Face Value",
    "Book Value (NGN)",
    "EIR %",
    "Coupon Rate %",
    "Maturity Date",
    "Stage",
    "Status",
  ];
  const data = filtered.map((r) => [
    r.id,
    r.name,
    r.issuer,
    r.instrumentType,
    r.sector,
    r.classification,
    r.currency,
    r.faceValue,
    +r.bookValueNGN.toFixed(2),
    +(r.eirPct * 100).toFixed(4),
    +(r.couponRate * 100).toFixed(4),
    r.maturityDate ?? "",
    r.stage,
    r.status,
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Holdings");
  XLSX.writeFile(
    wb,
    `portfolio-holdings-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
};
