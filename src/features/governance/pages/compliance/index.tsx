import { useState } from "react";
import { usePersona } from "../../../../context/persona";
import { COMPLIANCE_ITEMS } from "./config";
import { PageHeader } from "./components/page-header";
import { Stats } from "./components/stats";
import { HealthCard } from "./components/health-card";
import { Checklist } from "./components/checklist";

export function ComplianceMonitoring() {
  const { persona } = usePersona();
  const [catFilter, setCatFilter] = useState("All");

  const displayed =
    catFilter === "All"
      ? COMPLIANCE_ITEMS
      : COMPLIANCE_ITEMS.filter((c) => c.category === catFilter);

  const compliantCount = COMPLIANCE_ITEMS.filter(
    (c) => c.status === "compliant",
  ).length;
  const exceptionCount = COMPLIANCE_ITEMS.filter(
    (c) => c.status === "exception",
  ).length;
  const pendingCount = COMPLIANCE_ITEMS.filter(
    (c) => c.status === "pending",
  ).length;
  const breachCount = COMPLIANCE_ITEMS.filter(
    (c) => c.status === "breach",
  ).length;
  const score = Math.round((compliantCount / COMPLIANCE_ITEMS.length) * 100);

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <PageHeader />
      <Stats
        score={score}
        compliantCount={compliantCount}
        exceptionCount={exceptionCount}
        pendingCount={pendingCount}
      />
      <HealthCard
        score={score}
        compliantCount={compliantCount}
        exceptionCount={exceptionCount}
        pendingCount={pendingCount}
        breachCount={breachCount}
        catFilter={catFilter}
        setCatFilter={setCatFilter}
      />
      <Checklist
        displayed={displayed}
        catFilter={catFilter}
        setCatFilter={setCatFilter}
      />
    </div>
  );
}
