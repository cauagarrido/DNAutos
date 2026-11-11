import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onCloseRef.current();
      }
      if (e.key === "Tab" && isOpen) {
        const controls = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled),a[href],input:not(:disabled),select,textarea,[tabindex="0"]',
          ) ?? [],
        );
        const first = controls[0],
          last = controls[controls.length - 1];
        if (!first) {
          e.preventDefault();
          return;
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
      const input = dialogRef.current?.querySelector<HTMLElement>(
        'input:not([type="checkbox"]):not(:disabled),select:not(:disabled),textarea:not(:disabled)',
      );
      (
        input ?? dialogRef.current?.querySelector<HTMLElement>("button")
      )?.focus();
    }
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      if (isOpen) previousFocus?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
  };

  return (
    <div className="modal-shell">
      {/* Backdrop */}
      <div className="modal-scrim" onClick={onClose} />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className={`modal-panel ${maxWidthStyles[maxWidth]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <span className="eyebrow">DNAUTOS VISTORIAS</span>
            <div id={titleId} className="modal-title">
              {title}
            </div>
          </div>
          <button onClick={onClose} className="icon-button" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};
