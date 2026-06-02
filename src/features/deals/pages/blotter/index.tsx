import { useState, useMemo } from "react";
import { DataTable } from "../../../../components/shared/data-table";
import { SectionCard } from "../../../../components/shared/section-card";
import {
  BOOK_INSTRUMENTS,
  BOOK_COMPUTED,
} from "../../../portfolio/engine/book-compute";
import type { Instrument } from "../../../portfolio/engine/book-compute";
import type { Row } from "./types";
import { exportBlotterXlsx } from "./utils";
import { makeBlotterColumns } from "./components/columns";
import { BlotterHeader } from "./components/blotter-header";
import { BlotterStats } from "./components/blotter-stats";
import { BlotterFilters } from "./components/blotter-filters";
import { BlotterDetailModal } from "./components/detail-modal";
import { DeleteConfirm } from "./components/delete-confirm";
import { EditBlotterDrawer } from "./components/edit-drawer";

export function DealBlotter() {
  const [instruments, setInstruments] = useState<Instrument[]>([
    ...BOOK_INSTRUMENTS,
  ]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [clfFilter, setClfFilter] = useState("All");
  const [selected, setSelected] = useState<Row | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  const types = useMemo(
    () => [
      "All",
      ...Array.from(new Set(instruments.map((i) => i.instrumentType))).sort(),
    ],
    [instruments],
  );

  const rows = useMemo<Row[]>(() => {
    return instruments.filter((i) => {
      const matchType = typeFilter === "All" || i.instrumentType === typeFilter;
      const matchClf = clfFilter === "All" || i.classification === clfFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.issuer.toLowerCase().includes(q);
      return matchType && matchClf && matchSearch;
    }) as Row[];
  }, [instruments, search, typeFilter, clfFilter]);

  const totals = BOOK_COMPUTED.totals;

  const cols = makeBlotterColumns({
    onEdit: setEditing,
    onDelete: setDeleting,
  });

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <BlotterHeader
        rowCount={rows.length}
        totalCount={instruments.length}
        onExport={() => exportBlotterXlsx(rows)}
      />

      <BlotterStats
        totalInstruments={instruments.length}
        totalFaceValueNGN={totals.totalFaceValueNGN}
        totalBSValueNGN={totals.totalBSValueNGN}
        filteredCount={rows.length}
      />

      <SectionCard title="Instrument Book">
        <BlotterFilters
          search={search}
          onSearchChange={setSearch}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          clfFilter={clfFilter}
          onClfChange={setClfFilter}
          types={types}
        />

        <DataTable<Row>
          columns={cols}
          data={rows}
          keyExtractor={(r) => r.id}
          emptyMessage="No instruments match your filters"
          pageSize={20}
          onRowClick={setSelected}
        />
      </SectionCard>

      <BlotterDetailModal
        selected={selected}
        onClose={() => setSelected(null)}
      />

      {editing && (
        <EditBlotterDrawer
          row={editing}
          onSave={(patch) => {
            setInstruments((prev) =>
              prev.map((i) => (i.id === editing.id ? { ...i, ...patch } : i)),
            );
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <DeleteConfirm
          deleting={deleting}
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            setInstruments((prev) =>
              prev.filter((i) => i.id !== String(deleting.id)),
            );
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}
