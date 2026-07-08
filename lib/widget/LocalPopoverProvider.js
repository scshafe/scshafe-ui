import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { DevUxContext, PopoverControllerContext } from "./PopoverControllerContext.js";
const INITIAL_STATE = { openId: null, anchor: null, payload: null };
// Mirrors state/Popovers.js EXACTLY: single-open (a new open preempts the
// current one; a missing id is ignored); popoverClosed resets everything; the
// SCOPED close is a no-op unless `id` is still the open one — so behavior
// matches the RTK path.
function reduceLocalPopover(state, action) {
    switch (action.type) {
        case "open":
            if (typeof action.id !== "string" || !action.id)
                return state;
            // Default anchor/payload to null to mirror the Popovers slice's
            // `anchor = null, payload = null` destructuring (an undefined arg must
            // land as null, not undefined, so standalone state matches the RTK path).
            return { openId: action.id, anchor: action.anchor ?? null, payload: action.payload ?? null };
        case "close":
            return INITIAL_STATE;
        case "closeIfCurrent":
            if (state.openId !== action.id)
                return state;
            return INITIAL_STATE;
        default:
            return state;
    }
}
export function LocalPopoverProvider({ children }) {
    const [state, dispatch] = React.useReducer(reduceLocalPopover, INITIAL_STATE);
    // The open/close/closeIfCurrent closures capture only the stable useReducer
    // `dispatch`, so the controller identity changes only when openId/anchor do
    // (matches the RTK adapter's memoization).
    const controller = React.useMemo(() => ({
        openId: state.openId,
        anchor: state.anchor,
        open(id, anchor, payload) { dispatch({ type: "open", id, anchor, payload }); },
        close() { dispatch({ type: "close" }); },
        closeIfCurrent(id) { dispatch({ type: "closeIfCurrent", id }); }
    }), [state.openId, state.anchor]);
    return (_jsx(DevUxContext.Provider, { value: false, children: _jsx(PopoverControllerContext.Provider, { value: controller, children: children }) }));
}
