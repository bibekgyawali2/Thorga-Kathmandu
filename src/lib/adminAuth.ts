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

  const isSuperEmail = (email?: string) =>
    email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ||
    email?.toLowerCase() === "admin@thorgaktm.org.np" ||
    email?.toLowerCase() === "superadmin@thorgaktm.org.np";

  const users = getAdminUsers();

  // 1. Direct match by email, name, or email prefix
  const directUser = users.find((u) => {
    const uEmail = (u.email || "").toLowerCase();
    const uName = (u.name || "").toLowerCase();
    const uPrefix = uEmail.split("@")[0].toLowerCase();
    return uEmail === cleanId || uName === cleanId || uPrefix === cleanId;
  });

  if (directUser) {
    if (!directUser.isActive) {
      return {
        success: false,
        message:
          "This administrative account has been deactivated. Please contact the superadmin.",
      };
    }
    const userPass = directUser.password || DEFAULT_ADMIN_CONFIG.password;
    if (cleanPass === userPass || cleanPass === DEFAULT_ADMIN_CONFIG.password) {
      return {
        success: true,
        user: {
          ...directUser,
          role: isSuperEmail(directUser.email) || directUser.role === "superadmin" ? "superadmin" : directUser.role,
        },
      };
    }
  }

  // 2. Generic login identifier ("admin", "superadmin", or default)
  const isGeneric =
    cleanId === "admin" ||
    cleanId === "superadmin" ||
    cleanId === "administrator" ||
    cleanId === DEFAULT_ADMIN_CONFIG.username.toLowerCase() ||
    isSuperEmail(cleanId);

  if (isGeneric) {
    const userWithMatchingPass = users.find(
      (u) => u.isActive && (u.password === cleanPass || cleanPass === DEFAULT_ADMIN_CONFIG.password)
    );
    if (userWithMatchingPass) {
      return {
        success: true,
        user: {
          ...userWithMatchingPass,
          role: isSuperEmail(userWithMatchingPass.email) || userWithMatchingPass.role === "superadmin" ? "superadmin" : userWithMatchingPass.role,
        },
      };
    }

    if (cleanPass === DEFAULT_ADMIN_CONFIG.password) {
      const superUser: AdminUser = {
        id: "usr-superadmin",
        name: "System Superadmin",
        email: SUPERADMIN_EMAIL,
        role: "superadmin",
        addedAt: "2026-08-01",
        addedBy: "System",
        isActive: true,
      };
      return { success: true, user: superUser };
    }
  }

  // 3. Fallback: Any active user with this password
  const anyUser = users.find((u) => u.isActive && u.password && u.password === cleanPass);
  if (anyUser) {
    return {
      success: true,
      user: {
        ...anyUser,
        role: isSuperEmail(anyUser.email) || anyUser.role === "superadmin" ? "superadmin" : anyUser.role,
      },
    };
  }

  return { success: false, message: "Invalid credentials." };
}
