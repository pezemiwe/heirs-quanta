import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User, ChevronDown } from "lucide-react";
import { PERSONAS } from "../config";
import { buildPersonaFromEmail, findPersonaByRole } from "../utils";
import type { SimplePersona } from "../types";

interface LoginFormProps {
  onLogin: (p: SimplePersona) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [selectedPersona, setSelectedPersona] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePersonaChange = (value: string) => {
    setSelectedPersona(value);
    setError("");
    const p = PERSONAS.find((p) => p.role === value);
    if (p) {
      setEmail(p.email);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setLoading(true);
    // Simulate auth handshake
    setTimeout(() => {
      setLoading(false);
      const p = findPersonaByRole(selectedPersona);
      onLogin(
        p
          ? { name: p.name, role: p.role, avatar: p.avatar }
          : buildPersonaFromEmail(email),
      );
    }, 1400);
  };

  const activePersona = PERSONAS.find((p) => p.role === selectedPersona);

  return (
    <>
      {/* Heading */}
      <div className="mb-8">
        <h1 className="mb-1.5 text-2xl font-bold text-dark-gray">
          Welcome back
        </h1>
        <p className="text-sm text-dark-gray/50">
          Sign in to access the Heirs Quanta platform
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Persona selector */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-dark-gray/45">
            Quick access — select persona
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-gray/35" />
            <select
              value={selectedPersona}
              onChange={(e) => handlePersonaChange(e.target.value)}
              className="w-full appearance-none rounded-xl border border-border bg-surface-muted py-3 pl-10 pr-10 text-sm text-dark-gray outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="">— Select a user persona —</option>
              {PERSONAS.map((p) => (
                <option key={p.role} value={p.role}>
                  {p.name} · {p.role}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-gray/35" />
          </div>

          {/* Active persona access badge */}
          {activePersona && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-primary/15 bg-pale-red px-3 py-2">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white"
                style={{ background: "#CC0000" }}
              >
                {activePersona.avatar}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-dark-gray">
                  {activePersona.name}
                </p>
                <p className="truncate text-[10px] text-primary">
                  {activePersona.access}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-border" />
          <span className="text-[11px] font-medium text-dark-gray/30">
            or enter credentials
          </span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-dark-gray/45"
          >
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-gray/35" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@heirsholdings.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm text-dark-gray placeholder:text-dark-gray/30 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-wider text-dark-gray/45"
            >
              Password
            </label>
            <button
              type="button"
              className="text-[11px] font-medium text-primary hover:text-mid-red"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-gray/35" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter any password to continue"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-11 text-sm text-dark-gray placeholder:text-dark-gray/30 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-gray/35 hover:text-dark-gray/65"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="rounded-lg border border-danger/20 bg-red-50 px-4 py-2.5 text-xs font-medium text-danger">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="group relative w-full overflow-hidden rounded-xl py-3.5 text-sm font-bold text-white transition-all disabled:opacity-70"
          style={{
            background: loading
              ? "#CC0000"
              : "linear-gradient(135deg, #CC0000 0%, #800000 100%)",
            boxShadow: loading ? "none" : "0 4px 20px rgba(204,0,0,0.30)",
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Signing in…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Sign In
              <span className="transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </span>
          )}
        </button>
      </form>

      {/* Footer note */}
      <p className="mt-8 text-center text-[11px] text-dark-gray/30">
        Heirs Holdings Group · Confidential · Authorised users only
      </p>
    </>
  );
}
