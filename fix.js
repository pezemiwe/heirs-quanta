const fs = require('fs');
let code = fs.readFileSync('src/features/accounting/pages/monthly-schedule.tsx', 'utf8');

// Fix 1: Add equities to getCols
code = code.replace(/case "placements-usd":\s*return placementsUsdCols;\s*case "tbills":\s*return tbillsCols;/g, 'case "placements-usd": return placementsUsdCols;\n    case "tbills": return tbillsCols;\n    case "equities": return equitiesCols;');

// Fix 3: USD Placements logic updates
code = code.replace(/{ header: "PRINCIPAL USD \\\(\\\$\\\)", render: \\(i\\) => fmtMoney\\(i.faceValue, "USD"\\), exportValue: \\(i\\) => i.faceValue },/g, '{ header: "PRINCIPAL USD ($)", render: (i) => fmtMoney(i.purchasePrice, "USD"), exportValue: (i) => i.purchasePrice },');

code = code.replace(/{ header: "INTEREST RECEIVABLE \\\(\\\$\\\)", isGrey: true, render: \\(i, v\\) => <InlineDiff inst={i} computed={v.fcyScheduleMetrics\\?\\.totalAccruedInterestFcy \\?\\? 0} manualKey="interestReceivable" currency="USD" \\/>, exportValue: \\(i, v\\) => v.fcyScheduleMetrics\\?\\.totalAccruedInterestFcy \\?\\? 0 },/g, '{ header: "INTEREST RECEIVABLE ($)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.placementScheduleMetrics?.totalInterest ?? 0} manualKey="interestReceivable" currency="USD" />, exportValue: (i, v) => v.placementScheduleMetrics?.totalInterest ?? 0 },');

code = code.replace(/{ header: "THIS MONTH INTEREST INCOME \\\(\\\$\\\)", isGrey: true, render: \\(i, v\\) => <InlineDiff inst={i} computed={v.fcyScheduleMetrics\\?\\.thisMonthInterestFcy \\?\\? 0} manualKey="interestIncomeThisMonth" currency="USD" \\/>, exportValue: \\(i, v\\) => v.fcyScheduleMetrics\\?\\.thisMonthInterestFcy \\?\\? 0 },/g, '{ header: "THIS MONTH INTEREST INCOME ($)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.placementScheduleMetrics?.thisMonthInterest ?? 0} manualKey="interestIncomeThisMonth" currency="USD" />, exportValue: (i, v) => v.placementScheduleMetrics?.thisMonthInterest ?? 0 },');

code = code.replace(/{ header: "ACCRUED INTEREST \\\(\\\$\\\)", isGrey: true, render: \\(i, v\\) => <InlineDiff inst={i} computed={v.fcyScheduleMetrics\\?\\.closingAmortisedCostFcy \\?\\? 0} manualKey="accruedInterestClosingUsd" currency="USD" \\/>, exportValue: \\(i, v\\) => v.fcyScheduleMetrics\\?\\.closingAmortisedCostFcy \\?\\? 0 },/g, '{ header: "ACCRUED INTEREST ($)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.placementScheduleMetrics?.totalAccruedInterest ?? 0} manualKey="accruedInterestClosingUsd" currency="USD" />, exportValue: (i, v) => v.placementScheduleMetrics?.totalAccruedInterest ?? 0 },');

code = code.replace(/{ header: "CLOSING AMORTISED COST \\\(\\\$\\\)", isGrey: true, render: \\(i, v\\) => <InlineDiff inst={i} computed={\\(i.faceValue\\) \\+ \\(v.fcyScheduleMetrics\\?\\.closingAmortisedCostFcy \\?\\? 0\\)} manualKey="closingAmortisedCostUsd" currency="USD" \\/>, exportValue: \\(i, v\\) => \\(i.faceValue\\) \\+ \\(v.fcyScheduleMetrics\\?\\.closingAmortisedCostFcy \\?\\? 0\\) },/g, '{ header: "CLOSING AMORTISED COST ($)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.placementScheduleMetrics?.closingAmortisedCost ?? 0} manualKey="closingAmortisedCostUsd" currency="USD" />, exportValue: (i, v) => v.placementScheduleMetrics?.closingAmortisedCost ?? 0 },');

// Fix 5: T-Bills columns
code = code.replace(/{ header: "PRICE ON PURCHASE", render: \\(i\\) => fmtNumber\\(\\(i.purchasePrice \\/ \\(i.faceValue \\|\\| 1\\)\\) \\* 100, 2\\), exportValue: \\(i\\) => \\(i.purchasePrice \\/ \\(i.faceValue \\|\\| 1\\)\\) \\* 100 },/g, '{ header: "PRICE ON PURCHASE", render: (i) => fmtNumber((i.purchasePrice / (i.faceValue || 1)) * 100, 4), exportValue: (i) => (i.purchasePrice / (i.faceValue || 1)) * 100 },');

code = code.replace(/{ header: "INTEREST RECEIVABLE", isGrey: true, render: \\(i, v\\) => <InlineDiff inst={i} computed={v.scheduleMetrics\\?\\.totalAccruedInterest \\?\\? 0} manualKey="interestReceivable" \\/>, exportValue: \\(i, v\\) => v.scheduleMetrics\\?\\.totalAccruedInterest \\?\\? 0 },/g, '{ header: "INTEREST RECEIVABLE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={i.faceValue - i.purchasePrice} manualKey="interestReceivable" />, exportValue: (i, v) => i.faceValue - i.purchasePrice },');

fs.writeFileSync('src/features/accounting/pages/monthly-schedule.tsx', code);
