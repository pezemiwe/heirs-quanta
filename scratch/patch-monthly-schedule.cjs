const fs = require('fs');
let code = fs.readFileSync('src/features/accounting/pages/monthly-schedule.tsx', 'utf8');

const pendingStateComponent = `
function PendingState({ message = "Requires market data input" }: { message?: string }) {
  return (
    <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded w-fit border border-amber-200">
      <span className="text-[10px] uppercase font-semibold">{message}</span>
    </div>
  );
}
`;

// Insert PendingState before placementsNgnCols
code = code.replace(
  /const placementsNgnCols: ColDef\[\] = \[/,
  pendingStateComponent + '\nconst placementsNgnCols: ColDef[] = ['
);

// 1. T-Bills columns addition
code = code.replace(
  /const tbillsCols: ColDef\[\] = \[\r?\n\s*\{ header: "IDENTIFIER", render: \(i\) => i\.id, exportValue: \(i\) => i\.id \},/,
  `const tbillsCols: ColDef[] = [
  { header: "IDENTIFIER", render: (i) => i.id, exportValue: (i) => i.id },
  { header: "DEALER", render: (i) => i.issuer, exportValue: (i) => i.issuer },
  { header: "PORTFOLIO", render: (i) => i.portfolioBook ?? "N/A", exportValue: (i) => i.portfolioBook ?? "N/A" },
  { header: "DESCRIPTION", render: (i) => i.name, exportValue: (i) => i.name },
  { header: "PURCHASE COST", render: (i) => fmtMoney(i.purchasePrice, "NGN"), exportValue: (i) => i.purchasePrice },
  { header: "VALUE DATE", render: (i) => fmtDate(i.purchaseDate), exportValue: (i) => i.purchaseDate },
  { header: "INTEREST RATE", render: (i) => fmtPct(i.couponRate), exportValue: (i) => i.couponRate },
  { header: "TENOR", render: (i) => Math.round((new Date(i.maturityDate).getTime() - new Date(i.purchaseDate).getTime()) / 86400000), exportValue: (i) => Math.round((new Date(i.maturityDate).getTime() - new Date(i.purchaseDate).getTime()) / 86400000) },
  { header: "PRICE ON PURCHASE", render: (i) => fmtNumber(i.purchasePrice / (i.faceValue || 1)), exportValue: (i) => i.purchasePrice / (i.faceValue || 1) },`
);

// 2. Equities columns
const equitiesCols = `
const equitiesCols: ColDef[] = [
  { header: "S/N", render: (_, __, i) => i + 1, exportValue: (_, __, i) => i + 1 },
  { header: "IDENTIFIER", render: (i) => i.id, exportValue: (i) => i.id },
  { header: "PORTFOLIO", render: (i) => i.portfolioBook ?? "N/A", exportValue: (i) => i.portfolioBook ?? "N/A" },
  { header: "COMPANY", render: (i) => i.issuer, exportValue: (i) => i.issuer },
  { header: "PURCHASE DATE", render: (i) => fmtDate(i.purchaseDate), exportValue: (i) => i.purchaseDate },
  { header: "HOLDINGS", render: (i) => fmtNumber(i.quantity ?? 0), exportValue: (i) => i.quantity ?? 0 },
  { header: "COST PRICE UNIT", render: (i) => fmtNumber(i.costPriceUnit ?? 0), exportValue: (i) => i.costPriceUnit ?? 0 },
  { header: "COST", render: (i) => fmtMoney(i.faceValue, "NGN"), exportValue: (i) => i.faceValue },
  { header: "CLOSING MARKET PRICE", render: (i) => fmtNumber(i.marketPrice ?? 0), exportValue: (i) => i.marketPrice ?? 0 },
  { header: "CURRENT MARKET VALUE (ASSET LEG)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.totalCurrentMarketValue ?? 0} manualKey="currentMarketValue" />, exportValue: (i, v) => v.scheduleMetrics?.totalCurrentMarketValue ?? 0 },
  { header: "OPENING GAIN/(LOSS) ASSET LEG", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={0} manualKey="openingGainLoss" />, exportValue: (i, v) => 0 },
  { header: "CURRENT MTM (FAIR VALUE GAIN/LOSS) ASSET LEG", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.currentMtmGainLoss ?? 0} manualKey="currentMtmGainLoss" />, exportValue: (i, v) => v.scheduleMetrics?.currentMtmGainLoss ?? 0 },
  { header: "FAIR VALUE GAIN/(LOSS) INCOME LEG", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.monthlyMtmToPost ?? 0} manualKey="monthlyMtmToPost" />, exportValue: (i, v) => v.scheduleMetrics?.monthlyMtmToPost ?? 0 },
  { header: "GROSS DIVIDEND RECEIVED", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={0} manualKey="grossDividendReceived" />, exportValue: (i, v) => 0 },
  { header: "WHT", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={0} manualKey="wht" />, exportValue: (i, v) => 0 },
  { header: "DIVIDEND RECEIVED NET OF WHT", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={0} manualKey="netDividendReceived" />, exportValue: (i, v) => 0 },
  { header: "YTD DIVIDEND RECEIVED NET", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={0} manualKey="ytdDividendReceivedNet" />, exportValue: (i, v) => 0 },
];
`;

code = code.replace(
  /const fgnBondsCols: ColDef\[\] = \[/,
  equitiesCols + '\nconst fgnBondsCols: ColDef[] = ['
);

// 3. USD Placements additional columns
code = code.replace(
  /const placementsUsdCols: ColDef\[\] = \[\r?\n\s*\{ header: "S\/N", render: \(_, __, i\) => i \+ 1, exportValue: \(_, __, i\) => i \+ 1 \},/,
  `const placementsUsdCols: ColDef[] = [
  { header: "S/N", render: (_, __, i) => i + 1, exportValue: (_, __, i) => i + 1 },
  { header: "DEALER", render: (i) => i.issuer, exportValue: (i) => i.issuer },
  { header: "CURRENCY", render: (i) => i.currency, exportValue: (i) => i.currency },
  { header: "TENOR", render: (i) => Math.round((new Date(i.maturityDate).getTime() - new Date(i.purchaseDate).getTime()) / 86400000), exportValue: (i) => Math.round((new Date(i.maturityDate).getTime() - new Date(i.purchaseDate).getTime()) / 86400000) },
  { header: "OPENING EXCHANGE RATE", render: (i) => fmtNumber(i.openingFxRate ?? i.purchaseFxRate ?? 1), exportValue: (i) => i.openingFxRate ?? i.purchaseFxRate ?? 1 },
  { header: "CURRENT EXCHANGE RATE", render: (i, v) => fmtNumber((v.fcyScheduleMetrics?.closingAmortisedCostBase ?? 1) / (v.fcyScheduleMetrics?.closingAmortisedCostFcy || 1)), exportValue: (i, v) => (v.fcyScheduleMetrics?.closingAmortisedCostBase ?? 1) / (v.fcyScheduleMetrics?.closingAmortisedCostFcy || 1) },`
);

// USD placements missing grey columns
code = code.replace(
  /\{ header: "THIS MONTH EXCHANGE GAIN\/\(LOSS\) - NGN", isGrey: true, render: \(i, v\) => <InlineDiff inst=\{i\} computed=\{v\.fcyScheduleMetrics\?\.thisMonthUnrealisedFxGainLoss \?\? 0\} manualKey="thisMonthExchangeGainLoss" \/>, exportValue: \(i, v\) => v\.fcyScheduleMetrics\?\.thisMonthUnrealisedFxGainLoss \?\? 0 \},/,
  `{ header: "OPENING ACCRUED INCOME (USD)", isGrey: true, render: () => <PendingState message="Requires carryforward" />, exportValue: () => "Pending" },
  { header: "OPENING ACCRUED INCOME (NGN)", isGrey: true, render: () => <PendingState message="Requires carryforward" />, exportValue: () => "Pending" },
  { header: "OPENING AMORTISED COST (USD)", isGrey: true, render: () => <PendingState message="Requires carryforward" />, exportValue: () => "Pending" },
  { header: "OPENING AMORTISED COST (NGN)", isGrey: true, render: () => <PendingState message="Requires carryforward" />, exportValue: () => "Pending" },
  { header: "THIS MONTH EXCHANGE GAIN/(LOSS) - NGN", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.fcyScheduleMetrics?.thisMonthUnrealisedFxGainLoss ?? 0} manualKey="thisMonthExchangeGainLoss" />, exportValue: (i, v) => v.fcyScheduleMetrics?.thisMonthUnrealisedFxGainLoss ?? 0 },
  { header: "LAST MONTH EXCHANGE GAIN/(LOSS) (NGN)", isGrey: true, render: () => <PendingState message="Requires carryforward" />, exportValue: () => "Pending" },
  { header: "TOTAL REALISED EXCHANGE GAIN/LOSS JAN-DEC", isGrey: true, render: () => <PendingState message="Requires carryforward" />, exportValue: () => "Pending" },`
);


// 4. FGN Bonds
code = code.replace(
  /const fgnBondsCols: ColDef\[\] = \[\r?\n\s*\{ header: "IDENTIFIER", render: \(i\) => i\.id, exportValue: \(i\) => i\.id \},/,
  `const fgnBondsCols: ColDef[] = [
  { header: "IDENTIFIER", render: (i) => i.id, exportValue: (i) => i.id },
  { header: "DEALER", render: (i) => i.issuer, exportValue: (i) => i.issuer },
  { header: "PORTFOLIO", render: (i) => i.portfolioBook ?? "N/A", exportValue: (i) => i.portfolioBook ?? "N/A" },
  { header: "BOND NAME", render: (i) => i.name, exportValue: (i) => i.name },
  { header: "VALUE DATE", render: (i) => fmtDate(i.purchaseDate), exportValue: (i) => i.purchaseDate },
  { header: "COUPON RATE", render: (i) => fmtPct(i.couponRate), exportValue: (i) => i.couponRate },
  { header: "YIELD AT PURCHASE", render: (i) => fmtPct(i.uploadedManualValues?.yieldAtPurchase ?? 0), exportValue: (i) => i.uploadedManualValues?.yieldAtPurchase ?? 0 },
  { header: "UNITS", render: (i) => fmtNumber(i.quantity ?? 0), exportValue: (i) => i.quantity ?? 0 },
  { header: "COST AT PAR", render: (i) => fmtMoney(i.uploadedManualValues?.costAtPar ?? i.faceValue, "NGN"), exportValue: (i) => i.uploadedManualValues?.costAtPar ?? i.faceValue },
  { header: "DIRTY PRICE AT PURCHASE", render: (i) => fmtNumber(i.dirtyPriceAtPurchase ?? 0), exportValue: (i) => i.dirtyPriceAtPurchase ?? 0 },
  { header: "COST PRICE AT PURCHASE", render: (i) => fmtNumber(i.uploadedManualValues?.costPriceClean ?? 0), exportValue: (i) => i.uploadedManualValues?.costPriceClean ?? 0 },
  { header: "COST", render: (i) => fmtMoney(i.uploadedManualValues?.cost ?? i.purchasePrice, "NGN"), exportValue: (i) => i.uploadedManualValues?.cost ?? i.purchasePrice },
  { header: "CONSIDERATION AT PURCHASE", render: (i) => fmtMoney(i.uploadedManualValues?.considerationAtPurchase ?? i.purchasePrice, "NGN"), exportValue: (i) => i.uploadedManualValues?.considerationAtPurchase ?? i.purchasePrice },`
);
// FGN Bonds missing greys
code = code.replace(
  /\{ header: "TOTAL CURRENT MARKET VALUE", isGrey: true, render: \(i, v\) => <InlineDiff inst=\{i\} computed=\{v\.scheduleMetrics\?\.totalCurrentMarketValue \?\? 0\} manualKey="totalCurrentMarketValue" \/>, exportValue: \(i, v\) => v\.scheduleMetrics\?\.totalCurrentMarketValue \?\? 0 \},/,
  `{ header: "NUMBER OF COUPONS RECEIVED", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={Math.round((v.scheduleMetrics?.couponReceivedToDateGross ?? 0) / (i.faceValue * (i.couponRate ?? 0) / (i.couponFrequency === "Semi" ? 2 : i.couponFrequency === "Quarterly" ? 4 : i.couponFrequency === "Monthly" ? 12 : 1)))} manualKey="numberOfCouponsReceived" />, exportValue: (i, v) => Math.round((v.scheduleMetrics?.couponReceivedToDateGross ?? 0) / (i.faceValue * (i.couponRate ?? 0) / (i.couponFrequency === "Semi" ? 2 : i.couponFrequency === "Quarterly" ? 4 : i.couponFrequency === "Monthly" ? 12 : 1))) },
  { header: "LAST COUPON DATE", isGrey: true, render: (i, v) => v.scheduleMetrics?.lastCouponDate ?? "N/A", exportValue: (i, v) => v.scheduleMetrics?.lastCouponDate ?? "N/A" },
  { header: "NEXT COUPON DATE", isGrey: true, render: (i, v) => v.scheduleMetrics?.nextCouponDate ?? "N/A", exportValue: (i, v) => v.scheduleMetrics?.nextCouponDate ?? "N/A" },
  { header: "EFFECTIVE INTEREST RATE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.effectiveInterestRate ?? 0} manualKey="effectiveInterestRate" isPct />, exportValue: (i, v) => v.scheduleMetrics?.effectiveInterestRate ?? 0 },
  { header: "DAYS EARNED IN THE MONTH", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.daysEarnedInMonth ?? 0} manualKey="daysEarnedInMonth" />, exportValue: (i, v) => v.scheduleMetrics?.daysEarnedInMonth ?? 0 },
  { header: "LAST MONTH MARKET VALUE", isGrey: true, render: () => <PendingState message="Requires market data" />, exportValue: () => "Pending" },
  { header: "LAST MONTH YIELD", isGrey: true, render: () => <PendingState message="Requires market data" />, exportValue: () => "Pending" },
  { header: "LAST MONTH PRICE", isGrey: true, render: () => <PendingState message="Requires market data" />, exportValue: () => "Pending" },
  { header: "CURRENT MARKET YIELD", isGrey: true, render: () => <PendingState message="Requires market data" />, exportValue: () => "Pending" },
  { header: "CURRENT MARKET PRICE", isGrey: true, render: () => <PendingState message="Requires market data" />, exportValue: () => "Pending" },
  { header: "ACTUAL CURRENT MARKET VALUE (CLEAN)", isGrey: true, render: () => <PendingState message="Requires market data" />, exportValue: () => "Pending" },
  { header: "TOTAL CURRENT MARKET VALUE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.totalCurrentMarketValue ?? 0} manualKey="totalCurrentMarketValue" />, exportValue: (i, v) => v.scheduleMetrics?.totalCurrentMarketValue ?? 0 },`
);

// 5. Corporate Bonds
code = code.replace(
  /const corpBondsCols: ColDef\[\] = \[\r?\n\s*\{ header: "IDENTIFIER", render: \(i\) => i\.id, exportValue: \(i\) => i\.id \},/,
  `const corpBondsCols: ColDef[] = [
  { header: "IDENTIFIER", render: (i) => i.id, exportValue: (i) => i.id },
  { header: "DEALER", render: (i) => i.issuer, exportValue: (i) => i.issuer },
  { header: "PORTFOLIO", render: (i) => i.portfolioBook ?? "N/A", exportValue: (i) => i.portfolioBook ?? "N/A" },
  { header: "BOND NAME", render: (i) => i.name, exportValue: (i) => i.name },
  { header: "VALUE DATE", render: (i) => fmtDate(i.purchaseDate), exportValue: (i) => i.purchaseDate },
  { header: "COUPON RATE", render: (i) => fmtPct(i.couponRate), exportValue: (i) => i.couponRate },
  { header: "YIELD AT PURCHASE", render: (i) => fmtPct(i.uploadedManualValues?.yieldAtPurchase ?? 0), exportValue: (i) => i.uploadedManualValues?.yieldAtPurchase ?? 0 },
  { header: "UNITS", render: (i) => fmtNumber(i.quantity ?? 0), exportValue: (i) => i.quantity ?? 0 },
  { header: "COST AT PAR", render: (i) => fmtMoney(i.uploadedManualValues?.costAtPar ?? i.faceValue, "NGN"), exportValue: (i) => i.uploadedManualValues?.costAtPar ?? i.faceValue },
  { header: "DIRTY PRICE AT PURCHASE", render: (i) => fmtNumber(i.dirtyPriceAtPurchase ?? 0), exportValue: (i) => i.dirtyPriceAtPurchase ?? 0 },
  { header: "COST PRICE AT PURCHASE", render: (i) => fmtNumber(i.uploadedManualValues?.costPriceClean ?? 0), exportValue: (i) => i.uploadedManualValues?.costPriceClean ?? 0 },
  { header: "COST", render: (i) => fmtMoney(i.uploadedManualValues?.cost ?? i.purchasePrice, "NGN"), exportValue: (i) => i.uploadedManualValues?.cost ?? i.purchasePrice },
  { header: "CONSIDERATION AT PURCHASE", render: (i) => fmtMoney(i.uploadedManualValues?.considerationAtPurchase ?? i.purchasePrice, "NGN"), exportValue: (i) => i.uploadedManualValues?.considerationAtPurchase ?? i.purchasePrice },`
);
// Corp Bonds missing greys
code = code.replace(
  /\{ header: "TOTAL CURRENT MARKET VALUE", isGrey: true, render: \(i, v\) => <InlineDiff inst=\{i\} computed=\{v\.scheduleMetrics\?\.totalCurrentMarketValue \?\? 0\} manualKey="totalCurrentMarketValue" \/>, exportValue: \(i, v\) => v\.scheduleMetrics\?\.totalCurrentMarketValue \?\? 0 \},/,
  `{ header: "NUMBER OF COUPONS RECEIVED", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={Math.round((v.scheduleMetrics?.couponReceivedToDateGross ?? 0) / (i.faceValue * (i.couponRate ?? 0) / (i.couponFrequency === "Semi" ? 2 : i.couponFrequency === "Quarterly" ? 4 : i.couponFrequency === "Monthly" ? 12 : 1)))} manualKey="numberOfCouponsReceived" />, exportValue: (i, v) => Math.round((v.scheduleMetrics?.couponReceivedToDateGross ?? 0) / (i.faceValue * (i.couponRate ?? 0) / (i.couponFrequency === "Semi" ? 2 : i.couponFrequency === "Quarterly" ? 4 : i.couponFrequency === "Monthly" ? 12 : 1))) },
  { header: "LAST COUPON DATE", isGrey: true, render: (i, v) => v.scheduleMetrics?.lastCouponDate ?? "N/A", exportValue: (i, v) => v.scheduleMetrics?.lastCouponDate ?? "N/A" },
  { header: "NEXT COUPON DATE", isGrey: true, render: (i, v) => v.scheduleMetrics?.nextCouponDate ?? "N/A", exportValue: (i, v) => v.scheduleMetrics?.nextCouponDate ?? "N/A" },
  { header: "EFFECTIVE INTEREST RATE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.effectiveInterestRate ?? 0} manualKey="effectiveInterestRate" isPct />, exportValue: (i, v) => v.scheduleMetrics?.effectiveInterestRate ?? 0 },
  { header: "DAYS EARNED IN THE MONTH", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.daysEarnedInMonth ?? 0} manualKey="daysEarnedInMonth" />, exportValue: (i, v) => v.scheduleMetrics?.daysEarnedInMonth ?? 0 },
  { header: "LAST MONTH MARKET VALUE", isGrey: true, render: () => <PendingState message="Requires market data" />, exportValue: () => "Pending" },
  { header: "LAST MONTH YIELD", isGrey: true, render: () => <PendingState message="Requires market data" />, exportValue: () => "Pending" },
  { header: "LAST MONTH PRICE", isGrey: true, render: () => <PendingState message="Requires market data" />, exportValue: () => "Pending" },
  { header: "CURRENT MARKET YIELD", isGrey: true, render: () => <PendingState message="Requires market data" />, exportValue: () => "Pending" },
  { header: "CURRENT MARKET PRICE", isGrey: true, render: () => <PendingState message="Requires market data" />, exportValue: () => "Pending" },
  { header: "ACTUAL CURRENT MARKET VALUE (CLEAN)", isGrey: true, render: () => <PendingState message="Requires market data" />, exportValue: () => "Pending" },
  { header: "TOTAL CURRENT MARKET VALUE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.totalCurrentMarketValue ?? 0} manualKey="totalCurrentMarketValue" />, exportValue: (i, v) => v.scheduleMetrics?.totalCurrentMarketValue ?? 0 },`
);

// 6. State Bonds
code = code.replace(
  /const stateBondsCols: ColDef\[\] = \[\r?\n\s*\{ header: "IDENTIFIER", render: \(i\) => i\.id, exportValue: \(i\) => i\.id \},/,
  `const stateBondsCols: ColDef[] = [
  { header: "IDENTIFIER", render: (i) => i.id, exportValue: (i) => i.id },
  { header: "DEALER", render: (i) => i.issuer, exportValue: (i) => i.issuer },
  { header: "PORTFOLIO", render: (i) => i.portfolioBook ?? "N/A", exportValue: (i) => i.portfolioBook ?? "N/A" },
  { header: "BOND NAME", render: (i) => i.name, exportValue: (i) => i.name },
  { header: "VALUE DATE", render: (i) => fmtDate(i.purchaseDate), exportValue: (i) => i.purchaseDate },
  { header: "COUPON RATE", render: (i) => fmtPct(i.couponRate), exportValue: (i) => i.couponRate },
  { header: "YIELD AT PURCHASE", render: (i) => fmtPct(i.uploadedManualValues?.yieldAtPurchase ?? 0), exportValue: (i) => i.uploadedManualValues?.yieldAtPurchase ?? 0 },
  { header: "UNITS", render: (i) => fmtNumber(i.quantity ?? 0), exportValue: (i) => i.quantity ?? 0 },
  { header: "COST AT PAR", render: (i) => fmtMoney(i.uploadedManualValues?.costAtPar ?? i.faceValue, "NGN"), exportValue: (i) => i.uploadedManualValues?.costAtPar ?? i.faceValue },
  { header: "DIRTY PRICE AT PURCHASE", render: (i) => fmtNumber(i.dirtyPriceAtPurchase ?? 0), exportValue: (i) => i.dirtyPriceAtPurchase ?? 0 },
  { header: "COST PRICE AT PURCHASE", render: (i) => fmtNumber(i.uploadedManualValues?.costPriceClean ?? 0), exportValue: (i) => i.uploadedManualValues?.costPriceClean ?? 0 },
  { header: "COST", render: (i) => fmtMoney(i.uploadedManualValues?.cost ?? i.purchasePrice, "NGN"), exportValue: (i) => i.uploadedManualValues?.cost ?? i.purchasePrice },
  { header: "CONSIDERATION AT PURCHASE", render: (i) => fmtMoney(i.uploadedManualValues?.considerationAtPurchase ?? i.purchasePrice, "NGN"), exportValue: (i) => i.uploadedManualValues?.considerationAtPurchase ?? i.purchasePrice },`
);

code = code.replace(
  /\{ header: "PRINCIPAL REPAYMENT FOR THE MONTH", isGrey: true, render: \(i, v\) => <InlineDiff inst=\{i\} computed=\{0 \/\* Not fully supported yet \*\/\} manualKey="principalRepaymentThisMonth" \/>, exportValue: \(i, v\) => 0 \},/,
  `{ header: "PRINCIPAL REPAYMENT FOR THE MONTH", isGrey: true, render: () => <PendingState message="Pending Amortisation" />, exportValue: () => "Pending" },`
);

// State Bonds missing greys
code = code.replace(
  /\{ header: "TOTAL CURRENT MARKET VALUE", isGrey: true, render: \(i, v\) => <InlineDiff inst=\{i\} computed=\{v\.scheduleMetrics\?\.totalCurrentMarketValue \?\? 0\} manualKey="totalCurrentMarketValue" \/>, exportValue: \(i, v\) => v\.scheduleMetrics\?\.totalCurrentMarketValue \?\? 0 \},/,
  `{ header: "NUMBER OF COUPONS RECEIVED", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={Math.round((v.scheduleMetrics?.couponReceivedToDateGross ?? 0) / (i.faceValue * (i.couponRate ?? 0) / (i.couponFrequency === "Semi" ? 2 : i.couponFrequency === "Quarterly" ? 4 : i.couponFrequency === "Monthly" ? 12 : 1)))} manualKey="numberOfCouponsReceived" />, exportValue: (i, v) => Math.round((v.scheduleMetrics?.couponReceivedToDateGross ?? 0) / (i.faceValue * (i.couponRate ?? 0) / (i.couponFrequency === "Semi" ? 2 : i.couponFrequency === "Quarterly" ? 4 : i.couponFrequency === "Monthly" ? 12 : 1))) },
  { header: "LAST COUPON DATE", isGrey: true, render: (i, v) => v.scheduleMetrics?.lastCouponDate ?? "N/A", exportValue: (i, v) => v.scheduleMetrics?.lastCouponDate ?? "N/A" },
  { header: "NEXT COUPON DATE", isGrey: true, render: (i, v) => v.scheduleMetrics?.nextCouponDate ?? "N/A", exportValue: (i, v) => v.scheduleMetrics?.nextCouponDate ?? "N/A" },
  { header: "EFFECTIVE INTEREST RATE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.effectiveInterestRate ?? 0} manualKey="effectiveInterestRate" isPct />, exportValue: (i, v) => v.scheduleMetrics?.effectiveInterestRate ?? 0 },
  { header: "DAYS EARNED IN THE MONTH", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.daysEarnedInMonth ?? 0} manualKey="daysEarnedInMonth" />, exportValue: (i, v) => v.scheduleMetrics?.daysEarnedInMonth ?? 0 },
  { header: "LAST MONTH MARKET VALUE", isGrey: true, render: () => <PendingState message="Requires market data" />, exportValue: () => "Pending" },
  { header: "LAST MONTH YIELD", isGrey: true, render: () => <PendingState message="Requires market data" />, exportValue: () => "Pending" },
  { header: "LAST MONTH PRICE", isGrey: true, render: () => <PendingState message="Requires market data" />, exportValue: () => "Pending" },
  { header: "CURRENT MARKET YIELD", isGrey: true, render: () => <PendingState message="Requires market data" />, exportValue: () => "Pending" },
  { header: "CURRENT MARKET PRICE", isGrey: true, render: () => <PendingState message="Requires market data" />, exportValue: () => "Pending" },
  { header: "ACTUAL CURRENT MARKET VALUE (CLEAN)", isGrey: true, render: () => <PendingState message="Requires market data" />, exportValue: () => "Pending" },
  { header: "TOTAL CURRENT MARKET VALUE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.totalCurrentMarketValue ?? 0} manualKey="totalCurrentMarketValue" />, exportValue: (i, v) => v.scheduleMetrics?.totalCurrentMarketValue ?? 0 },`
);

fs.writeFileSync('src/features/accounting/pages/monthly-schedule.tsx', code);
console.log("patch-monthly-schedule.js applied");
