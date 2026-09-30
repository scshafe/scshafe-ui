import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { resolveConfirmThunk, selectConfirmDialog } from "../ConfirmDialog.js";
import { Kbd } from "../../primitive/KbdComponent.js";
import { Sheet, SheetBody, SheetFooter, SheetHeader } from "../../widget/SheetComponent.js";

interface ConfirmDialogState {
  open: boolean;
  prompt: {
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    kind: "danger" | "default";
  } | null;
}

// Exported as ConfirmDialogComponent — the ConfirmDialog SLICE owns the bare name in
// the @scshafe/ui/state barrel; hosts alias on re-export (data-sui-component stays "ConfirmDialog").
export function ConfirmDialogComponent() {
  const { open, prompt } = useSelector(selectConfirmDialog) as ConfirmDialogState;
  const dispatch: any = useDispatch(); // thunk-capable store assumed (createSuiStore default middleware)

  if (!open || !prompt) return null;

  const handleConfirm = () => dispatch(resolveConfirmThunk(true));
  const handleCancel = () => dispatch(resolveConfirmThunk(false));
  const confirmClass = prompt.kind === "danger" ? "sui-button sui-button-danger" : "sui-button sui-button-primary";

  return (
    <Sheet
      open
      onClose={handleCancel}
      side="center"
      dataSuiComponent="ConfirmDialog"
      ariaLabel={prompt.title || prompt.message}
    >
      <SheetHeader title={prompt.title || "Confirm"} description={prompt.message} />
      <SheetBody>{null}</SheetBody>
      <SheetFooter>
        <button type="button" className={confirmClass} onClick={handleConfirm} autoFocus>
          {prompt.confirmLabel}
        </button>
        <button type="button" className="sui-button sui-button-ghost" onClick={handleCancel}>
          {prompt.cancelLabel} <Kbd>Esc</Kbd>
        </button>
      </SheetFooter>
    </Sheet>
  );
}
