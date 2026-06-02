import { useNavigate } from "react-router-dom";
import { usePersona } from "../../context/persona";
import { BrandingSide } from "./components/branding-side";
import { TopBar } from "./components/top-bar";
import { LoginForm } from "./components/login-form";
import type { SimplePersona } from "./types";

export function LoginPage() {
  const { setPersona } = usePersona();
  const navigate = useNavigate();
  const onLogin = (p: SimplePersona) => {
    setPersona(p);
    navigate("/modules");
  };
  const onBack = () => navigate("/");

  return (
    <div className="flex min-h-screen font-sans antialiased">
      <BrandingSide />

      {/* ── Right panel (form) ───────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-white">
        <TopBar onBack={onBack} />

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-12">
          <div className="w-full max-w-100">
            <LoginForm onLogin={onLogin} />
          </div>
        </div>
      </div>
    </div>
  );
}
