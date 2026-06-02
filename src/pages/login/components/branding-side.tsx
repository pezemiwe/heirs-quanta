import { Check, Shield } from "lucide-react";

export function BrandingSide() {
  return (
    <div className="relative hidden overflow-hidden lg:flex lg:w-[58%]">
      {/* Background photo */}
      <img
        src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80"
        alt="Financial district"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(150deg, rgba(204,0,0,0.90) 0%, rgba(92,0,0,0.95) 100%)",
        }}
      />
      {/* Dot pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.18)]">
            <img
              src="/Heirs.png"
              alt="Heirs Holdings"
              className="h-9 w-9 object-contain"
              draggable={false}
            />
          </div>
          <div>
            <p className="text-base font-bold text-white">Heirs Quanta</p>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Financial Analytics
            </p>
          </div>
        </div>

        {/* Core message */}
        <div className="max-w-md">
          <p
            className="mb-3 text-xs font-bold uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Heirs Holdings Group
          </p>
          <h2 className="mb-5 text-3xl font-bold leading-snug text-white xl:text-4xl">
            Precision analytics for Africa's most ambitious financial group.
          </h2>
          <p
            className="mb-10 text-sm leading-relaxed"
            style={{ color: "rgba(255,255,255,0.58)" }}
          >
            Portfolio management, IFRS 9 & ECL computation, and fair-value
            valuation unified in one audit-ready platform.
          </p>

          <div className="space-y-3.5">
            {[
              "Real-time investment portfolio analytics & staging",
              "Automated IFRS 9 expected credit loss",
              "IFRS 13 fair-value valuation engine",
              "CBN regulatory reporting & audit trail",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  <Check className="h-3 w-3 text-white" />
                </span>
                <span
                  className="text-sm"
                  style={{ color: "rgba(255,255,255,0.72)" }}
                >
                  {feat}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom disclaimer */}
        <div
          className="flex items-center gap-2 text-xs"
          style={{ color: "rgba(255,255,255,0.28)" }}
        >
          <Shield className="h-3.5 w-3.5" />
          <span>
            Authorised users only · Heirs Holdings Group · Confidential
          </span>
        </div>
      </div>
    </div>
  );
}
