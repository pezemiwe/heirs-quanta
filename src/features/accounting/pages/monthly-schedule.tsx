import { useState, useMemo } from "react";
import { Download, Check } from "lucide-react";
import * as XLSX from "xlsx";
import { useValuation } from "../../valuation/store";
import { useInstrumentBook } from "../../../context/instrument-book";
import { valueInstrument } from "../../valuation/engine";
import { Tabs } from "../../../components/shared/tabs";
import { fmtMoney, fmtPct, fmtDate, fmtNumber } from "../../valuation/utils";
import type { Instrument, ManualValueKey, Currency, ScheduleMetrics, FcyScheduleMetrics } from "../../valuation/engine/types";
import { computeScheduleMetrics, computeFcyScheduleMetrics } from "../../valuation/engine/schedule-metrics";
import { PageHeader } from "../../../components/shared/page-header";

type TabId = "placements-ngn" | "tbills" | "placements-usd" | "equities" | "fgn-bonds" | "corp-bonds" | "state-bonds" | "data-quality";

interface ValuationResult {
  instrument: Instrument;
  scheduleMetrics?: ScheduleMetrics;
  fcyScheduleMetrics?: FcyScheduleMetrics;
}

type ColDef = {
  header: string;
  isGrey?: boolean;
  render: (inst: Instrument, val: ValuationResult, index: number) => React.ReactNode;
  exportValue: (inst: Instrument, val: ValuationResult, index: number) => string | number;
};

