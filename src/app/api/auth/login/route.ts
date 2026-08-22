import { NextResponse } from "next/server";
import { AdminUser, DEFAULT_ADMIN_CONFIG, initialAdminUsers, SUPERADMIN_EMAIL } from "@/lib/adminAuth";
import { fetchSiteSetting } from "@/lib/supabase/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const cleanId = (username || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    if (!cleanId || !cleanPass) {
      return NextResponse.json(
        { success: false, error: "Username and password are required." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const envAdminUser = (
      process.env.ADMIN_USERNAME ||
      process.env.NEXT_PUBLIC_ADMIN_USERNAME ||
      DEFAULT_ADMIN_CONFIG.username ||
      "admin"
    ).toLowerCase();

    const envAdminPass =
      process.env.ADMIN_PASSWORD ||
      process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
      DEFAULT_ADMIN_CONFIG.password ||
      "thorga2081@admin";

    const superEmail = (
      process.env.SUPERADMIN_EMAIL ||
      process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL ||
      SUPERADMIN_EMAIL
    ).toLowerCase();

    // 1. Fetch dynamic admin users from database
    const dbUsers = await fetchSiteSetting<AdminUser[]>(
      "admin_users",
      initialAdminUsers
    );

    // Look for matching user in database (by email, name, or role)
    const matchedUser = dbUsers.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        u.name.toLowerCase() === cleanId ||
        (cleanId === "admin" && (u.id === "usr-superadmin" || u.id === "usr-general-admin" || u.email === "admin@thorgaktm.org.np"))
    );

    if (matchedUser) {
      if (!matchedUser.isActive) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This administrative account has been deactivated. Please contact the superadmin.",
          },
          { status: 403, headers: NO_CACHE_HEADERS }
        );
      }

      const expectedPassword = matchedUser.password || envAdminPass;
      if (cleanPass === expectedPassword || cleanPass === envAdminPass) {
        const isSuper =
          matchedUser.role === "superadmin" ||
          matchedUser.email.toLowerCase() === superEmail ||
          matchedUser.id === "usr-superadmin";

        return NextResponse.json(
          {
            success: true,
            user: {
              id: matchedUser.id,
              name: matchedUser.name,
              email: matchedUser.email,
              role: isSuper ? "superadmin" : matchedUser.role,
              isActive: true,
              addedAt: matchedUser.addedAt,
              addedBy: matchedUser.addedBy,
            },
          },
          { headers: NO_CACHE_HEADERS }
        );
      }
    }

    // 2. Direct Environment Fallback for superadmin / admin
    if (
      cleanId === superEmail ||
      cleanId === envAdminUser ||
      cleanId === "admin" ||
      cleanId === "superadmin@thorgaktm.org.np" ||
      cleanId === "admin@thorgaktm.org.np"
    ) {
      if (cleanPass === envAdminPass) {
        const isSuper =
          cleanId === superEmail ||
          cleanId === "superadmin@thorgaktm.org.np" ||
          cleanId === envAdminUser ||
          cleanId === "admin";
        return NextResponse.json(
          {
            success: true,
            user: {
              id: isSuper ? "usr-superadmin" : "usr-general-admin",
              name: isSuper ? "System Superadmin" : "Forum Administrator",
              email: cleanId.includes("@") ? cleanId : superEmail,
              role: "superadmin",
              isActive: true,
              addedAt: "2026-08-01",
              addedBy: "System",
            },
          },
          { headers: NO_CACHE_HEADERS }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Invalid username or password." },
      { status: 401, headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error("Auth login error:", error);
    return NextResponse.json(
      { success: false, error: "Authentication failed." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
