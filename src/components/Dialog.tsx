"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  CheckCircle,
  WarningCircle,
  WarningOctagon,
  Info,
} from "@phosphor-icons/react";

export type DialogType = "info" | "success" | "warning" | "danger";

export interface DialogOptions {
  title: string;
  description?: string | React.ReactNode;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface DialogContextValue {
  showDialog: (options: DialogOptions) => Promise<boolean>;
  confirm: (options: Omit<DialogOptions, "showCancel">) => Promise<boolean>;
  alert: (options: Omit<DialogOptions, "showCancel" | "cancelText">) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog(): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    options: DialogOptions;
    resolve?: (value: boolean) => void;
  }>({
    isOpen: false,
    options: { title: "" },
  });

  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const showDialog = useCallback((options: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const confirm = useCallback(
    (options: Omit<DialogOptions, "showCancel">): Promise<boolean> => {
      return showDialog({
        showCancel: true,
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        ...options,
      });
    },
    [showDialog]
  );

  const alert = useCallback(
    (options: Omit<DialogOptions, "showCancel" | "cancelText">): Promise<boolean> => {
      return showDialog({
        showCancel: false,
        confirmText: options.confirmText || "OK",
        ...options,
      });
    },
    [showDialog]
  );

  const handleClose = (result: boolean) => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    if (dialogState.resolve) {
      dialogState.resolve(result);
    }
    if (result && dialogState.options.onConfirm) {
      dialogState.options.onConfirm();
    } else if (!result && dialogState.options.onCancel) {
      dialogState.options.onCancel();
    }
  };

  // Handle ESC key and Auto focus
  useEffect(() => {
    if (!dialogState.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const timer = setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [dialogState.isOpen]);

  const { options, isOpen } = dialogState;
  const type = options.type || "info";

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle size={24} className="text-emerald-500 flex-shrink-0" weight="fill" />;
      case "warning":
        return <WarningCircle size={24} className="text-amber-500 flex-shrink-0" weight="fill" />;
      case "danger":
        return <WarningOctagon size={24} className="text-red-500 flex-shrink-0" weight="fill" />;
      case "info":
      default:
        return <Info size={24} className="text-accent flex-shrink-0" weight="fill" />;
    }
  };

  const getConfirmBtnClass = () => {
    switch (type) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white";
      case "warning":
        return "bg-amber-600 hover:bg-amber-700 text-white";
      case "success":
        return "bg-emerald-600 hover:bg-emerald-700 text-white";
      case "info":
      default:
        return "bg-accent hover:bg-accent-hover text-on-accent";
    }
  };

  return (
    <DialogContext.Provider value={{ showDialog, confirm, alert }}>
      {children}

      {/* DIALOG MODAL BACKDROP */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border border-line rounded-card max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-control bg-tint border border-line flex items-center justify-center">
                {getIcon()}
              </div>

              <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
                <h3 id="dialog-title" className="text-base font-bold text-fg leading-snug">
                  {options.title}
                </h3>
                {options.description && (
                  <div className="text-xs leading-relaxed text-muted">
                    {options.description}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleClose(false)}
                className="p-1 rounded-control text-muted hover:text-fg hover:bg-tint transition-colors"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line">
              {options.showCancel && (
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="px-4 py-2 rounded-control text-xs font-semibold border border-line bg-ground hover:bg-tint text-fg transition-colors"
                >
                  {options.cancelText || "Cancel"}
                </button>
              )}

              <button
                type="button"
                ref={confirmBtnRef}
                onClick={() => handleClose(true)}
                className={`px-5 py-2 rounded-control text-xs font-semibold shadow-sm transition-colors ${getConfirmBtnClass()}`}
              >
                {options.confirmText || (options.showCancel ? "Confirm" : "OK")}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

/**
 * Standalone Declarative Dialog Component
 */
export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  type = "info",
  showCancel = true,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string | React.ReactNode;
  type?: DialogType;
  showCancel?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  children?: React.ReactNode;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle size={24} className="text-emerald-500 flex-shrink-0" weight="fill" />;
      case "warning":
        return <WarningCircle size={24} className="text-amber-500 flex-shrink-0" weight="fill" />;
      case "danger":
        return <WarningOctagon size={24} className="text-red-500 flex-shrink-0" weight="fill" />;
      case "info":
      default:
        return <Info size={24} className="text-accent flex-shrink-0" weight="fill" />;
    }
  };

  const getConfirmBtnClass = () => {
    switch (type) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white";
      case "warning":
        return "bg-amber-600 hover:bg-amber-700 text-white";
      case "success":
        return "bg-emerald-600 hover:bg-emerald-700 text-white";
      case "info":
      default:
        return "bg-accent hover:bg-accent-hover text-on-accent";
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-line rounded-card max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-control bg-tint border border-line flex items-center justify-center">
            {getIcon()}
          </div>

          <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
            <h3 className="text-base font-bold text-fg leading-snug">{title}</h3>
            {description && <div className="text-xs leading-relaxed text-muted">{description}</div>}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-control text-muted hover:text-fg hover:bg-tint transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {children && <div>{children}</div>}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line">
          {showCancel && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-control text-xs font-semibold border border-line bg-ground hover:bg-tint text-fg transition-colors"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={`px-5 py-2 rounded-control text-xs font-semibold shadow-sm transition-colors ${getConfirmBtnClass()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
