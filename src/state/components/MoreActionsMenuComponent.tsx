import React from "react";
import { useDispatch } from "react-redux";
import { useIcon } from "../../widget/IconContext.js";
import { popoverClosed, popoverOpened } from "../Popovers.js";
import { HoverButton } from "../../primitive/HoverButtonComponent.js";
import { Popover } from "../../widget/PopoverComponent.js";
import { type ContextMenuItem } from "./ContextMenuComponent.js";

export interface MoreActionsMenuProps {
  id: string;
  items: ReadonlyArray<ContextMenuItem>;
  label?: string;
  icon?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

// Click-triggered dropdown of menu items. Pairs a hover-revealed icon
// button (kebab / 3-dots by default) with a Popover anchored to the
// button's bounding rect. Items render with the same .mc-context-menu
// CSS as the right-click ContextMenu, so the action list looks
// consistent across triggers.
//
// Parent must carry `mc-hover-host` so the trigger button only shows on
// hover or focus-within.
export function MoreActionsMenu({
  id,
  items,
  label = "More actions",
  icon = "action.more",
  ariaLabel,
  disabled
}: MoreActionsMenuProps) {
  const dispatch = useDispatch();
  const renderIcon = useIcon();
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    if (disabled || items.length === 0) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    dispatch(popoverOpened({ id, anchor: { x: rect.right, y: rect.bottom } }));
  };

  // Attach the ref via wrapping span — HoverButton doesn't forward refs.
  return (
    <span ref={(node) => { buttonRef.current = node as unknown as HTMLButtonElement | null; }} data-mc-popover-anchor="">
      <HoverButton
        icon={icon}
        label={label}
        size="lg"
        disabled={disabled}
        onClick={handleClick}
        dataMcComponent="MoreActionsMenuTrigger"
      />
      <Popover id={id} side="bottom" ariaLabel={ariaLabel ?? label}>
        <ul className="mc-context-menu" role="menu">
          {items.map((item, index) => (
            <li key={`${item.label}:${index}`} role="none">
              <button
                type="button"
                role="menuitem"
                className={`mc-context-menu-item${item.danger ? " mc-context-menu-item--danger" : ""}`}
                disabled={item.disabled}
                onClick={(event) => {
                  event.stopPropagation();
                  if (item.disabled) return;
                  dispatch(popoverClosed());
                  item.action();
                }}
              >
                {item.icon ? renderIcon(item.icon, { size: 12, "aria-hidden": "true" }) : null}
                <span className="mc-context-menu-item-label">{item.label}</span>
                {item.kbd ? <span className="mc-context-menu-item-kbd">{item.kbd}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </Popover>
    </span>
  );
}
