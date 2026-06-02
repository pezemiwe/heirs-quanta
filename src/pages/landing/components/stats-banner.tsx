import { Activity, FileText, Layers, Shield } from "lucide-react";
import { useInView } from "../hooks";

const STATS = [
  {
    value: "9",
    label: "Integrated modules",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    value: "IFRS 9",
    label: "Regulatory standard",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    value: "CBN",
    label: "Compliant outputs",
    icon: <Shield className="h-5 w-5" />,
  },
  {
    value: "100%",
    label: "Audit-trail coverage",
    icon: <Activity className="h-5 w-5" />,
  },
];

export const StatsBanner = () => {
  const { ref, inView } = useInView();
  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-20"
      style={{
        background:
          "linear-gradient(135deg, #CC0000 0%, #800000 55%, #5C0000 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative mx-auto max-w-[1440px] px-4 lg:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center gap-3 text-center transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                {s.icon}
              </div>
              <p className="text-4xl font-black tracking-tight text-white lg:text-5xl">
                {s.value}
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.62)" }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
