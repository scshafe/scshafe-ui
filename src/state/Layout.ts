import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { MOBILE_CLAMP_MAX_WIDTH } from "../widget/popoverPosition.js";

// ============================================================================
// Layout — the viewport signal + the surface-collapse registry (L2; moved from
// the generic half of MC's LayoutManager — MC keeps its app-shell fields,
// sidebar/mobileNav, host-side).
//
// `isMobile` mirrors the ≤880px media query (the shipped MOBILE_CLAMP_MAX_WIDTH),
// dispatched by `attachViewportSync`; default false so SSR and test stores render
// the desktop layout byte-identically. `collapsedListsBySurface` is keyed by an
// arbitrary host `surfaceId` — any rail opts in by using it.
// ============================================================================

interface LayoutState {
  isMobile: boolean;
  collapsedListsBySurface: Record<string, boolean>;
}

const initialState: LayoutState = {
  isMobile: false,
  collapsedListsBySurface: {}
};

export const Layout = createSlice({
  name: "Layout",
  initialState,
  reducers: {
    viewportChanged(state, action: PayloadAction<boolean | { isMobile?: boolean }>) {
      state.isMobile = Boolean((action.payload as any)?.isMobile ?? action.payload);
    },
    surfaceListCollapseToggled(state, action: PayloadAction<string | { surfaceId?: string }>) {
      const surfaceId = typeof action.payload === "string" ? action.payload : action.payload?.surfaceId;
      if (!surfaceId) return;
      state.collapsedListsBySurface[surfaceId] = !state.collapsedListsBySurface[surfaceId];
    },
    surfaceListCollapseSet(state, action: PayloadAction<{ surfaceId?: string; collapsed?: boolean }>) {
      const surfaceId = action.payload?.surfaceId;
      if (!surfaceId) return;
      state.collapsedListsBySurface[surfaceId] = Boolean(action.payload?.collapsed);
    }
  }
});

export const { viewportChanged, surfaceListCollapseToggled, surfaceListCollapseSet } = Layout.actions;

export function selectIsMobile(state: any = {}): boolean {
  return Boolean(state?.Layout?.isMobile);
}

export function selectSurfaceListCollapsed(surfaceId: string) {
  return (state: any = {}): boolean => Boolean(state?.Layout?.collapsedListsBySurface?.[surfaceId]);
}

// Install the matchMedia listener driving `isMobile`; returns a detach function.
// No-op without a window (SSR / tests keep the desktop default).
export function attachViewportSync(store: { dispatch: (action: any) => unknown }, { maxWidth = MOBILE_CLAMP_MAX_WIDTH }: { maxWidth?: number } = {}): () => void {
  const matchMedia = (globalThis as any).matchMedia;
  if (typeof matchMedia !== "function") return () => {};
  const query = matchMedia(`(max-width: ${maxWidth}px)`);
  const sync = () => store.dispatch(viewportChanged(Boolean(query.matches)));
  sync();
  query.addEventListener?.("change", sync);
  return () => query.removeEventListener?.("change", sync);
}
