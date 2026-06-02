import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EMPTY_DRAFT, INITIAL_DEALS, STAGES } from "./config";
import type { Deal, Stage, ViewMode } from "./types";
import { HeaderBar } from "./components/header-bar";
import { KpiStrip } from "./components/kpi-strip";
import { FunnelBar } from "./components/funnel-bar";
import { KanbanBoard } from "./components/kanban-board";
import { DealList } from "./components/deal-list";
import { DealDetailDrawer } from "./components/deal-detail-drawer";
import { NewDealDrawer } from "./components/new-deal-drawer";
import { RemoveConfirmModal } from "./components/remove-confirm-modal";

export function PortfolioPipeline() {
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [view, setView] = useState<ViewMode>("kanban");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Deal | null>(null);
  const [adding, setAdding] = useState(false);
  const [submittingDeal, setSubmittingDeal] = useState(false);
  const [draft, setDraft] = useState<Omit<Deal, "id">>(EMPTY_DRAFT);
  const [sortField, setSortField] = useState<keyof Deal>("stage");
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [deletingDeal, setDeletingDeal] = useState<Deal | null>(null);

  const sel = selected
    ? (deals.find((d) => d.id === selected.id) ?? null)
    : null;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return deals.filter(
      (d) =>
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.sector.toLowerCase().includes(q) ||
        d.lead.toLowerCase().includes(q),
    );
  }, [deals, search]);

  const sortedList = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (typeof av === "number" && typeof bv === "number")
        return (av - bv) * sortDir;
      return String(av).localeCompare(String(bv)) * sortDir;
    });
  }, [filtered, sortField, sortDir]);

  const moveStage = (id: string, dir: 1 | -1) => {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const idx = STAGES.indexOf(d.stage);
        return {
          ...d,
          stage: STAGES[Math.max(0, Math.min(STAGES.length - 1, idx + dir))],
        };
      }),
    );
    setSelected((prev) => {
      if (!prev || prev.id !== id) return prev;
      const idx = STAGES.indexOf(prev.stage);
      return {
        ...prev,
        stage: STAGES[Math.max(0, Math.min(STAGES.length - 1, idx + dir))],
      };
    });
  };

  const removeDeal = (id: string) => {
    const deal = deals.find((d) => d.id === id);
    if (deal) setDeletingDeal(deal);
  };

  const confirmRemoveDeal = () => {
    if (!deletingDeal) return;
    setDeals((prev) => prev.filter((d) => d.id !== deletingDeal.id));
    setSelected(null);
    setDeletingDeal(null);
  };

  const dealsByStage = (s: Stage) => filtered.filter((d) => d.stage === s);

  const totalNGN = deals
    .filter((d) => d.currency === "NGN")
    .reduce((s, d) => s + d.size, 0);
  const totalUSD = deals
    .filter((d) => d.currency === "USD")
    .reduce((s, d) => s + d.size, 0);
  const avgIRR = deals.length
    ? deals.reduce((s, d) => s + d.irr, 0) / deals.length
    : 0;
  const highCount = deals.filter((d) => d.priority === "high").length;

  const toggleSort = (field: keyof Deal) => {
    if (sortField === field) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortField(field);
      setSortDir(1);
    }
  };

  const submitNewDeal = () => {
    setSubmittingDeal(true);
    setTimeout(() => {
      const id = `D${Date.now().toString(36).toUpperCase().slice(-5)}`;
      setDeals((prev) => [{ ...draft, id }, ...prev]);
      setSubmittingDeal(false);
      setAdding(false);
    }, 700);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <HeaderBar
        totalDeals={deals.length}
        avgIRR={avgIRR}
        highCount={highCount}
        view={view}
        onViewChange={setView}
        onNewDeal={() => {
          setDraft(EMPTY_DRAFT);
          setAdding(true);
        }}
      />

      <KpiStrip
        totalDeals={deals.length}
        highCount={highCount}
        avgIRR={avgIRR}
        totalNGN={totalNGN}
        totalUSD={totalUSD}
      />

      <FunnelBar countsByStage={dealsByStage} />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-gray/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search deals, sector, lead PM…"
          className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm outline-none focus:border-primary"
        />
      </div>

      {view === "kanban" && (
        <KanbanBoard
          dealsByStage={dealsByStage}
          selectedId={sel?.id ?? null}
          onSelect={setSelected}
        />
      )}

      {view === "list" && (
        <DealList
          deals={sortedList}
          selectedId={sel?.id ?? null}
          onSelect={setSelected}
          sortField={sortField}
          sortDir={sortDir}
          onToggleSort={toggleSort}
        />
      )}

      <DealDetailDrawer
        deal={sel}
        onClose={() => setSelected(null)}
        onMoveStage={moveStage}
        onRemove={removeDeal}
      />

      <RemoveConfirmModal
        deal={deletingDeal}
        onCancel={() => setDeletingDeal(null)}
        onConfirm={confirmRemoveDeal}
      />

      <NewDealDrawer
        open={adding}
        draft={draft}
        submitting={submittingDeal}
        onChange={setDraft}
        onClose={() => setAdding(false)}
        onSubmit={submitNewDeal}
      />
    </div>
  );
}
