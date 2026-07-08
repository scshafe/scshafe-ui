import React, { useEffect, useRef } from "react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: "right" | "center";
  ariaLabel?: string;
  dataMcComponent?: string;
  children: React.ReactNode;
}

// Native `<dialog>` wrapper for slide-in editor panels and centered modals.
// The "open" state lives in RTK (per-editor slice for edit forms, ConfirmDialog
// slice for confirms); this component just owns the imperative showModal /
// close on the underlying DOM element. When closed, the entire dialog (and
// its subtree) unmounts — tearing down hidden DOM per the project rule.
export function Sheet({ open, onClose, side = "right", ariaLabel, dataMcComponent = "Sheet", children }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) {
      dialog.showModal();
    }
  }, []);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className={`mc-sheet mc-sheet--${side}`}
      data-mc-component={dataMcComponent}
      aria-label={ariaLabel}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {children}
    </dialog>
  );
}

interface SheetHeaderProps { title: string; description?: string; }

export function SheetHeader({ title, description }: SheetHeaderProps) {
  return (
    <header className="mc-sheet__header">
      <h2 className="mc-sheet__title">{title}</h2>
      {description ? <p className="mc-sheet__description">{description}</p> : null}
    </header>
  );
}

export function SheetBody({ children }: { children: React.ReactNode }) {
  return <div className="mc-sheet__body">{children}</div>;
}

export function SheetFooter({ children }: { children: React.ReactNode }) {
  return <footer className="mc-sheet__footer">{children}</footer>;
}
