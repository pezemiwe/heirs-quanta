import { Instrument, DataQualityIssue } from "../../valuation/engine/types";
import { parseDate, couponDates, toISO } from "../../valuation/engine/index";

export function runDataQualityChecks(instruments: Instrument[]): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];

  const impliedDates: { category: string, date: string, sourceInstruments: string[] }[] = [];
  const addImpliedDate = (category: string, ms: number, instId: string) => {
    const d = toISO(new Date(ms));
    const existing = impliedDates.find(i => i.category === category && i.date === d);
    if (existing) {
      existing.sourceInstruments.push(instId);
    } else {
      impliedDates.push({ category, date: d, sourceInstruments: [instId] });
    }
  };

  const checkInterestReconciles = (instrument: Instrument, manualValue: number, computedValue: number, tolerancePct: number, fieldName: string) => {
    if (manualValue === 0 && computedValue === 0) return;
    const diff = Math.abs(manualValue - computedValue);
    const relDiff = diff / Math.max(Math.abs(computedValue), 0.01);
    if (relDiff > tolerancePct) {
      issues.push({
        severity: "warning",
        category: "input-sanity",
        message: `${instrument.id}: stated ${fieldName} doesn't reconcile with principal × rate × tenor — verify the source deal ticket.`,
        affectedInstrumentIds: [instrument.id]
      });
    }
  };

  const checkCarryforward = (inst: Instrument, vals: any, key: string, name: string) => {
    if (vals[key] === undefined) {
      issues.push({
        severity: "info",
        category: "requires-carryforward",
        message: `${inst.id}: ${name} requires the prior month's closing package and cannot be computed from this upload alone.`,
        affectedInstrumentIds: [inst.id]
      });
    }
  };

  for (const inst of instruments) {
    const vals = inst.uploadedManualValues || {};
    const id = inst.id;

    // a) Cross-sheet reporting-date consistency
    if ((inst.instrumentType === "Bank Placement" || inst.instrumentType === "Fixed Deposit") && vals.accruedDays !== undefined) {
      const impliedMs = parseDate(inst.purchaseDate).getTime() + vals.accruedDays * 86400000;
      addImpliedDate("Placements", impliedMs, id);
    }

    if (inst.instrumentType === "T-Bill" && vals.closingAmortisedCost !== undefined) {
      const pDate = parseDate(inst.purchaseDate).getTime();
      const mDate = parseDate(inst.maturityDate).getTime();
      const tenorDays = Math.round((mDate - pDate) / 86400000);
      const totalDiscount = inst.faceValue - inst.purchasePrice;
      const amortisedToDate = vals.closingAmortisedCost - inst.purchasePrice;
      if (totalDiscount > 0) {
        const daysSinceValue = Math.round((amortisedToDate / totalDiscount) * tenorDays);
        const impliedMs = pDate + daysSinceValue * 86400000;
        addImpliedDate("T-Bills", impliedMs, id);
      }
    }

    if (["FGN Bond", "Corporate Bond", "State Bond"].includes(inst.instrumentType) && vals.totalAccruedInterest !== undefined) {
      const dailyAccrual = (inst.faceValue * inst.couponRate) / 365;
      if (dailyAccrual > 0 && inst.numberOfCouponsReceived !== undefined) {
        const daysSinceLastCoupon = Math.round(vals.totalAccruedInterest / dailyAccrual);
        const cDates = couponDates(inst);
        let lastCouponMs = parseDate(inst.purchaseDate).getTime();
        const received = inst.numberOfCouponsReceived;
        if (received > 0 && received <= cDates.length) {
          lastCouponMs = cDates[received - 1].getTime();
        }
        const impliedMs = lastCouponMs + daysSinceLastCoupon * 86400000;
        addImpliedDate("Bonds", impliedMs, id);
      }
    }

    // b) WHT / Net-Gross plausibility
    if (inst.instrumentType === "Bank Placement") {
      const wht = vals.wht;
      if (wht !== undefined && inst.netGrossFlag) {
        if (inst.netGrossFlag === "Net") {
          if (Math.abs(wht) > 1) {
            issues.push({ severity: "warning", category: "wht-convention", message: `${id}: WHT amount doesn't match its Net/Gross flag (Net) — expected 0, found ${wht}.`, affectedInstrumentIds: [id] });
          }
        } else if (inst.netGrossFlag === "Gross") {
          const pDate = parseDate(inst.purchaseDate).getTime();
          const mDate = parseDate(inst.maturityDate).getTime();
          const tenorDays = Math.round((mDate - pDate) / 86400000);
          const grossInterest = inst.purchasePrice * inst.couponRate * (tenorDays / 365);
          const expectedWHT = grossInterest * 0.1;
          if (expectedWHT > 0 && Math.abs(wht - expectedWHT) / expectedWHT > 0.005) {
            issues.push({ severity: "warning", category: "wht-convention", message: `${id}: WHT amount doesn't match its Net/Gross flag (Gross) — expected ${expectedWHT.toFixed(2)}, found ${wht}.`, affectedInstrumentIds: [id] });
          }
        }
      }
    }

    // c) Raw-input sanity check
    if (inst.instrumentType === "Fixed Deposit" && inst.currency === "USD") {
      if (vals.interestReceivable !== undefined) {
        const pDate = parseDate(inst.purchaseDate).getTime();
        const mDate = parseDate(inst.maturityDate).getTime();
        const tenorDays = Math.round((mDate - pDate) / 86400000);
        const computed = inst.purchasePrice * inst.couponRate * (tenorDays / 365);
        checkInterestReconciles(inst, vals.interestReceivable, computed, 0.01, "interest receivable");
      }
    }

    // d) Requires-carryforward flagging
    if (inst.instrumentType === "Fixed Deposit" && inst.currency === "USD") {
      checkCarryforward(inst, vals, "totalUnrealisedExchangeGainLoss", "TOTAL UNREALISED EXCHANGE GAIN/LOSS");
    } else if (inst.instrumentType === "Equity") {
      checkCarryforward(inst, vals, "openingGainLoss", "OPENING GAIN/LOSS");
    } else if (["FGN Bond", "Corporate Bond", "State Bond"].includes(inst.instrumentType)) {
      checkCarryforward(inst, vals, "lastMonthAccruedInterest", "LAST MONTH ACCRUED INTEREST");
    }
  }

  // Cross-sheet reporting-date consistency comparison
  const distinctCategories = Array.from(new Set(impliedDates.map(d => d.category)));
  if (distinctCategories.length >= 2) {
    const categoryDates = new Map<string, number>();
    for (const cat of distinctCategories) {
      const datesForCat = impliedDates.filter(d => d.category === cat).map(d => new Date(d.date).getTime());
      categoryDates.set(cat, datesForCat[0]);
    }

    const dates = Array.from(categoryDates.values());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);

    if (maxDate - minDate > 86400000) { // > 1 day
      const categoryDateStrings = Array.from(categoryDates.entries())
        .map(([cat, ms]) => {
          const d = new Date(ms);
          return `${cat}: ${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })} ${d.getFullYear()}`;
        })
        .join(', ');
      
      const allAffected = impliedDates.flatMap(d => d.sourceInstruments);

      issues.push({
        severity: "warning",
        category: "reporting-date",
        message: `Uploaded figures imply inconsistent reporting dates across instrument types (e.g. ${categoryDateStrings}) — confirm the correct closing date before relying on these figures.`,
        affectedInstrumentIds: Array.from(new Set(allAffected))
      });
    }
  }

  return issues;
}
