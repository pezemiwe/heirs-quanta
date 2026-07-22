import { useState, useMemo } from "react";
import { Download, Check } from "lucide-react";
import * as XLSX from "xlsx";
import { useValuation } from "../../valuation/store";
import { daysBetween, parseDate, placementScheduleMetricsAt, valueInstrument } from "../../valuation/engine";
import { Tabs } from "../../../components/shared/tabs";
import { fmtMoney, fmtPct, fmtDate, fmtNumber } from "../../valuation/utils";
import type { Instrument, ManualValueKey, Currency } from "../../valuation/engine/types";
import { PageHeader } from "../../../components/shared/page-header";

type TabId = "placements-ngn" | "tbills" | "placements-usd" | "equities" | "fgn-bonds" | "corp-bonds" | "state-bonds";

interface ValuationResult {
  instrument: Instrument;
  [key: string]: any; 
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
  {
    header: "Net/Gross",
    isGrey: true,
    render: (_, v) => <span className="text-gray-900">{v.placementScheduleMetrics?.basis ?? "Net"}</span>,
    exportValue: (_, v) => v.placementScheduleMetrics?.basis ?? "Net",
  },
];

const placementsUsdCols: ColDef[] = [
  { header: "S/N", render: (_, __, i) => i + 1, exportValue: (_, __, i) => i + 1 },
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
  { header: "THIS MONTH EXCHANGE GAIN/(LOSS) - NGN", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.fcyScheduleMetrics?.thisMonthUnrealisedFxGainLoss ?? 0} manualKey="thisMonthExchangeGainLoss" />, exportValue: (i, v) => v.fcyScheduleMetrics?.thisMonthUnrealisedFxGainLoss ?? 0 },
  { header: "TOTAL UNREALISED EXCHANGE GAIN/(LOSS) - NGN", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.fcyScheduleMetrics?.totalUnrealisedFxGainLoss ?? 0} manualKey="totalUnrealisedExchangeGainLoss" />, exportValue: (i, v) => v.fcyScheduleMetrics?.totalUnrealisedFxGainLoss ?? 0 },
  { header: "TOTAL CURRENT MARKET VALUE INCLUSIVE OF FX (NGN)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={(v.fcyScheduleMetrics?.totalCurrentMarketValueBase ?? 0)} manualKey="totalCurrentMarketValue" />, exportValue: (i, v) => (v.fcyScheduleMetrics?.totalCurrentMarketValueBase ?? 0) },
];

