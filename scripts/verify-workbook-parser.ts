/**
 * Lightweight verification for workbook-parser hardening.
 * Run: npx tsx scripts/verify-workbook-parser.ts [path/to/workbook.xlsx]
 *
 * Without a file argument, runs synthetic tests for unrecognized sheets,
 * column reorder, and zero-row-parse warnings.
 */

import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";
import { parseWorkbook } from "../src/features/deals/engine/workbook-parser";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function toBuffer(wb: XLSX.WorkBook): ArrayBuffer {
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

function buildFgnSheet({ swapDateColumns = false } = {}): unknown[][] {
  const headers = [
    "S/No",
    "Identifier",
    "Dealer",
    "Portfolio",
    "IDENTIFIER/DEAL ID",
    "DESCRIPTION",
    "VALUE DATE",
    "MATURITY DATE",
    "COUPON RATE",
    "YIELD AT PURCHASE",
    "UNITS",
    "COST AT PAR",
    "FACE VALUE",
    "DIRTY PRICE",
    "COST PRICE/CLEAN",
    "COST",
    "CONSIDERATION AT PURCHASE",
    "PREMIUM/(DISCOUNT)",
    "CONSIDERATION INCL FMDQ+SEC",
  ];
  if (swapDateColumns) {
    const vi = headers.indexOf("VALUE DATE");
    const mi = headers.indexOf("MATURITY DATE");
    [headers[vi], headers[mi]] = [headers[mi], headers[vi]];
  }

  const row: unknown[] = [
    1,
    "FGN-TEST",
    "Dealer A",
    "FGN Bond Book",
    "DEAL-001",
    "12.5% FGN 2030",
    "28-Jul-21",
    "02-Apr-30",
    "12.5%",
    "14%",
    1,
    1000000,
    1000000,
    100,
    98,
    980000,
    980000,
    0,
    985000,
  ];
  if (swapDateColumns) {
    const vi = 6;
    const mi = 7;
    [row[vi], row[mi]] = [row[mi], row[vi]];
  }

  return [["FGN BONDS"], headers, row];
}

function runSyntheticTests() {
  console.log("── Synthetic tests ──");

  // 1. Unrecognized sheet surfaced
  {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["MUTUAL FUNDS"],
        ["S/No", "Fund", "NAV"],
        [1, "Alpha Fund", 100],
        [2, "Beta Fund", 200],
        ...Array.from({ length: 10 }, (_, i) => [i + 3, `Fund ${i}`, 100 + i]),
      ]),
      "MUTUAL FUNDS",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(buildFgnSheet()),
      "FGN BONDS",
    );
    const result = parseWorkbook(toBuffer(wb));
    assert(result.unrecognizedSheets.length === 1, "expected 1 unrecognized sheet");
    assert(result.unrecognizedSheets[0].sheetName === "MUTUAL FUNDS", "wrong sheet name");
    assert(result.unrecognizedSheets[0].rowCount >= 12, "expected row count >= 12");
    assert(result.totalInstruments === 1, "expected 1 FGN instrument");
    console.log("✓ unrecognized sheet tracked:", result.unrecognizedSheets[0]);
  }

  // 2. Column reorder — maturity date still correct via header lookup
  {
    const wbNormal = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wbNormal,
      XLSX.utils.aoa_to_sheet(buildFgnSheet()),
      "FGN BONDS",
    );
    const normal = parseWorkbook(toBuffer(wbNormal)).instruments[0];

    const wbSwapped = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wbSwapped,
      XLSX.utils.aoa_to_sheet(buildFgnSheet({ swapDateColumns: true })),
      "FGN BONDS",
    );
    const swapped = parseWorkbook(toBuffer(wbSwapped)).instruments[0];

    assert(normal && swapped, "expected instruments from both workbooks");
    assert(normal.purchaseDate === swapped.purchaseDate, "value date diverged after column swap");
    assert(normal.maturityDate === swapped.maturityDate, "maturity date diverged after column swap");
    console.log("✓ column reorder: dates match unswapped baseline", {
      purchaseDate: swapped.purchaseDate,
      maturityDate: swapped.maturityDate,
    });
  }

  // 3. Recognized sheet, zero rows parsed — explicit warning
  {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["FGN BONDS"],
        ["S/No", "Identifier", "DESCRIPTION", "VALUE DATE", "MATURITY DATE", "FACE VALUE"],
        ["", "", "bad", "not-a-date", "also-bad", "0"],
        ["", "", "worse", "nope", "nope", "0"],
      ]),
      "FGN BONDS",
    );
    const result = parseWorkbook(toBuffer(wb));
    const sheet = result.sheets.find((s) => s.sheetName === "FGN BONDS");
    assert(sheet, "FGN sheet summary missing");
    assert(
      sheet.warnings.some((w) => w.startsWith("0 of")),
      `expected zero-row warning, got: ${JSON.stringify(sheet.warnings)}`,
    );
    console.log("✓ zero-row parse warning:", sheet.warnings[0]);
  }

  // 4. Timezone-safe date parsing — calendar dates must not shift under UTC+ timezones
  {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["FGN BONDS"],
        [
          "S/No",
          "Identifier",
          "Dealer",
          "Portfolio",
          "IDENTIFIER/DEAL ID",
          "DESCRIPTION",
          "VALUE DATE",
          "MATURITY DATE",
          "COUPON RATE",
          "YIELD AT PURCHASE",
          "UNITS",
          "COST AT PAR",
          "FACE VALUE",
        ],
        [
          1,
          "FGN-2036",
          "Dealer",
          "FGN Bond Book",
          "DEAL-2036",
          "12.40% FGN BOND MAR 2036",
          "28-Jul-21",
          "18-Mar-36",
          "12.40%",
          "14%",
          1,
          53_000_000,
          53_000_000,
        ],
      ]),
      "FGN BONDS",
    );
    const inst = parseWorkbook(toBuffer(wb)).instruments[0];
    assert(inst, "expected FGN instrument");
    assert(
      inst.purchaseDate === "2021-07-28",
      `value date shifted: expected 2021-07-28, got ${inst.purchaseDate}`,
    );
    assert(
      inst.maturityDate === "2036-03-18",
      `maturity date shifted: expected 2036-03-18, got ${inst.maturityDate}`,
    );
    console.log("✓ timezone-safe date parsing:", {
      purchaseDate: inst.purchaseDate,
      maturityDate: inst.maturityDate,
    });
  }

  // 5. dd/mm/yyyy branch — same timezone safety
  {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["PLACEMENTS LESS THAN 90DAYS"],
        ["S/No", "Identifier", "Institution", "Principal", "Rate", "Value date", "Maturity date"],
        [1, "PLC-1", "Union Bank", 10_000_000, "15%", "18/03/2026", "18/06/2026"],
      ]),
      "PLACEMENTS LESS THAN 90DAYS",
    );
    const inst = parseWorkbook(toBuffer(wb)).instruments[0];
    assert(inst, "expected placement instrument");
    assert(inst.purchaseDate === "2026-03-18", `value date: got ${inst.purchaseDate}`);
    assert(inst.maturityDate === "2026-06-18", `maturity date: got ${inst.maturityDate}`);
    console.log("✓ dd/mm/yyyy parsing:", {
      purchaseDate: inst.purchaseDate,
      maturityDate: inst.maturityDate,
    });
  }

  console.log("All synthetic tests passed.\n");
}

const fileArg = process.argv[2];
if (fileArg) {
  console.log(`── Real workbook: ${fileArg} ──`);
  const buffer = readFileSync(fileArg).buffer;
  const result = parseWorkbook(buffer);
  console.log(`Instruments: ${result.totalInstruments}`);
  console.log(`Sheets parsed: ${result.sheets.length}`);
  for (const s of result.sheets) {
    console.log(`  ${s.sheetName}: ${s.rowsParsed} parsed, ${s.rowsSkipped} skipped, ${s.warnings.length} warnings`);
  }
  if (result.unrecognizedSheets.length) {
    console.log("Unrecognized:");
    for (const u of result.unrecognizedSheets) {
      console.log(`  ${u.sheetName} (${u.rowCount} rows)`);
    }
  }
} else {
  runSyntheticTests();
  console.log("Pass a workbook path to verify a real file, e.g.:");
  console.log("  npx tsx scripts/verify-workbook-parser.ts path/to/portfolio.xlsx");
}
