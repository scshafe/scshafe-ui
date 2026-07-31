import React from "react";
export interface UseInfiniteScrollOptions {
    onLoadMore: () => void;
    disabled?: boolean;
    /** Pre-trigger margin handed to IntersectionObserver (default "600px 0px" — load before the viewer hits the end). */
    rootMargin?: string;
    /** Scroll container to observe within; omit for the viewport. */
    root?: React.RefObject<Element | null>;
}
export declare function useInfiniteScroll({ onLoadMore, disabled, rootMargin, root }: UseInfiniteScrollOptions): (node: HTMLElement | null) => void;
export interface InfiniteScrollSentinelProps extends UseInfiniteScrollOptions {
    /** Host-rendered status line ("Showing 300 of 2,433", "Loading…"); the sentinel itself is chromeless. */
    children?: React.ReactNode;
    className?: string;
}
export declare function InfiniteScrollSentinel({ children, className, ...options }: InfiniteScrollSentinelProps): React.JSX.Element;
