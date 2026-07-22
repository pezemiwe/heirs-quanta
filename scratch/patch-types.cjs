const fs = require('fs');
let code = fs.readFileSync('src/features/valuation/engine/types.ts', 'utf8');

// 1. Add fields to Instrument
code = code.replace(
  /maturityDate: string; \/\/ ISO yyyy-mm-dd\r?\n\r?\n\s*couponRate: number;/,
  `maturityDate: string; // ISO yyyy-mm-dd\n\n  // Additions for exact source matching:\n  quantity?: number;\n  costPriceUnit?: number;\n  dirtyPriceAtPurchase?: number;\n\n  couponRate: number;`
);

// 2. Add fields to ScheduleMetrics
code = code.replace(
  /monthlyMtmToPost: number;\r?\n\}/,
  `monthlyMtmToPost: number;\n  lastCouponDate?: string;\n  nextCouponDate?: string;\n  daysEarnedInMonth?: number;\n}`
);

// 3. Add fields to ManualValueKey
code = code.replace(
  /\| "numberOfCouponsReceived";/,
  `| "numberOfCouponsReceived"\n  | "cost"\n  | "yieldAtPurchase"\n  | "costAtPar"\n  | "considerationAtPurchase"\n  | "costPriceClean";`
);

fs.writeFileSync('src/features/valuation/engine/types.ts', code);
console.log("patch-types.js applied");
