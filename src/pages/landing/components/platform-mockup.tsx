import {
  Activity,
  BarChart2,
  Calculator,
  FileText,
  LayoutDashboard,
  Settings,
} from "lucide-react";

export const PlatformMockup = () => (
  <div className="relative w-full max-w-155">
    <div
      className="pointer-events-none absolute inset-0 -z-10 scale-105 rounded-3xl blur-3xl"
      style={{
        background:
          "radial-gradient(ellipse, rgba(204,0,0,0.12) 0%, transparent 70%)",
      }}
    />
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_20px_60px_rgba(0,0,0,0.10),0_4px_16px_rgba(0,0,0,0.06)]">
      <div className="flex h-10 items-center gap-1.5 border-b border-border bg-surface-muted px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <div className="mx-auto flex h-5 w-52 items-center justify-center rounded border border-border bg-white">
          <span className="font-mono text-[9px] text-dark-gray/40">
            heirs-quanta.app — Dashboard
          </span>
        </div>
      </div>

      <div className="flex" style={{ height: 400 }}>
        <div className="flex w-14 shrink-0 flex-col items-center gap-5 border-r border-border bg-surface-muted py-5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-black text-white"
            style={{ background: "#CC0000" }}
          >
            HQ
          </div>
          {[LayoutDashboard, BarChart2, FileText, Calculator, Settings].map(
            (Icon, i) => (
              <Icon
                key={i}
                style={{
                  width: 16,
                  height: 16,
                  color: i === 0 ? "#CC0000" : "#1a1a1a",
                  opacity: i === 0 ? 1 : 0.25,
                }}
              />
            ),
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-1 h-2.5 w-40 rounded-sm bg-dark-gray/80" />
              <div className="h-2 w-24 rounded-sm bg-dark-gray/20" />
            </div>
            <div
              className="flex h-7 items-center gap-1.5 rounded-lg px-3 text-[9px] font-semibold text-white"
              style={{ background: "#CC0000" }}
            >
              <Activity style={{ width: 9, height: 9 }} />
              Run ECL
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {[
              {
                label: "Portfolio",
                value: "₦14.2B",
                up: true,
                note: "+8.3% YoY",
              },
              {
                label: "ECL Charge",
                value: "₦1.84B",
                up: false,
                note: "−2.1% QoQ",
              },
              { label: "Stage 3", value: "4.72%", up: true, note: "+0.3pp" },
              { label: "Coverage", value: "73.4%", up: null, note: "Stable" },
            ].map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-white p-3"
              >
                <p className="text-[7px] text-dark-gray/40">{s.label}</p>
                <p className="mt-0.5 text-[11px] font-bold text-dark-gray leading-tight">
                  {s.value}
                </p>
                <p
                  className="mt-1 text-[7px] font-medium"
                  style={{
                    color:
                      s.up === null
                        ? "#1a1a1a66"
                        : s.up
                          ? "#b91c1c"
                          : "#0f766e",
                  }}
                >
                  {s.note}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {["Portfolio", "IFRS 9 / ECL", "Valuation"].map((tab, i) => (
              <div
                key={tab}
                className="rounded-md px-3 py-1.5 text-[8px] font-semibold"
                style={{
                  background: i === 0 ? "#CC0000" : "#f4f4f4",
                  color: i === 0 ? "white" : "#1a1a1a99",
                }}
              >
                {tab}
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <div className="flex gap-5 bg-surface-muted px-3 py-2 border-b border-border">
              {["Security", "Stage", "Carrying", "ECL", "Status"].map((h) => (
                <span
                  key={h}
                  className="text-[7px] font-bold uppercase tracking-wider text-dark-gray/40"
                >
                  {h}
                </span>
              ))}
            </div>
            {[
              {
                id: "L001",
                stage: "S1",
                color: "#0f766e",
                amt: "₦450M",
                ecl: "₦1.4M",
                status: "Performing",
              },
              {
                id: "L002",
                stage: "S2",
                color: "#d97706",
                amt: "₦78.5M",
                ecl: "₦9.4M",
                status: "Watch",
              },
              {
                id: "L003",
                stage: "S3",
                color: "#b91c1c",
                amt: "₦25M",
                ecl: "₦12.5M",
                status: "Substandard",
              },
            ].map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-5 px-3 py-2"
                style={{
                  background: i % 2 === 0 ? "white" : "#fafafa",
                  borderTop: i > 0 ? "1px solid #f0f0f0" : "none",
                }}
              >
                <span className="font-mono text-[8px] text-dark-gray/50 w-7">
                  {r.id}
                </span>
                <span
                  className="rounded-full px-1.5 py-0.5 text-[7px] font-semibold text-white"
                  style={{ background: r.color }}
                >
                  {r.stage}
                </span>
                <span className="text-[8px] text-dark-gray/60">{r.amt}</span>
                <span className="text-[8px] font-medium text-danger">
                  {r.ecl}
                </span>
                <span className="text-[8px]" style={{ color: r.color }}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-1 items-end gap-1 rounded-lg border border-border bg-white p-3">
            <p className="self-start text-[7px] text-dark-gray/35 mr-2">
              ECL Trend (12m)
            </p>
            {[38, 42, 48, 52, 47, 58, 62, 55, 68, 72, 78, 83].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${h * 0.6}%`,
                  maxHeight: 36,
                  background: `rgba(204,0,0,${0.2 + (i / 11) * 0.6})`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);
