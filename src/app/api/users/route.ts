import { NextRequest, NextResponse } from "next/server";
import { AdminUser, initialAdminUsers, SUPERADMIN_EMAIL } from "@/lib/adminAuth";
import { fetchSiteSetting, saveSiteSetting } from "@/lib/supabase/data";
import { verifyAuth } from "@/lib/authGuard";

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
      password: u.password ? "••••••••" : undefined,
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

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req, "admin");
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const body = await req.json();
    const currentUsers = await fetchSiteSetting<AdminUser[]>(
      "admin_users",
      initialAdminUsers
    );

    let updatedUsers: AdminUser[];

    if (body.id) {
      // Update existing user
      const exists = currentUsers.some((u) => u.id === body.id);
      if (exists) {
        // Only superadmin can change another user's role to superadmin
        if (body.role === "superadmin" && !auth.user?.isSuperadmin) {
          return NextResponse.json(
            { success: false, error: "Only the superadmin can assign the superadmin role." },
            { status: 403, headers: NO_CACHE_HEADERS }
          );
        }

        updatedUsers = currentUsers.map((u) => {
          if (u.id === body.id) {
            return {
              ...u,
              name: body.name !== undefined ? body.name : u.name,
              email: body.email !== undefined ? body.email : u.email,
              role: body.role !== undefined ? body.role : u.role,
              password: body.password !== undefined && body.password.trim() !== "" ? body.password : u.password,
              isActive: body.isActive !== undefined ? body.isActive : u.isActive,
            };
          }
          return u;
        });
      } else {
        // Create with specified id
        const newUser: AdminUser = {
          id: body.id,
          name: body.name || "Administrator",
          email: body.email || "admin@thorgaktm.org.np",
          role: body.role || "admin",
          password: body.password || "thorga2081@admin",
          addedAt: body.addedAt || new Date().toISOString().split("T")[0],
          addedBy: auth.user?.name || "Superadmin",
          isActive: body.isActive !== undefined ? body.isActive : true,
        };
        updatedUsers = [newUser, ...currentUsers];
      }
    } else {
      // Create new user
      const newUser: AdminUser = {
        id: `usr-${Date.now()}`,
        name: body.name || "Administrator",
        email: body.email || "admin@thorgaktm.org.np",
        role: body.role || "admin",
        password: body.password || "thorga2081@admin",
        addedAt: new Date().toISOString().split("T")[0],
        addedBy: auth.user?.name || "Superadmin",
        isActive: true,
      };
      updatedUsers = [newUser, ...currentUsers];
    }

    await saveSiteSetting("admin_users", updatedUsers);

    const sanitized = updatedUsers.map((u) => ({
      ...u,
      password: u.password ? "••••••••" : undefined,
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
      password: u.password ? "••••••••" : undefined,
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
