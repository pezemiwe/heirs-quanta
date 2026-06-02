import { ArrowRight, LayoutDashboard } from "lucide-react";
import { useInView } from "../hooks";

interface Props {
  onEnter: () => void;
}

export const CTASection = ({ onEnter }: Props) => {
  const { ref, inView } = useInView();
  return (
    <section
      ref={ref}
      className="py-24 lg:py-32"
      style={{ background: "#F7F7F8" }}
    >
      <div className="mx-auto max-w-4xl px-5 text-center lg:px-8">
        <div
          className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="overflow-hidden rounded-3xl border border-border bg-white px-10 py-16 shadow-[0_8px_40px_rgba(0,0,0,0.07)] sm:px-16">
            <div className="mx-auto mb-8 h-1 w-16 rounded-full bg-primary" />

            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-pale-red px-3.5 py-1.5">
              <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">
                Ready to get started?
              </span>
            </div>

            <h2 className="mb-4 text-3xl font-bold tracking-tight text-dark-gray sm:text-4xl">
              Your financial platform is ready.
            </h2>
            <p className="mx-auto mb-10 max-w-lg text-base leading-relaxed text-dark-gray/58">
              Access Portfolio Management, IFRS 9 & ECL computation, and
              Valuation tools integrated in one secure, audit-ready environment.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={onEnter}
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-white transition-all hover:bg-mid-red"
                style={{ boxShadow: "0 4px 20px rgba(204,0,0,0.28)" }}
              >
                Access Platform
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>

            <p className="mt-8 text-xs text-dark-gray/35">
              Heirs Holdings Group · Confidential
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
