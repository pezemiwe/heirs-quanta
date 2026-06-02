import { PageHeader } from "./components/page-header";
import { Kpis } from "./components/kpis";
import { VarSection } from "./components/var-section";
import { Concentration } from "./components/concentration";
import { TopIssuers } from "./components/top-issuers";
import { StressTests } from "./components/stress-tests";
import { StageDistribution } from "./components/stage-distribution";

export function PortfolioRisk() {
  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <PageHeader />
      <Kpis />
      <VarSection />
      <Concentration />
      <TopIssuers />
      <StressTests />
      <StageDistribution />
    </div>
  );
}
