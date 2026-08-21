export type AdminRole = "superadmin" | "admin" | "editor";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  password?: string;
  addedAt: string;
  addedBy: string;
  isActive: boolean;
}

export interface AdminSession {
  isAuthenticated: boolean;
  username: string;
  email: string;
  role: AdminRole;
  isSuperadmin: boolean;
  loginTime: number;
}

export const SUPERADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL ||
  process.env.SUPERADMIN_EMAIL ||
  "superadmin@thorgaktm.org.np";

const ADMIN_USERS_STORAGE_KEY = "thorga_admin_users";
const ADMIN_SESSION_STORAGE_KEY = "thorga_admin_session";

export const DEFAULT_ADMIN_CONFIG = {
  username: process.env.NEXT_PUBLIC_ADMIN_USERNAME || "admin",
  password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "thorga2081@admin",
  superadminEmail: SUPERADMIN_EMAIL,
};

export const initialAdminUsers: AdminUser[] = [
  {
    id: "usr-superadmin",
    name: "System Superadmin",
    email: SUPERADMIN_EMAIL,
    role: "superadmin",
    password: DEFAULT_ADMIN_CONFIG.password,
    addedAt: "2026-08-01",
    addedBy: "System Environment",
    isActive: true,
  },
  {
    id: "usr-general-admin",
    name: "Forum Administrator",
    email: "admin@thorgaktm.org.np",
    role: "admin",
    password: DEFAULT_ADMIN_CONFIG.password,
    addedAt: "2026-08-15",
    addedBy: SUPERADMIN_EMAIL,
    isActive: true,
  },
];

export function getAdminUsers(): AdminUser[] {
  if (typeof window === "undefined") return initialAdminUsers;
  try {
    const raw = localStorage.getItem(ADMIN_USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(initialAdminUsers));
      return initialAdminUsers;
    }
    const users: AdminUser[] = JSON.parse(raw);
    const hasSuperadmin = users.some(
      (u) => u.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()
    );
    if (!hasSuperadmin) {
      const superUser: AdminUser = {
        id: "usr-superadmin",
        name: "System Superadmin",
        email: SUPERADMIN_EMAIL,
        role: "superadmin",
        password: DEFAULT_ADMIN_CONFIG.password,
        addedAt: new Date().toISOString().split("T")[0],
        addedBy: "Environment Config",
        isActive: true,
      };
      const updated = [superUser, ...users];
      localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }
    return users;
  } catch {
    return initialAdminUsers;
  }
}

export function saveAdminUsers(users: AdminUser[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {}
}

export function addAdminUser(
  newUser: Omit<AdminUser, "id" | "addedAt">
): AdminUser {
  const users = getAdminUsers();
  const created: AdminUser = {
    id: `usr-${Date.now()}`,
    ...newUser,
    addedAt: new Date().toISOString().split("T")[0],
  };
  const updated = [created, ...users];
  saveAdminUsers(updated);
  return created;
}

export function removeAdminUser(
  id: string,
  currentSessionEmail: string
): { success: boolean; message?: string } {
  const isSuperadmin =
    currentSessionEmail.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ||
    currentSessionEmail.toLowerCase() === "admin@thorgaktm.org.np" ||
    getAdminSession()?.isSuperadmin === true;
  if (!isSuperadmin) {
    return {
      success: false,
      message: "Only the superadmin can remove administrative users.",
    };
  }

  const users = getAdminUsers();
  const target = users.find((u) => u.id === id);
  if (!target) {
    return { success: false, message: "User not found." };
  }
  if (
    target.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ||
    target.id === "usr-superadmin"
  ) {
    return {
      success: false,
      message:
        "Cannot remove the primary superadmin account configured in the environment.",
    };
  }

  const updated = users.filter((u) => u.id !== id);
  saveAdminUsers(updated);
  return { success: true };
}

export function toggleAdminUserStatus(
  id: string,
  currentSessionEmail: string
): { success: boolean; message?: string } {
  const isSuperadmin =
    currentSessionEmail.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ||
    currentSessionEmail.toLowerCase() === "admin@thorgaktm.org.np" ||
    getAdminSession()?.isSuperadmin === true;
  if (!isSuperadmin) {
    return {
      success: false,
      message: "Only the superadmin can change user access status.",
    };
  }

  const users = getAdminUsers();
  const target = users.find((u) => u.id === id);
  if (!target) {
    return { success: false, message: "User not found." };
  }
  if (
    target.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ||
    target.id === "usr-superadmin"
  ) {
    return {
      success: false,
      message: "Cannot deactivate the primary superadmin account.",
    };
  }

  const updated = users.map((u) =>
    u.id === id ? { ...u, isActive: !u.isActive } : u
  );
  saveAdminUsers(updated);
  return { success: true };
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: AdminSession = JSON.parse(raw);
    if (Date.now() - session.loginTime > 24 * 60 * 60 * 1000) {
      sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      return null;
    }
    // Dynamically ensure superadmin status for environment credentials and superadmin roles
    const isSuper =
      session.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ||
      session.email.toLowerCase() === "admin@thorgaktm.org.np" ||
      session.username.toLowerCase() === DEFAULT_ADMIN_CONFIG.username.toLowerCase() ||
      session.role === "superadmin";
    if (isSuper && (!session.isSuperadmin || session.role !== "superadmin")) {
      session.isSuperadmin = true;
      session.role = "superadmin";
      sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
    }
    return session;
  } catch {
    return null;
  }
}

export function setAdminSession(user: AdminUser): void {
  if (typeof window === "undefined") return;
  const isSuper =
    user.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ||
    user.email.toLowerCase() === "admin@thorgaktm.org.np" ||
    user.role === "superadmin" ||
    user.id === "usr-superadmin";
  const session: AdminSession = {
    isAuthenticated: true,
    username: user.name,
    email: user.email,
    role: isSuper ? "superadmin" : user.role,
    isSuperadmin: isSuper,
    loginTime: Date.now(),
  };
  sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
}

export function verifyAdminCredentials(
  identifier: string,
  pass: string
): { success: boolean; user?: AdminUser; message?: string } {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = pass.trim();

  // 1. Direct superadmin check or default admin username
  if (
    cleanId === SUPERADMIN_EMAIL.toLowerCase() ||
    cleanId === DEFAULT_ADMIN_CONFIG.username.toLowerCase()
  ) {
    if (cleanPass === DEFAULT_ADMIN_CONFIG.password) {
      const superUser: AdminUser = {
        id: "usr-superadmin",
        name:
          cleanId === SUPERADMIN_EMAIL.toLowerCase()
            ? "System Superadmin"
            : "Forum Superadmin",
        email:
          cleanId === SUPERADMIN_EMAIL.toLowerCase()
            ? SUPERADMIN_EMAIL
            : "admin@thorgaktm.org.np",
        role: "superadmin",
        addedAt: "2026-08-01",
        addedBy: "System",
        isActive: true,
      };
      return { success: true, user: superUser };
    }
  }

  // 2. Check dynamic admin user list
  const users = getAdminUsers();
  const matchedUser = users.find(
    (u) =>
      u.email.toLowerCase() === cleanId || u.name.toLowerCase() === cleanId
  );

  if (matchedUser) {
    if (!matchedUser.isActive) {
      return {
        success: false,
        message:
          "This administrative account has been deactivated. Please contact the superadmin.",
      };
    }
    const userPass = matchedUser.password || DEFAULT_ADMIN_CONFIG.password;
    if (cleanPass === userPass) {
      return { success: true, user: matchedUser };
    }
  }

  return { success: false, message: "Invalid credentials." };
}
