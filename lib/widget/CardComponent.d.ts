import React, { type ReactNode } from "react";
import { type ClampToken, type DataAttributes, type StatusTone } from "../layout/layoutShared.js";
export interface CardChip {
    label: string;
    status?: string;
    tooltip?: string;
}
export type CardTag = "article" | "section" | "div";
export type CardHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export interface CardProps {
    id: string;
    title?: string;
    subtitle?: string;
    titleLevel?: CardHeadingLevel;
    /** L3 doctrine: THE glanceable state — an iconized Status in a fixed header slot, visually distinct from taxonomy chips. */
    status?: string;
    chips?: ReadonlyArray<CardChip>;
    /** Visible chip cap (default 2); the rest collapse into a "+N" chip whose title lists them. */
    maxChips?: number;
    /** ISO timestamp — rendered relative + muted in the header, absolute on hover. */
    timestamp?: string;
    /** Demoted provenance footer (ids, hashes — full, copyable, out of the title's line). Entries per RecordMeta. */
    meta?: ReadonlyArray<{
        label: string;
        value: string;
    } | null>;
    actions?: ReactNode;
    maxHeight?: ClampToken;
    tone?: StatusTone;
    children: ReactNode;
    as?: CardTag;
    dataMcComponent?: string;
    data?: DataAttributes;
}
export declare function Card(props: CardProps): React.JSX.Element;
export interface MetricCardProps {
    label: string;
    value: string | number;
    detail?: string;
    dataMcComponent?: string;
}
export declare function MetricCard(props: MetricCardProps): React.JSX.Element;
