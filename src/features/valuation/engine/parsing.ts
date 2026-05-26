import type { Asset, AssetType, Currency } from "./types";

/* ───────────────────────────────────────────────────────────
   CSV parser — expected columns (case-insensitive):
     id, name, type, sector, currency, holdingPct, carryingValue,
     freeCashFlowYear1, growthRate, terminalGrowth, projectionYears,
     beta, sharesHeld, lastPrice, revenue, ebitda, netIncome,
     bookValue, faceValue, couponRate, yearsToMaturity, ytm,
     paymentsPerYear, noi, capRate, reportedNav
   ─────────────────────────────────────────────────────────── */

const ALLOWED_TYPES: AssetType[] = [
  "subsidiary",
  "equity_listed",
  "equity_unlisted",
  "real_estate",
  "bond",
  "tbill",
  "pe_fund",
  "joint_venture",
];

const ALLOWED_CCY: Currency[] = ["NGN", "USD", "GBP", "EUR"];

export function parseAssetsCSV(text: string): {
  assets: Asset[];
  errors: { row: number; message: string }[];
} {
  const errors: { row: number; message: string }[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { assets: [], errors: [{ row: 0, message: "Empty file" }] };
  }

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (col: string) => header.indexOf(col.toLowerCase());

  const REQUIRED = [
    "id",
    "name",
    "type",
    "sector",
    "currency",
    "holdingpct",
    "carryingvalue",
  ];
  for (const r of REQUIRED) {
    if (idx(r) === -1) {
      errors.push({ row: 0, message: `Missing required column: ${r}` });
    }
  }
  if (errors.length) return { assets: [], errors };

  const num = (s: string | undefined) =>
    s == null || s === "" ? undefined : Number(s.replace(/,/g, ""));

  const assets: Asset[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",").map((p) => p.trim());
    try {
      const type = parts[idx("type")] as AssetType;
      const currency = parts[idx("currency")] as Currency;

      if (!ALLOWED_TYPES.includes(type)) {
        errors.push({ row: i + 1, message: `Invalid type: "${type}"` });
        continue;
      }
      if (!ALLOWED_CCY.includes(currency)) {
        errors.push({ row: i + 1, message: `Invalid currency: "${currency}"` });
        continue;
      }

      const holdingPct = num(parts[idx("holdingpct")]);
      const carryingValue = num(parts[idx("carryingvalue")]);
      if (holdingPct == null || carryingValue == null) {
        errors.push({
          row: i + 1,
          message: "holdingPct and carryingValue required",
        });
        continue;
      }

      const a: Asset = {
        id: parts[idx("id")] || `IMP-${i}`,
        name: parts[idx("name")] || "(unnamed)",
        type,
        sector: parts[idx("sector")] || "Uncategorised",
        currency,
        holdingPct,
        carryingValue,
        freeCashFlowYear1: num(parts[idx("freecashflowyear1")]),
        growthRate: num(parts[idx("growthrate")]),
        terminalGrowth: num(parts[idx("terminalgrowth")]),
        projectionYears: num(parts[idx("projectionyears")]),
        beta: num(parts[idx("beta")]),
        sharesHeld: num(parts[idx("sharesheld")]),
        lastPrice: num(parts[idx("lastprice")]),
        revenue: num(parts[idx("revenue")]),
        ebitda: num(parts[idx("ebitda")]),
        netIncome: num(parts[idx("netincome")]),
        bookValue: num(parts[idx("bookvalue")]),
        faceValue: num(parts[idx("facevalue")]),
        couponRate: num(parts[idx("couponrate")]),
        yearsToMaturity: num(parts[idx("yearstomaturity")]),
        ytm: num(parts[idx("ytm")]),
        paymentsPerYear: num(parts[idx("paymentsperyear")]),
        noi: num(parts[idx("noi")]),
        capRate: num(parts[idx("caprate")]),
        reportedNav: num(parts[idx("reportednav")]),
      };
      assets.push(a);
    } catch (e) {
      errors.push({
        row: i + 1,
        message: `Parse error: ${(e as Error).message}`,
      });
    }
  }

  return { assets, errors };
}

/* ─── CSV template for download ─────────────────────────── */
export const CSV_TEMPLATE_HEADER =
  "id,name,type,sector,currency,holdingPct,carryingValue,freeCashFlowYear1,growthRate,terminalGrowth,projectionYears,beta,sharesHeld,lastPrice,revenue,ebitda,netIncome,bookValue,faceValue,couponRate,yearsToMaturity,ytm,paymentsPerYear,noi,capRate,reportedNav";
