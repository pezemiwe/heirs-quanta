import { useNavigate, useParams } from "react-router-dom";
import { usePersona } from "../../context/persona";
import {
  LayoutDashboard,
  Briefcase,
  SlidersHorizontal,
  Calculator,
  BarChart3,
  FileText,
  Activity,
  Database,
  FileSpreadsheet,
} from "lucide-react";
import { Logo } from "../../components/shared/logo";
import { UserMenu } from "../../components/shared/user-menu";

import { ValuationProvider } from "./store";
import { ValuationDataManager } from "./pages/data-manager";
import { ValuationOverview } from "./pages/overview";
import { ValuationInventory } from "./pages/inventory";
import { ValuationAssumptions } from "./pages/assumptions";
import { ValuationDCFWorkbench } from "./pages/dcf-workbench";
import { ValuationComparables } from "./pages/comparables";
import { ValuationResults } from "./pages/results";
import { ValuationSensitivity } from "./pages/sensitivity";
import { ValuationReports } from "./pages/reports";

export type ValuationPage =
  | "data-manager"
  | "overview"
  | "inventory"
  | "assumptions"
  | "dcf"
  | "comparables"
  | "results"
  | "sensitivity"
  | "reports";

interface Props {
  persona: { name: string; role: string; avatar: string };
  onBack: () => void;
  onLogout: () => void;
}

const NAV: {
  id: ValuationPage;
  label: string;
  icon: React.ReactNode;
  group: string;
}[] = [
  {
    id: "data-manager",
    label: "Data Manager",
    icon: <Database className="h-4 w-4" />,
    group: "data",
  },
  {
    id: "overview",
    label: "Overview",
    icon: <LayoutDashboard className="h-4 w-4" />,
    group: "main",
  },
  {
    id: "inventory",
    label: "Asset Inventory",
    icon: <Briefcase className="h-4 w-4" />,
    group: "main",
  },
  {
    id: "assumptions",
    label: "Assumptions",
    icon: <SlidersHorizontal className="h-4 w-4" />,
    group: "main",
  },
  {
    id: "dcf",
    label: "DCF Workbench",
    icon: <Calculator className="h-4 w-4" />,
    group: "analytics",
  },
  {
    id: "comparables",
    label: "Comparables",
    icon: <BarChart3 className="h-4 w-4" />,
    group: "analytics",
  },
  {
    id: "results",
    label: "Results",
    icon: <FileSpreadsheet className="h-4 w-4" />,
    group: "analytics",
  },
  {
    id: "sensitivity",
    label: "Sensitivity",
    icon: <Activity className="h-4 w-4" />,
    group: "analytics",
  },
  {
    id: "reports",
    label: "Reports",
    icon: <FileText className="h-4 w-4" />,
    group: "operations",
  },
];

const GROUPS: Record<string, string> = {
  data: "Data",
  main: "Overview",
  analytics: "Analytics",
  operations: "Operations",
};

function PageBody({ page }: { page: ValuationPage }) {
  switch (page) {
    case "data-manager":
      return <ValuationDataManager />;
    case "overview":
      return <ValuationOverview />;
    case "inventory":
      return <ValuationInventory />;
    case "assumptions":
      return <ValuationAssumptions />;
    case "dcf":
      return <ValuationDCFWorkbench />;
    case "comparables":
      return <ValuationComparables />;
    case "results":
      return <ValuationResults />;
    case "sensitivity":
      return <ValuationSensitivity />;
    case "reports":
      return <ValuationReports />;
  }
}

export function ValuationModule() {
  const { persona, setPersona } = usePersona();
  const navigate = useNavigate();
  const { page: pageParam } = useParams<{ page?: string }>();
  const page = (pageParam ?? "overview") as ValuationPage;

  const grouped = Object.entries(GROUPS).map(([key, label]) => ({
    groupLabel: label,
    items: NAV.filter((n) => n.group === key),
  }));

  return (
    <ValuationProvider>
      <div className="flex h-screen flex-col bg-surface-muted font-sans text-dark-gray overflow-hidden">
        {/* top header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-5 z-10">
          <div className="flex items-center gap-3">
            <Logo collapsed />
            <div className="h-4 w-px bg-border" />
            <span className="text-xs font-semibold text-dark-gray">
              Valuation Engine
            </span>
          </div>

          <div className="flex items-center gap-3">
            <UserMenu
              persona={persona}
              onSwitchModules={() => navigate("/modules")}
              onLogout={() => {
                setPersona({ name: "", role: "", avatar: "" });
                navigate("/");
              }}
            />
          </div>
        </header>

        {/* body */}
        <div className="flex flex-1 overflow-hidden">
          <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface overflow-y-auto">
            <nav className="flex-1 py-4">
              {grouped.map(({ groupLabel, items }) => (
                <div key={groupLabel} className="mb-5">
                  <p className="mb-1 px-4 text-xs font-semibold uppercase tracking-widest text-gray-300">
                    {groupLabel}
                  </p>
                  {items.map((item) => {
                    const active = page === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(`/valuation/${item.id}`)}
                        className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                          active
                            ? "border-r-2 border-primary bg-pale-red font-medium text-primary"
                            : "text-gray-500 hover:bg-gray-50 hover:text-dark-gray"
                        }`}
                      >
                        <span
                          className={`shrink-0 ${active ? "text-primary" : ""}`}
                        >
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
          </aside>

          <main className="min-w-0 flex-1 overflow-y-auto">
            <PageBody page={page} />
          </main>
        </div>
      </div>
    </ValuationProvider>
  );
}
