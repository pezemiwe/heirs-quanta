import { useState, useMemo } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "../../../../components/shared/data-table";
import { RowDetailModal } from "../../../../components/shared/row-detail-modal";
import { fmtCompact, fmtPct, fmtDate } from "../../engine/book-compute";
import type { HoldingRow } from "./types";
import { ALL_ROWS, COLUMNS } from "./config";
import { exportHoldingsXlsx } from "./utils";
import { HoldingsHeader } from "./components/header";
import { SummaryStrip } from "./components/summary-strip";
import { HoldingsFilters } from "./components/filters";
import { ActionsCell } from "./components/actions-cell";
import { DeleteHoldingModal } from "./components/delete-modal";
import { EditHoldingDrawer } from "./components/edit-holding-drawer";

export function PortfolioHoldings() {
  const [rows, setRows] = useState<HoldingRow[]>(ALL_ROWS);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [classFilter, setClassFilter] = useState("All");
  const [selected, setSelected] = useState<HoldingRow | null>(null);
  const [editing, setEditing] = useState<HoldingRow | null>(null);
  const [deleting, setDeleting] = useState<HoldingRow | null>(null);

  const actionsColumn: DataTableColumn<HoldingRow> = {
    key: "_actions" as never,
    header: "",
    width: "72px",
    render: (r) => (
      <ActionsCell row={r} onEdit={setEditing} onDelete={setDeleting} />
    ),
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      if (typeFilter !== "All" && r.instrumentType !== typeFilter) return false;
      if (classFilter !== "All" && r.classification !== classFilter)
        return false;
      if (
        q &&
        !r.name.toLowerCase().includes(q) &&
        !r.issuer.toLowerCase().includes(q) &&
        !r.id.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [rows, search, typeFilter, classFilter]);

  const totalBookValue = filtered.reduce((s, r) => s + r.bookValueNGN, 0);

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <HoldingsHeader
        filteredCount={filtered.length}
        totalCount={ALL_ROWS.length}
        totalBookValue={totalBookValue}
        onExport={() => exportHoldingsXlsx(filtered)}
      />

      <SummaryStrip rows={rows} />

      <HoldingsFilters
        search={search}
        setSearch={setSearch}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        classFilter={classFilter}
        setClassFilter={setClassFilter}
      />

      <DataTable<HoldingRow>
        columns={[...COLUMNS, actionsColumn]}
        data={filtered}
        keyExtractor={(r) => r.id}
        pageSize={25}
        emptyMessage="No instruments match your filters"
        onRowClick={setSelected}
      />

      <RowDetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Holding Detail"}
        subtitle={selected?.id}
        fields={
          selected
            ? [
                { label: "ID", value: selected.id },
                { label: "Type", value: selected.instrumentType },
                { label: "Issuer", value: selected.issuer },
                { label: "Sector", value: selected.sector },
                { label: "Classification", value: selected.classification },
                { label: "Currency", value: selected.currency },
                { label: "Face Value", value: fmtCompact(selected.faceValue) },
                {
                  label: "Book Value (NGN)",
                  value: fmtCompact(selected.bookValueNGN),
                },
                {
                  label: "EIR",
                  value: selected.eirPct > 0 ? fmtPct(selected.eirPct) : "—",
                },
                {
                  label: "Coupon Rate",
                  value:
                    selected.couponRate > 0 ? fmtPct(selected.couponRate) : "—",
                },
                {
                  label: "Maturity Date",
                  value: fmtDate(selected.maturityDate),
                },
                { label: "Stage", value: selected.stage },
                { label: "Status", value: selected.status },
              ]
            : []
        }
      />

      {editing && (
        <EditHoldingDrawer
          row={editing}
          onSave={(patch) => {
            setRows((prev) =>
              prev.map((r) => (r.id === editing.id ? { ...r, ...patch } : r)),
            );
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <DeleteHoldingModal
          row={deleting}
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            setRows((prev) => prev.filter((r) => r.id !== deleting.id));
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}
