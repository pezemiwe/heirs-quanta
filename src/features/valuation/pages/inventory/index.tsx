import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useValuation } from "../../store";
import { EmptyPortfolio } from "../../components/empty-portfolio";
import { InventoryHeader } from "./components/inventory-header";
import { InventoryFilters } from "./components/inventory-filters";
import { InventoryTable } from "./components/inventory-table";
import { DeleteModal } from "./components/delete-modal";
import { AddInstrumentDrawer } from "./components/add-instrument-drawer";
import { EditInstrumentDrawer } from "./components/edit-instrument-drawer";
import type { Classification, Instrument, InstrumentType } from "./types";

export function ValuationInventory() {
  const v = useValuation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | InstrumentType>("All");
  const [classFilter, setClassFilter] = useState<"All" | Classification>("All");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Instrument | null>(null);
  const [deleting, setDeleting] = useState<Instrument | null>(null);

  if (!v.hasData) return <EmptyPortfolio />;

  const filtered = v.instruments.filter((i) => {
    const matchType = typeFilter === "All" || i.instrumentType === typeFilter;
    const matchClass =
      classFilter === "All" || i.classification === classFilter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      i.id.toLowerCase().includes(q) ||
      i.name.toLowerCase().includes(q) ||
      i.issuer.toLowerCase().includes(q) ||
      i.sector.toLowerCase().includes(q);
    return matchType && matchClass && matchSearch;
  });

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <InventoryHeader
        filteredCount={filtered.length}
        totalCount={v.instruments.length}
        onAdd={() => setAdding(true)}
      />

      {/* filters */}
      <InventoryFilters
        search={search}
        setSearch={setSearch}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        classFilter={classFilter}
        setClassFilter={setClassFilter}
      />

      <InventoryTable
        filtered={filtered}
        valuations={v.result.valuations}
        onRowClick={(id) => navigate(`/valuation/asset/${id}`)}
        onEdit={setEditing}
        onDelete={setDeleting}
      />

      {adding && <AddInstrumentDrawer onClose={() => setAdding(false)} />}
      {editing && (
        <EditInstrumentDrawer
          instrument={editing}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <DeleteModal
          instrument={deleting}
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            v.removeInstrument(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}
