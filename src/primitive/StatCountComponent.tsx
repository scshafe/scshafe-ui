import React from "react";
import { Badge } from "./BadgeComponent.js";
import { Status } from "./StatusComponent.js";

// L3 — a state + its count as ONE atom (the StateOverview pattern emitted
// alternating <Status/><Badge/> fragments that could wrap apart mid-pair).
export interface StatCountProps {
  state: string;
  count: number | string;
  tooltip?: unknown;
}

export function StatCount({ state, count, tooltip }: StatCountProps) {
  return (
    <span className="mc-stat-count" data-mc-component="StatCount">
      <Status state={state} tooltip={tooltip as any} />
      <Badge value={count} componentName="StatCountValue" />
    </span>
  );
}
