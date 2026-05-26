import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Drawer } from "../../../components/shared/drawer";

type Stage =
  | "Prospecting"
  | "Due Diligence"
  | "Term Sheet"
  | "IC Approval"
  | "Closed";
type Priority = "high" | "medium" | "low";

interface Deal {
  id: string;
  name: string;
  sector: string;
  stage: Stage;
  irr: number;
  size: number;
  currency: "NGN" | "USD";
  lead: string;
  priority: Priority;
  notes: string;
}

const STAGES: Stage[] = [
  "Prospecting",
  "Due Diligence",
  "Term Sheet",
  "IC Approval",
  "Closed",
];

const STAGE_TOP: Record<Stage, string> = {
  Prospecting: "border-t-gray-300",
  "Due Diligence": "border-t-blue-400",
  "Term Sheet": "border-t-yellow-400",
  "IC Approval": "border-t-orange-500",
  Closed: "border-t-teal-500",
};

const STAGE_LABEL: Record<Stage, string> = {
  Prospecting: "text-gray-400",
  "Due Diligence": "text-blue-600",
  "Term Sheet": "text-yellow-600",
  "IC Approval": "text-orange-600",
  Closed: "text-teal-600",
};

const PRIORITY_BADGE: Record<Priority, string> = {
  high: "bg-red-100 text-danger",
  medium: "bg-yellow-50 text-yellow-700",
  low: "bg-gray-100 text-gray-500",
};

const SECTOR_BADGE: Record<string, string> = {
  "Financial Services": "bg-blue-50 text-blue-700",
  FinTech: "bg-purple-50 text-purple-700",
  Technology: "bg-indigo-50 text-indigo-700",
  Agriculture: "bg-green-50 text-green-700",
  Energy: "bg-orange-50 text-orange-700",
  "Healthcare / Real Estate": "bg-teal-50 text-teal-700",
};

const INITIAL_DEALS: Deal[] = [
  {
    id: "D001",
    name: "Heirs Microfinance Expansion",
    sector: "Financial Services",
    stage: "IC Approval",
    irr: 18.4,
    size: 12.5,
    currency: "NGN",
    lead: "F. Aliyu",
    priority: "high",
    notes:
      "Board approval meeting 28 May. Regulatory pre-clearance obtained from CBN.",
  },
  {
    id: "D002",
    name: "Afropay Digital Payments",
    sector: "FinTech",
    stage: "Due Diligence",
    irr: 31.2,
    size: 8.8,
    currency: "USD",
    lead: "F. Aliyu",
    priority: "high",
    notes:
      "CBN PSSP licence review in progress. Legal DD expected to close 5-Jun.",
  },
  {
    id: "D003",
    name: "Lagos Tier-3 Data Centre JV",
    sector: "Technology",
    stage: "Term Sheet",
    irr: 22.0,
    size: 45.0,
    currency: "NGN",
    lead: "F. Aliyu",
    priority: "medium",
    notes:
      "JV partner: MTN Infrastructure. Term sheet signed 20 May. Legal review underway.",
  },
  {
    id: "D004",
    name: "Northern Agri-Processing Hub",
    sector: "Agriculture",
    stage: "Prospecting",
    irr: 19.5,
    size: 22.0,
    currency: "NGN",
    lead: "F. Aliyu",
    priority: "medium",
    notes:
      "FGN incentive zone eligible — NIRSAL co-investment under discussion.",
  },
  {
    id: "D005",
    name: "Transcorp Energy Spinoff Stake",
    sector: "Energy",
    stage: "Due Diligence",
    irr: 25.8,
    size: 38.0,
    currency: "NGN",
    lead: "F. Aliyu",
    priority: "high",
    notes:
      "Follows Transcorp Group restructuring. Existing board seat provides information advantage.",
  },
  {
    id: "D006",
    name: "Pan-African Healthcare REIT",
    sector: "Healthcare / Real Estate",
    stage: "Prospecting",
    irr: 16.2,
    size: 60.0,
    currency: "USD",
    lead: "F. Aliyu",
    priority: "low",
    notes:
      "5-country footprint: Nigeria, Kenya, Ghana, Egypt, South Africa. Anchor LP discussions ongoing.",
  },
];

