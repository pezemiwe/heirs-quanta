const fs = require('fs');

function resolveMonthlySchedule() {
  let code = fs.readFileSync('src/features/accounting/pages/monthly-schedule.tsx', 'utf8');
  
  // Resolve imports and interface
  code = code.replace(
    /<<<<<<< HEAD[\s\S]*?=======([\s\S]*?)>>>>>>> main/g,
    (match) => {
      if (match.includes('import { useInstrumentBook }')) {
        return `import { useInstrumentBook } from "../../../context/instrument-book";
import { daysBetween, parseDate, placementScheduleMetricsAt, valueInstrument } from "../../valuation/engine";`;
      }
      
      if (match.includes('valueInstrument(inst, v.assumptions)')) {
        return `      const valuation = valueInstrument(inst, v.assumptions);
      return {
        ...valuation,
        instrument: inst,
        scheduleMetrics: computeScheduleMetrics(inst, valuation, v.assumptions),
        fcyScheduleMetrics: inst.currency !== "NGN" ? computeFcyScheduleMetrics(inst, valuation, v.assumptions) : undefined,
        placementScheduleMetrics: inst.instrumentType === "Bank Placement" && inst.currency === "NGN" ? placementScheduleMetricsAt(inst, new Date(\`\${v.assumptions.valuationDate}T00:00:00Z\`)) : undefined
      };`;
      }
      
      return match;
    }
  );

  // We need to also patch the interface since `main` spread `valuation`.
  // I will replace `interface ValuationResult {`
  code = code.replace(
    /interface ValuationResult \{/,
    `type ValuationResult = ReturnType<typeof valueInstrument> & {`
  );
  // and change the closing brace
  code = code.replace(
    /  fcyScheduleMetrics\?: FcyScheduleMetrics;\r?\n\}/,
    `  fcyScheduleMetrics?: FcyScheduleMetrics;\n  placementScheduleMetrics?: any;\n}`
  );

  fs.writeFileSync('src/features/accounting/pages/monthly-schedule.tsx', code);
}

function resolveWorkbookParser() {
  let code = fs.readFileSync('src/features/deals/engine/workbook-parser.ts', 'utf8');
  
  code = code.replace(
    /<<<<<<< HEAD\r?\n\s*const c_netGross = optCol\(\["netgross", "interestbasis", "whtbasis"\]\);\r?\n\s*const c_accruedDays = optCol\(\["accrueddays"\]\);\r?\n\s*const c_interestAccruedToValuationDate = optCol\(\["interestaccruedtovaluationdate"\]\);\r?\n=======\r?\n\s*const c_netGross = optCol\(\["netgross", "interestbasis", "whtbasis"\]\);\r?\n>>>>>>> main/,
    `  const c_netGross = optCol(["netgross", "interestbasis", "whtbasis"]);
  const c_accruedDays = optCol(["accrueddays"]);
  const c_interestAccruedToValuationDate = optCol(["interestaccruedtovaluationdate"]);`
  );

  code = code.replace(
    /<<<<<<< HEAD\r?\n\s*const placementInterestBasis = str\(c_netGross >= 0 \? r\[c_netGross\] : ""\)\.toLowerCase\(\) === "gross" \? "Gross" : "Net";\r?\n=======\r?\n\s*const placementInterestBasis = str\(c_netGross >= 0 \? r\[c_netGross\] : ""\)\.toLowerCase\(\) === "gross"\r?\n\s*\? "Gross"\r?\n\s*: "Net";\r?\n>>>>>>> main/,
    `    const placementInterestBasis = str(c_netGross >= 0 ? r[c_netGross] : "").toLowerCase() === "gross" ? "Gross" : "Net";`
  );

  fs.writeFileSync('src/features/deals/engine/workbook-parser.ts', code);
}

function resolveAssetDetail() {
  let code = fs.readFileSync('src/features/valuation/pages/asset-detail.tsx', 'utf8');
  
  code = code.replace(
    /<<<<<<< HEAD\r?\n\s*const nextCouponDate = currentPeriod \? parseDate\(currentPeriod\.date\) : parseDate\(inst\.maturityDate\);\r?\n\s*\r?\n=======\r?\n\s*const nextCouponDate = currentPeriod \? parseDate\(currentPeriod\.date\) : maturityDate;\r?\n\s*const placementMetrics =[\s\S]*?\/\/\s*Bond variables\r?\n>>>>>>> main/,
    `  const nextCouponDate = currentPeriod ? parseDate(currentPeriod.date) : parseDate(inst.maturityDate);
  const placementMetrics =
    inst.instrumentType === "Bank Placement"
      ? placementScheduleMetricsAt(inst, parseDate(assumptions.valuationDate))
      : null;`
  );

  fs.writeFileSync('src/features/valuation/pages/asset-detail.tsx', code);
}

resolveMonthlySchedule();
resolveWorkbookParser();
resolveAssetDetail();
console.log('Resolved conflicts');
