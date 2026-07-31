import { jsx as _jsx } from "react/jsx-runtime";
// P1 (consumers-standalone track) — infinite-scroll pagination seam. Mirrors
// PinnedDataTable's host-owned-state philosophy: the package renders the sentinel and
// reports "the viewer reached it" via an injected callback; the HOST owns every bit of
// paging state (offset / hasMore / inFlight) and does the fetching. No data, no store.
//
// useInfiniteScroll — IntersectionObserver on the returned ref. Fires `onLoadMore` when
// the sentinel enters the (pre-expanded, see rootMargin) viewport, and AGAIN whenever
// `disabled` flips back to false while the sentinel is still visible — that second path is
// what keeps short first pages filling without a scroll event. Hosts set `disabled` while a
// page is in flight or when there is nothing left. Server rendering (no IntersectionObserver)
// degrades to inert markup.
import React from "react";
export function useInfiniteScroll({ onLoadMore, disabled = false, rootMargin = "600px 0px", root }) {
    const [node, setNode] = React.useState(null);
    const intersectingRef = React.useRef(false);
    const onLoadMoreRef = React.useRef(onLoadMore);
    onLoadMoreRef.current = onLoadMore;
    const disabledRef = React.useRef(disabled);
    disabledRef.current = disabled;
    React.useEffect(() => {
        if (!node || typeof IntersectionObserver === "undefined")
            return;
        const observer = new IntersectionObserver((entries) => {
            const entry = entries[entries.length - 1];
            intersectingRef.current = Boolean(entry?.isIntersecting);
            if (intersectingRef.current && !disabledRef.current)
                onLoadMoreRef.current();
        }, { root: root?.current ?? null, rootMargin });
        observer.observe(node);
        return () => {
            intersectingRef.current = false;
            observer.disconnect();
        };
    }, [node, rootMargin, root]);
    // A page landed (disabled -> false) with the sentinel still on screen: keep loading.
    React.useEffect(() => {
        if (!disabled && intersectingRef.current)
            onLoadMoreRef.current();
    }, [disabled]);
    return setNode;
}
export function InfiniteScrollSentinel({ children, className, ...options }) {
    const sentinelRef = useInfiniteScroll(options);
    return (_jsx("div", { ref: sentinelRef, className: ["mc-infinite-sentinel", className].filter(Boolean).join(" "), "data-mc-component": "InfiniteScrollSentinel", role: "status", "aria-live": "polite", children: children }));
}