export function PortfolioPipeline() {
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [selected, setSelected] = useState<Deal | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Deal>({
    id: "",
    name: "",
    sector: "Financial Services",
    stage: "Prospecting",
    irr: 15,
    size: 5,
    currency: "NGN",
    lead: "F. Aliyu",
    priority: "medium",
    notes: "",
  });

  const sel = selected
    ? (deals.find((d) => d.id === selected.id) ?? null)
    : null;

  const moveStage = (id: string, dir: 1 | -1) => {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const idx = STAGES.indexOf(d.stage);
        const next = Math.max(0, Math.min(STAGES.length - 1, idx + dir));
        return { ...d, stage: STAGES[next] };
      }),
    );
  };

  const removeDeal = (id: string) => {
    if (!confirm("Remove this deal from pipeline?")) return;
    setDeals((prev) => prev.filter((d) => d.id !== id));
    setSelected(null);
  };

  const dealsByStage = (s: Stage) => deals.filter((d) => d.stage === s);

  const totalNGN = deals
    .filter((d) => d.currency === "NGN")
    .reduce((sum, d) => sum + d.size, 0);
  const totalUSD = deals
    .filter((d) => d.currency === "USD")
    .reduce((sum, d) => sum + d.size, 0);
  const avgIRR = deals.length
    ? deals.reduce((sum, d) => sum + d.irr, 0) / deals.length
    : 0;

  return (
    <div className="p-6 xl:p-8 space-y-6">
      {/* header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">
            Investment Pipeline
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {deals.length} deals under evaluation · Avg projected IRR{" "}
            <span className="font-semibold text-success">
              {avgIRR.toFixed(1)}%
            </span>
          </p>
        </div>
        <button
          onClick={() => {
            setDraft({
              id: "",
              name: "",
              sector: "Financial Services",
              stage: "Prospecting",
              irr: 15,
              size: 5,
              currency: "NGN",
              lead: "F. Aliyu",
              priority: "medium",
              notes: "",
            });
            setAdding(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-mid-red"
        >
          <Plus className="h-4 w-4" /> New Deal
        </button>
      </div>

      {/* summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs text-gray-400">Active Deals</p>
          <p className="mt-1 text-xl font-bold text-dark-gray">
            {deals.length}
          </p>
          <p className="text-xs text-gray-400">
            {deals.filter((d) => d.priority === "high").length} high priority
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs text-gray-400">NGN Deal Value</p>
          <p className="mt-1 text-xl font-bold text-primary">
            ₦{totalNGN.toFixed(1)}B
          </p>
          <p className="text-xs text-gray-400">+ ${totalUSD.toFixed(1)}B USD</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs text-gray-400">Avg Projected IRR</p>
          <p className="mt-1 text-xl font-bold text-success">
            {avgIRR.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400">Unweighted mean</p>
        </div>
      </div>

      {/* kanban board */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3" style={{ minWidth: "940px" }}>
          {STAGES.map((stage) => {
            const deals = dealsByStage(stage);
            return (
              <div
                key={stage}
                className={`flex-1 rounded-xl border-t-4 border border-border bg-surface shadow-sm ${STAGE_TOP[stage]}`}
              >
                <div className="px-4 py-3 border-b border-border">
                  <p
                    className={`text-xs font-bold uppercase tracking-wider ${STAGE_LABEL[stage]}`}
                  >
                    {stage}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {deals.length} deal{deals.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="p-2 space-y-2 min-h-24">
                  {deals.length === 0 && (
                    <p className="py-6 text-center text-xs text-gray-300">
                      Empty
                    </p>
                  )}
                  {deals.map((deal) => {
                    const isActive = selected?.id === deal.id;
                    return (
                      <button
                        key={deal.id}
                        onClick={() => setSelected(isActive ? null : deal)}
                        className={`w-full rounded-lg border p-3 text-left transition-all ${
                          isActive
                            ? "border-primary bg-pale-red/30 shadow-sm"
                            : "border-border bg-surface-muted hover:border-primary/40 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs font-semibold text-dark-gray leading-tight">
                            {deal.name}
                          </p>
                          <span
                            className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium ${PRIORITY_BADGE[deal.priority]}`}
                          >
                            {deal.priority}
                          </span>
                        </div>
                        <span
                          className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${SECTOR_BADGE[deal.sector] ?? "bg-gray-100 text-gray-500"}`}
                        >
                          {deal.sector}
                        </span>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="font-bold text-success">
                            {deal.irr}% IRR
                          </span>
                          <span className="text-gray-400">
                            {deal.currency === "NGN" ? "₦" : "$"}
                            {deal.size}B
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* deal detail */}
      {sel && (
        <div className="rounded-xl border border-primary/30 bg-pale-red/20 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Deal Detail
              </p>
              <h3 className="mt-0.5 text-lg font-bold text-dark-gray">
                {sel.name}
              </h3>
              <p className="text-xs text-gray-500">{sel.sector}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => moveStage(sel.id, -1)}
                disabled={STAGES.indexOf(sel.stage) === 0}
                className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-border disabled:hover:text-gray-600"
                title="Move to previous stage"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </button>
              <button
                onClick={() => moveStage(sel.id, 1)}
                disabled={STAGES.indexOf(sel.stage) === STAGES.length - 1}
                className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-mid-red disabled:opacity-40 disabled:hover:bg-primary"
                title="Advance to next stage"
              >
                Advance <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => removeDeal(sel.id)}
                className="flex items-center gap-1 rounded-lg border border-danger/30 bg-surface px-2.5 py-1.5 text-xs font-medium text-danger shadow-sm hover:bg-red-50"
                title="Remove deal"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${PRIORITY_BADGE[sel.priority]}`}
              >
                {sel.priority} priority
              </span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-xs text-gray-400">Stage</p>
              <p className={`text-sm font-semibold ${STAGE_LABEL[sel.stage]}`}>
                {sel.stage}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Projected IRR</p>
              <p className="text-sm font-bold text-success">{sel.irr}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Deal Size</p>
              <p className="text-sm font-semibold">
                {sel.currency === "NGN" ? "₦" : "$"}
                {sel.size}B
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Lead PM</p>
              <p className="text-sm font-semibold">{sel.lead}</p>
            </div>
          </div>
          <p className="mt-3 border-t border-primary/20 pt-3 text-xs text-gray-500 leading-relaxed">
            <span className="font-semibold text-dark-gray">Notes: </span>
            {sel.notes}
          </p>
        </div>
      )}

      {/* New deal drawer */}
      <Drawer
        isOpen={adding}
        onClose={() => setAdding(false)}
        size="md"
        title="New Pipeline Deal"
        description="Register a prospective investment for the deal team to evaluate."
        footer={
          <>
            <button
              onClick={() => setAdding(false)}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-gray-600 hover:border-gray-300"
            >
              Cancel
            </button>
            <button
              disabled={!draft.name.trim()}
              onClick={() => {
                const id = `D${Date.now().toString(36).toUpperCase()}`;
                setDeals((prev) => [{ ...draft, id }, ...prev]);
                setAdding(false);
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red disabled:opacity-50"
            >
              Add Deal
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500">
              Deal Name <span className="text-danger">*</span>
            </label>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="e.g. Lagos Renewable Energy Fund II"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">
                Sector
              </label>
              <select
                value={draft.sector}
                onChange={(e) => setDraft({ ...draft, sector: e.target.value })}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {Object.keys(SECTOR_BADGE).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Stage</label>
              <select
                value={draft.stage}
                onChange={(e) =>
                  setDraft({ ...draft, stage: e.target.value as Stage })
                }
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {STAGES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Projected IRR (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={draft.irr}
                onChange={(e) =>
                  setDraft({ ...draft, irr: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Deal Size (B)
              </label>
              <input
                type="number"
                step="0.1"
                value={draft.size}
                onChange={(e) =>
                  setDraft({ ...draft, size: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Currency
              </label>
              <select
                value={draft.currency}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    currency: e.target.value as "NGN" | "USD",
                  })
                }
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option>NGN</option>
                <option>USD</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Priority
              </label>
              <select
                value={draft.priority}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    priority: e.target.value as Priority,
                  })
                }
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-500">
                Lead PM
              </label>
              <input
                value={draft.lead}
                onChange={(e) => setDraft({ ...draft, lead: e.target.value })}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Notes</label>
            <textarea
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="DD progress, regulatory considerations, key risks…"
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
