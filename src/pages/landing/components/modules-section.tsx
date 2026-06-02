import { Check, Layers } from "lucide-react";
import { useInView } from "../hooks";
import { MODULES } from "../data";

export const ModulesSection = () => {
  const { ref, inView } = useInView();
  return (
    <section id="modules" ref={ref} className="bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-6">
        <div
          className={`mb-16 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-pale-red px-3.5 py-1.5">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">
              Platform Modules
            </span>
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-dark-gray lg:text-4xl">
            Nine integrated modules.
            <br />
            One platform.
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-dark-gray/58">
            Each module is purpose-built for a distinct investment management
            workflow, yet seamlessly integrated data flows across modules
            without manual intervention.
          </p>
        </div>

        <div className="space-y-6">
          {MODULES.map((m, i) => (
            <div
              key={m.id}
              className={`overflow-hidden rounded-2xl border border-border bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)] transition-all duration-700 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div className="grid gap-0 lg:grid-cols-[1fr_1.4fr]">
                <div
                  className="flex flex-col justify-between p-8 lg:p-10"
                  style={{ background: m.bg }}
                >
                  <div>
                    <div className="mb-5 flex items-center gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm"
                        style={{ background: m.accent }}
                      >
                        {m.icon}
                      </div>
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-dark-gray">
                      {m.title}
                    </h3>
                    <p
                      className="mb-4 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: m.accent }}
                    >
                      {m.subtitle}
                    </p>
                    <p className="text-sm leading-relaxed text-dark-gray/60">
                      {m.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col justify-center border-t border-border p-8 lg:border-l lg:border-t-0 lg:p-10">
                  <p className="mb-5 text-xs font-semibold uppercase tracking-wider text-dark-gray/35">
                    Key capabilities
                  </p>
                  <ul className="space-y-3">
                    {m.capabilities.map((cap) => (
                      <li key={cap} className="flex items-start gap-3">
                        <span
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                          style={{ background: m.bg }}
                        >
                          <Check
                            className="h-3 w-3"
                            style={{ color: m.accent }}
                          />
                        </span>
                        <span className="text-sm text-dark-gray/70">{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
