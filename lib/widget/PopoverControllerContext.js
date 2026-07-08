import React from "react";
// Default = an inert no-op controller. A component rendered with NO provider
// (a standalone consumer that forgot to mount one, or a window-less SSR/test
// render) simply never opens a popover rather than crashing. This is the
// closed-state behavior, byte-identical to the old `openId === null` path. MC
// always mounts RtkPopoverProvider at the app root; the package default is
// LocalPopoverProvider.
const NOOP_POPOVER_CONTROLLER = {
    openId: null,
    anchor: null,
    open() { },
    close() { },
    closeIfCurrent() { }
};
export const PopoverControllerContext = React.createContext(NOOP_POPOVER_CONTROLLER);
// dev-ux gating (MC's DevUxManager slice; standalone default = off). Kept as a
// SEPARATE context from the controller: it changes on a different cadence
// (essentially never at runtime) than the popover open/close state, so a
// tooltip re-render on popover open does not churn on devUx and vice-versa.
export const DevUxContext = React.createContext(false);
export function usePopoverController() {
    return React.useContext(PopoverControllerContext);
}
export function useDevUxEnabled() {
    return React.useContext(DevUxContext);
}
