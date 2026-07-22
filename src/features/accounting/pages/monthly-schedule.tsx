import { useState, useMemo } from "react";
import { Download, Check } from "lucide-react";
import * as XLSX from "xlsx";
import { useValuation } from "../../valuation/store";
import { useInstrumentBook } from "../../../context/instrument-book";
import { daysBetween, parseDate, placementScheduleMetricsAt, valueInstrument } from "../../valuation/engine";
import { Tabs } from "../../../components/shared/tabs";
import { fmtMoney, fmtPct, fmtDate, fmtNumber } from "../../valuation/utils";
import type { Instrument, ManualValueKey, Currency, ScheduleMetrics, FcyScheduleMetrics } from "../../valuation/engine/types";
import { computeScheduleMetrics, computeFcyScheduleMetrics } from "../../valuation/engine/schedule-metrics";
import { PageHeader } from "../../../components/shared/page-header";
import { Drawer } from "../../../components/shared/drawer";

type TabId = "placements-ngn" | "tbills" | "placements-usd" | "equities" | "fgn-bonds" | "corp-bonds" | "state-bonds" | "data-quality";

type ValuationResult = ReturnType<typeof valueInstrument> & {
  instrument: Instrument;
  scheduleMetrics?: ScheduleMetrics;
  fcyScheduleMetrics?: FcyScheduleMetrics;
  placementScheduleMetrics?: any;
  assumptions: any;
}

type ColDef = {
  header: string;
  isGrey?: boolean;
  render: (inst: Instrument, val: ValuationResult, index: number) => React.ReactNode;
  exportValue: (inst: Instrument, val: ValuationResult, index: number) => string | number;
};

function InlineDiff({ inst, computed, manualKey, currency = "NGN", isPct, isPlainNumber }: any) {
  const formattedComputed = isPlainNumber ? computed.toString() : isPct ? fmtPct(computed) : fmtMoney(computed, currency);
  return <span className="text-gray-900">{formattedComputed}</span>;
}


function PendingState({ message = "Requires market data input" }: { message?: string }) {
  return (
    <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded w-fit border border-amber-200">
      <span className="text-[10px] uppercase font-semibold">{message}</span>
    </div>
  );
}

const placementsNgnCols: ColDef[] = [
  { header: "S/No", render: (_, __, i) => i + 1, exportValue: (_, __, i) => i + 1 },
  { header: "Identifier", render: (i) => i.id, exportValue: (i) => i.id },
  { header: "Institution", render: (i) => i.issuer, exportValue: (i) => i.issuer },
  { header: "Principal", render: (i) => fmtMoney(i.purchasePrice, "NGN"), exportValue: (i) => i.purchasePrice },
  { header: "Rate", render: (i) => fmtPct(i.couponRate), exportValue: (i) => i.couponRate },
  { header: "Value date", render: (i) => fmtDate(i.purchaseDate), exportValue: (i) => i.purchaseDate },
  { header: "Maturity date", render: (i) => fmtDate(i.maturityDate), exportValue: (i) => i.maturityDate },
  {
    header: "Tenor",
    render: (i) => daysBetween(parseDate(i.purchaseDate), parseDate(i.maturityDate)),
    exportValue: (i) => daysBetween(parseDate(i.purchaseDate), parseDate(i.maturityDate)),
  },
  {
    header: "Interest Amount",
    isGrey: true,
    render: (i, v) => <InlineDiff inst={i} computed={v.placementScheduleMetrics?.totalInterest ?? 0} manualKey="interestReceivable" />,
    exportValue: (i, v) => v.placementScheduleMetrics?.totalInterest ?? 0,
  },
  {
    header: "Maturity value",
    isGrey: true,
    render: (i, v) => <span className="text-gray-900">{fmtMoney(v.placementScheduleMetrics?.maturityValue ?? i.faceValue, "NGN")}</span>,
    exportValue: (i, v) => v.placementScheduleMetrics?.maturityValue ?? i.faceValue,
  },
  {
    header: "This month Interest",
    isGrey: true,
    render: (i, v) => <InlineDiff inst={i} computed={v.placementScheduleMetrics?.thisMonthInterest ?? 0} manualKey="interestIncomeThisMonth" />,
    exportValue: (i, v) => v.placementScheduleMetrics?.thisMonthInterest ?? 0,
  },
  {
    header: "WHT (10%)",
    isGrey: true,
    render: (i, v) => <InlineDiff inst={i} computed={v.placementScheduleMetrics?.wht ?? 0} manualKey="wht" />,
    exportValue: (i, v) => v.placementScheduleMetrics?.wht ?? 0,
  },
  {
    header: "This month Interest (Net)",
    isGrey: true,
    render: (i, v) => <InlineDiff inst={i} computed={v.placementScheduleMetrics?.netIncome ?? 0} manualKey="netIncome" />,
    exportValue: (i, v) => v.placementScheduleMetrics?.netIncome ?? 0,
  },
  {
    header: "Opening Amortised Cost",
    isGrey: true,
    render: (i, v) => <span className="text-gray-900">{fmtMoney(v.placementScheduleMetrics?.openingAmortisedCost ?? i.purchasePrice, "NGN")}</span>,
    exportValue: (i, v) => v.placementScheduleMetrics?.openingAmortisedCost ?? i.purchasePrice,
  },
  {
    header: "Opening Accrued Income",
    isGrey: true,
    render: (i, v) => <span className="text-gray-900">{fmtMoney(v.placementScheduleMetrics?.openingAccruedInterest ?? 0, "NGN")}</span>,
    exportValue: (i, v) => v.placementScheduleMetrics?.openingAccruedInterest ?? 0,
  },
  {
    header: "Closing Amortised Cost",
    isGrey: true,
    render: (i, v) => <InlineDiff inst={i} computed={v.placementScheduleMetrics?.closingAmortisedCost ?? 0} manualKey="accruedInterestClosing" />,
    exportValue: (i, v) => v.placementScheduleMetrics?.closingAmortisedCost ?? 0,
  },
  {
    header: "Accrued Days",
    isGrey: true,
    render: (_, v) => <span className="text-gray-900">{v.placementScheduleMetrics?.accruedDays ?? 0}</span>,
    exportValue: (_, v) => v.placementScheduleMetrics?.accruedDays ?? 0,
  },
  {
    header: "Interest Accrued to Valuation Date",
    isGrey: true,
    render: (i, v) => <InlineDiff inst={i} computed={v.placementScheduleMetrics?.totalAccruedInterest ?? 0} manualKey="interestReceivable" />,
    exportValue: (i, v) => v.placementScheduleMetrics?.totalAccruedInterest ?? 0,
  },
];

