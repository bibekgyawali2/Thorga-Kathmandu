import { NextRequest, NextResponse } from "next/server";
import { AdminUser, initialAdminUsers, SUPERADMIN_EMAIL } from "@/lib/adminAuth";
import { fetchSiteSetting, saveSiteSetting } from "@/lib/supabase/data";
import { verifyAuth } from "@/lib/authGuard";
import { hashPassword } from "@/lib/password";
import { isValidEmail } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const users = await fetchSiteSetting<AdminUser[]>(
      "admin_users",
      initialAdminUsers
    );
    // Sanitize passwords from response
    const sanitized = users.map((u) => ({
      ...u,
      password: undefined,
      hasPassword: Boolean(u.password),
    }));
    return NextResponse.json(sanitized, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("Failed to fetch admin users:", error);
    return NextResponse.json(initialAdminUsers, {
      status: 500,
      headers: NO_CACHE_HEADERS,
    });
  }
}

const VALID_ROLES = ["superadmin", "admin", "editor"] as const;
type ValidRole = (typeof VALID_ROLES)[number];

function isValidRole(role: unknown): role is ValidRole {
  return typeof role === "string" && (VALID_ROLES as readonly string[]).includes(role);
}

function superadminEmail(): string {
  return (
    process.env.SUPERADMIN_EMAIL ||
    process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL ||
    SUPERADMIN_EMAIL
  ).toLowerCase();
}

function isProtectedSuperadmin(user: AdminUser): boolean {
  return (
    user.id === "usr-superadmin" ||
    (user.email || "").toLowerCase() === superadminEmail()
  );
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req, "admin");
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const isSuperadminCaller = auth.user?.isSuperadmin === true;

    if (body.role !== undefined && !isValidRole(body.role)) {
      return NextResponse.json(
        { success: false, error: "Unknown role." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // Only the superadmin may grant the superadmin role.
    if (body.role === "superadmin" && !isSuperadminCaller) {
      return NextResponse.json(
        { success: false, error: "Only the superadmin can assign the superadmin role." },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    if (body.email !== undefined && !isValidEmail(String(body.email))) {
      return NextResponse.json(
        { success: false, error: "A valid email address is required." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const rawPassword =
      typeof body.password === "string" && body.password.trim() !== ""
        ? body.password.trim()
        : null;

    if (rawPassword && rawPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters long." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // Hashed once here so no plaintext ever reaches storage.
    const hashed = rawPassword ? await hashPassword(rawPassword) : null;

    const currentUsers = await fetchSiteSetting<AdminUser[]>(
      "admin_users",
      initialAdminUsers
    );

    let updatedUsers: AdminUser[];

    const existing = body.id ? currentUsers.find((u) => u.id === body.id) : undefined;

    if (existing) {
      // A non-superadmin cannot modify the protected superadmin account.
      if (isProtectedSuperadmin(existing) && !isSuperadminCaller) {
        return NextResponse.json(
          { success: false, error: "Only the superadmin can modify this account." },
          { status: 403, headers: NO_CACHE_HEADERS }
        );
      }

      // The protected superadmin cannot be demoted or deactivated, which would
      // otherwise leave the installation with no way back in.
      const demoting = body.role !== undefined && body.role !== "superadmin";
      const deactivating = body.isActive === false;
      if (isProtectedSuperadmin(existing) && (demoting || deactivating)) {
        return NextResponse.json(
          {
            success: false,
            error: "The primary superadmin account cannot be demoted or deactivated.",
          },
          { status: 403, headers: NO_CACHE_HEADERS }
        );
      }

      updatedUsers = currentUsers.map((u) =>
        u.id === body.id
          ? {
              ...u,
              name: body.name !== undefined ? String(body.name) : u.name,
              email: body.email !== undefined ? String(body.email) : u.email,
              role: body.role !== undefined ? (body.role as AdminUser["role"]) : u.role,
              password: hashed ?? u.password,
              isActive: body.isActive !== undefined ? Boolean(body.isActive) : u.isActive,
            }
          : u
      );
    } else {
      if (!body.name || !body.email) {
        return NextResponse.json(
          { success: false, error: "Name and email are required to create an account." },
          { status: 400, headers: NO_CACHE_HEADERS }
        );
      }

      const email = String(body.email).toLowerCase();
      if (currentUsers.some((u) => (u.email || "").toLowerCase() === email)) {
        return NextResponse.json(
          { success: false, error: "An account with that email already exists." },
          { status: 409, headers: NO_CACHE_HEADERS }
        );
      }

      // A new account with no password is created inactive: it cannot be signed
      // into until the superadmin sets one.
      const newUser: AdminUser = {
        id: typeof body.id === "string" && body.id ? body.id : `usr-${Date.now()}`,
        name: String(body.name),
        email: String(body.email),
        role: isValidRole(body.role) ? body.role : "editor",
        password: hashed ?? undefined,
        addedAt: new Date().toISOString().split("T")[0],
        addedBy: auth.user?.name || "Administrator",
        isActive: hashed ? body.isActive !== false : false,
      };
      updatedUsers = [newUser, ...currentUsers];
    }

    await saveSiteSetting("admin_users", updatedUsers);

    const sanitized = updatedUsers.map((u) => ({
      ...u,
      password: undefined,
      hasPassword: Boolean(u.password),
    }));

    return NextResponse.json(
      { success: true, users: sanitized },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error("Failed to save admin user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save user." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await verifyAuth(req, "superadmin");
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "User ID is required." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const currentUsers = await fetchSiteSetting<AdminUser[]>(
      "admin_users",
      initialAdminUsers
    );

    const target = currentUsers.find((u) => u.id === id);

    if (
      target &&
      (target.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ||
        target.id === "usr-superadmin")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete the primary system superadmin account.",
        },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    const updatedUsers = currentUsers.filter((u) => u.id !== id);
    await saveSiteSetting("admin_users", updatedUsers);

    const sanitized = updatedUsers.map((u) => ({
      ...u,
      password: undefined,
      hasPassword: Boolean(u.password),
    }));

    return NextResponse.json(
      { success: true, users: sanitized },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error("Failed to delete admin user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete user." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
