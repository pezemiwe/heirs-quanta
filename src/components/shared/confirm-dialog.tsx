import { Modal } from "./modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
}

/** Reusable confirm/cancel dialog built on the shared Modal — use this instead
 * of window.confirm() for any destructive or hard-to-reverse action. */
export function ConfirmDialog({
  isOpen,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-dark-gray hover:bg-gray-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              tone === "danger"
                ? "rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                : "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-mid-red"
            }
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      {description && <p className="text-sm text-dark-gray/60">{description}</p>}
    </Modal>
  );
}
