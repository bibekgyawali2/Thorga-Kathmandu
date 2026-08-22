import { NextResponse } from "next/server";
import { AdminUser, initialAdminUsers, SUPERADMIN_EMAIL } from "@/lib/adminAuth";
import { fetchSiteSetting, saveSiteSetting } from "@/lib/supabase/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  try {
    const users = await fetchSiteSetting<AdminUser[]>(
      "admin_users",
      initialAdminUsers
    );
    return NextResponse.json(users, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("Failed to fetch admin users:", error);
    return NextResponse.json(initialAdminUsers, {
      status: 500,
      headers: NO_CACHE_HEADERS,
    });
  }
}

export async function POST(req: Request) {
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
          addedBy: body.addedBy || "Superadmin",
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
        addedBy: body.addedBy || "Superadmin",
        isActive: true,
      };
      updatedUsers = [newUser, ...currentUsers];
    }

    await saveSiteSetting("admin_users", updatedUsers);
    return NextResponse.json(
      { success: true, users: updatedUsers },
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

export async function DELETE(req: Request) {
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

    return NextResponse.json(
      { success: true, users: updatedUsers },
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
