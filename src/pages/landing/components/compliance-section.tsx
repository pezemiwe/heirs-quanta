import { Check, Shield } from "lucide-react";
import { useInView } from "../hooks";
import { COMPLIANCE_ITEMS } from "../data";

export const ComplianceSection = () => {
  const { ref, inView } = useInView();
  return (
    <section id="compliance" ref={ref} className="bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-6">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div
            className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-pale-red px-3.5 py-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">
                Regulatory Compliance
              </span>
            </div>
            <h2 className="mb-5 text-3xl font-bold tracking-tight text-dark-gray lg:text-4xl">
              Engineered to meet every
              <br />
              regulatory obligation.
            </h2>
            <p className="mb-8 text-base leading-relaxed text-dark-gray/58">
              From CBN supervisory guidelines to IFRS standards, Heirs Quanta
              was designed with the regulatory framework baked in not bolted on.
            </p>
            <div className="overflow-hidden rounded-2xl border border-border">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80"
                alt="Financial analytics in action"
                className="h-48 w-full object-cover"
                loading="lazy"
              />
              <div className="bg-surface-muted px-5 py-4">
                <p className="text-xs leading-relaxed text-dark-gray/55">
                  Every computation is fully traceable from raw data ingestion
                  through model parameters to final ECL charge with a complete,
                  immutable audit record.
                </p>
              </div>
            </div>
          </div>

          <div
            className={`transition-all duration-700 delay-200 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <div className="space-y-3">
              {COMPLIANCE_ITEMS.map((item, i) => (
                <div
                  key={item.label}
                  className="flex items-start gap-4 rounded-xl border border-border bg-surface-muted p-5 transition-all hover:border-primary/20"
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pale-red">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-dark-gray">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-xs text-dark-gray/50">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
