import { createMcStore, Popovers, Toasts } from "mc-ui/state";
import { ExampleManager } from "./ExampleManager.js";

export function createAppStore(options = {}) {
  return createMcStore({
    slices: [ExampleManager, Popovers, Toasts],
    preloadedState: options.preloadedState
  });
}
