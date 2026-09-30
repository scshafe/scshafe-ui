import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { createPersistMiddleware, readPersistedState } from "./createPersistMiddleware.js";

// ============================================================================
// PaneSizes — persisted drag-resize widths keyed by paneId (L2; moved from
// MC's state/PaneSizes.js, now built on the package's own persistence factory).
// The slice name keeps MC's store key, and the storage key + shape are the
// ones MC already persisted, so existing localStorage carries over.
// ============================================================================

const STORAGE_KEY = "sui-pane-sizes";

interface PaneSizesState {
  sizes: Record<string, number>;
}

function normalize(parsed: unknown): PaneSizesState {
  const sizes: Record<string, number> = {};
  const raw = (parsed as any)?.sizes;
  if (raw && typeof raw === "object") {
    for (const [key, value] of Object.entries(raw)) {
      if (typeof key === "string" && typeof value === "number" && Number.isFinite(value)) sizes[key] = value;
    }
  }
  return { sizes };
}

export const PaneSizes = createSlice({
  name: "PaneSizes",
  initialState: () => readPersistedState(STORAGE_KEY, normalize, { sizes: {} }),
  reducers: {
    paneSizeSet(state, action: PayloadAction<{ paneId?: string; size?: number }>) {
      const paneId = typeof action.payload?.paneId === "string" ? action.payload.paneId : null;
      const size = action.payload?.size;
      if (!paneId || typeof size !== "number" || !Number.isFinite(size)) return;
      state.sizes[paneId] = Math.round(size);
    },
    paneSizeCleared(state, action: PayloadAction<{ paneId?: string }>) {
      const paneId = typeof action.payload?.paneId === "string" ? action.payload.paneId : null;
      if (!paneId) return;
      delete state.sizes[paneId];
    }
  }
});

export const { paneSizeSet, paneSizeCleared } = PaneSizes.actions;

export const paneSizesPersistMiddleware = createPersistMiddleware({
  key: STORAGE_KEY,
  select: (state: any) => state.PaneSizes,
  matches: "PaneSizes/"
});

export function selectPaneSize(paneId: string) {
  return (state: any = {}): number | null => state?.PaneSizes?.sizes?.[paneId] ?? null;
}
