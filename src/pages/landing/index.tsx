import { useNavigate } from "react-router-dom";
import { Navbar } from "./components/navbar";
import { HeroSection } from "./components/hero-section";
import { HeirsEcosystemSection } from "./components/heirs-ecosystem-section";
import { CityBanner } from "./components/city-banner";
import { ModulesSection } from "./components/modules-section";
import { CapabilitiesSection } from "./components/capabilities-section";
import { StatsBanner } from "./components/stats-banner";
import { ComplianceSection } from "./components/compliance-section";
import { CTASection } from "./components/cta-section";
import { Footer } from "./components/footer";

export function LandingPage() {
  const navigate = useNavigate();
  const onEnterShowcase = () => navigate("/login");
  return (
    <div className="min-h-screen bg-white font-sans text-dark-gray antialiased">
      <Navbar onEnter={onEnterShowcase} />
      <HeroSection onEnter={onEnterShowcase} />
      <HeirsEcosystemSection />
      <CityBanner />
      <ModulesSection />
      <CapabilitiesSection />
      <StatsBanner />
      <ComplianceSection />
      <CTASection onEnter={onEnterShowcase} />
      <Footer />
    </div>
  );
}
