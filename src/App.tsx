import { Navigate, Route, Routes } from "react-router-dom";
import { PersonaProvider } from "./context/persona";
import { RequireAuth } from "./components/shared/require-auth";
import { LandingPage } from "./pages/landing";
import { LoginPage } from "./pages/login";
import { ModulesPage } from "./pages/modules";
import { PortfolioModule } from "./features/portfolio";
import { IFRS9Module } from "./features/ifrs9";
import { ValuationModule } from "./features/valuation";

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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PersonaProvider>
  );
}
