/**
 * Saved blotter views - persisted filter/sort presets per user.
 *
 * Kept separate from the deal-slip/register workflow store on purpose: this
 * is view/UI preference state, not deal or position data, so it doesn't
 * belong in the same persisted blob or need cross-tab BroadcastChannel sync.
 */
import { useCallback, useEffect, useState } from "react";
import type { DealSlipStatus } from "../../workflow/types";

export type BlotterSortField = "purchaseDate" | "faceValue" | "status" | "instrumentName";
export type SortDirection = "asc" | "desc";

export interface BlotterFilters {
  statusFilter: DealSlipStatus | "All";
  search: string;
  sortBy: BlotterSortField;
  sortDir: SortDirection;
}

export interface SavedBlotterView {
  id: string;
  name: string;
  owner: string; // persona name
  filters: BlotterFilters;
  createdAt: string;
}

const LS_KEY = "hq_blotter_saved_views_v1";

function loadAll(): SavedBlotterView[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedBlotterView[];
  } catch {
    return [];
  }
}

function saveAll(views: SavedBlotterView[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(views));
  } catch {
    // ignore quota / private-mode errors
  }
}

function rid(): string {
  return `view-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function useSavedBlotterViews(ownerName: string) {
  const [all, setAll] = useState<SavedBlotterView[]>(loadAll);

  useEffect(() => {
    saveAll(all);
  }, [all]);

  const saveView = useCallback(
    (name: string, filters: BlotterFilters) => {
      setAll((prev) => [
        ...prev,
        { id: rid(), name, owner: ownerName, filters, createdAt: new Date().toISOString() },
      ]);
    },
    [ownerName],
  );

  const deleteView = useCallback((id: string) => {
    setAll((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const views = all.filter((v) => v.owner === ownerName);

  return { views, saveView, deleteView };
}
