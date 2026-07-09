import { useParams } from "react-router-dom";
import {
  ArrowLeftRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Gauge,
  Landmark,
  PieChart,
  PlusSquare,
  Scale,
  ShieldAlert,
  Users,
} from "lucide-react";
import {
  ModuleShell,
  type ModuleNavItem,
} from "../../components/shared/module-shell";
import { PlaceholderPage } from "../../components/shared/placeholder-page";
import { useInstrumentBook } from "../../context/instrument-book";
import { useWorkflow } from "../workflow/store";
import { DealBlotter } from "./pages/blotter";
import { CouponSchedules } from "./pages/coupon-schedules";
import { Settlements } from "./pages/settlements";
import { Counterparties } from "./pages/counterparties";
import { Approvals } from "./pages/approvals";
import { NewBooking } from "./pages/new-booking";
import { Exceptions } from "./pages/exceptions";
import { Reconciliation } from "./pages/reconciliation";
import { TreasuryCash } from "./pages/treasury-cash";
import { TraderPerformance } from "./pages/trader-performance";
import { CounterpartyExposure } from "./pages/counterparty-exposure";

export type DealsPage =
  | "blotter"
  | "new-booking"
  | "coupon-schedules"
  | "settlements"
  | "counterparties"
  | "approvals"
  | "exceptions"
  | "reconciliation"
  | "treasury-cash"
  | "trader-performance"
  | "counterparty-exposure";

/** Pages driven purely by the deal-slip workflow store rather than the
 * shared instrument book — gated on "any deal slip exists" instead of
 * "the instrument book has data" (see PageBody below). */
const WORKFLOW_DRIVEN_PAGES: DealsPage[] = [
  "blotter",
  "new-booking",
  "exceptions",
  "reconciliation",
  "treasury-cash",
  "trader-performance",
  "counterparty-exposure",
];

const NAV: ModuleNavItem[] = [
  {
    id: "blotter",
    label: "Trade Blotter",
    icon: <ClipboardList className="h-4 w-4" />,
    group: "trades",
  },
  {
    id: "new-booking",
    label: "New Booking",
    icon: <PlusSquare className="h-4 w-4" />,
    group: "trades",
  },
  {
    id: "coupon-schedules",
    label: "Coupon Schedules",
    icon: <CalendarClock className="h-4 w-4" />,
    group: "lifecycle",
  },
  {
    id: "settlements",
    label: "Settlements",
    icon: <ArrowLeftRight className="h-4 w-4" />,
    group: "lifecycle",
  },
  {
    id: "counterparties",
    label: "Counterparties",
    icon: <Users className="h-4 w-4" />,
    group: "static",
  },
  {
    id: "approvals",
    label: "Approvals",
    icon: <CheckCircle2 className="h-4 w-4" />,
    group: "controls",
  },
  {
    id: "exceptions",
    label: "Exceptions",
    icon: <ShieldAlert className="h-4 w-4" />,
    group: "controls",
  },
  {
    id: "reconciliation",
    label: "Reconciliation",
    icon: <Scale className="h-4 w-4" />,
    group: "finance",
  },
  {
    id: "treasury-cash",
    label: "Treasury & Cash",
    icon: <Landmark className="h-4 w-4" />,
    group: "finance",
  },
  {
    id: "trader-performance",
    label: "Trader Performance",
    icon: <Gauge className="h-4 w-4" />,
    group: "analytics",
  },
  {
    id: "counterparty-exposure",
    label: "Counterparty Exposure",
    icon: <PieChart className="h-4 w-4" />,
    group: "analytics",
  },
];

const GROUPS: Record<string, string> = {
  trades: "Trades",
  lifecycle: "Lifecycle",
  static: "Static Data",
  controls: "Controls",
  finance: "Finance",
  analytics: "Analytics",
};

function PageBody({ page }: { page: DealsPage }) {
  const book = useInstrumentBook();
  const { dealSlips } = useWorkflow();

  const isWorkflowDriven = WORKFLOW_DRIVEN_PAGES.includes(page);
  // Reconciliation is the odd one out: its whole point is to catch instrument
  // book entries that have NO deal slip (e.g. a bulk import), so it must stay
  // visible whenever there's a book to reconcile against, even with zero deal
  // slips — gating it on "a deal slip must exist first" would hide exactly
  // the break it's meant to surface.
  const gated =
    page === "reconciliation"
      ? dealSlips.length === 0 && !book.hasData
      : isWorkflowDriven
        ? page !== "blotter" && page !== "new-booking" && dealSlips.length === 0
        : !book.hasData;

  if (gated) {
    return (
      <PlaceholderPage
        eyebrow="Deal Capture"
        title={isWorkflowDriven ? "No Deal Slips Yet" : "Load A Portfolio Book First"}
        description={
          isWorkflowDriven
            ? "This view is derived entirely from the deal-slip pipeline — capture your first deal in New Booking to populate it."
            : "These lifecycle and control pages remain empty until you book a deal manually or upload a workbook in New Booking."
        }
        bullets={
          isWorkflowDriven
            ? [
                "Book a single instrument with the New Booking form.",
                "Walk it through review, approval, and settlement in the Trade Blotter.",
                "Return here once at least one deal slip exists.",
              ]
            : [
                "Book a single instrument with the New Booking form.",
                "Upload an .xlsx or .csv batch from New Booking.",
                "Return here after the shared portfolio book is populated.",
              ]
        }
      />
    );
  }

  switch (page) {
    case "blotter":
      return <DealBlotter />;
    case "new-booking":
      return <NewBooking />;
    case "coupon-schedules":
      return <CouponSchedules />;
    case "settlements":
      return <Settlements />;
    case "counterparties":
      return <Counterparties />;
    case "approvals":
      return <Approvals />;
    case "exceptions":
      return <Exceptions />;
    case "reconciliation":
      return <Reconciliation />;
    case "treasury-cash":
      return <TreasuryCash />;
    case "trader-performance":
      return <TraderPerformance />;
    case "counterparty-exposure":
      return <CounterpartyExposure />;
  }
}

export function DealsModule() {
  const { page: pageParam } = useParams<{ page?: string }>();
  const page = (pageParam ?? "blotter") as DealsPage;

  return (
    <ModuleShell
      moduleLabel="Deal Capture & Trade Management"
      basePath="/deal-capture"
      activePage={page}
      nav={NAV}
      groups={GROUPS}
    >
      <PageBody page={page} />
    </ModuleShell>
  );
}
