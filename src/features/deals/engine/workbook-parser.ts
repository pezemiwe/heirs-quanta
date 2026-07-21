/**
 * Heirs Quanta - Portfolio Workbook Parser
 *
 * Accepts an ArrayBuffer from an .xlsx workbook (or a single CSV sheet) and
 * produces the three canonical data structures consumed by all platform modules:
 *
 *   Instrument[]  → Valuation, Duration Risk, Deal Blotter
 *   Security[]    → IFRS 9 (ECL engine)
 *   Holding[]     → Portfolio Management
 *
 * Sheet detection is name-based first, then falls back to content sniffing.
 * Every sheet in the Heirs Holdings workbook is handled:
 *   - FGN BONDS
 *   - STATE BOND
 *   - CORPORATE BOND
 *   - TREASURY BILLS
 *   - PLACEMENTS USD
 *   - PLACEMENTS LESS THAN 90DAYS
 *   - QUOTED EQUITY
 */

import * as XLSX from "xlsx";
import type { Instrument, InstrumentType } from "../../valuation/engine/types";
import type {
  Security,
  AssetSpecification,
  CouponFrequency as IFRS9Freq,
  PerformanceStatus,
} from "../../ifrs9/engine/types";
import type { Holding } from "../../portfolio/engine/types";

/* ─────────────────────────────────────────────────────────────
   Public result types
   ───────────────────────────────────────────────────────────── */

export interface SheetSummary {
  sheetName: string;
  detectedType: string;
  rowsParsed: number;
  rowsSkipped: number;
  warnings: string[];
}

/** A sheet whose name didn't match any known type - parsed by nothing, tracked instead of silently dropped. */
export interface UnrecognizedSheet {
  sheetName: string;
  rowCount: number;
}

export interface ParsedWorkbook {
  instruments: Instrument[];
  securities: Security[];
  holdings: Holding[];
  sheets: SheetSummary[];
  totalInstruments: number;
  unrecognizedSheets: UnrecognizedSheet[];
}

/* ─────────────────────────────────────────────────────────────
   Low-level helpers
   ───────────────────────────────────────────────────────────── */

