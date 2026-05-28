import { Navigate, Route, Routes } from "react-router-dom";
import { PersonaProvider } from "./context/persona";
import { RequireAuth } from "./components/shared/require-auth";
import { LandingPage } from "./pages/landing";
import { LoginPage } from "./pages/login";
import { ModulesPage } from "./pages/modules";
import { PortfolioModule } from "./features/portfolio";
import { IFRS9Module } from "./features/ifrs9";
import { ValuationModule } from "./features/valuation";
import { DurationRiskModule } from "./features/duration-risk";
import { MarketDataModule } from "./features/market-data";
import { DealsModule } from "./features/deals";
import { PerformanceModule } from "./features/performance";
import { AccountingModule } from "./features/accounting";
import { ReportingModule } from "./features/reporting";

export function App() {
  return (
    <PersonaProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Module hub */}
        <Route
          path="/modules"
          element={
            <RequireAuth>
              <ModulesPage />
            </RequireAuth>
          }
        />

        {/* Portfolio — all sub-pages via :page param */}
        <Route
          path="/portfolio"
          element={
            <RequireAuth>
              <PortfolioModule />
            </RequireAuth>
          }
        />
        <Route
          path="/portfolio/:page"
          element={
            <RequireAuth>
              <PortfolioModule />
            </RequireAuth>
          }
        />

        {/* IFRS 9 */}
        <Route
          path="/ifrs9"
          element={
            <RequireAuth>
              <IFRS9Module />
            </RequireAuth>
          }
        />
        <Route
          path="/ifrs9/:page"
          element={
            <RequireAuth>
              <IFRS9Module />
            </RequireAuth>
          }
        />

        {/* Valuation */}
        <Route
          path="/valuation"
          element={
            <RequireAuth>
              <ValuationModule />
            </RequireAuth>
          }
        />
        <Route
          path="/valuation/:page"
          element={
            <RequireAuth>
              <ValuationModule />
            </RequireAuth>
          }
        />
        <Route
          path="/valuation/asset/:id"
          element={
            <RequireAuth>
              <ValuationModule />
            </RequireAuth>
          }
        />

        {/* Duration & Risk */}
        <Route
          path="/duration-risk"
          element={
            <RequireAuth>
              <DurationRiskModule />
            </RequireAuth>
          }
        />
        <Route
          path="/duration-risk/:page"
          element={
            <RequireAuth>
              <DurationRiskModule />
            </RequireAuth>
          }
        />
        <Route
          path="/duration-risk/asset/:id"
          element={
            <RequireAuth>
              <DurationRiskModule />
            </RequireAuth>
          }
        />

        {/* Market Data & Trend Analytics */}
        <Route
          path="/market-data"
          element={
            <RequireAuth>
              <MarketDataModule />
            </RequireAuth>
          }
        />
        <Route
          path="/market-data/:page"
          element={
            <RequireAuth>
              <MarketDataModule />
            </RequireAuth>
          }
        />

        {/* Deal Capture & Trade Management */}
        <Route
          path="/deal-capture"
          element={
            <RequireAuth>
              <DealsModule />
            </RequireAuth>
          }
        />
        <Route
          path="/deal-capture/:page"
          element={
            <RequireAuth>
              <DealsModule />
            </RequireAuth>
          }
        />

        {/* Performance Analytics */}
        <Route
          path="/performance"
          element={
            <RequireAuth>
              <PerformanceModule />
            </RequireAuth>
          }
        />
        <Route
          path="/performance/:page"
          element={
            <RequireAuth>
              <PerformanceModule />
            </RequireAuth>
          }
        />

        {/* Accounting & GL */}
        <Route
          path="/accounting"
          element={
            <RequireAuth>
              <AccountingModule />
            </RequireAuth>
          }
        />
        <Route
          path="/accounting/:page"
          element={
            <RequireAuth>
              <AccountingModule />
            </RequireAuth>
          }
        />

        {/* Reporting */}
        <Route
          path="/reporting"
          element={
            <RequireAuth>
              <ReportingModule />
            </RequireAuth>
          }
        />
        <Route
          path="/reporting/:page"
          element={
            <RequireAuth>
              <ReportingModule />
            </RequireAuth>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PersonaProvider>
  );
}
