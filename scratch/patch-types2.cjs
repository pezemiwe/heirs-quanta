const fs = require('fs');
let code = fs.readFileSync('src/features/valuation/engine/types.ts', 'utf8');

code = code.replace(
  /status: InstrumentStatus;/,
  `status: InstrumentStatus;\n\n  netGrossFlag?: "Net" | "Gross";\n  numberOfCouponsReceived?: number;`
);

code += `\n\nexport type DataQualitySeverity = "warning" | "info";\nexport interface DataQualityIssue {\n  category: "date-sanity" | "wht-plausibility" | "amortised-carryforward" | "inconsistent-yield-bond";\n  severity: DataQualitySeverity;\n  message: string;\n  affectedInstrumentIds: string[];\n}\n`;

fs.writeFileSync('src/features/valuation/engine/types.ts', code);
console.log('Fixed types.ts data quality');
