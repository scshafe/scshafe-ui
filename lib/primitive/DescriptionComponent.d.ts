/**
 * Helper / descriptive text primitive. Pairs with Label above and a field
 * control beside; also used standalone under section Titles or inside
 * Cards.
 *
 * Props:
 *  - children: descriptive text
 *  - tone: default | muted (default "muted")
 *  - tooltip: tooltip metadata object or string
 */
export function Description({ children, tone, tooltip }: {
    children: any;
    tone?: string | undefined;
    tooltip?: null | undefined;
}): React.JSX.Element;
import React from "react";
