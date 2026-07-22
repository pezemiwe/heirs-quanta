const fs = require('fs');
let code = fs.readFileSync('src/features/valuation/engine/types.ts', 'utf8');

const manualValueKeyString = `export type ManualValueKey =
  | "interestReceivable"
  | "effectiveInterestRate"
  | "interestIncomeThisMonth"
  | "wht"
  | "netIncome"
  | "accruedInterestClosing"
  | "accruedInterestClosingNgn"
  | "accruedInterestClosingUsd"
  | "closingAmortisedCost"
  | "closingAmortisedCostNgn"
  | "closingAmortisedCostUsd"
  | "currentMarketBidDiscountRate"
  | "currentMarketValue"
  | "currentMarketValueNgn"
  | "currentMarketValueUsd"
  | "currentMtmGainLoss"
  | "monthlyMtmToPost"
  | "couponReceivedToDateGross"
  | "couponReceivedToDateNet"
  | "principalRepaymentThisMonth"
  | "lastMonthAccruedInterest"
  | "grossCoupon"
  | "netCoupon"
  | "totalAccruedInterest"
  | "totalCurrentMarketValue"
  | "daysEarnedInMonth"
  | "lastMonthMarketValueClean"
  | "lastMonthMarketYield"
  | "lastMonthMarketPrice"
  | "currentMarketYield"
  | "currentMarketPrice"
  | "actualCurrentMarketValueClean"
  | "thisMonthExchangeGainLoss"
  | "totalUnrealisedExchangeGainLoss"
  | "openingGainLoss"
  | "grossDividendReceived"
  | "netDividendReceived"
  | "ytdDividendReceivedNet"
  | "accruedDays"
  | "interestAccruedToValuationDate"
  | "numberOfCouponsReceived"
  | "cost"
  | "yieldAtPurchase"
  | "costAtPar"
  | "considerationAtPurchase"
  | "costPriceClean";`;

const startIdx = code.indexOf('export type ManualValueKey =');
const endIdx = code.indexOf(';', startIdx) + 1;
if(startIdx !== -1 && endIdx !== 0) {
  code = code.substring(0, startIdx) + manualValueKeyString + code.substring(endIdx);
}

// Fix DataQualityIssue category
code = code.replace(
  /export interface DataQualityIssue \{\r?\n\s*category: "[^"]*" \| "[^"]*" \| "[^"]*" \| "[^"]*";/,
  `export interface DataQualityIssue {\n  category: string;`
);

fs.writeFileSync('src/features/valuation/engine/types.ts', code);
console.log('Fixed types.ts manually');
