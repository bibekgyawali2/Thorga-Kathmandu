import { Language } from "@/data/mockData";
import { AdminSession } from "@/lib/adminAuth";
import { useToast } from "@/components/Toast";

export type AdminTab =
  | "overview"
  | "hero"
  | "members"
  | "publications"
  | "events"
  | "gallery"
  | "inquiries"
  | "settings"
  | "access"
  | "branding"
  | "about"
  | "publication-pages";

export type CommitteeSection =
  | "current"
  | "officials"
  | "advisor"
  | "former-officials"
  | "former-advisors";

export interface DialogAlertOptions {
  title: string;
  description?: string | React.ReactNode;
  type?: "info" | "success" | "warning" | "danger";
  confirmText?: string;
}

export interface DialogConfirmOptions extends DialogAlertOptions {
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export type AdminToast = ReturnType<typeof useToast>;

export interface BaseTabProps {
  lang: Language;
  adminFetch: (url: string, init?: RequestInit) => Promise<Response>;
  dialogAlert: (opts: DialogAlertOptions) => Promise<boolean>;
  dialogConfirm: (opts: DialogConfirmOptions) => Promise<boolean>;
  toast: AdminToast;
  session: AdminSession | null;
  onNavigateTab?: (tab: AdminTab) => void;
}
