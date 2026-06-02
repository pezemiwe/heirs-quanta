import * as XLSX from "xlsx";
import type { Row } from "./types";

export function exportBlotterXlsx(rows: Row[]) {
  const headers = [
    "ID",
    "Instrument",
    "Issuer",
    "Type",
    "Sector",
    "Classification",
    "Currency",
    "Face Value",
    "Purchase Price",
    "Purchase Date",
    "Maturity Date",
    "Coupon Rate %",
    "Coupon Frequency",
    "Status",
    "Stage",
  ];
  const data = rows.map((r) => [
    r.id,
    r.name,
    r.issuer,
    r.instrumentType,
    r.sector,
    r.classification,
    r.currency,
    r.faceValue,
    r.purchasePrice,
    r.purchaseDate,
    r.maturityDate,
    r.couponRate > 0 ? +(r.couponRate * 100).toFixed(4) : 0,
    r.couponFrequency,
    r.status,
    r.impairmentStage ?? "",
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Trade Blotter");
  XLSX.writeFile(
    wb,
    `trade-blotter-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}
