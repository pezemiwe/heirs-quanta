import { useState } from "react";
import { usePortfolioRegistry, type Portfolio } from "../../portfolio-registry";
import type { FormValues } from "./types";
import { BLANK } from "./config";
import { PortfolioModal } from "./components/portfolio-modal";
import { DetailPanel } from "./components/detail-panel";
import { PortfolioList } from "./components/portfolio-list";
import { ConfirmDeleteModal } from "./components/confirm-delete-modal";

export function PortfolioBooks() {
  const { portfolios, addPortfolio, updatePortfolio, removePortfolio } =
    usePortfolioRegistry();

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Portfolio | null>(null);
  const [selected, setSelected] = useState<Portfolio | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Portfolio | null>(null);

  function handleCreate(v: FormValues) {
    const newP = addPortfolio(v);
    setSelected(newP);
  }

  function handleEdit(v: FormValues) {
    if (!editing) return;
    updatePortfolio(editing.id, v);
    setSelected((prev) => (prev?.id === editing.id ? { ...prev, ...v } : prev));
  }

  function handleDelete(p: Portfolio) {
    removePortfolio(p.id);
    if (selected?.id === p.id) setSelected(null);
    setConfirmDelete(null);
  }

  return (
    <div className="flex h-full overflow-hidden">
      <PortfolioList
        portfolios={portfolios}
        selected={selected}
        onSelect={setSelected}
        onAdd={() => setShowCreate(true)}
        onEdit={setEditing}
        onDelete={setConfirmDelete}
      />

      {/* detail panel */}
      {selected && (
        <DetailPanel
          portfolio={selected}
          onClose={() => setSelected(null)}
          onEdit={() => setEditing(selected)}
        />
      )}

      {/* create modal */}
      {showCreate && (
        <PortfolioModal
          title="Create New Portfolio"
          initial={BLANK}
          onSave={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* edit modal */}
      {editing && (
        <PortfolioModal
          title={`Edit: ${editing.name}`}
          initial={{
            name: editing.name,
            type: editing.type,
            baseCurrency: editing.baseCurrency,
            description: editing.description,
            manager: editing.manager,
            mandatedBy: editing.mandatedBy,
            strategy: editing.strategy,
            status: editing.status,
          }}
          onSave={handleEdit}
          onClose={() => setEditing(null)}
        />
      )}

      {/* confirm delete */}
      {confirmDelete && (
        <ConfirmDeleteModal
          portfolio={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete)}
        />
      )}
    </div>
  );
}
