import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { DevUxContext, PopoverControllerContext } from "../widget/PopoverControllerContext.js";
import { popoverClosed, popoverClosedIfCurrent, popoverOpened, selectOpenPopoverId, selectPopoverAnchor } from "./Popovers.js";
export function RtkPopoverProvider({ children, devUxEnabled = false }) {
    const dispatch = useDispatch();
    const openId = useSelector(selectOpenPopoverId);
    const anchor = useSelector(selectPopoverAnchor);
    const controller = React.useMemo(() => ({
        openId,
        anchor,
        open(id, popoverAnchor, payload) { dispatch(popoverOpened({ id, anchor: popoverAnchor, payload })); },
        close() { dispatch(popoverClosed()); },
        closeIfCurrent(id) { dispatch(popoverClosedIfCurrent(id)); }
    }), [openId, anchor, dispatch]);
    return (_jsx(DevUxContext.Provider, { value: devUxEnabled, children: _jsx(PopoverControllerContext.Provider, { value: controller, children: children }) }));
}