const tbillsCols: ColDef[] = [
  { header: "IDENTIFIER", render: (i) => i.id, exportValue: (i) => i.id },
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

const fgnBondsCols: ColDef[] = [
  { header: "IDENTIFIER", render: (i) => i.id, exportValue: (i) => i.id },
  { header: "MATURITY DATE", render: (i) => fmtDate(i.maturityDate), exportValue: (i) => i.maturityDate },
  { header: "FACE VALUE", render: (i) => fmtMoney(i.faceValue, "NGN"), exportValue: (i) => i.faceValue },
  { header: "TOTAL COUPON RECEIVED TO DATE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.couponReceivedToDateGross ?? 0} manualKey="couponReceivedToDateGross" />, exportValue: (i, v) => v.scheduleMetrics?.couponReceivedToDateGross ?? 0 },
  { header: "LAST MONTH ACCRUED INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.lastMonthAccruedInterest ?? 0} manualKey="lastMonthAccruedInterest" />, exportValue: (i, v) => v.scheduleMetrics?.lastMonthAccruedInterest ?? 0 },
  { header: "THIS MONTH INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.thisMonthInterest ?? 0} manualKey="interestIncomeThisMonth" />, exportValue: (i, v) => v.scheduleMetrics?.thisMonthInterest ?? 0 },
  { header: "TOTAL ACCRUED INTEREST", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.totalAccruedInterest ?? 0} manualKey="totalAccruedInterest" />, exportValue: (i, v) => v.scheduleMetrics?.totalAccruedInterest ?? 0 },
  { header: "TOTAL CURRENT MARKET VALUE", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.totalCurrentMarketValue ?? 0} manualKey="totalCurrentMarketValue" />, exportValue: (i, v) => v.scheduleMetrics?.totalCurrentMarketValue ?? 0 },
  { header: "CURRENT MARK TO MARKET GAIN/(LOSS)", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.currentMtmGainLoss ?? 0} manualKey="currentMtmGainLoss" />, exportValue: (i, v) => v.scheduleMetrics?.currentMtmGainLoss ?? 0 },
];

const corpBondsCols: ColDef[] = [
  { header: "IDENTIFIER", render: (i) => i.id, exportValue: (i) => i.id },
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
  { header: "MATURITY DATE", render: (i) => fmtDate(i.maturityDate), exportValue: (i) => i.maturityDate },
  { header: "FACE VALUE", render: (i) => fmtMoney(i.faceValue, "NGN"), exportValue: (i) => i.faceValue },
  { header: "COUPON RECEIVED TO DATE GROSS", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={v.scheduleMetrics?.couponReceivedToDateGross ?? 0} manualKey="couponReceivedToDateGross" />, exportValue: (i, v) => v.scheduleMetrics?.couponReceivedToDateGross ?? 0 },
  { header: "COUPON RECEIVED TO DATE NET", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={(v.scheduleMetrics?.couponReceivedToDateGross ?? 0) * 0.9} manualKey="couponReceivedToDateNet" />, exportValue: (i, v) => (v.scheduleMetrics?.couponReceivedToDateGross ?? 0) * 0.9 },
  { header: "PRINCIPAL REPAYMENT FOR THE MONTH", isGrey: true, render: (i, v) => <InlineDiff inst={i} computed={0 /* Not fully supported yet */} manualKey="principalRepaymentThisMonth" />, exportValue: (i, v) => 0 },
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

  const instrumentsForTab = useMemo(() => {
    return v.instruments.filter(i => {
      if (tab === "placements-ngn") return i.instrumentType === "Bank Placement" && i.currency === "NGN";
      if (tab === "placements-usd") return i.instrumentType === "Bank Placement" && i.currency === "USD";
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
      if (inst.instrumentType === "Bank Placement" && inst.currency === "NGN") {
        return {
          ...valuation,
          placementScheduleMetrics: placementScheduleMetricsAt(
            inst,
            new Date(`${v.assumptions.valuationDate}T00:00:00Z`),
          ),
        };
      }
      return valuation;
    });
  }, [instrumentsForTab, v.assumptions]);

  const cols = getCols(tab);

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    
    for (const t of tabs) {
      const typeInsts = v.instruments.filter(i => {
        if (t.id === "placements-ngn") return i.instrumentType === "Bank Placement" && i.currency === "NGN";
        if (t.id === "placements-usd") return i.instrumentType === "Bank Placement" && i.currency === "USD";
        if (t.id === "tbills") return i.instrumentType === "T-Bill";
        if (t.id === "equities") return i.instrumentType === "Equity";
        if (t.id === "fgn-bonds") return i.instrumentType === "FGN Bond";
        if (t.id === "corp-bonds") return i.instrumentType === "Corporate Bond";
        if (t.id === "state-bonds") return i.instrumentType === "State Bond";
        return false;
      });
      
      const typeVals = typeInsts.map(inst => {
        const valuation = valueInstrument(inst, v.assumptions);
        if (inst.instrumentType === "Bank Placement" && inst.currency === "NGN") {
          return {
            ...valuation,
            placementScheduleMetrics: placementScheduleMetricsAt(
              inst,
              new Date(`${v.assumptions.valuationDate}T00:00:00Z`),
            ),
          };
        }
        return valuation;
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
            tabs={tabs.map((t) => ({ value: t.id, label: t.label }))}
            value={tab}
            onChange={(id) => setTab(id as TabId)}
          />
        </div>

        <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {instrumentsForTab.length === 0 ? (
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
