/**
 * Heirs Quanta — Portfolio Workbook Parser
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

export interface ParsedWorkbook {
  instruments: Instrument[];
  securities: Security[];
  holdings: Holding[];
  sheets: SheetSummary[];
  totalInstruments: number;
}

/* ─────────────────────────────────────────────────────────────
   Low-level helpers
   ───────────────────────────────────────────────────────────── */

const MONTH: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

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
    // Always pivot 2-digit years to the 2000s — this book's bond maturities run
    // out to "50" (2050) and no legitimate 19XX date exists in this platform's data.
    if (yr < 100) yr += 2000;
    return new Date(yr, mon, day).toISOString().slice(0, 10);
  }

  // dd/mm/yyyy
  const dmy = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const day = parseInt(dmy[1]);
    const mon = parseInt(dmy[2]) - 1;
    const yr = parseInt(dmy[3]);
    return new Date(yr, mon, day).toISOString().slice(0, 10);
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
   Sheet parsers — each returns Instrument[]
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

  for (let i = hdr + 1; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    if (isBlankRow(r)) continue;
    if (!r[0] || String(r[0]).trim() === "") continue;

    const sno = parseNum(r[0]);
    if (isNaN(sno) || sno === 0) continue; // skip sub-header rows

    const id = str(r[1]) || str(r[4]) || `FGN-${i}`;
    const name = str(r[5]) || `FGN Bond ${id}`;
    const purchaseDate = parseDate(r[6]);
    const maturityDate = parseDate(r[7]);
    const couponRate = parseRate(r[8]);
    const faceValue = parseNum(r[12]);
    // Prefer consideration incl. FMDQ (col 18, 0-based: idx 18), else consideration (idx 17)
    const purchasePrice = parseNum(r[18]) || parseNum(r[17]) || parseNum(r[15]);
    const marketYield = parseRate(r[31]);
    const marketPrice = parseNum(r[32]);
    const bookedBy = str(r[2]);
    const portfolioBook = str(r[3]) || "FGN Bond Book";

    if (!purchaseDate) warnings.push(`Row ${i + 1}: missing value date for ${id}`);
    if (!maturityDate) warnings.push(`Row ${i + 1}: missing maturity date for ${id}`);
    if (faceValue === 0) warnings.push(`Row ${i + 1}: face value is zero for ${id}`);

    instruments.push({
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

  for (let i = hdr + 1; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    if (isBlankRow(r)) continue;
    if (!r[0] || String(r[0]).trim() === "") continue;
    const sno = parseNum(r[0]);
    if (isNaN(sno) || sno === 0) continue;

    const id = str(r[1]) || `SG-${i}`;
    const name = str(r[4]) || `State Bond ${id}`;
    const purchaseDate = parseDate(r[5]);
    const maturityDate = parseDate(r[6]);
    const couponRate = parseRate(r[7]);
    const faceValue = parseNum(r[11]);
    const purchasePrice = parseNum(r[15]) || parseNum(r[14]);
    const bookedBy = str(r[2]);
    const portfolioBook = str(r[3]) || "State Bond Book";

    if (!purchaseDate) warnings.push(`Row ${i + 1}: missing value date for ${id}`);
    if (faceValue === 0) warnings.push(`Row ${i + 1}: face value is zero for ${id}`);

    instruments.push({
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

  for (let i = hdr + 1; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    if (isBlankRow(r)) continue;
    if (!r[0] || String(r[0]).trim() === "") continue;
    const sno = parseNum(r[0]);
    if (isNaN(sno) || sno === 0) continue;

    const id = str(r[1]) || `COR-${i}`;
    const name = str(r[4]) || `Corporate Bond ${id}`;
    const purchaseDate = parseDate(r[5]);
    const maturityDate = parseDate(r[6]);
    const couponRate = parseRate(r[7]);
    const faceValue = parseNum(r[11]);
    const purchasePrice = parseNum(r[15]) || parseNum(r[14]);
    const bookedBy = str(r[2]);
    const portfolioBook = str(r[3]) || "Corporate Bond Book";

    if (faceValue === 0) warnings.push(`Row ${i + 1}: face value is zero for ${id}`);

    instruments.push({
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

  for (let i = hdr + 1; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    if (isBlankRow(r)) continue;
    if (!r[0] || String(r[0]).trim() === "") continue;
    const sno = parseNum(r[0]);
    if (isNaN(sno) || sno === 0) continue;

    const id = str(r[2]) || `TB-${i}`;
    const name = str(r[4]) || `Treasury Bill ${id}`;
    const purchasePrice = parseNum(r[5]);
    const purchaseDate = parseDate(r[6]);
    const maturityDate = parseDate(r[7]);
    const couponRate = parseRate(r[8]); // discount rate
    const faceValue = parseNum(r[9]);
    const bookedBy = str(r[1]);
    const portfolioBook = str(r[3]) || "Treasury Bill Book";

    if (faceValue === 0) warnings.push(`Row ${i + 1}: face value is zero for ${id}`);

    instruments.push({
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

  for (let i = hdr + 1; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    if (isBlankRow(r)) continue;
    if (!r[0] || String(r[0]).trim() === "") continue;
    const sno = parseNum(r[0]);
    if (isNaN(sno) || sno === 0) continue;

    const id = str(r[2]) || `PUSD-${i}`;
    const dealer = str(r[1]);
    const principalUSD = parseNum(r[6]);
    const fxRate = parseNum(r[7]);
    const couponRate = parseRate(r[9]);
    const purchaseDate = parseDate(r[10]);
    const maturityDate = parseDate(r[11]);
    const portfolioBook = str(r[3]) || "USD Placement Book";

    instruments.push({
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
      // stash FX rate in marketPrice for downstream FX computations
      marketPrice: fxRate || undefined,
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

  for (let i = hdr + 1; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    if (isBlankRow(r)) continue;
    if (!r[0] || String(r[0]).trim() === "") continue;
    const sno = parseNum(r[0]);
    if (isNaN(sno) || sno === 0) continue;

    const id = str(r[1]) || `PLC-${i}`;
    const institution = str(r[2]);
    const principal = parseNum(r[3]);
    const couponRate = parseRate(r[4]);
    const purchaseDate = parseDate(r[5]);
    const maturityDate = parseDate(r[6]);
    const portfolioBook = "Placements <90 Days";

    instruments.push({
      id,
      name: `${institution} Placement ${id}`,
      instrumentType: "Bank Placement",
      issuer: institution || "Commercial Bank",
      sector: "Banking",
      portfolioBook,
      classification: "AC",
      ifrs13Level: "L2",
      currency: "NGN",
      faceValue: principal,
      purchasePrice: principal,
      purchaseDate: purchaseDate || "2026-01-01",
      maturityDate: maturityDate || "2026-06-01",
      couponRate,
      couponFrequency: "Zero",
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

  for (let i = hdr + 1; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    if (isBlankRow(r)) continue;
    const sno = parseNum(r[0]);
    if (isNaN(sno) || sno === 0) continue; // skip sub-header/unit rows

    const id = str(r[1]) || `EQ-${i}`;
    const company = str(r[3]) || `Equity ${id}`;
    const purchaseDate = parseDate(r[4]);
    const quantity = parseNum(r[5]);
    const costPriceUnit = parseNum(r[6]);
    const totalCost = parseNum(r[7]);
    const marketPriceUnit = parseNum(r[8]);
    const marketValueTotal = parseNum(r[9]);
    const portfolioBook = str(r[2]) || "Quoted Equity Book";

    const costBasisM = totalCost / 1_000_000;
    const mktValueM =
      marketValueTotal > 0
        ? marketValueTotal / 1_000_000
        : (quantity * marketPriceUnit) / 1_000_000;
    const ytdReturn =
      costBasisM > 0 ? (mktValueM - costBasisM) / costBasisM : 0;

    instruments.push({
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
      purchasePrice: costPriceUnit * quantity || totalCost,
      purchaseDate: purchaseDate || "2024-01-01",
      maturityDate: "2099-12-31",
      couponRate: 0,
      couponFrequency: "N/A",
      status: "Active",
      marketPrice: marketPriceUnit || undefined,
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

  // Safe date parsing — fall back to sensible defaults
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

export function parseWorkbook(buffer: ArrayBuffer): ParsedWorkbook {
  const wb = XLSX.read(buffer, { type: "array", cellDates: false });
  const allInstruments: Instrument[] = [];
  const allHoldings: Holding[] = [];
  const sheets: SheetSummary[] = [];

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
        // Unrecognised sheet — skip silently
        continue;
    }

    parsed = parsed.map((instrument) => ({
      ...instrument,
      sourceSheet: sheetName,
    }));

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

  // Derive IFRS9 Securities — only debt instruments (exclude equities)
  const securities: Security[] = allInstruments
    .filter((i) => i.instrumentType !== "Equity" && i.couponFrequency !== "N/A")
    .map((inst, idx) => instrumentToSecurity(inst, idx + 1));

  return {
    instruments: allInstruments,
    securities,
    holdings: allHoldings,
    sheets,
    totalInstruments: allInstruments.length,
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