function InlineDiff({ inst, computed, manualKey, isPct, currency = "NGN" }: { inst: Instrument, computed: number, manualKey: ManualValueKey, isPct?: boolean, currency?: Currency }) {
  const manual = inst.uploadedManualValues?.[manualKey];
  const formattedComputed = isPct ? fmtPct(computed) : fmtMoney(computed, currency);
  
  if (manual === undefined) {
    return <span className="text-gray-900">{formattedComputed}</span>;
  }
  
  const diff = Math.abs(manual - computed);
  const threshold = Math.max(1, 0.0001 * Math.abs(computed)); // Max of 1 NGN or 0.01% of magnitude
  
  if (diff > threshold) {
    return (
      <div className="flex flex-col gap-1 whitespace-nowrap">
        <span className="text-red-600 font-semibold">{formattedComputed}</span>
        <span className="text-[10px] text-red-700 bg-red-100 px-1 py-0.5 rounded w-fit border border-red-200" title={`Diff: ${Math.abs(computed - manual).toFixed(2)}`}>
          User: {isPct ? fmtPct(manual) : fmtMoney(manual, currency)}
        </span>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-1 whitespace-nowrap">
      <span className="text-gray-900">{formattedComputed}</span>
      <span className="text-[10px] text-green-700 bg-green-50 border border-green-200 px-1 py-0.5 rounded w-fit flex items-center gap-0.5">
        Match <Check size={10}/>
      </span>
    </div>
  );
}


function PendingState({ message = "Requires market data input" }: { message?: string }) {
  return (
    <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded w-fit border border-amber-200">
      <span className="text-[10px] uppercase font-semibold">{message}</span>
    </div>
  );
}

const placementsNgnCols: ColDef[] = [
  { header: "S/N", render: (_, __, i) => i + 1, exportValue: (_, __, i) => i + 1 },
  { header: "IDENTIFIER", render: (i) => i.id, exportValue: (i) => i.id },
  { header: "INSTITUTION", render: (i) => i.issuer, exportValue: (i) => i.issuer },
  { header: "PRINCIPAL", render: (i) => fmtMoney(i.faceValue, "NGN"), exportValue: (i) => i.faceValue },
  { header: "RATE", render: (i) => fmtPct(i.couponRate), exportValue: (i) => i.couponRate },
  { header: "VALUE DATE", render: (i) => fmtDate(i.purchaseDate), exportValue: (i) => i.purchaseDate },
  { header: "MATURITY DATE", render: (i) => fmtDate(i.maturityDate), exportValue: (i) => i.maturityDate },
  { header: "INTEREST RECEIVABLE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.totalAccruedInterest ?? 0} manualKey="interestReceivable" />, exportValue: (i, v) => v.scheduleMetrics?.totalAccruedInterest ?? 0 },
  { header: "EFFECTIVE INTEREST RATE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.effectiveInterestRate ?? 0} manualKey="effectiveInterestRate" isPct />, exportValue: (i, v) => v.scheduleMetrics?.effectiveInterestRate ?? 0 },
  { header: "THIS MONTH INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.thisMonthInterest ?? 0} manualKey="interestIncomeThisMonth" />, exportValue: (i, v) => v.scheduleMetrics?.thisMonthInterest ?? 0 },
  { header: "WHT 10%", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={(v.scheduleMetrics?.thisMonthInterest ?? 0) * 0.1} manualKey="wht" />, exportValue: (i, v) => (v.scheduleMetrics?.thisMonthInterest ?? 0) * 0.1 },
  { header: "NET INCOME", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={(v.scheduleMetrics?.thisMonthInterest ?? 0) * 0.9} manualKey="netIncome" />, exportValue: (i, v) => (v.scheduleMetrics?.thisMonthInterest ?? 0) * 0.9 },
  { header: "CLOSING ACCRUED INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.closingAmortisedCost ?? 0} manualKey="accruedInterestClosing" />, exportValue: (i, v) => v.scheduleMetrics?.closingAmortisedCost ?? 0 },
];

const placementsUsdCols: ColDef[] = [
  { header: "S/N", render: (_, __, i) => i + 1, exportValue: (_, __, i) => i + 1 },
  { header: "DEALER", render: (i) => i.issuer, exportValue: (i) => i.issuer },
  { header: "CURRENCY", render: (i) => i.currency, exportValue: (i) => i.currency },
  { header: "TENOR", render: (i) => Math.round((new Date(i.maturityDate).getTime() - new Date(i.purchaseDate).getTime()) / 86400000), exportValue: (i) => Math.round((new Date(i.maturityDate).getTime() - new Date(i.purchaseDate).getTime()) / 86400000) },
  { header: "OPENING EXCHANGE RATE", render: (i) => fmtNumber(i.openingFxRate ?? i.purchaseFxRate ?? 1), exportValue: (i) => i.openingFxRate ?? i.purchaseFxRate ?? 1 },
  { header: "CURRENT EXCHANGE RATE", render: (i, v) => fmtNumber((v.fcyScheduleMetrics?.closingAmortisedCostBase ?? 1) / (v.fcyScheduleMetrics?.closingAmortisedCostFcy || 1)), exportValue: (i, v) => (v.fcyScheduleMetrics?.closingAmortisedCostBase ?? 1) / (v.fcyScheduleMetrics?.closingAmortisedCostFcy || 1) },
  { header: "IDENTIFIER", render: (i) => i.id, exportValue: (i) => i.id },
  { header: "PORTFOLIO", render: (i) => i.portfolioBook ?? "N/A", exportValue: (i) => i.portfolioBook ?? "N/A" },
  { header: "INSTITUTION", render: (i) => i.issuer, exportValue: (i) => i.issuer },
  { header: "PRINCIPAL USD ($)", render: (i) => fmtMoney(i.faceValue, "USD"), exportValue: (i) => i.faceValue },
  { header: "EXCHANGE RATE @ PURCHASE", render: (i) => fmtNumber(i.purchaseFxRate ?? 1), exportValue: (i) => i.purchaseFxRate ?? 1 },
  { header: "PRINCIPAL (NGN)", render: (i) => fmtMoney(i.purchasePrice, "NGN"), exportValue: (i) => i.purchasePrice },
  { header: "RATE", render: (i) => fmtPct(i.couponRate), exportValue: (i) => i.couponRate },
  { header: "VALUE DATE", render: (i) => fmtDate(i.purchaseDate), exportValue: (i) => i.purchaseDate },
  { header: "MATURITY DATE", render: (i) => fmtDate(i.maturityDate), exportValue: (i) => i.maturityDate },
  { header: "INTEREST RECEIVABLE ($)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.fcyScheduleMetrics?.totalAccruedInterestFcy ?? 0} manualKey="interestReceivable" currency="USD" />, exportValue: (i, v) => v.fcyScheduleMetrics?.totalAccruedInterestFcy ?? 0 },
  { header: "EFFECTIVE INTEREST RATE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.effectiveInterestRate ?? 0} manualKey="effectiveInterestRate" isPct />, exportValue: (i, v) => v.scheduleMetrics?.effectiveInterestRate ?? 0 },
  { header: "THIS MONTH INTEREST INCOME ($)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.fcyScheduleMetrics?.thisMonthInterestFcy ?? 0} manualKey="interestIncomeThisMonth" currency="USD" />, exportValue: (i, v) => v.fcyScheduleMetrics?.thisMonthInterestFcy ?? 0 },
  { header: "ACCRUED INTEREST ($)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.fcyScheduleMetrics?.closingAmortisedCostFcy ?? 0} manualKey="accruedInterestClosingUsd" currency="USD" />, exportValue: (i, v) => v.fcyScheduleMetrics?.closingAmortisedCostFcy ?? 0 },
  { header: "ACCRUED INTEREST (NGN)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.fcyScheduleMetrics?.closingAmortisedCostBase ?? 0} manualKey="accruedInterestClosingNgn" />, exportValue: (i, v) => v.fcyScheduleMetrics?.closingAmortisedCostBase ?? 0 },
  { header: "CLOSING AMORTISED COST ($)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={(i.faceValue) + (v.fcyScheduleMetrics?.closingAmortisedCostFcy ?? 0)} manualKey="closingAmortisedCostUsd" currency="USD" />, exportValue: (i, v) => (i.faceValue) + (v.fcyScheduleMetrics?.closingAmortisedCostFcy ?? 0) },
  { header: "OPENING ACCRUED INCOME (USD)", isGrey: true, render: () => <PendingState message="Requires carryforward" />, exportValue: () => "Pending" },
  { header: "OPENING ACCRUED INCOME (NGN)", isGrey: true, render: () => <PendingState message="Requires carryforward" />, exportValue: () => "Pending" },
  { header: "OPENING AMORTISED COST (USD)", isGrey: true, render: () => <PendingState message="Requires carryforward" />, exportValue: () => "Pending" },
  { header: "OPENING AMORTISED COST (NGN)", isGrey: true, render: () => <PendingState message="Requires carryforward" />, exportValue: () => "Pending" },
  { header: "THIS MONTH EXCHANGE GAIN/(LOSS) - NGN", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.fcyScheduleMetrics?.thisMonthUnrealisedFxGainLoss ?? 0} manualKey="thisMonthExchangeGainLoss" />, exportValue: (i, v) => v.fcyScheduleMetrics?.thisMonthUnrealisedFxGainLoss ?? 0 },
  { header: "LAST MONTH EXCHANGE GAIN/(LOSS) (NGN)", isGrey: true, render: () => <PendingState message="Requires carryforward" />, exportValue: () => "Pending" },
  { header: "TOTAL REALISED EXCHANGE GAIN/LOSS JAN-DEC", isGrey: true, render: () => <PendingState message="Requires carryforward" />, exportValue: () => "Pending" },
  { header: "TOTAL UNREALISED EXCHANGE GAIN/(LOSS) - NGN", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.fcyScheduleMetrics?.totalUnrealisedFxGainLoss ?? 0} manualKey="totalUnrealisedExchangeGainLoss" />, exportValue: (i, v) => v.fcyScheduleMetrics?.totalUnrealisedFxGainLoss ?? 0 },
  { header: "TOTAL CURRENT MARKET VALUE INCLUSIVE OF FX (NGN)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={(v.fcyScheduleMetrics?.totalCurrentMarketValueBase ?? 0)} manualKey="totalCurrentMarketValue" />, exportValue: (i, v) => (v.fcyScheduleMetrics?.totalCurrentMarketValueBase ?? 0) },
];

const tbillsCols: ColDef[] = [
  { header: "IDENTIFIER", render: (i) => i.id, exportValue: (i) => i.id },
  { header: "DEALER", render: (i) => i.issuer, exportValue: (i) => i.issuer },
  { header: "PORTFOLIO", render: (i) => i.portfolioBook ?? "N/A", exportValue: (i) => i.portfolioBook ?? "N/A" },
  { header: "DESCRIPTION", render: (i) => i.name, exportValue: (i) => i.name },
  { header: "PURCHASE COST", render: (i) => fmtMoney(i.purchasePrice, "NGN"), exportValue: (i) => i.purchasePrice },
  { header: "VALUE DATE", render: (i) => fmtDate(i.purchaseDate), exportValue: (i) => i.purchaseDate },
  { header: "INTEREST RATE", render: (i) => fmtPct(i.couponRate), exportValue: (i) => i.couponRate },
  { header: "TENOR", render: (i) => Math.round((new Date(i.maturityDate).getTime() - new Date(i.purchaseDate).getTime()) / 86400000), exportValue: (i) => Math.round((new Date(i.maturityDate).getTime() - new Date(i.purchaseDate).getTime()) / 86400000) },
  { header: "PRICE ON PURCHASE", render: (i) => fmtNumber(i.purchasePrice / (i.faceValue || 1)), exportValue: (i) => i.purchasePrice / (i.faceValue || 1) },
  { header: "MATURITY DATE", render: (i) => fmtDate(i.maturityDate), exportValue: (i) => i.maturityDate },
  { header: "FACE VALUE", render: (i) => fmtMoney(i.faceValue, "NGN"), exportValue: (i) => i.faceValue },
  { header: "INTEREST RECEIVABLE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.totalAccruedInterest ?? 0} manualKey="interestReceivable" />, exportValue: (i, v) => v.scheduleMetrics?.totalAccruedInterest ?? 0 },
  { header: "EFFECTIVE INTEREST RATE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.effectiveInterestRate ?? 0} manualKey="effectiveInterestRate" isPct />, exportValue: (i, v) => v.scheduleMetrics?.effectiveInterestRate ?? 0 },
  { header: "INTEREST INCOME FOR THE MONTH", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.thisMonthInterest ?? 0} manualKey="interestIncomeThisMonth" />, exportValue: (i, v) => v.scheduleMetrics?.thisMonthInterest ?? 0 },
  { header: "CLOSING ACCRUED INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.closingAmortisedCost ?? 0} manualKey="accruedInterestClosing" />, exportValue: (i, v) => v.scheduleMetrics?.closingAmortisedCost ?? 0 },
  { header: "CURRENT MARKET BID DISCOUNT RATE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.currentMarketYield ?? 0} manualKey="currentMarketBidDiscountRate" isPct />, exportValue: (i, v) => v.scheduleMetrics?.currentMarketYield ?? 0 },
  { header: "CURRENT MARKET VALUE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.totalCurrentMarketValue ?? 0} manualKey="currentMarketValue" />, exportValue: (i, v) => v.scheduleMetrics?.totalCurrentMarketValue ?? 0 },
  { header: "CURRENT MARK TO MARKET GAIN/(LOSS)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.currentMtmGainLoss ?? 0} manualKey="currentMtmGainLoss" />, exportValue: (i, v) => v.scheduleMetrics?.currentMtmGainLoss ?? 0 },
  { header: "MONTHLY MARK TO MARKET TO POST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.monthlyMtmToPost ?? 0} manualKey="monthlyMtmToPost" />, exportValue: (i, v) => v.scheduleMetrics?.monthlyMtmToPost ?? 0 },
];


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

const fgnBondsCols: ColDef[] = [
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
  { header: "CONSIDERATION AT PURCHASE", render: (i) => fmtMoney(i.uploadedManualValues?.considerationAtPurchase ?? i.purchasePrice, "NGN"), exportValue: (i) => i.uploadedManualValues?.considerationAtPurchase ?? i.purchasePrice },
  { header: "MATURITY DATE", render: (i) => fmtDate(i.maturityDate), exportValue: (i) => i.maturityDate },
  { header: "FACE VALUE", render: (i) => fmtMoney(i.faceValue, "NGN"), exportValue: (i) => i.faceValue },
  { header: "TOTAL COUPON RECEIVED TO DATE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.couponReceivedToDateGross ?? 0} manualKey="couponReceivedToDateGross" />, exportValue: (i, v) => v.scheduleMetrics?.couponReceivedToDateGross ?? 0 },
  { header: "LAST MONTH ACCRUED INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.lastMonthAccruedInterest ?? 0} manualKey="lastMonthAccruedInterest" />, exportValue: (i, v) => v.scheduleMetrics?.lastMonthAccruedInterest ?? 0 },
  { header: "THIS MONTH INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.thisMonthInterest ?? 0} manualKey="interestIncomeThisMonth" />, exportValue: (i, v) => v.scheduleMetrics?.thisMonthInterest ?? 0 },
  { header: "TOTAL ACCRUED INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.totalAccruedInterest ?? 0} manualKey="totalAccruedInterest" />, exportValue: (i, v) => v.scheduleMetrics?.totalAccruedInterest ?? 0 },
  { header: "NUMBER OF COUPONS RECEIVED", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={Math.round((v.scheduleMetrics?.couponReceivedToDateGross ?? 0) / (i.faceValue * (i.couponRate ?? 0) / (i.couponFrequency === "Semi" ? 2 : i.couponFrequency === "Quarterly" ? 4 : i.couponFrequency === "Monthly" ? 12 : 1)))} manualKey="numberOfCouponsReceived" />, exportValue: (i, v) => Math.round((v.scheduleMetrics?.couponReceivedToDateGross ?? 0) / (i.faceValue * (i.couponRate ?? 0) / (i.couponFrequency === "Semi" ? 2 : i.couponFrequency === "Quarterly" ? 4 : i.couponFrequency === "Monthly" ? 12 : 1))) },
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
  { header: "NUMBER OF COUPONS RECEIVED", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={Math.round((v.scheduleMetrics?.couponReceivedToDateGross ?? 0) / (i.faceValue * (i.couponRate ?? 0) / (i.couponFrequency === "Semi" ? 2 : i.couponFrequency === "Quarterly" ? 4 : i.couponFrequency === "Monthly" ? 12 : 1)))} manualKey="numberOfCouponsReceived" />, exportValue: (i, v) => Math.round((v.scheduleMetrics?.couponReceivedToDateGross ?? 0) / (i.faceValue * (i.couponRate ?? 0) / (i.couponFrequency === "Semi" ? 2 : i.couponFrequency === "Quarterly" ? 4 : i.couponFrequency === "Monthly" ? 12 : 1))) },
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
  { header: "NUMBER OF COUPONS RECEIVED", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={Math.round((v.scheduleMetrics?.couponReceivedToDateGross ?? 0) / (i.faceValue * (i.couponRate ?? 0) / (i.couponFrequency === "Semi" ? 2 : i.couponFrequency === "Quarterly" ? 4 : i.couponFrequency === "Monthly" ? 12 : 1)))} manualKey="numberOfCouponsReceived" />, exportValue: (i, v) => Math.round((v.scheduleMetrics?.couponReceivedToDateGross ?? 0) / (i.faceValue * (i.couponRate ?? 0) / (i.couponFrequency === "Semi" ? 2 : i.couponFrequency === "Quarterly" ? 4 : i.couponFrequency === "Monthly" ? 12 : 1))) },
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
  { header: "TOTAL CURRENT MARKET VALUE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.totalCurrentMarketValue ?? 0} manualKey="totalCurrentMarketValue" />, exportValue: (i, v) => v.scheduleMetrics?.totalCurrentMarketValue ?? 0 },
  { header: "CURRENT MARK TO MARKET GAIN/(LOSS)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.currentMtmGainLoss ?? 0} manualKey="currentMtmGainLoss" />, exportValue: (i, v) => v.scheduleMetrics?.currentMtmGainLoss ?? 0 },
];

const corpBondsCols: ColDef[] = [
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
  { header: "CONSIDERATION AT PURCHASE", render: (i) => fmtMoney(i.uploadedManualValues?.considerationAtPurchase ?? i.purchasePrice, "NGN"), exportValue: (i) => i.uploadedManualValues?.considerationAtPurchase ?? i.purchasePrice },
  { header: "MATURITY DATE", render: (i) => fmtDate(i.maturityDate), exportValue: (i) => i.maturityDate },
  { header: "FACE VALUE", render: (i) => fmtMoney(i.faceValue, "NGN"), exportValue: (i) => i.faceValue },
  { header: "TOTAL COUPON RECEIVED TO DATE NET", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={(v.scheduleMetrics?.couponReceivedToDateGross ?? 0) * 0.9} manualKey="couponReceivedToDateNet" />, exportValue: (i, v) => (v.scheduleMetrics?.couponReceivedToDateGross ?? 0) * 0.9 },
  { header: "TOTAL COUPON GROSS", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.couponReceivedToDateGross ?? 0} manualKey="couponReceivedToDateGross" />, exportValue: (i, v) => v.scheduleMetrics?.couponReceivedToDateGross ?? 0 },
  { header: "LAST MONTH ACCRUED INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.lastMonthAccruedInterest ?? 0} manualKey="lastMonthAccruedInterest" />, exportValue: (i, v) => v.scheduleMetrics?.lastMonthAccruedInterest ?? 0 },
  { header: "THIS MONTH INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.thisMonthInterest ?? 0} manualKey="interestIncomeThisMonth" />, exportValue: (i, v) => v.scheduleMetrics?.thisMonthInterest ?? 0 },
  { header: "TOTAL ACCRUED INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.totalAccruedInterest ?? 0} manualKey="totalAccruedInterest" />, exportValue: (i, v) => v.scheduleMetrics?.totalAccruedInterest ?? 0 },
  { header: "TOTAL CURRENT MARKET VALUE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.totalCurrentMarketValue ?? 0} manualKey="totalCurrentMarketValue" />, exportValue: (i, v) => v.scheduleMetrics?.totalCurrentMarketValue ?? 0 },
];

const stateBondsCols: ColDef[] = [
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
  { header: "CONSIDERATION AT PURCHASE", render: (i) => fmtMoney(i.uploadedManualValues?.considerationAtPurchase ?? i.purchasePrice, "NGN"), exportValue: (i) => i.uploadedManualValues?.considerationAtPurchase ?? i.purchasePrice },
  { header: "MATURITY DATE", render: (i) => fmtDate(i.maturityDate), exportValue: (i) => i.maturityDate },
  { header: "FACE VALUE", render: (i) => fmtMoney(i.faceValue, "NGN"), exportValue: (i) => i.faceValue },
  { header: "COUPON RECEIVED TO DATE GROSS", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.couponReceivedToDateGross ?? 0} manualKey="couponReceivedToDateGross" />, exportValue: (i, v) => v.scheduleMetrics?.couponReceivedToDateGross ?? 0 },
  { header: "COUPON RECEIVED TO DATE NET", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={(v.scheduleMetrics?.couponReceivedToDateGross ?? 0) * 0.9} manualKey="couponReceivedToDateNet" />, exportValue: (i, v) => (v.scheduleMetrics?.couponReceivedToDateGross ?? 0) * 0.9 },
  { header: "PRINCIPAL REPAYMENT FOR THE MONTH", isGrey: true, render: () => <PendingState message="Pending Amortisation" />, exportValue: () => "Pending" },
  { header: "LAST MONTH ACCRUED INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.lastMonthAccruedInterest ?? 0} manualKey="lastMonthAccruedInterest" />, exportValue: (i, v) => v.scheduleMetrics?.lastMonthAccruedInterest ?? 0 },
  { header: "THIS MONTH INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.thisMonthInterest ?? 0} manualKey="interestIncomeThisMonth" />, exportValue: (i, v) => v.scheduleMetrics?.thisMonthInterest ?? 0 },
  { header: "GROSS COUPON", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.thisMonthInterest ?? 0} manualKey="grossCoupon" />, exportValue: (i, v) => v.scheduleMetrics?.thisMonthInterest ?? 0 },
  { header: "WHT", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={(v.scheduleMetrics?.thisMonthInterest ?? 0) * 0.1} manualKey="wht" />, exportValue: (i, v) => (v.scheduleMetrics?.thisMonthInterest ?? 0) * 0.1 },
  { header: "NET COUPON", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={(v.scheduleMetrics?.thisMonthInterest ?? 0) * 0.9} manualKey="netCoupon" />, exportValue: (i, v) => (v.scheduleMetrics?.thisMonthInterest ?? 0) * 0.9 },
  { header: "TOTAL ACCRUED INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.totalAccruedInterest ?? 0} manualKey="totalAccruedInterest" />, exportValue: (i, v) => v.scheduleMetrics?.totalAccruedInterest ?? 0 },
  { header: "TOTAL CURRENT MARKET VALUE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.totalCurrentMarketValue ?? 0} manualKey="totalCurrentMarketValue" />, exportValue: (i, v) => v.scheduleMetrics?.totalCurrentMarketValue ?? 0 },
];

const getCols = (tab: TabId): ColDef[] => {
  switch (tab) {
    case "placements-ngn": return placementsNgnCols;
    case "placements-usd": return placementsUsdCols;
    case "tbills": return tbillsCols;
    case "fgn-bonds": return fgnBondsCols;
    case "corp-bonds": return corpBondsCols;
    case "state-bonds": return stateBondsCols;
    default: return fgnBondsCols; 
  }
}

export function MonthlySchedule() {
  const v = useValuation();
  const { importState } = useInstrumentBook();
  const [tab, setTab] = useState<TabId>("placements-ngn");
  
  const tabs = [
    { id: "placements-ngn", label: "Placements" },
    { id: "tbills", label: "T-Bills" },
    { id: "placements-usd", label: "USD Placements" },
    { id: "equities", label: "Equities" },
    { id: "fgn-bonds", label: "FGN Bonds" },
    { id: "corp-bonds", label: "Corporate Bonds" },
    { id: "state-bonds", label: "State Bonds" },
  ] as const;

  const activeTabs = importState.dataQualityIssues && importState.dataQualityIssues.length > 0
    ? [...tabs, { id: "data-quality" as const, label: `Data Quality (${importState.dataQualityIssues.length})` }]
    : tabs;

  const instrumentsForTab = useMemo(() => {
    return v.instruments.filter(i => {
      if (tab === "placements-ngn") return i.instrumentType === "Bank Placement" && i.currency === "NGN";
      if (tab === "placements-usd") return i.instrumentType === "Fixed Deposit" && i.currency === "USD";
      if (tab === "tbills") return i.instrumentType === "T-Bill";
      if (tab === "equities") return i.instrumentType === "Equity";
      if (tab === "fgn-bonds") return i.instrumentType === "FGN Bond";
      if (tab === "corp-bonds") return i.instrumentType === "Corporate Bond";
      if (tab === "state-bonds") return i.instrumentType === "State Bond";
      return false;
    });
  }, [v.instruments, tab]);

  const vals = useMemo(() => {
    return instrumentsForTab.map(inst => {
      const val = valueInstrument(inst, v.assumptions);
      return {
        instrument: inst,
        scheduleMetrics: computeScheduleMetrics(inst, val, v.assumptions),
        fcyScheduleMetrics: inst.currency !== "NGN" ? computeFcyScheduleMetrics(inst, val, v.assumptions) : undefined
      };
    });
  }, [instrumentsForTab, v.assumptions]);

  const cols = getCols(tab);

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    
    for (const t of tabs) {
      const typeInsts = v.instruments.filter(i => {
        if (t.id === "placements-ngn") return i.instrumentType === "Bank Placement" && i.currency === "NGN";
        if (t.id === "placements-usd") return i.instrumentType === "Fixed Deposit" && i.currency === "USD";
        if (t.id === "tbills") return i.instrumentType === "T-Bill";
        if (t.id === "equities") return i.instrumentType === "Equity";
        if (t.id === "fgn-bonds") return i.instrumentType === "FGN Bond";
        if (t.id === "corp-bonds") return i.instrumentType === "Corporate Bond";
        if (t.id === "state-bonds") return i.instrumentType === "State Bond";
        return false;
      });
      
      const typeVals = typeInsts.map(inst => valueInstrument(inst, v.assumptions));
      const typeCols = getCols(t.id as TabId);
      
      const data = typeVals.map((val, idx) => {
        const row: Record<string, string | number> = {};
        typeCols.forEach(c => {
          row[c.header] = c.exportValue(val.instrument, val as any, idx);
        });
        return row;
      });
      
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, t.label);
    }
    
    XLSX.writeFile(wb, "Monthly_Closing_Schedule.xlsx");
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6 max-h-[calc(100vh-6rem)] overflow-hidden flex flex-col">
      <PageHeader 
        title="Monthly Closing Schedule" 
        description={`Reporting Date: ${fmtDate(v.assumptions.valuationDate)}`}
        actions={[
          <button 
            key="export"
            onClick={handleExport}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-colors"
          >
            <Download size={16} />
            Export to Excel
          </button>
        ]}
      />

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col flex-1 min-h-0">
          <div className="border-b border-gray-200 px-2 pt-2 bg-gray-50 flex-none overflow-x-auto">
            <Tabs
              tabs={activeTabs.map((t) => ({ value: t.id, label: t.label }))}
              value={tab}
              onChange={(id) => setTab(id as TabId)}
            />
          </div>
  
          <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {tab === "data-quality" ? (
              <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
                <div className="pb-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Data Quality Issues</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    The following inconsistencies were detected in the most recent workbook import. These issues highlight potential errors in the uploaded data or discrepancies with expected calculation logic.
                  </p>
                </div>
                {importState.dataQualityIssues?.map((issue, idx) => (
                  <div key={idx} className={`p-4 rounded-lg border ${issue.severity === "warning" ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"}`}>
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${issue.severity === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                        {issue.severity}
                      </span>
                      <div>
                        <h4 className={`text-sm font-semibold ${issue.severity === 'warning' ? 'text-amber-900' : 'text-blue-900'}`}>
                          {issue.category.replace("-", " ")}
                        </h4>
                        <p className={`mt-1 text-sm ${issue.severity === 'warning' ? 'text-amber-800' : 'text-blue-800'}`}>
                          {issue.message}
                        </p>
                        {issue.affectedInstrumentIds.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {issue.affectedInstrumentIds.map(id => (
                              <span key={id} className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${issue.severity === 'warning' ? 'bg-amber-100 text-amber-700 ring-amber-600/20' : 'bg-blue-100 text-blue-700 ring-blue-600/20'}`}>
                                {id}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : instrumentsForTab.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No instruments found for this asset class.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  {cols.map((c, i) => (
                    <th 
                      key={i} 
                      className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap ${c.isGrey ? 'bg-gray-200/50 border-l border-gray-300' : ''}`}
                    >
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vals.map((val, rIdx) => (
                  <tr key={val.instrument.id} className="hover:bg-gray-50 transition-colors">
                    {cols.map((c, cIdx) => (
                      <td 
                        key={cIdx} 
                        className={`px-4 py-3 text-sm align-top whitespace-nowrap ${c.isGrey ? 'bg-gray-50/50 border-l border-gray-200' : 'text-gray-900'}`}
                      >
                        {c.render(val.instrument, val, rIdx)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
