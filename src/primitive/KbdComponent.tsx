import React from "react";

export interface KbdProps {
  children?: React.ReactNode;
  keys?: ReadonlyArray<string>;
  ariaLabel?: string;
}

export function Kbd({ children, keys, ariaLabel }: KbdProps) {
  if (keys && keys.length > 0) {
    const label = ariaLabel ?? keys.join(" + ");
    return (
      <span className="sui-kbd-combo" data-sui-component="Kbd" aria-label={label}>
        {keys.map((key, index) => (
          <kbd key={`${key}:${index}`} className="sui-kbd">{key}</kbd>
        ))}
      </span>
    );
  }
  return (
    <kbd className="sui-kbd" data-sui-component="Kbd" aria-label={ariaLabel}>{children}</kbd>
  );
}
