const fs = require('fs');
let code = fs.readFileSync('src/features/valuation/engine/schedule-metrics.ts', 'utf8');

// 1. Add missing fields to ScheduleMetrics return
code = code.replace(
  /monthlyMtmToPost: val\.unrealisedGL \?\? 0,\r?\n\s*\};\r?\n\}/,
  `monthlyMtmToPost: val.unrealisedGL ?? 0,\n    lastCouponDate: lastCouponDate ? lastCouponDate.toISOString().split('T')[0] : undefined,\n    nextCouponDate: val.risk?.nextCouponDate ?? undefined,\n    daysEarnedInMonth: inst.instrumentType.includes("Bond") ? daysEarnedInMonth : undefined,\n  };\n}`
);

fs.writeFileSync('src/features/valuation/engine/schedule-metrics.ts', code);
console.log("patch-schedule-metrics.js applied");