const placementsUsdCols: ColDef[] = [
  { header: "S/No", render: (_, __, i) => i + 1, exportValue: (_, __, i) => i + 1 },
  { header: "Dealer", render: (i) => i.issuer, exportValue: (i) => i.issuer },
  { header: "Identifier", render: (i) => i.id, exportValue: (i) => i.id },
  { header: "Portfolio", render: (i) => i.portfolioBook ?? "N/A", exportValue: (i) => i.portfolioBook ?? "N/A" },
  { header: "Currency", render: (i) => i.currency, exportValue: (i) => i.currency },
  { header: "Asset class", render: (i) => i.instrumentType === "Fixed Deposit" ? "Fixed Term Deposit" : i.instrumentType, exportValue: (i) => i.instrumentType === "Fixed Deposit" ? "Fixed Term Deposit" : i.instrumentType },
  { header: "Principal USD ($)", render: (i) => fmtMoney(i.purchasePrice, "USD"), exportValue: (i) => i.purchasePrice },
  { header: "Exchange rate @ purchase", render: (i) => fmtNumber(i.purchaseFxRate ?? 1), exportValue: (i) => i.purchaseFxRate ?? 1 },
  { header: "Principal (N)", render: (i) => fmtMoney(i.purchasePrice * (i.purchaseFxRate ?? 1), "NGN"), exportValue: (i) => i.purchasePrice * (i.purchaseFxRate ?? 1) },
  { header: "Rate", render: (i) => fmtPct(i.couponRate), exportValue: (i) => i.couponRate },
  { header: "Value date", render: (i) => fmtDate(i.purchaseDate), exportValue: (i) => i.purchaseDate },
  { header: "Maturity date", render: (i) => fmtDate(i.maturityDate), exportValue: (i) => i.maturityDate },
  { header: "Tenor", render: (i) => daysBetween(parseDate(i.purchaseDate), parseDate(i.maturityDate)), exportValue: (i) => daysBetween(parseDate(i.purchaseDate), parseDate(i.maturityDate)) },
  { header: "Interest Receivable ($)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.placementScheduleMetrics?.totalInterest ?? 0} manualKey="interestReceivable" currency="USD" />, exportValue: (i, v) => v.placementScheduleMetrics?.totalInterest ?? 0 },
  { header: "Interest Receivable (N)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={(v.placementScheduleMetrics?.totalInterest ?? 0) * (i.purchaseFxRate ?? 1)} manualKey="interestReceivableNgn" />, exportValue: (i, v) => (v.placementScheduleMetrics?.totalInterest ?? 0) * (i.purchaseFxRate ?? 1) },
  { header: "Maturity Value ($)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={i.purchasePrice + (v.placementScheduleMetrics?.totalInterest ?? 0)} manualKey="maturityValueUsd" currency="USD" />, exportValue: (i, v) => i.purchasePrice + (v.placementScheduleMetrics?.totalInterest ?? 0) },
  { header: "Accrued Interest ($)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.placementScheduleMetrics?.totalAccruedInterest ?? 0} manualKey="accruedInterestClosingUsd" currency="USD" />, exportValue: (i, v) => v.placementScheduleMetrics?.totalAccruedInterest ?? 0 },
  { header: "Accrued Interest (N)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={(v.placementScheduleMetrics?.totalAccruedInterest ?? 0) * (i.purchaseFxRate ?? 1)} manualKey="accruedInterestClosingNgn" />, exportValue: (i, v) => (v.placementScheduleMetrics?.totalAccruedInterest ?? 0) * (i.purchaseFxRate ?? 1) },
  { header: "THIS MONTH", isGrey: true, render: (i, v) => <span className="text-gray-900">{v.scheduleMetrics?.daysEarnedInMonth ?? 0}</span>, exportValue: (i, v) => v.scheduleMetrics?.daysEarnedInMonth ?? 0 },
  { header: "This Month Interest Income (USD)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.placementScheduleMetrics?.thisMonthInterest ?? 0} manualKey="interestIncomeThisMonth" currency="USD" />, exportValue: (i, v) => v.placementScheduleMetrics?.thisMonthInterest ?? 0 },
  { header: "Opening Exchange rate", isGrey: true, render: (i) => <span className="text-gray-900">{fmtNumber(i.openingFxRate ?? i.purchaseFxRate ?? 1)}</span>, exportValue: (i) => i.openingFxRate ?? i.purchaseFxRate ?? 1 },
  { header: "Current Exchange rate", isGrey: true, render: (_, v) => <span className="text-gray-900">{fmtNumber(v.assumptions.fxUSD)}</span>, exportValue: (_, v) => v.assumptions.fxUSD },
  { header: "OPENING ACCRUED INCOME (USD)", isGrey: true, render: () => <PendingState message="Requires carryforward" />, exportValue: () => "Pending" },
  { header: "OPENING ACCRUED INCOME (NAIRA)", isGrey: true, render: () => <PendingState message="Requires carryforward" />, exportValue: () => "Pending" },
  { header: "OPENING AMORTISED COST (NAIRA) 2025", isGrey: true, render: () => <PendingState message="Requires carryforward" />, exportValue: () => "Pending" },
  { header: "OPENING AMORTISED COST (USD) 2025", isGrey: true, render: () => <PendingState message="Requires carryforward" />, exportValue: () => "Pending" },
  { header: "CLOSING ACCRUED INCOME (USD)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.placementScheduleMetrics?.totalAccruedInterest ?? 0} manualKey="closingAccruedIncomeUsd" currency="USD" />, exportValue: (i, v) => v.placementScheduleMetrics?.totalAccruedInterest ?? 0 },
  { header: "CLOSING ACCRUED INCOME (NAIRA)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={(v.placementScheduleMetrics?.totalAccruedInterest ?? 0) * v.assumptions.fxUSD} manualKey="closingAccruedIncomeNgn" />, exportValue: (i, v) => (v.placementScheduleMetrics?.totalAccruedInterest ?? 0) * v.assumptions.fxUSD },
  { header: "LAST MONTH EXCHANGE GAIN (NAIRA)", isGrey: true, render: () => <PendingState message="Requires carryforward" />, exportValue: () => "Pending" },
  { header: "THIS MONTH EXCHANGE GAIN /LOSS (NAIRA)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.fcyScheduleMetrics?.thisMonthAccruedFxGainLoss ?? 0} manualKey="thisMonthExchangeGainLoss" />, exportValue: (i, v) => v.fcyScheduleMetrics?.thisMonthAccruedFxGainLoss ?? 0 },
  { header: "TO POST EXCHANGE GAIN (NAIRA)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={(v.fcyScheduleMetrics?.thisMonthUnrealisedFxGainLoss ?? 0) - (v.fcyScheduleMetrics?.thisMonthAccruedFxGainLoss ?? 0)} manualKey="monthlyMtmToPost" />, exportValue: (i, v) => (v.fcyScheduleMetrics?.thisMonthUnrealisedFxGainLoss ?? 0) - (v.fcyScheduleMetrics?.thisMonthAccruedFxGainLoss ?? 0) },
  { header: "TOTAL UNREALISED EXCHANGE GAIN/LOSS JAN-DEC 2026", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.fcyScheduleMetrics?.totalUnrealisedFxGainLoss ?? 0} manualKey="totalUnrealisedExchangeGainLoss" />, exportValue: (i, v) => v.fcyScheduleMetrics?.totalUnrealisedFxGainLoss ?? 0 },
  { header: "TOTAL REALISED EXCHANGE GAIN/LOSS JAN-DEC 2026", isGrey: true, render: () => <PendingState message="Requires carryforward" />, exportValue: () => "Pending" },
  { header: "TOTAL CURRENT MARKET VALUE INCLUSIVE OF EXCHANGE GAIN/LOSS", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={(i.purchasePrice + (v.placementScheduleMetrics?.totalAccruedInterest ?? 0)) * v.assumptions.fxUSD} manualKey="totalCurrentMarketValue" />, exportValue: (i, v) => (i.purchasePrice + (v.placementScheduleMetrics?.totalAccruedInterest ?? 0)) * v.assumptions.fxUSD },
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
  { header: "PRICE ON PURCHASE", render: (i) => fmtNumber((i.purchasePrice / (i.faceValue || 1)) * 100, 2), exportValue: (i) => (i.purchasePrice / (i.faceValue || 1)) * 100 },
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
  { header: "Identifier", render: (i) => i.id, exportValue: (i) => i.id },
  { header: "Portfolio", render: (i) => i.portfolioBook ?? "N/A", exportValue: (i) => i.portfolioBook ?? "N/A" },
  { header: "COMPANY", render: (i) => i.issuer, exportValue: (i) => i.issuer },
  { header: "Purchase date", render: (i) => fmtDate(i.purchaseDate), exportValue: (i) => i.purchaseDate },
  { header: "Holdings", render: (i) => fmtNumber(i.quantity ?? 0), exportValue: (i) => i.quantity ?? 0 },
  { header: "Cost Price Unit", render: (i) => fmtNumber(i.costPriceUnit ?? 0), exportValue: (i) => i.costPriceUnit ?? 0 },
  { header: "COST", render: (i) => fmtMoney(i.faceValue, "NGN"), exportValue: (i) => i.faceValue },
  { header: "Closing Market Price at May 2026", render: (i) => fmtNumber((i.marketPrice ?? 0) / (i.quantity || 1)), exportValue: (i) => (i.marketPrice ?? 0) / (i.quantity || 1) },
  { header: "Current Market Value (Asset Leg)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={i.marketPrice ?? 0} manualKey="currentMarketValue" />, exportValue: (i) => i.marketPrice ?? 0 },
  { header: "Opening Gain/(Loss)Asset leg", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={0} manualKey="openingGainLoss" />, exportValue: (i, v) => 0 },
  { header: "Current MTM (Fair value Gain/(Loss)) Asset leg", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={(i.marketPrice ?? 0) - i.faceValue} manualKey="currentMtmGainLoss" />, exportValue: (i) => (i.marketPrice ?? 0) - i.faceValue },
  { header: "Fair value Gain/(Loss) Income Leg", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={0} manualKey="monthlyMtmToPost" />, exportValue: (i, v) => 0 },
  { header: "Gross Dividend Received for the month", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={0} manualKey="grossDividendReceived" />, exportValue: (i, v) => 0 },
  { header: "WHT", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={0} manualKey="wht" />, exportValue: (i, v) => 0 },
  { header: "Dividend Received for the month (Net of wht)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={0} manualKey="netDividendReceived" />, exportValue: (i, v) => 0 },
  { header: "YTD Dividend Received NET", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={0} manualKey="ytdDividendReceivedNet" />, exportValue: (i, v) => 0 },
];

const fgnBondsCols: ColDef[] = [
  { header: "S/N", render: (_, __, i) => i + 1, exportValue: (_, __, i) => i + 1 },
  { header: "IDENTIFIER", render: (i) => i.id, exportValue: (i) => i.id },
  { header: "DEALER", render: (i) => i.issuer, exportValue: (i) => i.issuer },
  { header: "PORTFOLIO", render: (i) => i.portfolioBook ?? "N/A", exportValue: (i) => i.portfolioBook ?? "N/A" },
  { header: "BOND NAME", render: (i) => i.name, exportValue: (i) => i.name },
  { header: "VALUE DATE", render: (i) => fmtDate(i.purchaseDate), exportValue: (i) => i.purchaseDate },
  { header: "MATURITY DATE", render: (i) => fmtDate(i.maturityDate), exportValue: (i) => i.maturityDate },
  { header: "COUPON RATE", render: (i) => fmtPct(i.couponRate), exportValue: (i) => i.couponRate },
  { header: "YIELD AT PURCHASE", render: (i) => fmtPct(i.uploadedManualValues?.yieldAtPurchase ?? 0), exportValue: (i) => i.uploadedManualValues?.yieldAtPurchase ?? 0 },
  { header: "UNITS", render: (i) => fmtNumber(i.quantity ?? 0), exportValue: (i) => i.quantity ?? 0 },
  { header: "COST AT PAR", render: (i) => fmtMoney(i.uploadedManualValues?.costAtPar ?? i.faceValue, "NGN"), exportValue: (i) => i.uploadedManualValues?.costAtPar ?? i.faceValue },
  { header: "FACE VALUE", render: (i) => fmtMoney(i.faceValue, "NGN"), exportValue: (i) => i.faceValue },
  { header: "DIRTY PRICE AT PURCHASE", render: (i) => fmtNumber(i.dirtyPriceAtPurchase ?? 0), exportValue: (i) => i.dirtyPriceAtPurchase ?? 0 },
  { header: "COST PRICE AT PURCHASE", render: (i) => fmtNumber(i.uploadedManualValues?.costPriceClean ?? 0), exportValue: (i) => i.uploadedManualValues?.costPriceClean ?? 0 },
  { header: "COST", render: (i) => fmtMoney(i.uploadedManualValues?.cost ?? i.purchasePrice, "NGN"), exportValue: (i) => i.uploadedManualValues?.cost ?? i.purchasePrice },
  { header: "PREMIUM /(DISCOUNT)", render: (i) => fmtMoney((i.uploadedManualValues?.cost ?? i.purchasePrice) - i.faceValue, "NGN"), exportValue: (i) => (i.uploadedManualValues?.cost ?? i.purchasePrice) - i.faceValue },
  { header: "CONSIDERATION AT PURCHASE", render: (i) => fmtMoney(i.uploadedManualValues?.considerationAtPurchase ?? i.purchasePrice, "NGN"), exportValue: (i) => i.uploadedManualValues?.considerationAtPurchase ?? i.purchasePrice },
  { header: "CONSIDERATION AT PURCHASE INCLUSIVE OF FMDQ AND SEC CHARGES", render: (i) => fmtMoney(i.uploadedManualValues?.considerationAtPurchase ?? i.purchasePrice, "NGN"), exportValue: (i) => i.uploadedManualValues?.considerationAtPurchase ?? i.purchasePrice },
  { header: "ACCRUED INTEREST PAID AT ACQUISITION", render: (i) => fmtMoney((i.uploadedManualValues?.considerationAtPurchase ?? i.purchasePrice) - (i.uploadedManualValues?.cost ?? i.purchasePrice), "NGN"), exportValue: (i) => (i.uploadedManualValues?.considerationAtPurchase ?? i.purchasePrice) - (i.uploadedManualValues?.cost ?? i.purchasePrice) },
  { header: "NUMBER OF COUPONS RECEIVED", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={Math.round((v.scheduleMetrics?.couponReceivedToDateGross ?? 0) / (i.faceValue * (i.couponRate ?? 0) / (i.couponFrequency === "Semi" ? 2 : i.couponFrequency === "Quarterly" ? 4 : i.couponFrequency === "Monthly" ? 12 : 1)))} manualKey="numberOfCouponsReceived" isPlainNumber={true} />, exportValue: (i, v) => Math.round((v.scheduleMetrics?.couponReceivedToDateGross ?? 0) / (i.faceValue * (i.couponRate ?? 0) / (i.couponFrequency === "Semi" ? 2 : i.couponFrequency === "Quarterly" ? 4 : i.couponFrequency === "Monthly" ? 12 : 1))) },
  { header: "TOTAL COUPON RECEIVED TO DATE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.couponReceivedToDateGross ?? 0} manualKey="couponReceivedToDateGross" />, exportValue: (i, v) => v.scheduleMetrics?.couponReceivedToDateGross ?? 0 },
  { header: "LAST MONTH ACCRUED INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.lastMonthAccruedInterest ?? 0} manualKey="lastMonthAccruedInterest" />, exportValue: (i, v) => v.scheduleMetrics?.lastMonthAccruedInterest ?? 0 },
  { header: "EFFECTIVE INTEREST RATE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.effectiveInterestRate ?? 0} manualKey="effectiveInterestRate" isPct />, exportValue: (i, v) => v.scheduleMetrics?.effectiveInterestRate ?? 0 },
  { header: "DAYS EARNED IN THE MONTH", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.daysEarnedInMonth ?? 0} manualKey="daysEarnedInMonth" />, exportValue: (i, v) => v.scheduleMetrics?.daysEarnedInMonth ?? 0 },
  { header: "THIS MONTH INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.thisMonthInterest ?? 0} manualKey="interestIncomeThisMonth" />, exportValue: (i, v) => v.scheduleMetrics?.thisMonthInterest ?? 0 },
  { header: "TOTAL ACCRUED INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.totalAccruedInterest ?? 0} manualKey="totalAccruedInterest" />, exportValue: (i, v) => v.scheduleMetrics?.totalAccruedInterest ?? 0 },
  { header: "LAST COUPON DATE", isGrey: true, render: (i, v) => v.scheduleMetrics?.lastCouponDate ?? "N/A", exportValue: (i, v) => v.scheduleMetrics?.lastCouponDate ?? "N/A" },
  { header: "NEXT COUPON DATE", isGrey: true, render: (i, v) => v.scheduleMetrics?.nextCouponDate ?? "N/A", exportValue: (i, v) => v.scheduleMetrics?.nextCouponDate ?? "N/A" },
  { header: "LAST MONTH MARKET VALUE (CLEAN)", isGrey: true, render: (i) => <InlineDiff inst={i} computed={i.uploadedManualValues?.lastMonthMarketValueClean ?? 0} manualKey="lastMonthMarketValueClean" />, exportValue: (i) => i.uploadedManualValues?.lastMonthMarketValueClean ?? 0 },
  { header: "LAST MONTH MARKET YIELD", isGrey: true, render: (i) => <InlineDiff inst={i} computed={i.uploadedManualValues?.lastMonthMarketYield ?? 0} manualKey="lastMonthMarketYield" isPct={true} />, exportValue: (i) => i.uploadedManualValues?.lastMonthMarketYield ?? 0 },
  { header: "LAST MONTH MARKET PRICE", isGrey: true, render: (i) => <InlineDiff inst={i} computed={i.uploadedManualValues?.lastMonthMarketPrice ?? 0} manualKey="lastMonthMarketPrice" />, exportValue: (i) => i.uploadedManualValues?.lastMonthMarketPrice ?? 0 },
  { header: "CURRENT MARKET YIELD", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.marketYieldUsed} manualKey="currentMarketYield" isPct={true} />, exportValue: (i, v) => v.marketYieldUsed },
  { header: "CURRENT MARKET PRICE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={(v.cleanFairValue / (i.faceValue || 1)) * 100} manualKey="currentMarketPrice" />, exportValue: (i, v) => (v.cleanFairValue / (i.faceValue || 1)) * 100 },
  { header: "ACTUAL CURRENT MARKET VALUE (CLEAN)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.cleanFairValue} manualKey="actualCurrentMarketValueClean" />, exportValue: (i, v) => v.cleanFairValue },
  { header: "TOTAL CURRENT MARKET VALUE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.totalCurrentMarketValue ?? 0} manualKey="totalCurrentMarketValue" />, exportValue: (i, v) => v.scheduleMetrics?.totalCurrentMarketValue ?? 0 },
  { header: "CURRENT MARK TO MARKET GAIN /(LOSS)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.currentMtmGainLoss ?? 0} manualKey="currentMtmGainLoss" />, exportValue: (i, v) => v.scheduleMetrics?.currentMtmGainLoss ?? 0 },
  { header: "MARK TO MARKET TO POST THIS MONTH", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.monthlyMtmToPost ?? 0} manualKey="monthlyMtmToPost" />, exportValue: (i, v) => v.scheduleMetrics?.monthlyMtmToPost ?? 0 },
];

const corpBondsCols: ColDef[] = [
  { header: "S/N", render: (_, __, i) => i + 1, exportValue: (_, __, i) => i + 1 },
  { header: "IDENTIFIER", render: (i) => i.id, exportValue: (i) => i.id },
  { header: "DEALER", render: (i) => i.issuer, exportValue: (i) => i.issuer },
  { header: "PORTFOLIO", render: (i) => i.portfolioBook ?? "N/A", exportValue: (i) => i.portfolioBook ?? "N/A" },
  { header: "BOND NAME", render: (i) => i.name, exportValue: (i) => i.name },
  { header: "VALUE DATE", render: (i) => fmtDate(i.purchaseDate), exportValue: (i) => i.purchaseDate },
  { header: "MATURITY DATE", render: (i) => fmtDate(i.maturityDate), exportValue: (i) => i.maturityDate },
  { header: "COUPON RATE", render: (i) => fmtPct(i.couponRate), exportValue: (i) => i.couponRate },
  { header: "YIELD AT PURCHASE", render: (i) => fmtPct(i.uploadedManualValues?.yieldAtPurchase ?? 0), exportValue: (i) => i.uploadedManualValues?.yieldAtPurchase ?? 0 },
  { header: "UNITS", render: (i) => fmtNumber(i.quantity ?? 0), exportValue: (i) => i.quantity ?? 0 },
  { header: "COST AT PAR", render: (i) => fmtMoney(i.uploadedManualValues?.costAtPar ?? i.faceValue, "NGN"), exportValue: (i) => i.uploadedManualValues?.costAtPar ?? i.faceValue },
  { header: "FACE VALUE", render: (i) => fmtMoney(i.faceValue, "NGN"), exportValue: (i) => i.faceValue },
  { header: "DIRTY PRICE AT PURCHASE", render: (i) => fmtNumber(i.dirtyPriceAtPurchase ?? 0), exportValue: (i) => i.dirtyPriceAtPurchase ?? 0 },
  { header: "COST PRICE AT PURCHASE", render: (i) => fmtNumber(i.uploadedManualValues?.costPriceClean ?? 0), exportValue: (i) => i.uploadedManualValues?.costPriceClean ?? 0 },
  { header: "COST", render: (i) => fmtMoney(i.uploadedManualValues?.cost ?? i.purchasePrice, "NGN"), exportValue: (i) => i.uploadedManualValues?.cost ?? i.purchasePrice },
  { header: "CONSIDERATION AT PURCHASE", render: (i) => fmtMoney(i.uploadedManualValues?.considerationAtPurchase ?? i.purchasePrice, "NGN"), exportValue: (i) => i.uploadedManualValues?.considerationAtPurchase ?? i.purchasePrice },
  { header: "NUMBER OF COUPONS RECEIVED", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={Math.round((v.scheduleMetrics?.couponReceivedToDateGross ?? 0) / (i.faceValue * (i.couponRate ?? 0) / (i.couponFrequency === "Semi" ? 2 : i.couponFrequency === "Quarterly" ? 4 : i.couponFrequency === "Monthly" ? 12 : 1)))} manualKey="numberOfCouponsReceived" isPlainNumber={true} />, exportValue: (i, v) => Math.round((v.scheduleMetrics?.couponReceivedToDateGross ?? 0) / (i.faceValue * (i.couponRate ?? 0) / (i.couponFrequency === "Semi" ? 2 : i.couponFrequency === "Quarterly" ? 4 : i.couponFrequency === "Monthly" ? 12 : 1))) },
  { header: "TOTAL COUPON RECEIVED TO DATE NET", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={(v.scheduleMetrics?.couponReceivedToDateGross ?? 0) * 0.9} manualKey="couponReceivedToDateNet" />, exportValue: (i, v) => (v.scheduleMetrics?.couponReceivedToDateGross ?? 0) * 0.9 },
  { header: "TOTAL COUPON GROSS", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.couponReceivedToDateGross ?? 0} manualKey="couponReceivedToDateGross" />, exportValue: (i, v) => v.scheduleMetrics?.couponReceivedToDateGross ?? 0 },
  { header: "LAST MONTH ACCRUED INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.lastMonthAccruedInterest ?? 0} manualKey="lastMonthAccruedInterest" />, exportValue: (i, v) => v.scheduleMetrics?.lastMonthAccruedInterest ?? 0 },
  { header: "THIS MONTH INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.thisMonthInterest ?? 0} manualKey="interestIncomeThisMonth" />, exportValue: (i, v) => v.scheduleMetrics?.thisMonthInterest ?? 0 },
  { header: "TOTAL ACCRUED INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.totalAccruedInterest ?? 0} manualKey="totalAccruedInterest" />, exportValue: (i, v) => v.scheduleMetrics?.totalAccruedInterest ?? 0 },
  { header: "LAST COUPON DATE", isGrey: true, render: (i, v) => v.scheduleMetrics?.lastCouponDate ?? "N/A", exportValue: (i, v) => v.scheduleMetrics?.lastCouponDate ?? "N/A" },
  { header: "NEXT COUPON DATE", isGrey: true, render: (i, v) => v.scheduleMetrics?.nextCouponDate ?? "N/A", exportValue: (i, v) => v.scheduleMetrics?.nextCouponDate ?? "N/A" },
  { header: "TOTAL CURRENT MARKET VALUE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.totalCurrentMarketValue ?? 0} manualKey="totalCurrentMarketValue" />, exportValue: (i, v) => v.scheduleMetrics?.totalCurrentMarketValue ?? 0 },
];

const stateBondsCols: ColDef[] = [
  { header: "S/N", render: (_, __, i) => i + 1, exportValue: (_, __, i) => i + 1 },
  { header: "IDENTIFIER/DEAL ID", render: (i) => i.id, exportValue: (i) => i.id },
  { header: "INVESTMENT FIRM", render: (i) => i.issuer, exportValue: (i) => i.issuer },
  { header: "FUND TYPE", render: (i) => i.portfolioBook ?? "N/A", exportValue: (i) => i.portfolioBook ?? "N/A" },
  { header: "BOND NAME", render: (i) => i.name, exportValue: (i) => i.name },
  { header: "VALUE DATE", render: (i) => fmtDate(i.purchaseDate), exportValue: (i) => i.purchaseDate },
  { header: "MATURITY DATE", render: (i) => fmtDate(i.maturityDate), exportValue: (i) => i.maturityDate },
  { header: "COUPON RATE", render: (i) => fmtPct(i.couponRate), exportValue: (i) => i.couponRate },
  { header: "YIELD AT PURCHASE", render: (i) => fmtPct(i.uploadedManualValues?.yieldAtPurchase ?? 0), exportValue: (i) => i.uploadedManualValues?.yieldAtPurchase ?? 0 },
  { header: "UNITS HOLDING", render: (i) => fmtNumber(i.quantity ?? 0), exportValue: (i) => i.quantity ?? 0 },
  { header: "COST AT PAR", render: (i) => fmtMoney(i.uploadedManualValues?.costAtPar ?? i.faceValue, "NGN"), exportValue: (i) => i.uploadedManualValues?.costAtPar ?? i.faceValue },
  { header: "FACE VALUE", render: (i) => fmtMoney(i.faceValue, "NGN"), exportValue: (i) => i.faceValue },
  { header: "DIRTY PRICE", render: (i) => fmtNumber(i.dirtyPriceAtPurchase ?? 0), exportValue: (i) => i.dirtyPriceAtPurchase ?? 0 },
  { header: "COST PRICE/CLEAN PRICE", render: (i) => fmtNumber(i.uploadedManualValues?.costPriceClean ?? 0), exportValue: (i) => i.uploadedManualValues?.costPriceClean ?? 0 },
  { header: "COST", render: (i) => fmtMoney(i.uploadedManualValues?.cost ?? i.purchasePrice, "NGN"), exportValue: (i) => i.uploadedManualValues?.cost ?? i.purchasePrice },
  { header: "CONSIDERATION AT PURCHASE", render: (i) => fmtMoney(i.uploadedManualValues?.considerationAtPurchase ?? i.purchasePrice, "NGN"), exportValue: (i) => i.uploadedManualValues?.considerationAtPurchase ?? i.purchasePrice },
  { header: "PRINCIPAL REPAYMENT", render: (i) => fmtMoney(i.uploadedManualValues?.principalRepaymentToDate ?? 0, "NGN"), exportValue: (i) => i.uploadedManualValues?.principalRepaymentToDate ?? 0 },
  { header: "NUMBER OF COUPONS RECEIVED", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={Math.round((v.scheduleMetrics?.couponReceivedToDateGross ?? 0) / (i.faceValue * (i.couponRate ?? 0) / (i.couponFrequency === "Semi" ? 2 : i.couponFrequency === "Quarterly" ? 4 : i.couponFrequency === "Monthly" ? 12 : 1)))} manualKey="numberOfCouponsReceived" isPlainNumber={true} />, exportValue: (i, v) => Math.round((v.scheduleMetrics?.couponReceivedToDateGross ?? 0) / (i.faceValue * (i.couponRate ?? 0) / (i.couponFrequency === "Semi" ? 2 : i.couponFrequency === "Quarterly" ? 4 : i.couponFrequency === "Monthly" ? 12 : 1))) },
  { header: "TOTAL COUPON RECEIVED TO DATE (GROSS)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.couponReceivedToDateGross ?? 0} manualKey="couponReceivedToDateGross" />, exportValue: (i, v) => v.scheduleMetrics?.couponReceivedToDateGross ?? 0 },
  { header: "TOTAL COUPON RECEIVED TO DATE (NET)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={(v.scheduleMetrics?.couponReceivedToDateGross ?? 0) * 0.9} manualKey="couponReceivedToDateNet" />, exportValue: (i, v) => (v.scheduleMetrics?.couponReceivedToDateGross ?? 0) * 0.9 },
  { header: "PRINCIPAL REPAYMENT FOR THE MONTH", isGrey: true, render: (i) => <InlineDiff inst={i} computed={i.uploadedManualValues?.principalRepaymentThisMonth ?? 0} manualKey="principalRepaymentThisMonth" />, exportValue: (i) => i.uploadedManualValues?.principalRepaymentThisMonth ?? 0 },
  { header: "LAST MONTH ACCRUED INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.lastMonthAccruedInterest ?? 0} manualKey="lastMonthAccruedInterest" />, exportValue: (i, v) => v.scheduleMetrics?.lastMonthAccruedInterest ?? 0 },
  { header: "THIS MONTH INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.thisMonthInterest ?? 0} manualKey="interestIncomeThisMonth" />, exportValue: (i, v) => v.scheduleMetrics?.thisMonthInterest ?? 0 },
  { header: "GROSS COUPON", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.thisMonthInterest ?? 0} manualKey="grossCoupon" />, exportValue: (i, v) => v.scheduleMetrics?.thisMonthInterest ?? 0 },
  { header: "CHARGES WHT", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={(v.scheduleMetrics?.thisMonthInterest ?? 0) * 0.1} manualKey="wht" />, exportValue: (i, v) => (v.scheduleMetrics?.thisMonthInterest ?? 0) * 0.1 },
  { header: "NET COUPON", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={(v.scheduleMetrics?.thisMonthInterest ?? 0) * 0.9} manualKey="netCoupon" />, exportValue: (i, v) => (v.scheduleMetrics?.thisMonthInterest ?? 0) * 0.9 },
  { header: "TOTAL ACCRUED INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.totalAccruedInterest ?? 0} manualKey="totalAccruedInterest" />, exportValue: (i, v) => v.scheduleMetrics?.totalAccruedInterest ?? 0 },
  { header: "LAST COUPON DATE", isGrey: true, render: (i, v) => v.scheduleMetrics?.lastCouponDate ?? "N/A", exportValue: (i, v) => v.scheduleMetrics?.lastCouponDate ?? "N/A" },
  { header: "NEXT COUPON DATE", isGrey: true, render: (i, v) => v.scheduleMetrics?.nextCouponDate ?? "N/A", exportValue: (i, v) => v.scheduleMetrics?.nextCouponDate ?? "N/A" },
  { header: "TOTAL CURRENT MARKET VALUE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.totalCurrentMarketValue ?? 0} manualKey="totalCurrentMarketValue" />, exportValue: (i, v) => v.scheduleMetrics?.totalCurrentMarketValue ?? 0 },
];

const getCols = (tab: TabId): ColDef[] => {
  switch (tab) {
    case "placements-ngn": return placementsNgnCols;
    case "placements-usd": return placementsUsdCols;
    case "tbills": return tbillsCols;
    case "equities": return equitiesCols;
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
  const [selectedRow, setSelectedRow] = useState<{ val: ValuationResult, index: number } | null>(null);
  
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
      const valuation = valueInstrument(inst, v.assumptions);
      return {
        ...valuation,
        instrument: inst,
        scheduleMetrics: computeScheduleMetrics(inst, valuation, v.assumptions),
        fcyScheduleMetrics: inst.currency !== "NGN" ? computeFcyScheduleMetrics(inst, valuation, v.assumptions) : undefined,
        placementScheduleMetrics: (inst.instrumentType === "Bank Placement" || inst.instrumentType === "Fixed Deposit") ? placementScheduleMetricsAt(inst, new Date(`${v.assumptions.valuationDate}T00:00:00Z`)) : undefined,
        assumptions: v.assumptions
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
      
      const typeVals = typeInsts.map(inst => {
        const valuation = valueInstrument(inst, v.assumptions);
        return {
          ...valuation,
          instrument: inst,
          scheduleMetrics: computeScheduleMetrics(inst, valuation, v.assumptions),
          fcyScheduleMetrics: inst.currency !== "NGN" ? computeFcyScheduleMetrics(inst, valuation, v.assumptions) : undefined,
          placementScheduleMetrics: (inst.instrumentType === "Bank Placement" || inst.instrumentType === "Fixed Deposit") ? placementScheduleMetricsAt(inst, new Date(`${v.assumptions.valuationDate}T00:00:00Z`)) : undefined
        };
      });
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
          tab === "placements-usd" && (
            <div 
              key="fx" 
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md shadow-sm"
              title="Live FX Rate from CBN via data provider"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="font-medium">Live FX (CBN):</span>
              <span>$1 = ₦{fmtNumber(v.assumptions.fxUSD, 2)}</span>
            </div>
          ),
          <button 
            key="export"
            onClick={handleExport}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
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
                  <tr 
                    key={val.instrument.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedRow({ val, index: rIdx })}
                  >
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
      
      <Drawer
        isOpen={selectedRow !== null}
        onClose={() => setSelectedRow(null)}
        title="Row Details"
        size="lg"
      >
        {selectedRow && (
          <div className="space-y-4">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
              {cols.map((c, i) => (
                <div key={i} className="col-span-1">
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {c.header}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 break-words font-medium">
                    {c.render(selectedRow.val.instrument, selectedRow.val, selectedRow.index)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Drawer>
    </div>
  );
}
