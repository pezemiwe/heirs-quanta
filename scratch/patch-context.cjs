const fs = require('fs');
let code = fs.readFileSync('src/context/instrument-book.tsx', 'utf8');

code = code.replace(
  /summary: string\[\];\r?\n\}/,
  `summary: string[];\n  dataQualityIssues?: import('../features/valuation/engine/types').DataQualityIssue[];\n}`
);

code = code.replace(
  /import \{ parseWorkbook \} from "\.\.\/features\/deals\/engine\/workbook-parser";/,
  `import { parseWorkbook } from "../features/deals/engine/workbook-parser";\nimport { runDataQualityChecks } from "../features/deals/engine/data-quality-checks";`
);

code = code.replace(
  /const summary: string\[\] = \[\];/,
  `const summary: string[] = [];\n      const dataQualityIssues = runDataQualityChecks(parsed.instruments);`
);

code = code.replace(
  /setImportState\(\{\r?\n\s*phase: "done",\r?\n\s*fileName: file\.name,\r?\n\s*instruments: parsed\.instruments,\r?\n\s*holdings: parsed\.holdings,\r?\n\s*summary,\r?\n\s*\}\);/,
  `setImportState({\n          phase: "done",\n          fileName: file.name,\n          instruments: parsed.instruments,\n          holdings: parsed.holdings,\n          summary,\n          dataQualityIssues,\n        });`
);

fs.writeFileSync('src/context/instrument-book.tsx', code);
console.log('Fixed instrument-book.tsx');
