import React from "react";
import { Inline } from "../layout/InlineComponent.js";
import { type StatusTone } from "../layout/layoutShared.js";
import { toneByState } from "../format.js";

export interface ChipListItem {
  label: string;
  tooltip?: string;
  status?: string;
}

export interface ChipListProps {
  items: ReadonlyArray<ChipListItem>;
  dataMcComponent?: string;
}

function chipTone(status: string | undefined): StatusTone | undefined {
  if (!status) return undefined;
  const tone = toneByState.get(status);
  return typeof tone === "string" ? (tone as StatusTone) : undefined;
}

export function ChipList(props: ChipListProps) {
  const { items, dataMcComponent = "ChipList" } = props;
  return (
    <Inline wrap gap="xs" dataMcComponent={dataMcComponent}>
      {items.map((item) => {
        const tone = chipTone(item.status);
        return (
          <code
            key={item.label}
            className="mc-chip"
            data-mc-chip-tone={tone}
            title={item.tooltip}
          >
            {item.label}
          </code>
        );
      })}
    </Inline>
  );
}
