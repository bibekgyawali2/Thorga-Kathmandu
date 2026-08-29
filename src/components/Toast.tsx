"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckCircle, WarningCircle, Info, X, Warning } from "@phosphor-icons/react";

export type ToastTone = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Milliseconds before auto dismissal. Pass 0 to require a manual close. */
  duration?: number;
}

interface ToastRecord extends Required<Omit<ToastOptions, "description">> {
  id: number;
  description?: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => number;
  success: (title: string, description?: string) => number;
  error: (title: string, description?: string) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside a ToastProvider.");
  }
  return ctx;
}

const TONE_ICON = {
  success: CheckCircle,
  error: WarningCircle,
  warning: Warning,
  info: Info,
} as const;

const DEFAULT_DURATION = 5000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = nextId.current++;
      const record: ToastRecord = {
        id,
        title: options.title,
        description: options.description,
        tone: options.tone ?? "info",
        duration: options.duration ?? DEFAULT_DURATION,
      };

      // Cap the stack so a burst of failures cannot cover the page.
      setToasts((current) => [...current.slice(-3), record]);

      if (record.duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), record.duration)
        );
      }
      return id;
    },
    [dismiss]
  );

  const success = useCallback(
    (title: string, description?: string) => toast({ title, description, tone: "success" }),
    [toast]
  );

  const error = useCallback(
    // Failures stay longer: the reader needs time to act on them.
    (title: string, description?: string) =>
      toast({ title, description, tone: "error", duration: 8000 }),
    [toast]
  );

  // Clear every pending timer if the provider unmounts.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const value = useMemo(
    () => ({ toast, success, error, dismiss }),
    [toast, success, error, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        // polite rather than assertive: a confirmation should not interrupt a
        // screen reader mid-sentence.
        role="status"
        aria-live="polite"
        aria-atomic="false"
        className="fixed z-[100] bottom-4 right-4 left-4 sm:left-auto sm:w-[380px] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((item) => {
          const Icon = TONE_ICON[item.tone];
          return (
            <div
              key={item.id}
              className="toast-item pointer-events-auto rounded-card border border-line bg-surface shadow-e2 p-4 flex items-start gap-3"
            >
              <Icon
                size={20}
                weight="duotone"
                className={
                  item.tone === "error" || item.tone === "warning"
                    ? "text-danger flex-shrink-0 mt-0.5"
                    : "text-accent flex-shrink-0 mt-0.5"
                }
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-fg">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-muted leading-relaxed mt-0.5">{item.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
                className="p-1 rounded-chip text-muted hover:text-fg hover:bg-tint transition-colors flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
