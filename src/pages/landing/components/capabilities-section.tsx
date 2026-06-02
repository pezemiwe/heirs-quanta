import { Settings } from "lucide-react";
import { useInView } from "../hooks";
import { CAPABILITIES } from "../data";

export const CapabilitiesSection = () => {
  const { ref, inView } = useInView();
  return (
    <section
      id="capabilities"
      ref={ref}
      className="py-24 lg:py-32"
      style={{ background: "#F7F7F8" }}
    >
      <div className="mx-auto max-w-[1440px] px-4 lg:px-6">
        <div
          className={`mb-16 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-3.5 py-1.5">
            <Settings className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">
              Platform Capabilities
            </span>
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-dark-gray lg:text-4xl">
            Built for enterprise-grade financial work
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-dark-gray/58">
            Every capability has been designed around the operational and
            regulatory realities of a Nigerian financial services group.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c, i) => (
            <div
              key={c.title}
              className={`rounded-2xl border border-border bg-white p-7 shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-all duration-700 hover:border-primary/20 hover:shadow-[0_8px_24px_rgba(204,0,0,0.07)] ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${(i % 3) * 100}ms` }}
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-pale-red text-primary">
                {c.icon}
              </div>
              <h3 className="mb-2 text-sm font-semibold text-dark-gray">
                {c.title}
              </h3>
              <p className="text-sm leading-relaxed text-dark-gray/55">
                {c.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
