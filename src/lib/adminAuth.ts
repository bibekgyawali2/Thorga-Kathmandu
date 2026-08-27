import { decodeJWT, isJWTExpired } from "./jwt";

export type AdminRole = "superadmin" | "admin" | "editor";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  /**
   * PBKDF2 hash produced by lib/password.ts. Only ever populated on the
   * server. API responses mask this field and the client never receives it.
   */
  password?: string;
  addedAt: string;
  addedBy: string;
  isActive: boolean;
}

export interface AdminSession {
  isAuthenticated: boolean;
  token: string;
  username: string;
  email: string;
  role: AdminRole;
  isSuperadmin: boolean;
  loginTime: number;
  expiresAt: number; // Unix timestamp in milliseconds
}

/**
 * Display-only copy of the superadmin address, used by the admin UI to label
 * the protected account. Authorization decisions are made on the server from
 * process.env.SUPERADMIN_EMAIL and the signed JWT claims, never from this.
 */
export const SUPERADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL || "superadmin@thorgaktm.org.np";

const ADMIN_USERS_STORAGE_KEY = "thorga_admin_users";
export const ADMIN_SESSION_STORAGE_KEY = "thorga_admin_session";
export const ADMIN_AUTH_SYNC_EVENT = "thorga_admin_auth_sync";

/**
 * Seed roster used when the database has no admin_users record yet.
 * Deliberately carries no password: an account only becomes usable once a
 * password is set through the admin API, which hashes it before storage.
 */
export const initialAdminUsers: AdminUser[] = [
  {
    id: "usr-superadmin",
    name: "System Superadmin",
    email: SUPERADMIN_EMAIL,
    role: "superadmin",
    addedAt: "2026-08-01",
    addedBy: "System Environment",
    isActive: true,
  },
];

/** Local cache of the roster for the admin UI. Never holds password material. */
export function getAdminUsers(): AdminUser[] {
  if (typeof window === "undefined") return initialAdminUsers;
  try {
    const raw = localStorage.getItem(ADMIN_USERS_STORAGE_KEY);
    if (!raw) return initialAdminUsers;
    const users: AdminUser[] = JSON.parse(raw);
    if (!Array.isArray(users)) return initialAdminUsers;
    return users.map((u) => ({ ...u, password: undefined }));
  } catch {
    return initialAdminUsers;
  }
}

export function saveAdminUsers(users: AdminUser[]): void {
  if (typeof window === "undefined") return;
  try {
    const stripped = users.map((u) => ({ ...u, password: undefined }));
    localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(stripped));
  } catch {
    // Storage unavailable. The API remains the source of truth.
  }
}

// ---------------------------------------------------------------------------
// Session management
//
// The signed JWT is the only authority on identity and role. Everything below
// reads its claims rather than trusting the values written into storage, so a
// visitor editing localStorage cannot promote themselves in the UI, and the
// server would reject the forged claim regardless.
// ---------------------------------------------------------------------------

let sessionListeners: Array<(session: AdminSession | null) => void> = [];

export function subscribeAdminSession(callback: (session: AdminSession | null) => void) {
  sessionListeners.push(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === ADMIN_SESSION_STORAGE_KEY || e.key === ADMIN_AUTH_SYNC_EVENT) {
      callback(getAdminSession());
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    sessionListeners = sessionListeners.filter((l) => l !== callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function notifySessionChange(session: AdminSession | null) {
  sessionListeners.forEach((l) => {
    try {
      l(session);
    } catch {
      // A failing subscriber must not stop the others from being notified.
    }
  });
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY) ||
      localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);

    if (!raw) return null;
    const stored: AdminSession = JSON.parse(raw);

    // A session without a token cannot be trusted at all.
    if (!stored.token || isJWTExpired(stored.token)) {
      clearAdminSession();
      return null;
    }

    const claims = decodeJWT(stored.token);
    if (!claims) {
      clearAdminSession();
      return null;
    }

    if (stored.expiresAt && Date.now() >= stored.expiresAt) {
      clearAdminSession();
      return null;
    }

    // Rebuild from token claims so edited storage cannot change identity.
    return {
      isAuthenticated: true,
      token: stored.token,
      username: claims.name,
      email: claims.email,
      role: claims.role,
      isSuperadmin: claims.isSuperadmin === true,
      loginTime: claims.iat ? claims.iat * 1000 : stored.loginTime,
      expiresAt: claims.exp ? claims.exp * 1000 : stored.expiresAt,
    };
  } catch {
    return null;
  }
}

function saveSessionToStorage(session: AdminSession) {
  try {
    const json = JSON.stringify(session);
    sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, json);
    localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, json);
    localStorage.setItem(ADMIN_AUTH_SYNC_EVENT, Date.now().toString());
  } catch {
    // Storage unavailable. The httpOnly cookie still carries the session.
  }
}

export function setAdminSession(
  user: Partial<AdminUser> & { id: string; name: string; email: string; role?: AdminRole },
  token?: string,
  expSeconds?: number
): AdminSession {
  const claims = token ? decodeJWT(token) : null;

  let expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  if (claims?.exp) {
    expiresAt = claims.exp * 1000;
  } else if (expSeconds) {
    expiresAt = expSeconds * 1000;
  }

  const session: AdminSession = {
    isAuthenticated: true,
    token: token || "",
    username: claims?.name ?? user.name,
    email: claims?.email ?? user.email,
    role: claims?.role ?? user.role ?? "editor",
    isSuperadmin: claims?.isSuperadmin === true,
    loginTime: Date.now(),
    expiresAt,
  };

  saveSessionToStorage(session);
  notifySessionChange(session);
  return session;
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    localStorage.setItem(ADMIN_AUTH_SYNC_EVENT, `logout-${Date.now()}`);
  } catch {
    // Nothing to clear.
  }
  notifySessionChange(null);
}
