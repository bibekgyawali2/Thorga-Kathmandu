export interface AdminSession {
  isAuthenticated: boolean;
  username: string;
  loginTime: number;
}

const ADMIN_STORAGE_KEY = "thorga_admin_session";

// Default admin credentials (Can be changed in environment variables or Admin Settings)
export const DEFAULT_ADMIN_CONFIG = {
  username: process.env.NEXT_PUBLIC_ADMIN_USERNAME || "admin",
  password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "thorga2081@admin",
};

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return null;
    const session: AdminSession = JSON.parse(raw);
    // 24-hour expiration
    if (Date.now() - session.loginTime > 24 * 60 * 60 * 1000) {
      sessionStorage.removeItem(ADMIN_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function setAdminSession(username: string): void {
  if (typeof window === "undefined") return;
  const session: AdminSession = {
    isAuthenticated: true,
    username,
    loginTime: Date.now(),
  };
  sessionStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(session));
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ADMIN_STORAGE_KEY);
}

export function verifyAdminCredentials(user: string, pass: string): boolean {
  return (
    user.trim() === DEFAULT_ADMIN_CONFIG.username &&
    pass.trim() === DEFAULT_ADMIN_CONFIG.password
  );
}