const MONTH: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** Format year/month/day as ISO yyyy-mm-dd without constructing a local-midnight Date. */
function formatISODate(yr: number, mon: number, day: number): string {
  const mm = String(mon + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${yr}-${mm}-${dd}`;
}

/** Parse any date string the Heirs workbook might contain → ISO yyyy-mm-dd */
function parseDate(s: unknown): string {
  if (!s) return "";
  const t = String(s).trim();
  if (!t || t === "0") return "";

  // Excel serial number
  if (/^\d{5}$/.test(t)) {
    const d = XLSX.SSF.parse_date_code(Number(t));
    if (d) {
      const m = String(d.m).padStart(2, "0");
      const day = String(d.d).padStart(2, "0");
      return `${d.y}-${m}-${day}`;
    }
  }

  // dd-Mon-yy or dd-Mon-yyyy (e.g. "28-Jul-21", "02-Apr-26")
  const mdm = t.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/);
  if (mdm) {
    const day = parseInt(mdm[1]);
    const mon = MONTH[mdm[2].toLowerCase()] ?? 0;
    let yr = parseInt(mdm[3]);
    // Always pivot 2-digit years to the 2000s - this book's bond maturities run
    // out to "50" (2050) and no legitimate 19XX date exists in this platform's data.
    if (yr < 100) yr += 2000;
    return formatISODate(yr, mon, day);
  }

  // dd/mm/yyyy
  const dmy = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const day = parseInt(dmy[1]);
    const mon = parseInt(dmy[2]) - 1;
    const yr = parseInt(dmy[3]);
    return formatISODate(yr, mon, day);
  }

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;

  return "";
}

/** Strip commas, currency symbols, spaces; return 0 for blank/dash */
function parseNum(s: unknown): number {
  if (s === null || s === undefined || s === "") return 0;
  const raw = String(s).trim();
  if (raw === "-" || raw === "") return 0;
  const cleaned = raw.replace(/[,\s₦$£€]/g, "").replace(/%$/, "");
  const n = Number(cleaned);
  return isFinite(n) ? n : 0;
}

/** Parse a rate: "15.25%" → 0.1525, "0.1525" → 0.1525, "15.25" → 0.1525 */
function parseRate(s: unknown): number {
  const raw = String(s ?? "").trim();
  if (!raw || raw === "-") return 0;
  const hasPercent = raw.endsWith("%");
  const n = parseNum(s);
  if (hasPercent) return n / 100;
  // Bare number > 1 is almost certainly a percent already (e.g. "15.25" means 15.25%)
  return n > 1 ? n / 100 : n;
}

function str(s: unknown): string {
  return String(s ?? "").trim();
}

function isBlankRow(row: unknown[]): boolean {
  return row.every((c) => !c || String(c).trim() === "");
}

/** Find the row index where S/No, S/N, Identifier etc. starts */
function findHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    const cell = String(rows[i]?.[0] ?? "").trim().toLowerCase();
    if (cell === "s/no" || cell === "s/n" || cell === "sno" || cell === "#") {
      return i;
    }
    // Also check col 1 in case first col is blank
    const cell1 = String(rows[i]?.[1] ?? "").trim().toLowerCase();
    if (cell1 === "identifier" || cell1 === "s/no" || cell1 === "identifier/deal id") {
      return i;
    }
  }
  return 1; // default: title on row 0, headers on row 1
}

/* ─────────────────────────────────────────────────────────────
   Column resolution by header name (not fixed position)
   ─────────────────────────────────────────────────────────────
   The Heirs workbook template is hand-maintained and columns have shifted
   before (this is the same failure class as the dd-Mon-yy year-pivot bug -
   just in a different column). Every sheet parser below resolves each field
   it needs by looking up the actual header text in that sheet's header row
   first, and only falls back to the historically-hardcoded position - with
   a warning - if none of that field's known header aliases are present. */

/** Normalise a header cell → canonical lookup key (lowercase, alphanumeric only) */
function normaliseHeader(h: unknown): string {
  return String(h ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Build a normalised-header → column-index map from a sheet's header row. First occurrence wins. */
function buildHeaderMap(headerRow: unknown[] | undefined): Map<string, number> {
  const map = new Map<string, number>();
  (headerRow ?? []).forEach((cell, idx) => {
    const key = normaliseHeader(cell);
    if (key && !map.has(key)) map.set(key, idx);
  });
  return map;
}

/**
 * Resolves a column index by trying header-name aliases (normalised) against
 * the sheet's header map, in order. Falls back to `fallbackIndex` - the
 * historically hardcoded position - only if none of the aliases matched,
 * pushing a warning onto `warnings` so the fallback is never silent.
 */
function resolveColumn(
  headerMap: Map<string, number>,
  warnings: string[],
  label: string,
  aliases: string[],
  fallbackIndex: number,
): number {
  for (const alias of aliases) {
    const idx = headerMap.get(alias);
    if (idx !== undefined) return idx;
  }
  warnings.push(`Expected column '${label}' not found - falling back to position ${fallbackIndex + 1}`);
  console.warn(`[workbook-parser] Expected column '${label}' not found - falling back to position ${fallbackIndex + 1}`);
  return fallbackIndex;
}

/** Sheet-name-based type detection */
function detectSheetType(
  name: string,
): "fgn" | "state" | "corporate" | "tbill" | "placements-usd" | "placements-ngn" | "equity" | "unknown" {
  const n = name.toUpperCase();
  if (n.includes("FGN")) return "fgn";
  if (n.includes("STATE")) return "state";
  if (n.includes("CORPORATE")) return "corporate";
  if (n.includes("TREASURY") || n.includes("T-BILL") || n.includes("TBILL")) return "tbill";
  if (n.includes("USD")) return "placements-usd";
  if (n.includes("PLACEMENT") || n.includes("90")) return "placements-ngn";
  if (n.includes("EQUITY")) return "equity";
  return "unknown";
}

/* ─────────────────────────────────────────────────────────────
   Sheet parsers - each returns Instrument[]
   ───────────────────────────────────────────────────────────── */

/**
 * FGN Bonds
 * Headers (1-based col):
 * 1:S/No 2:Identifier 3:Dealer 4:Portfolio 5:IDENTIFIER/DEAL ID
 * 6:DESCRIPTION 7:VALUE DATE 8:MATURITY DATE 9:COUPON RATE
 * 10:YIELD AT PURCHASE 11:UNITS 12:COST AT PAR 13:FACE VALUE
 * 14:DIRTY PRICE 15:COST PRICE/CLEAN 16:COST 17:PREMIUM/(DISCOUNT)
 * 18:CONSIDERATION AT PURCHASE 19:CONSIDERATION INCL FMDQ+SEC
 * 20:ACCRUED INT AT ACQ  ...  32:CURRENT MARKET YIELD  33:CURRENT MARKET PRICE
 */
function parseFgnBonds(rows: unknown[][]): { instruments: Instrument[]; warnings: string[] } {
  const warnings: string[] = [];
  const instruments: Instrument[] = [];
  const hdr = findHeaderRow(rows);
  const headerMap = buildHeaderMap(rows[hdr]);
  const col = (label: string, aliases: string[], fallback: number) =>
    resolveColumn(headerMap, warnings, label, aliases, fallback);
  const optCol = (aliases: string[]) => {
    for (const alias of aliases) {
      const idx = headerMap.get(alias);
      if (idx !== undefined) return idx;
    }
    return -1;
  };

  const cId = col("IDENTIFIER", ["identifier"], 1);
  const cDealId = col("IDENTIFIER/DEAL ID", ["identifierdealid"], 4);
  const cDealer = col("DEALER", ["dealer"], 2);
  const cPortfolio = col("PORTFOLIO", ["portfolio"], 3);
  const cDescription = col("DESCRIPTION", ["description"], 5);
  const cValueDate = col("VALUE DATE", ["valuedate"], 6);
  const cMaturityDate = col("MATURITY DATE", ["maturitydate"], 7);
  const cCouponRate = col("COUPON RATE", ["couponrate"], 8);
  const cFaceValue = col("FACE VALUE", ["facevalue"], 12);
  const cConsiderationFmdq = col(
    "CONSIDERATION INCL FMDQ+SEC",
    ["considerationinclfmdqsec", "considerationinclfmdq"],
    18,
  );
  const cConsideration = col("CONSIDERATION AT PURCHASE", ["considerationatpurchase"], 17);
  const cCostPriceClean = col("COST PRICE/CLEAN", ["costpriceclean"], 15);
  const cMarketYield = col("CURRENT MARKET YIELD", ["currentmarketyield", "currentyield"], 31);
  const cMarketPrice = col("CURRENT MARKET PRICE", ["currentmarketprice", "currentprice"], 32);

  const c_couponReceivedToDateGross = optCol(["totalcouponreceivedtodate"]);
  const c_lastMonthAccruedInterest = optCol(["lastmonthaccruedinterest", "accruedinterestlastmonth"]);
  const c_effectiveInterestRate = optCol(["effectiveinterestrate", "eir", "yield", "interestrate"]);
  const c_daysEarnedInMonth = optCol(["daysearnedinthemonth", "daysearnedinmonth", "daysinmonth"]);
  const c_interestIncomeThisMonth = optCol(["thismonthinterest", "thismonthinterestincome", "interestincomeforthemonth", "interestincomeforthemonthincomeleg"]);
  const c_totalAccruedInterest = optCol(["totalaccruedinterest", "accruedinterest", "closingaccruedinterest"]);
  const c_lastMonthMarketValueClean = optCol(["lastmonthmarketvalueclean", "lastmonthmarketvalue"]);
  const c_lastMonthMarketYield = optCol(["lastmonthmarketyield", "lastmonthyield"]);
  const c_lastMonthMarketPrice = optCol(["lastmonthmarketprice", "lastmonthprice"]);
  const c_currentMarketYield = optCol(["currentmarketyield", "currentyield"]);
  const c_currentMarketPrice = optCol(["currentmarketprice", "currentprice"]);
  const c_actualCurrentMarketValueClean = optCol(["actualcurrentmarketvalueclean", "currentmarketvalueclean", "actualmarketvalueclean"]);
  const c_totalCurrentMarketValue = optCol(["totalcurrentmarketvalue", "currentmarketvalue", "totalmarketvalue"]);
  const c_currentMtmGainLoss = optCol(["currentmarktomarketgainloss", "mtmgainloss", "currentmtmgainloss"]);
  const c_monthlyMtmToPost = optCol(["marktomarkettopostthismonth", "mtmtopost", "monthlymtmtopost"]);

  for (let i = hdr + 1; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    if (isBlankRow(r)) continue;
    if (!r[0] || String(r[0]).trim() === "") continue;

    const sno = parseNum(r[0]);
    if (isNaN(sno) || sno === 0) continue; // skip sub-header rows

    const id = generateId(str(r[cId]) || str(r[cDealId]), "FGN");
    const name = str(r[cDescription]) || `FGN Bond ${id}`;
    const purchaseDate = parseDate(r[cValueDate]);
    const maturityDate = parseDate(r[cMaturityDate]);
    const couponRate = parseRate(r[cCouponRate]);
    const faceValue = parseNum(r[cFaceValue]);
    // Prefer consideration incl. FMDQ, else consideration, else clean cost price
    const purchasePrice = parseNum(r[cConsiderationFmdq]) || parseNum(r[cConsideration]) || parseNum(r[cCostPriceClean]);
    const marketYield = parseRate(r[cMarketYield]);
    const marketPrice = parseNum(r[cMarketPrice]);
    const bookedBy = str(r[cDealer]);
    const portfolioBook = str(r[cPortfolio]) || "FGN Bond Book";

    if (!purchaseDate) warnings.push(`Row ${i + 1}: missing value date for ${id}`);
    if (!maturityDate) warnings.push(`Row ${i + 1}: missing maturity date for ${id}`);
    if (faceValue === 0) warnings.push(`Row ${i + 1}: face value is zero for ${id}`);

    const uploadedManualValues: Partial<Record<import('../../valuation/engine/types').ManualValueKey, number>> = {};
    if (c_couponReceivedToDateGross >= 0) {
      const raw = String(r[c_couponReceivedToDateGross] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["couponReceivedToDateGross"] = parseNum(raw);
      }
    }
    if (c_lastMonthAccruedInterest >= 0) {
      const raw = String(r[c_lastMonthAccruedInterest] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["lastMonthAccruedInterest"] = parseNum(raw);
      }
    }
    if (c_effectiveInterestRate >= 0) {
      const raw = String(r[c_effectiveInterestRate] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["effectiveInterestRate"] = parseNum(raw);
      }
    }
    if (c_daysEarnedInMonth >= 0) {
      const raw = String(r[c_daysEarnedInMonth] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["daysEarnedInMonth"] = parseNum(raw);
      }
    }
    if (c_interestIncomeThisMonth >= 0) {
      const raw = String(r[c_interestIncomeThisMonth] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["interestIncomeThisMonth"] = parseNum(raw);
      }
    }
    if (c_totalAccruedInterest >= 0) {
      const raw = String(r[c_totalAccruedInterest] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["totalAccruedInterest"] = parseNum(raw);
      }
    }
    if (c_lastMonthMarketValueClean >= 0) {
      const raw = String(r[c_lastMonthMarketValueClean] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["lastMonthMarketValueClean"] = parseNum(raw);
      }
    }
    if (c_lastMonthMarketYield >= 0) {
      const raw = String(r[c_lastMonthMarketYield] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["lastMonthMarketYield"] = parseNum(raw);
      }
    }
    if (c_lastMonthMarketPrice >= 0) {
      const raw = String(r[c_lastMonthMarketPrice] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["lastMonthMarketPrice"] = parseNum(raw);
      }
    }
    if (c_currentMarketYield >= 0) {
      const raw = String(r[c_currentMarketYield] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["currentMarketYield"] = parseNum(raw);
      }
    }
    if (c_currentMarketPrice >= 0) {
      const raw = String(r[c_currentMarketPrice] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["currentMarketPrice"] = parseNum(raw);
      }
    }
    if (c_actualCurrentMarketValueClean >= 0) {
      const raw = String(r[c_actualCurrentMarketValueClean] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["actualCurrentMarketValueClean"] = parseNum(raw);
      }
    }
    if (c_totalCurrentMarketValue >= 0) {
      const raw = String(r[c_totalCurrentMarketValue] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["totalCurrentMarketValue"] = parseNum(raw);
      }
    }
    if (c_currentMtmGainLoss >= 0) {
      const raw = String(r[c_currentMtmGainLoss] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["currentMtmGainLoss"] = parseNum(raw);
      }
    }
    if (c_monthlyMtmToPost >= 0) {
      const raw = String(r[c_monthlyMtmToPost] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["monthlyMtmToPost"] = parseNum(raw);
      }
    }
    instruments.push({
      uploadedManualValues,
      id,
      name,
      instrumentType: "FGN Bond",
      issuer: "Federal Government of Nigeria",
      sector: "Sovereign",
      portfolioBook,
      classification: "AC",
      ifrs13Level: "L1",
      currency: "NGN",
      faceValue,
      purchasePrice: purchasePrice || faceValue,
      purchaseDate: purchaseDate || "2021-01-01",
      maturityDate: maturityDate || "2030-01-01",
      couponRate,
      couponFrequency: "Semi",
      status: "Active",
      bookedBy,
      marketYield: marketYield || undefined,
      marketPrice: marketPrice || undefined,
      impairmentStage: "Stage 1",
      eclProvision: 0,
    });
  }

  return { instruments, warnings };
}

/**
 * State Bonds
 * Headers: S/No | IDENTIFIER/DEAL ID | Investment Firm | Fund type | Bond Name
 *          Value Date | Maturity Date | Coupon Rate | Yield at Purchase | Units Holding
 *          Cost at par | Face Value | Dirty Price | Cost Price/Clean price | Cost | Consideration at Purchase
 */
function parseStateBonds(rows: unknown[][]): { instruments: Instrument[]; warnings: string[] } {
  const warnings: string[] = [];
  const instruments: Instrument[] = [];
  const hdr = findHeaderRow(rows);
  const headerMap = buildHeaderMap(rows[hdr]);
  const col = (label: string, aliases: string[], fallback: number) =>
    resolveColumn(headerMap, warnings, label, aliases, fallback);
  const optCol = (aliases: string[]) => {
    for (const alias of aliases) {
      const idx = headerMap.get(alias);
      if (idx !== undefined) return idx;
    }
    return -1;
  };

  const cId = col("IDENTIFIER/DEAL ID", ["identifierdealid"], 1);
  const cDealer = col("INVESTMENT FIRM", ["investmentfirm"], 2);
  const cPortfolio = col("FUND TYPE", ["fundtype"], 3);
  const cBondName = col("BOND NAME", ["bondname"], 4);
  const cValueDate = col("VALUE DATE", ["valuedate"], 5);
  const cMaturityDate = col("MATURITY DATE", ["maturitydate"], 6);
  const cCouponRate = col("COUPON RATE", ["couponrate"], 7);
  const cFaceValue = col("FACE VALUE", ["facevalue"], 11);
  const cConsideration = col("CONSIDERATION AT PURCHASE", ["considerationatpurchase"], 15);
  const cCost = col("COST", ["cost"], 14);

  const c_couponReceivedToDateGross = optCol(["couponreceivedtodategross", "totalcouponreceivedtodategross", "totalcoupongross"]);
  const c_couponReceivedToDateNet = optCol(["couponreceivedtodatenet", "totalcouponreceivedtodatenet", "totalcouponnet"]);
  const c_principalRepaymentThisMonth = optCol(["principalrepaymentforthemonth"]);
  const c_lastMonthAccruedInterest = optCol(["lastmonthaccruedinterest", "accruedinterestlastmonth"]);
  const c_interestIncomeThisMonth = optCol(["thismonthinterest", "thismonthinterestincome", "interestincomeforthemonth", "interestincomeforthemonthincomeleg"]);
  const c_grossCoupon = optCol(["grosscoupon"]);
  const c_wht = optCol(["chargeswht"]);
  const c_netCoupon = optCol(["netcoupon"]);
  const c_totalAccruedInterest = optCol(["totalaccruedinterest", "accruedinterest", "closingaccruedinterest"]);
  const c_totalCurrentMarketValue = optCol(["totalcurrentmarketvalue", "currentmarketvalue", "totalmarketvalue"]);

  for (let i = hdr + 1; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    if (isBlankRow(r)) continue;
    if (!r[0] || String(r[0]).trim() === "") continue;
    const sno = parseNum(r[0]);
    if (isNaN(sno) || sno === 0) continue;

    const id = generateId(str(r[cId]), "SG");
    const name = str(r[cBondName]) || `State Bond ${id}`;
    const purchaseDate = parseDate(r[cValueDate]);
    const maturityDate = parseDate(r[cMaturityDate]);
    const couponRate = parseRate(r[cCouponRate]);
    const faceValue = parseNum(r[cFaceValue]);
    const purchasePrice = parseNum(r[cConsideration]) || parseNum(r[cCost]);
    const bookedBy = str(r[cDealer]);
    const portfolioBook = str(r[cPortfolio]) || "State Bond Book";

    if (!purchaseDate) warnings.push(`Row ${i + 1}: missing value date for ${id}`);
    if (faceValue === 0) warnings.push(`Row ${i + 1}: face value is zero for ${id}`);

    const uploadedManualValues: Partial<Record<import('../../valuation/engine/types').ManualValueKey, number>> = {};
    if (c_couponReceivedToDateGross >= 0) {
      const raw = String(r[c_couponReceivedToDateGross] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["couponReceivedToDateGross"] = parseNum(raw);
      }
    }
    if (c_couponReceivedToDateNet >= 0) {
      const raw = String(r[c_couponReceivedToDateNet] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["couponReceivedToDateNet"] = parseNum(raw);
      }
    }
    if (c_principalRepaymentThisMonth >= 0) {
      const raw = String(r[c_principalRepaymentThisMonth] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["principalRepaymentThisMonth"] = parseNum(raw);
      }
    }
    if (c_lastMonthAccruedInterest >= 0) {
      const raw = String(r[c_lastMonthAccruedInterest] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["lastMonthAccruedInterest"] = parseNum(raw);
      }
    }
    if (c_interestIncomeThisMonth >= 0) {
      const raw = String(r[c_interestIncomeThisMonth] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["interestIncomeThisMonth"] = parseNum(raw);
      }
    }
    if (c_grossCoupon >= 0) {
      const raw = String(r[c_grossCoupon] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["grossCoupon"] = parseNum(raw);
      }
    }
    if (c_wht >= 0) {
      const raw = String(r[c_wht] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["wht"] = parseNum(raw);
      }
    }
    if (c_netCoupon >= 0) {
      const raw = String(r[c_netCoupon] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["netCoupon"] = parseNum(raw);
      }
    }
    if (c_totalAccruedInterest >= 0) {
      const raw = String(r[c_totalAccruedInterest] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["totalAccruedInterest"] = parseNum(raw);
      }
    }
    if (c_totalCurrentMarketValue >= 0) {
      const raw = String(r[c_totalCurrentMarketValue] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["totalCurrentMarketValue"] = parseNum(raw);
      }
    }
    instruments.push({
      uploadedManualValues,
      id,
      name,
      instrumentType: "State Bond",
      issuer: extractStateIssuer(name),
      sector: "Sub-Sovereign",
      portfolioBook,
      classification: "AC",
      ifrs13Level: "L2",
      currency: "NGN",
      faceValue,
      purchasePrice: purchasePrice || faceValue,
      purchaseDate: purchaseDate || "2022-01-01",
      maturityDate: maturityDate || "2033-01-01",
      couponRate,
      couponFrequency: "Semi",
      status: "Active",
      bookedBy,
      impairmentStage: "Stage 1",
      eclProvision: 0,
    });
  }

  return { instruments, warnings };
}

function extractStateIssuer(bondName: string): string {
  const n = bondName.toUpperCase();
  if (n.includes("LASG") || n.includes("LAGOS")) return "Lagos State Government";
  if (n.includes("RIVERS")) return "Rivers State Government";
  if (n.includes("KANO")) return "Kano State Government";
  if (n.includes("FCT") || n.includes("ABUJA")) return "FCT Administration";
  // Try to extract from name pattern like "15.25% LASG MAY 2033 Bond"
  const match = bondName.match(/\b([A-Z]{3,6})\b/);
  return match ? `${match[1]} State Government` : "State Government";
}

/**
 * Corporate Bonds
 * Headers: S/No | Identifier | Dealer | Portfolio | Bond Name | Value Date | Maturity Date
 *          Coupon Rate | Yield at Purchase | Units Holding | Cost at par | Face Value
 *          Dirty Price | Cost Price/Clean price | Cost | Consideration at Purchase
 */
function parseCorporateBonds(rows: unknown[][]): { instruments: Instrument[]; warnings: string[] } {
  const warnings: string[] = [];
  const instruments: Instrument[] = [];
  const hdr = findHeaderRow(rows);
  const headerMap = buildHeaderMap(rows[hdr]);
  const col = (label: string, aliases: string[], fallback: number) =>
    resolveColumn(headerMap, warnings, label, aliases, fallback);
  const optCol = (aliases: string[]) => {
    for (const alias of aliases) {
      const idx = headerMap.get(alias);
      if (idx !== undefined) return idx;
    }
    return -1;
  };

  const cId = col("IDENTIFIER", ["identifier"], 1);
  const cDealer = col("DEALER", ["dealer"], 2);
  const cPortfolio = col("PORTFOLIO", ["portfolio"], 3);
  const cBondName = col("BOND NAME", ["bondname"], 4);
  const cValueDate = col("VALUE DATE", ["valuedate"], 5);
  const cMaturityDate = col("MATURITY DATE", ["maturitydate"], 6);
  const cCouponRate = col("COUPON RATE", ["couponrate"], 7);
  const cFaceValue = col("FACE VALUE", ["facevalue"], 11);
  const cConsideration = col("CONSIDERATION AT PURCHASE", ["considerationatpurchase"], 15);
  const cCost = col("COST", ["cost"], 14);

  const c_couponReceivedToDateNet = optCol(["totalcouponreceivedtodatenet"]);
  const c_couponReceivedToDateGross = optCol(["totalcoupongross"]);
  const c_lastMonthAccruedInterest = optCol(["lastmonthaccruedinterest", "accruedinterestlastmonth"]);
  const c_interestIncomeThisMonth = optCol(["thismonthinterest", "thismonthinterestincome", "interestincomeforthemonth", "interestincomeforthemonthincomeleg"]);
  const c_totalAccruedInterest = optCol(["totalaccruedinterest", "accruedinterest", "closingaccruedinterest"]);
  const c_totalCurrentMarketValue = optCol(["totalcurrentmarketvalue", "currentmarketvalue", "totalmarketvalue"]);

  for (let i = hdr + 1; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    if (isBlankRow(r)) continue;
    if (!r[0] || String(r[0]).trim() === "") continue;
    const sno = parseNum(r[0]);
    if (isNaN(sno) || sno === 0) continue;

    const id = generateId(str(r[cId]), "COR");
    const name = str(r[cBondName]) || `Corporate Bond ${id}`;
    const purchaseDate = parseDate(r[cValueDate]);
    const maturityDate = parseDate(r[cMaturityDate]);
    const couponRate = parseRate(r[cCouponRate]);
    const faceValue = parseNum(r[cFaceValue]);
    const purchasePrice = parseNum(r[cConsideration]) || parseNum(r[cCost]);
    const bookedBy = str(r[cDealer]);
    const portfolioBook = str(r[cPortfolio]) || "Corporate Bond Book";

    if (faceValue === 0) warnings.push(`Row ${i + 1}: face value is zero for ${id}`);

    const uploadedManualValues: Partial<Record<import('../../valuation/engine/types').ManualValueKey, number>> = {};
    if (c_couponReceivedToDateNet >= 0) {
      const raw = String(r[c_couponReceivedToDateNet] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["couponReceivedToDateNet"] = parseNum(raw);
      }
    }
    if (c_couponReceivedToDateGross >= 0) {
      const raw = String(r[c_couponReceivedToDateGross] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["couponReceivedToDateGross"] = parseNum(raw);
      }
    }
    if (c_lastMonthAccruedInterest >= 0) {
      const raw = String(r[c_lastMonthAccruedInterest] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["lastMonthAccruedInterest"] = parseNum(raw);
      }
    }
    if (c_interestIncomeThisMonth >= 0) {
      const raw = String(r[c_interestIncomeThisMonth] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["interestIncomeThisMonth"] = parseNum(raw);
      }
    }
    if (c_totalAccruedInterest >= 0) {
      const raw = String(r[c_totalAccruedInterest] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["totalAccruedInterest"] = parseNum(raw);
      }
    }
    if (c_totalCurrentMarketValue >= 0) {
      const raw = String(r[c_totalCurrentMarketValue] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["totalCurrentMarketValue"] = parseNum(raw);
      }
    }
    instruments.push({
      uploadedManualValues,
      id,
      name,
      instrumentType: "Corporate Bond",
      issuer: extractCorporateIssuer(name, bookedBy),
      sector: extractCorporateSector(name),
      portfolioBook,
      classification: "FVOCI",
      ifrs13Level: "L2",
      currency: "NGN",
      faceValue,
      purchasePrice: purchasePrice || faceValue,
      purchaseDate: purchaseDate || "2022-01-01",
      maturityDate: maturityDate || "2027-01-01",
      couponRate,
      couponFrequency: "Semi",
      status: "Active",
      bookedBy,
      impairmentStage: "Stage 1",
      eclProvision: 0,
    });
  }

  return { instruments, warnings };
}

function extractCorporateIssuer(bondName: string, dealer: string): string {
  const n = bondName.toUpperCase();
  if (n.includes("UNITED CAPITAL") || n.includes("UCAP")) return "United Capital Plc";
  if (n.includes("MTN") || n.includes("MTN NIGERIA")) return "MTN Nigeria Communications Plc";
  if (n.includes("DANGOTE")) return "Dangote Group";
  if (n.includes("ZENITH")) return "Zenith Bank Plc";
  if (n.includes("ACCESS")) return "Access Bank Plc";
  if (n.includes("UBA")) return "United Bank for Africa Plc";
  if (n.includes("GTCO")) return "Guaranty Trust Holding Co.";
  return dealer || "Corporate Issuer";
}

function extractCorporateSector(bondName: string): string {
  const n = bondName.toUpperCase();
  if (n.includes("MTN") || n.includes("AIRTEL") || n.includes("9MOBILE")) return "Telecoms";
  if (n.includes("BANK") || n.includes("CAPITAL") || n.includes("FINANCE")) return "Financial Services";
  if (n.includes("DANGOTE") || n.includes("CEMENT") || n.includes("FLOUR")) return "Consumer Staples";
  if (n.includes("OIL") || n.includes("ENERGY") || n.includes("NNPC")) return "Energy";
  return "Corporate";
}

/**
 * Treasury Bills
 * Headers: S/No | Dealer | Identifier | Portfolio | Description | Purchase Cost
 *          Value Date | Maturity Date | Interest Rate | Facevalue | Tenor | Price on purchase
 */
function parseTreasuryBills(rows: unknown[][]): { instruments: Instrument[]; warnings: string[] } {
  const warnings: string[] = [];
  const instruments: Instrument[] = [];
  const hdr = findHeaderRow(rows);
  const headerMap = buildHeaderMap(rows[hdr]);
  const col = (label: string, aliases: string[], fallback: number) =>
    resolveColumn(headerMap, warnings, label, aliases, fallback);
  const optCol = (aliases: string[]) => {
    for (const alias of aliases) {
      const idx = headerMap.get(alias);
      if (idx !== undefined) return idx;
    }
    return -1;
  };

  const cDealer = col("DEALER", ["dealer"], 1);
  const cId = col("IDENTIFIER", ["identifier"], 2);
  const cPortfolio = col("PORTFOLIO", ["portfolio"], 3);
  const cDescription = col("DESCRIPTION", ["description"], 4);
  const cPurchaseCost = col("PURCHASE COST", ["purchasecost"], 5);
  const cValueDate = col("VALUE DATE", ["valuedate"], 6);
  const cMaturityDate = col("MATURITY DATE", ["maturitydate"], 7);
  const cInterestRate = col("INTEREST RATE", ["interestrate"], 8);
  const cFaceValue = col("FACEVALUE", ["facevalue"], 9);

  const c_interestReceivable = optCol(["interestreceivable", "interestreceivableusd", "interestreceivablengn", "accruedinterest"]);
  const c_effectiveInterestRate = optCol(["effectiveinterestrate", "eir", "yield", "interestrate"]);
  const c_interestIncomeThisMonth = optCol(["interestincomeforthemonthincomeleg"]);
  const c_accruedInterestClosing = optCol(["closingaccruedinterestassetleg"]);
  const c_currentMarketBidDiscountRate = optCol(["currentmarketbiddiscountrate"]);
  const c_currentMarketValue = optCol(["currentmarketvalue"]);
  const c_currentMtmGainLoss = optCol(["currentmarktomarketgainlossassetleg"]);
  const c_monthlyMtmToPost = optCol(["monthlymarktomarkettopostincomeleg"]);

  for (let i = hdr + 1; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    if (isBlankRow(r)) continue;
    if (!r[0] || String(r[0]).trim() === "") continue;
    const sno = parseNum(r[0]);
    if (isNaN(sno) || sno === 0) continue;

    const id = generateId(str(r[cId]), "TB");
    const name = str(r[cDescription]) || `Treasury Bill ${id}`;
    const purchasePrice = parseNum(r[cPurchaseCost]);
    const purchaseDate = parseDate(r[cValueDate]);
    const maturityDate = parseDate(r[cMaturityDate]);
    const couponRate = parseRate(r[cInterestRate]); // discount rate
    const faceValue = parseNum(r[cFaceValue]);
    const bookedBy = str(r[cDealer]);
    const portfolioBook = str(r[cPortfolio]) || "Treasury Bill Book";

    if (faceValue === 0) warnings.push(`Row ${i + 1}: face value is zero for ${id}`);

    const uploadedManualValues: Partial<Record<import('../../valuation/engine/types').ManualValueKey, number>> = {};
    if (c_interestReceivable >= 0) {
      const raw = String(r[c_interestReceivable] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["interestReceivable"] = parseNum(raw);
      }
    }
    if (c_effectiveInterestRate >= 0) {
      const raw = String(r[c_effectiveInterestRate] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["effectiveInterestRate"] = parseNum(raw);
      }
    }
    if (c_interestIncomeThisMonth >= 0) {
      const raw = String(r[c_interestIncomeThisMonth] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["interestIncomeThisMonth"] = parseNum(raw);
      }
    }
    if (c_accruedInterestClosing >= 0) {
      const raw = String(r[c_accruedInterestClosing] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["accruedInterestClosing"] = parseNum(raw);
      }
    }
    if (c_currentMarketBidDiscountRate >= 0) {
      const raw = String(r[c_currentMarketBidDiscountRate] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["currentMarketBidDiscountRate"] = parseNum(raw);
      }
    }
    if (c_currentMarketValue >= 0) {
      const raw = String(r[c_currentMarketValue] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["currentMarketValue"] = parseNum(raw);
      }
    }
    if (c_currentMtmGainLoss >= 0) {
      const raw = String(r[c_currentMtmGainLoss] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["currentMtmGainLoss"] = parseNum(raw);
      }
    }
    if (c_monthlyMtmToPost >= 0) {
      const raw = String(r[c_monthlyMtmToPost] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["monthlyMtmToPost"] = parseNum(raw);
      }
    }
    instruments.push({
      uploadedManualValues,
      id,
      name,
      instrumentType: "T-Bill",
      issuer: "Federal Government of Nigeria",
      sector: "Sovereign",
      portfolioBook,
      classification: "AC",
      ifrs13Level: "L1",
      currency: "NGN",
      faceValue,
      purchasePrice: purchasePrice || faceValue,
      purchaseDate: purchaseDate || "2025-01-01",
      maturityDate: maturityDate || "2026-01-01",
      couponRate,
      couponFrequency: "Zero",
      status: "Active",
      bookedBy,
      impairmentStage: "Stage 1",
      eclProvision: 0,
    });
  }

  return { instruments, warnings };
}

/**
 * Placements USD (FCY Fixed Term Deposits)
 * Headers: S/No | Dealer | Identifier | Portfolio | Currency | Asset class
 *          Principal USD ($) | Exchange rate @ purchase | Principal (N) | Rate
 *          Value date | Maturity date | Tenor
 */
function parsePlacementsUSD(rows: unknown[][]): { instruments: Instrument[]; warnings: string[] } {
  const warnings: string[] = [];
  const instruments: Instrument[] = [];
  const hdr = findHeaderRow(rows);
  const headerMap = buildHeaderMap(rows[hdr]);
  const col = (label: string, aliases: string[], fallback: number) =>
    resolveColumn(headerMap, warnings, label, aliases, fallback);
  const optCol = (aliases: string[]) => {
    for (const alias of aliases) {
      const idx = headerMap.get(alias);
      if (idx !== undefined) return idx;
    }
    return -1;
  };

  const cDealer = col("DEALER", ["dealer"], 1);
  const cId = col("IDENTIFIER", ["identifier"], 2);
  const cPortfolio = col("PORTFOLIO", ["portfolio"], 3);
  const cPrincipalUSD = col("PRINCIPAL USD ($)", ["principalusd"], 6);
  const cFxRate = col("EXCHANGE RATE @ PURCHASE", ["exchangeratepurchase", "exchangerateatpurchase", "exchangerate"], 7);
  const cRate = col("RATE", ["rate", "interestrate", "yield", "coupon", "couponrate", "effectiveinterestrate"], 9);
  const cValueDate = col("VALUE DATE", ["valuedate"], 10);
  const cMaturityDate = col("MATURITY DATE", ["maturitydate"], 11);
  const cOpeningFx = col("OPENING EXCHANGE RATE", ["openingexchangerate", "openingrate"], -1);

  const c_interestReceivable = optCol(["interestreceivableusd"]);
  const c_effectiveInterestRate = optCol(["effectiveinterestrate", "eir", "yield", "interestrate"]);
  const c_interestIncomeThisMonth = optCol(["thismonthinterestincomeusd"]);
  const c_accruedInterestClosingUsd = optCol(["accruedinterestusd"]);
  const c_accruedInterestClosingNgn = optCol(["accruedinterestngn"]);
  const c_closingAmortisedCostUsd = optCol(["closingamortisedcostusd"]);
  const c_thisMonthExchangeGainLoss = optCol(["thismonthexchangegainlossngn"]);
  const c_totalUnrealisedExchangeGainLoss = optCol(["totalunrealisedexchangegainlossngn"]);
  const c_totalCurrentMarketValue = optCol(["totalcurrentmarketvalueinclusiveoffxngn"]);

  for (let i = hdr + 1; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    if (isBlankRow(r)) continue;
    if (!r[0] || String(r[0]).trim() === "") continue;
    const sno = parseNum(r[0]);
    if (isNaN(sno) || sno === 0) continue;

    const id = generateId(str(r[cId]), "PUSD");
    const dealer = str(r[cDealer]);
    const principalUSD = parseNum(r[cPrincipalUSD]);
    const fxRate = parseNum(r[cFxRate]);
    const openingFxRate = cOpeningFx >= 0 ? parseNum(r[cOpeningFx]) : undefined;
    const couponRate = parseRate(r[cRate]);
    const purchaseDate = parseDate(r[cValueDate]);
    const maturityDate = parseDate(r[cMaturityDate]);
    const portfolioBook = str(r[cPortfolio]) || "USD Placement Book";

    const uploadedManualValues: Partial<Record<import('../../valuation/engine/types').ManualValueKey, number>> = {};
    if (c_interestReceivable >= 0) {
      const raw = String(r[c_interestReceivable] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["interestReceivable"] = parseNum(raw);
      }
    }
    if (c_effectiveInterestRate >= 0) {
      const raw = String(r[c_effectiveInterestRate] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["effectiveInterestRate"] = parseNum(raw);
      }
    }
    if (c_interestIncomeThisMonth >= 0) {
      const raw = String(r[c_interestIncomeThisMonth] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["interestIncomeThisMonth"] = parseNum(raw);
      }
    }
    if (c_accruedInterestClosingUsd >= 0) {
      const raw = String(r[c_accruedInterestClosingUsd] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["accruedInterestClosingUsd"] = parseNum(raw);
      }
    }
    if (c_accruedInterestClosingNgn >= 0) {
      const raw = String(r[c_accruedInterestClosingNgn] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["accruedInterestClosingNgn"] = parseNum(raw);
      }
    }
    if (c_closingAmortisedCostUsd >= 0) {
      const raw = String(r[c_closingAmortisedCostUsd] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["closingAmortisedCostUsd"] = parseNum(raw);
      }
    }
    if (c_thisMonthExchangeGainLoss >= 0) {
      const raw = String(r[c_thisMonthExchangeGainLoss] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["thisMonthExchangeGainLoss"] = parseNum(raw);
      }
    }
    if (c_totalUnrealisedExchangeGainLoss >= 0) {
      const raw = String(r[c_totalUnrealisedExchangeGainLoss] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["totalUnrealisedExchangeGainLoss"] = parseNum(raw);
      }
    }
    if (c_totalCurrentMarketValue >= 0) {
      const raw = String(r[c_totalCurrentMarketValue] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["totalCurrentMarketValue"] = parseNum(raw);
      }
    }
    instruments.push({
      uploadedManualValues,
      id,
      name: `${dealer} USD Placement ${id}`,
      instrumentType: "Fixed Deposit",
      issuer: dealer || "Counterparty Bank",
      sector: "Banking",
      portfolioBook,
      classification: "AC",
      ifrs13Level: "L2",
      currency: "USD",
      faceValue: principalUSD,
      purchasePrice: principalUSD,
      purchaseDate: purchaseDate || "2026-01-01",
      maturityDate: maturityDate || "2027-01-01",
      couponRate,
      couponFrequency: "Zero",
      status: "Active",
      bookedBy: dealer,
      impairmentStage: "Stage 1",
      eclProvision: 0,
      purchaseFxRate: isNaN(fxRate) || fxRate === 0 ? undefined : fxRate,
      openingFxRate: openingFxRate === undefined || isNaN(openingFxRate) || openingFxRate === 0 ? undefined : openingFxRate,
    });
  }

  return { instruments, warnings };
}

/**
 * Placements < 90 Days (NGN short-term)
 * Headers: S/No | Identifier | Institution | Principal | Rate | Value date | Maturity date | Tenor
 */
function parsePlacementsNGN(rows: unknown[][]): { instruments: Instrument[]; warnings: string[] } {
  const warnings: string[] = [];
  const instruments: Instrument[] = [];
  const hdr = findHeaderRow(rows);
  const headerMap = buildHeaderMap(rows[hdr]);
  const col = (label: string, aliases: string[], fallback: number) =>
    resolveColumn(headerMap, warnings, label, aliases, fallback);
  const optCol = (aliases: string[]) => {
    for (const alias of aliases) {
      const idx = headerMap.get(alias);
      if (idx !== undefined) return idx;
    }
    return -1;
  };

  const cId = col("IDENTIFIER", ["identifier"], 1);
  const cInstitution = col("INSTITUTION", ["institution"], 2);
  const cPrincipal = col("PRINCIPAL", ["principal"], 3);
  const cRate = col("RATE", ["rate", "interestrate", "yield", "coupon", "couponrate", "effectiveinterestrate"], 4);
  const cValueDate = col("VALUE DATE", ["valuedate"], 5);
  const cMaturityDate = col("MATURITY DATE", ["maturitydate", "enddate", "maturity"], 6);

  console.log("=== DEBUG PLACEMENTS NGN HEADERS ===");
  console.log("Found Header Row:", hdr);
  console.log("Header Map Keys:", Array.from(headerMap.keys()));
  console.log("Column Indices:", { cId, cInstitution, cPrincipal, cRate, cValueDate, cMaturityDate });

  const c_interestReceivable = optCol(["interestreceivable", "interestreceivableusd", "interestreceivablengn", "accruedinterest"]);
  const c_effectiveInterestRate = optCol(["effectiveinterestrate", "eir", "yield", "interestrate"]);
  const c_interestIncomeThisMonth = optCol(["thismonthinterest", "thismonthinterestincome", "interestincomeforthemonth", "interestincomeforthemonthincomeleg"]);
  const c_wht = optCol(["wht10", "wht", "chargeswht", "whttax", "tax"]);
  const c_netIncome = optCol(["netincome", "netinterestincome"]);
  const c_accruedInterestClosing = optCol(["closingaccruedinterest", "closingamortisedcost", "accruedinterestclosing", "closingaccruedinterestassetleg", "accruedinterest"]);

  for (let i = hdr + 1; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    if (isBlankRow(r)) continue;
    if (!r[0] || String(r[0]).trim() === "") continue;
    const sno = parseNum(r[0]);
    if (isNaN(sno) || sno === 0) continue;

    const id = generateId(str(r[cId]), "PLC");
    const institution = str(r[cInstitution]);
    const principal = parseNum(r[cPrincipal]);
    const couponRate = parseRate(r[cRate]);
    const purchaseDate = parseDate(r[cValueDate]);
    const maturityDate = parseDate(r[cMaturityDate]);
    const portfolioBook = "Placements <90 Days";

    let faceValue = principal;
    if (purchaseDate && maturityDate) {
      const pDate = new Date(purchaseDate);
      const mDate = new Date(maturityDate);
      const tenorDays = Math.round((mDate.getTime() - pDate.getTime()) / 86400000);
      const grossInterest = principal * couponRate * (tenorDays / 365);
      const netInterest = grossInterest * 0.9; // 10% WHT deducted
      faceValue = principal + netInterest;
    }

    const uploadedManualValues: Partial<Record<import('../../valuation/engine/types').ManualValueKey, number>> = {};
    if (c_interestReceivable >= 0) {
      const raw = String(r[c_interestReceivable] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["interestReceivable"] = parseNum(raw);
      }
    }
    if (c_effectiveInterestRate >= 0) {
      const raw = String(r[c_effectiveInterestRate] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["effectiveInterestRate"] = parseNum(raw);
      }
    }
    if (c_interestIncomeThisMonth >= 0) {
      const raw = String(r[c_interestIncomeThisMonth] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["interestIncomeThisMonth"] = parseNum(raw);
      }
    }
    if (c_wht >= 0) {
      const raw = String(r[c_wht] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["wht"] = parseNum(raw);
      }
    }
    if (c_netIncome >= 0) {
      const raw = String(r[c_netIncome] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["netIncome"] = parseNum(raw);
      }
    }
    if (c_accruedInterestClosing >= 0) {
      const raw = String(r[c_accruedInterestClosing] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["accruedInterestClosing"] = parseNum(raw);
      }
    }
    instruments.push({
      uploadedManualValues,
      id,
      name: `${institution} Placement ${id}`,
      instrumentType: "Bank Placement",
      issuer: institution || "Commercial Bank",
      sector: "Banking",
      portfolioBook,
      classification: "AC",
      ifrs13Level: "L2",
      currency: "NGN",
      faceValue,
      purchasePrice: principal,
      purchaseDate: purchaseDate || "2026-01-01",
      maturityDate: maturityDate || "2026-06-01",
      couponRate,
      couponFrequency: "Monthly", // Force monthly schedule for proper accrual steps
      status: "Active",
      bookedBy: institution,
      impairmentStage: "Stage 1",
      eclProvision: 0,
    });
  }

  return { instruments, warnings };
}

/**
 * Quoted Equity
 * Headers: S/N | Identifier | Portfolio | COMPANY | Purchase date
 *          Holdings | Cost Price Unit | COST | Closing Market Price | Current Market Value
 *
 * Note: This sheet has 2 extra sub-header rows after the main headers (dates, units).
 * We skip any row where col[0] is not a number.
 */
function parseQuotedEquity(
  rows: unknown[][],
): { instruments: Instrument[]; holdings: Holding[]; warnings: string[] } {
  const warnings: string[] = [];
  const instruments: Instrument[] = [];
  const holdings: Holding[] = [];
  const hdr = findHeaderRow(rows);
  const headerMap = buildHeaderMap(rows[hdr]);
  const col = (label: string, aliases: string[], fallback: number) =>
    resolveColumn(headerMap, warnings, label, aliases, fallback);
  const optCol = (aliases: string[]) => {
    for (const alias of aliases) {
      const idx = headerMap.get(alias);
      if (idx !== undefined) return idx;
    }
    return -1;
  };

  const cId = col("IDENTIFIER", ["identifier"], 1);
  const cPortfolio = col("PORTFOLIO", ["portfolio"], 2);
  const cCompany = col("COMPANY", ["company"], 3);
  const cPurchaseDate = col("PURCHASE DATE", ["purchasedate"], 4);
  const cHoldings = col("HOLDINGS", ["holdings"], 5);
  const cCostPriceUnit = col("COST PRICE UNIT", ["costpriceunit"], 6);
  const cCost = col("COST", ["cost"], 7);
  const cClosingMarketPrice = col("CLOSING MARKET PRICE", ["closingmarketprice"], 8);
  const cCurrentMarketValue = col("CURRENT MARKET VALUE", ["currentmarketvalue"], 9);

  const c_currentMarketValue = optCol(["currentmarketvalueassetleg"]);
  const c_openingGainLoss = optCol(["openinggainlossassetleg"]);
  const c_currentMtmGainLoss = optCol(["currentmtmfairvaluegainlossassetleg"]);
  const c_monthlyMtmToPost = optCol(["monthlyfairvaluegainlossincomeleg"]);
  const c_grossDividendReceived = optCol(["grossdividendreceivedforthemonth"]);
  const c_wht = optCol(["wht"]);
  const c_netDividendReceived = optCol(["dividendreceivedforthemonthnetofwht"]);
  const c_ytdDividendReceivedNet = optCol(["ytddividendreceivednet"]);

  for (let i = hdr + 1; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    if (isBlankRow(r)) continue;
    const sno = parseNum(r[0]);
    if (isNaN(sno) || sno === 0) continue; // skip sub-header/unit rows

    const id = generateId(str(r[cId]), "EQ");
    const company = str(r[cCompany]) || `Equity ${id}`;
    const purchaseDate = parseDate(r[cPurchaseDate]);
    const quantity = parseNum(r[cHoldings]);
    const costPriceUnit = parseNum(r[cCostPriceUnit]);
    const totalCost = parseNum(r[cCost]);
    const marketPriceUnit = parseNum(r[cClosingMarketPrice]);
    const marketValueTotal = parseNum(r[cCurrentMarketValue]);
    const portfolioBook = str(r[cPortfolio]) || "Quoted Equity Book";

    const positionMarketValue =
      marketValueTotal > 0 ? marketValueTotal : quantity * marketPriceUnit;

    const costBasisM = totalCost / 1_000_000;
    const mktValueM =
      marketValueTotal > 0
        ? marketValueTotal / 1_000_000
        : (quantity * marketPriceUnit) / 1_000_000;
    const ytdReturn =
      costBasisM > 0 ? (mktValueM - costBasisM) / costBasisM : 0;

    const uploadedManualValues: Partial<Record<import('../../valuation/engine/types').ManualValueKey, number>> = {};
    if (c_currentMarketValue >= 0) {
      const raw = String(r[c_currentMarketValue] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["currentMarketValue"] = parseNum(raw);
      }
    }
    if (c_openingGainLoss >= 0) {
      const raw = String(r[c_openingGainLoss] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["openingGainLoss"] = parseNum(raw);
      }
    }
    if (c_currentMtmGainLoss >= 0) {
      const raw = String(r[c_currentMtmGainLoss] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["currentMtmGainLoss"] = parseNum(raw);
      }
    }
    if (c_monthlyMtmToPost >= 0) {
      const raw = String(r[c_monthlyMtmToPost] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["monthlyMtmToPost"] = parseNum(raw);
      }
    }
    if (c_grossDividendReceived >= 0) {
      const raw = String(r[c_grossDividendReceived] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["grossDividendReceived"] = parseNum(raw);
      }
    }
    if (c_wht >= 0) {
      const raw = String(r[c_wht] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["wht"] = parseNum(raw);
      }
    }
    if (c_netDividendReceived >= 0) {
      const raw = String(r[c_netDividendReceived] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["netDividendReceived"] = parseNum(raw);
      }
    }
    if (c_ytdDividendReceivedNet >= 0) {
      const raw = String(r[c_ytdDividendReceivedNet] ?? "").trim();
      if (raw !== "" && raw !== "-") {
        uploadedManualValues["ytdDividendReceivedNet"] = parseNum(raw);
      }
    }
    instruments.push({
      uploadedManualValues,
      id,
      name: company,
      instrumentType: "Equity",
      issuer: company,
      sector: guessSector(company),
      portfolioBook,
      classification: "FVTPL",
      ifrs13Level: "L1",
      currency: "NGN",
      faceValue: totalCost,
      purchasePrice: costPriceUnit * quantity,
      purchaseDate: purchaseDate || "2024-01-01",
      maturityDate: "2099-12-31",
      couponRate: 0,
      couponFrequency: "N/A",
      status: "Active",
      marketPrice: positionMarketValue || undefined,
      impairmentStage: "N/A",
      eclProvision: 0,
    });

    holdings.push({
      id,
      name: company,
      assetClass: "Equity",
      sector: guessSector(company),
      geography: "Nigeria",
      currency: "NGN",
      issuer: company,
      quantity,
      costPrice: costPriceUnit,
      costBasis: costBasisM,
      marketValue: mktValueM,
      marketPrice: marketPriceUnit || undefined,
      ytdReturn,
      beta: 1.0,
      dividendYield: 0.03,
    });
  }

  return { instruments, holdings, warnings };
}

function guessSector(company: string): string {
  const n = company.toUpperCase();
  if (n.includes("BANK") || n.includes("CAPITAL") || n.includes("UBA") || n.includes("GTCO"))
    return "Banking";
  if (n.includes("INSURANCE") || n.includes("ASSURANCE") || n.includes("LIFE"))
    return "Insurance";
  if (n.includes("OIL") || n.includes("ENERGY") || n.includes("GAS") || n.includes("PETROLEUM"))
    return "Energy";
  if (n.includes("MTN") || n.includes("AIRTEL") || n.includes("TELECOM"))
    return "Telecoms";
  if (n.includes("CEMENT") || n.includes("DANGOTE") || n.includes("LAFARGE"))
    return "Consumer Staples";
  if (n.includes("TRANSCORP") || n.includes("HOTEL"))
    return "Hospitality";
  return "Financial Services";
}

/* ─────────────────────────────────────────────────────────────
   Instrument → Security (IFRS 9) conversion
   ───────────────────────────────────────────────────────────── */

const COUPON_FREQ_MAP: Record<string, IFRS9Freq> = {
  Annual: "ANNUALLY",
  Semi: "SEMI-ANNUALLY",
  Quarterly: "QUARTERLY",
  Monthly: "MONTHLY",
  Zero: "BULLET",
  "N/A": "BULLET",
};

const FX_RATES: Record<string, number> = {
  NGN: 1,
  USD: 1580,
  GBP: 1980,
  EUR: 1720,
};

export function instrumentToSecurity(inst: Instrument, sn: number): Security {
  const fxRate = FX_RATES[inst.currency] ?? 1;
  const isSovFCY =
    inst.currency !== "NGN" &&
    (inst.instrumentType === "FGN Bond" || inst.sector === "Sovereign");
  const isSovLCY =
    inst.currency === "NGN" &&
    (inst.instrumentType === "FGN Bond" ||
      inst.instrumentType === "State Bond" ||
      inst.sector === "Sovereign");

  const spec: AssetSpecification = isSovFCY
    ? "Sovereign FCY"
    : isSovLCY
      ? "Sovereign LCY"
      : "Corporate";

  const purchaseLcy = inst.purchasePrice * fxRate;
  const faceLcy = inst.faceValue * fxRate;

  // Safe date parsing - fall back to sensible defaults
  const origDate = inst.purchaseDate ? new Date(inst.purchaseDate + "T00:00:00Z") : new Date();
  const matDate = inst.maturityDate && inst.maturityDate !== "2099-12-31"
    ? new Date(inst.maturityDate + "T00:00:00Z")
    : new Date(Date.now() + 365 * 24 * 3600_000);

  if (isNaN(origDate.getTime())) origDate.setTime(Date.now());
  if (isNaN(matDate.getTime())) matDate.setTime(Date.now() + 365 * 24 * 3600_000);

  const defaultRating = spec === "Sovereign LCY" || spec === "Sovereign FCY" ? "B+" : "B";

  return {
    sn,
    counterparty: inst.issuer,
    currency: inst.currency,
    assetSpecification: spec,
    purchaseConsiderationAcy: inst.purchasePrice,
    purchaseConsiderationLcy: purchaseLcy,
    redemptionValueAcy: inst.faceValue,
    redemptionValueLcy: faceLcy,
    carryingAmountAcy: inst.purchasePrice,
    fxRate,
    carryingAmountLcy: purchaseLcy,
    collateralAmount: 0,
    collateralType: "Nil",
    originationDate: origDate,
    maturityDate: matDate,
    lastCouponDate: origDate,
    eir: inst.couponRate,
    couponRate: inst.couponRate,
    ratingAtOriginationDate: defaultRating,
    ratingAgencyAtOriginationDate: "GCR",
    ratingAtReportingDate: defaultRating,
    ratingAgencyAtReportingDate: "GCR",
    couponRepayment: COUPON_FREQ_MAP[inst.couponFrequency] ?? "SEMI-ANNUALLY",
    performanceStatus: "Performing" as PerformanceStatus,
    daysPastDue: 0,
    qualitativeStagingOverride: 0,
  };
}

/** Derive a portfolio Holding from any fixed-income Instrument */
export function instrumentToHolding(inst: Instrument): Holding {
  const fxRate = FX_RATES[inst.currency] ?? 1;
  const costBasisNGN = inst.purchasePrice * fxRate;
  const mktPriceNGN = inst.marketPrice
    ? inst.instrumentType === "Equity"
      ? inst.marketPrice // equity: price per share in NGN
      : inst.marketPrice * fxRate
    : undefined;

  let marketValueM: number;
  let costBasisM: number;

  if (inst.instrumentType === "Equity") {
    // Equity: cost is total spend (faceValue = total cost), market = qty * price
    const qty = inst.faceValue / (inst.purchasePrice > 0 ? inst.purchasePrice / (inst.faceValue > 0 ? 1 : 1) : 1);
    marketValueM = mktPriceNGN
      ? (inst.faceValue / Math.max(1, inst.purchasePrice / Math.max(1, inst.faceValue / 100))) *
        mktPriceNGN /
        1_000_000
      : inst.faceValue / 1_000_000;
    costBasisM = inst.faceValue / 1_000_000;
    void qty;
  } else {
    costBasisM = costBasisNGN / 1_000_000;
    marketValueM = costBasisM; // Fair value approximation (engines refine this)
  }

  const ytdReturn = costBasisM > 0 ? (marketValueM - costBasisM) / costBasisM : 0;

  return {
    id: inst.id,
    name: inst.name,
    assetClass: inst.instrumentType === "Equity" ? "Equity" : "Fixed Income",
    sector: inst.sector,
    geography: "Nigeria",
    currency: inst.currency as "NGN" | "USD" | "GBP" | "EUR",
    issuer: inst.issuer,
    quantity: inst.faceValue,
    costPrice: inst.purchasePrice,
    costBasis: costBasisM,
    marketValue: marketValueM,
    marketPrice: mktPriceNGN,
    ytdReturn,
    beta: inst.instrumentType === "Equity" ? 1.0 : 0.08,
    dividendYield: inst.instrumentType === "Equity" ? 0.03 : inst.couponRate,
  };
}

/* ─────────────────────────────────────────────────────────────
   Main entry point
   ───────────────────────────────────────────────────────────── */

/**
 * Generate a robust unique ID if the provided one is blank or a generic template string
 */
function generateId(provided: string | undefined, prefix: string): string {
  const p = (provided || "").trim();
  if (!p) {
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `HQ-${prefix}-${rand}`;
  }
  return p;
}

export function parseWorkbook(buffer: ArrayBuffer): ParsedWorkbook {
  const wb = XLSX.read(buffer, { type: "array", cellDates: false });
  const allInstruments: Instrument[] = [];
  const allHoldings: Holding[] = [];
  const sheets: SheetSummary[] = [];
  const unrecognizedSheets: UnrecognizedSheet[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      raw: false,
      defval: "",
    }) as unknown[][];

    // Skip entirely blank sheets
    const nonEmpty = rows.filter((r) => !isBlankRow(r as unknown[]));
    if (nonEmpty.length < 3) continue;

    const type = detectSheetType(sheetName);
    let parsed: Instrument[] = [];
    let equityHoldings: Holding[] = [];
    let warnings: string[] = [];

    switch (type) {
      case "fgn": {
        const res = parseFgnBonds(rows);
        parsed = res.instruments;
        warnings = res.warnings;
        break;
      }
      case "state": {
        const res = parseStateBonds(rows);
        parsed = res.instruments;
        warnings = res.warnings;
        break;
      }
      case "corporate": {
        const res = parseCorporateBonds(rows);
        parsed = res.instruments;
        warnings = res.warnings;
        break;
      }
      case "tbill": {
        const res = parseTreasuryBills(rows);
        parsed = res.instruments;
        warnings = res.warnings;
        break;
      }
      case "placements-usd": {
        const res = parsePlacementsUSD(rows);
        parsed = res.instruments;
        warnings = res.warnings;
        break;
      }
      case "placements-ngn": {
        const res = parsePlacementsNGN(rows);
        parsed = res.instruments;
        warnings = res.warnings;
        break;
      }
      case "equity": {
        const res = parseQuotedEquity(rows);
        parsed = res.instruments;
        equityHoldings = res.holdings;
        warnings = res.warnings;
        break;
      }
      default:
        // Unrecognised sheet - tracked and surfaced to the UI instead of
        // silently dropped (a sheet the template renamed or added is a real
        // data-loss risk, not something to swallow).
        unrecognizedSheets.push({ sheetName, rowCount: nonEmpty.length });
        continue;
    }

    parsed = parsed.map((instrument) => ({
      ...instrument,
      sourceSheet: sheetName,
    }));

    // A recognised sheet that parsed zero rows is a fully-broken sheet
    // (wrong header row, unexpected layout, etc.) - the aggregate
    // rowsSkipped number alone can hide this, so call it out explicitly.
    const candidateRows = Math.max(0, nonEmpty.length - 2);
    if (parsed.length === 0 && candidateRows > 0) {
      warnings = [`0 of ${candidateRows} rows parsed - sheet may be malformed or using an unexpected layout`, ...warnings];
    }

    const typeLabels: Record<string, string> = {
      fgn: "FGN Bonds",
      state: "State Bonds",
      corporate: "Corporate Bonds",
      tbill: "Treasury Bills",
      "placements-usd": "Placements (USD)",
      "placements-ngn": "Placements (<90 days)",
      equity: "Quoted Equity",
      unknown: "Unknown",
    };

    const before = allInstruments.length;
    allInstruments.push(...parsed);
    allHoldings.push(...equityHoldings);

    sheets.push({
      sheetName,
      detectedType: typeLabels[type] ?? type,
      rowsParsed: parsed.length,
      rowsSkipped: Math.max(0, nonEmpty.length - parsed.length - 2),
      warnings,
    });

    void before;
  }

  // Derive fixed-income holdings from non-equity instruments
  const fixedIncomeHoldings = allInstruments
    .filter((i) => i.instrumentType !== "Equity")
    .map(instrumentToHolding);
  allHoldings.push(...fixedIncomeHoldings);

  // Derive IFRS9 Securities - only debt instruments (exclude equities)
  const securities: Security[] = allInstruments
    .filter((i) => i.instrumentType !== "Equity" && i.couponFrequency !== "N/A")
    .map((inst, idx) => instrumentToSecurity(inst, idx + 1));

  return {
    instruments: allInstruments,
    securities,
    holdings: allHoldings,
    sheets,
    totalInstruments: allInstruments.length,
    unrecognizedSheets,
  };
}

/**
 * Parse a single CSV file (individual sheet upload).
 * Detects sheet type from filename.
 */
export function parseCSVSheet(csvText: string, fileName: string): ParsedWorkbook {
  const wb = XLSX.read(csvText, { type: "string" });
  // Rename the sheet to match our detection
  const ws = wb.Sheets[wb.SheetNames[0]];
  const tempName = fileName.replace(/\.csv$/i, "");
  delete wb.Sheets[wb.SheetNames[0]];
  wb.Sheets[tempName] = ws;
  wb.SheetNames[0] = tempName;
  return parseWorkbook(XLSX.write(wb, { bookType: "xlsx", type: "array" }));
}
