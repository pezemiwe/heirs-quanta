import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePersona } from "../../context/persona";
import { TopNav } from "./components/top-nav";
import { Hero } from "./components/hero";
import { ModuleCard } from "./components/module-card";
import { Footer } from "./components/footer";
import { MODULES } from "./config";

export function ModulesPage() {
  const { setPersona } = usePersona();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);

  const handleLogout = () => {
    setPersona({ name: "", role: "", avatar: "" });
    navigate("/");
  };

  return (
    <div
      className="flex min-h-screen flex-col font-sans antialiased"
      style={{ background: "#F7F7F8" }}
    >
      <TopNav onLogout={handleLogout} />
      <Hero />

      <main className="flex-1 py-8 lg:py-10">
        <div className="mx-auto max-w-[1440px] px-4 lg:px-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {MODULES.map((m) => (
              <ModuleCard
                key={m.id}
                module={m}
                hovered={hovered === m.id}
                onHoverChange={setHovered}
              />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
