const fs = require('fs');
let code = fs.readFileSync('src/context/instrument-book.tsx', 'utf8');

code = code.replace(
  /error: string \| null;\r?\n/,
  `error: string | null;\n  dataQualityIssues?: import('../features/valuation/engine/types').DataQualityIssue[];\n`
);

code = code.replace(
  /const state: ImportState = \{\r?\n\s*phase: "done",\r?\n\s*progress: 100,\r?\n\s*currentStep: "Import complete",\r?\n\s*fileName: file\.name,\r?\n\s*importedAt: new Date\(\)\.toISOString\(\),\r?\n\s*summary: sheetSummaries,\r?\n\s*unrecognizedSheets,\r?\n\s*error: null,\r?\n\s*\};/,
  `const dataQualityIssues = runDataQualityChecks(allInstruments);
      const state: ImportState = {
        phase: "done",
        progress: 100,
        currentStep: "Import complete",
        fileName: file.name,
        importedAt: new Date().toISOString(),
        summary: sheetSummaries,
        unrecognizedSheets,
        error: null,
        dataQualityIssues,
      };`
);

code = code.replace(
  /import \{ parseWorkbook \} from "\.\.\/features\/deals\/engine\/workbook-parser";/,
  `import { parseWorkbook } from "../features/deals/engine/workbook-parser";\nimport { runDataQualityChecks } from "../features/deals/engine/data-quality-checks";`
);

fs.writeFileSync('src/context/instrument-book.tsx', code);
console.log('Fixed instrument-book.tsx robustly');
