import { ArrowRight, Check, FileText, Shield, TrendingUp } from "lucide-react";
import { useInView } from "../hooks";
import { PlatformMockup } from "./platform-mockup";

interface Props {
  onEnter: () => void;
}

export const HeroSection = ({ onEnter }: Props) => {
  const { ref, inView } = useInView();
  return (
    <section
      ref={ref}
      id="hero"
      className="relative overflow-hidden pt-16"
      style={{
        background:
          "linear-gradient(135deg, #08081A 0%, #110407 55%, #06080F 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div
        className="pointer-events-none absolute -top-60 -left-60 h-[700px] w-[700px] rounded-full opacity-25"
        style={{
          background: "radial-gradient(circle, #CC0000, transparent 70%)",
          filter: "blur(100px)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, #1E3A5F, transparent 70%)",
          filter: "blur(80px)",
          opacity: 0.12,
        }}
      />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1440 700"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        aria-hidden="true"
      >
        {[
          35, 55, 45, 70, 60, 80, 65, 90, 75, 55, 85, 70, 95, 60, 80, 72, 88,
          65, 78, 92,
        ].map((h, i) => (
          <rect
            key={i}
            x={920 + i * 26}
            y={320 - h}
            width={10}
            height={h}
            rx={1.5}
            fill="#CC0000"
            opacity={0.04 + i * 0.007}
          />
        ))}
        <path
          d="M860 520 C940 490 1000 440 1100 415 C1180 394 1240 360 1340 330 C1390 315 1420 303 1440 293"
          stroke="#CC0000"
          strokeWidth="1.5"
          opacity="0.22"
        />
        <path
          d="M0 600 C140 578 280 558 440 528 C580 500 700 472 860 448 C980 428 1100 408 1280 382 C1360 368 1400 358 1440 348"
          stroke="#FFFFFF"
          strokeWidth="1"
          opacity="0.06"
        />
        <line
          x1="860"
          y1="310"
          x2="1440"
          y2="310"
          stroke="#FFFFFF"
          strokeWidth="0.5"
          strokeDasharray="4 8"
          opacity="0.07"
        />
        <line
          x1="860"
          y1="380"
          x2="1440"
          y2="380"
          stroke="#FFFFFF"
          strokeWidth="0.5"
          strokeDasharray="4 8"
          opacity="0.05"
        />
        <line
          x1="860"
          y1="450"
          x2="1440"
          y2="450"
          stroke="#FFFFFF"
          strokeWidth="0.5"
          strokeDasharray="4 8"
          opacity="0.03"
        />
      </svg>

      <div className="relative mx-auto max-w-[1440px] px-4 py-20 lg:px-6 lg:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div
            className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <div
              className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/15 px-4 py-1.5"
              style={{
                background: "rgba(255,255,255,0.07)",
                backdropFilter: "blur(10px)",
              }}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              <span className="text-xs font-semibold tracking-wide text-white/80">
                Heirs Holdings Group · Analytics Platform
              </span>
            </div>

            <h1 className="mb-5 text-4xl font-bold leading-[1.08] tracking-tight text-white lg:text-5xl xl:text-[3.5rem]">
              One platform for
              <br />
              <span className="text-primary">every investment</span>
              <br />
              decision.
            </h1>

            <p className="mb-8 max-w-lg text-base leading-relaxed text-white/60">
              Nine integrated modules{" "}
              <strong className="font-semibold text-white/85">
                Portfolio Management
              </strong>
              ,{" "}
              <strong className="font-semibold text-white/85">Valuation</strong>
              ,{" "}
              <strong className="font-semibold text-white/85">
                IFRS 9 &amp; ECL
              </strong>
              , Deal Capture, Performance Analytics, Duration &amp; Risk, Market
              Data, Accounting, and Reporting — unified in a single audit-ready
              platform built for CBN compliance.
            </p>

            <div className="mb-10 flex flex-wrap gap-3">
              <button
                onClick={onEnter}
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-white transition-all hover:bg-mid-red"
                style={{ boxShadow: "0 4px 24px rgba(204,0,0,0.4)" }}
              >
                Access Platform
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
              <a
                href="#modules"
                className="inline-flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-semibold text-white/80 no-underline transition-all hover:text-white"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.07)",
                  backdropFilter: "blur(10px)",
                }}
              >
                Explore Modules
              </a>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {[
                {
                  icon: <Shield className="h-3.5 w-3.5" />,
                  text: "CBN Compliant",
                },
                {
                  icon: <FileText className="h-3.5 w-3.5" />,
                  text: "IFRS 9 Ready",
                },
                {
                  icon: <Check className="h-3.5 w-3.5" />,
                  text: "Audit-Trail Enabled",
                },
                {
                  icon: <TrendingUp className="h-3.5 w-3.5" />,
                  text: "Real-Time Analytics",
                },
              ].map(({ icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-1.5 text-xs font-medium text-white/45"
                >
                  <span className="text-primary">{icon}</span>
                  {text}
                </div>
              ))}
            </div>
          </div>

          <div
            className={`flex justify-center transition-all duration-700 delay-200 lg:justify-end ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <PlatformMockup />
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
        style={{ background: "linear-gradient(to bottom, transparent, white)" }}
      />
    </section>
  );
};
