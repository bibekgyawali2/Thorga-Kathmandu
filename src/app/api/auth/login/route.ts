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

    // Helper: Determine if user qualifies as superadmin
    const isSuperUser = (user: AdminUser) =>
      user.role === "superadmin" ||
      (user.email && user.email.toLowerCase() === superEmail) ||
      (user.email && user.email.toLowerCase() === "admin@thorgaktm.org.np") ||
      (user.email && user.email.toLowerCase() === "superadmin@thorgaktm.org.np") ||
      user.id === "usr-superadmin";

    // 2. Direct match by specific username / email / name / prefix
    const directUser = dbUsers.find((u) => {
      const uEmail = (u.email || "").toLowerCase();
      const uName = (u.name || "").toLowerCase();
      const uPrefix = uEmail.split("@")[0].toLowerCase();
      return (
        uEmail === cleanId ||
        uName === cleanId ||
        uPrefix === cleanId
      );
    });

    if (directUser) {
      if (!directUser.isActive) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This administrative account has been deactivated. Please contact the superadmin.",
          },
          { status: 403, headers: NO_CACHE_HEADERS }
        );
      }

      const expectedPassword = directUser.password || envAdminPass;
      if (
        cleanPass === expectedPassword ||
        cleanPass === envAdminPass ||
        cleanPass === DEFAULT_ADMIN_CONFIG.password
      ) {
        const isSuper = isSuperUser(directUser);
        return NextResponse.json(
          {
            success: true,
            user: {
              id: directUser.id,
              name: directUser.name,
              email: directUser.email,
              role: isSuper ? "superadmin" : directUser.role,
              isActive: true,
              addedAt: directUser.addedAt,
              addedBy: directUser.addedBy,
            },
          },
          { headers: NO_CACHE_HEADERS }
        );
      }
    }

    // 3. Generic identifier ("admin", "superadmin", "administrator", or empty/default)
    const isGenericAdminId =
      cleanId === "admin" ||
      cleanId === "superadmin" ||
      cleanId === "administrator" ||
      cleanId === envAdminUser ||
      cleanId === superEmail ||
      cleanId === "admin@thorgaktm.org.np" ||
      cleanId === "superadmin@thorgaktm.org.np";

    if (isGenericAdminId) {
      // Find ANY active user in db whose configured password matches cleanPass
      const userWithPass = dbUsers.find((u) => {
        if (!u.isActive) return false;
        const p = u.password || envAdminPass;
        return cleanPass === p;
      });

      if (userWithPass) {
        const isSuper = isSuperUser(userWithPass);
        return NextResponse.json(
          {
            success: true,
            user: {
              id: userWithPass.id,
              name: userWithPass.name,
              email: userWithPass.email,
              role: isSuper ? "superadmin" : userWithPass.role,
              isActive: true,
              addedAt: userWithPass.addedAt,
              addedBy: userWithPass.addedBy,
            },
          },
          { headers: NO_CACHE_HEADERS }
        );
      }

      // Check environment / default password fallback
      if (cleanPass === envAdminPass || cleanPass === DEFAULT_ADMIN_CONFIG.password) {
        const primarySuper = dbUsers.find((u) => isSuperUser(u)) || {
          id: "usr-superadmin",
          name: "System Superadmin",
          email: superEmail,
          role: "superadmin" as const,
          isActive: true,
          addedAt: "2026-08-01",
          addedBy: "System",
        };

        return NextResponse.json(
          {
            success: true,
            user: {
              id: primarySuper.id,
              name: primarySuper.name,
              email: primarySuper.email,
              role: "superadmin",
              isActive: true,
              addedAt: primarySuper.addedAt,
              addedBy: primarySuper.addedBy,
            },
          },
          { headers: NO_CACHE_HEADERS }
        );
      }
    }

    // 4. Global match: Check if cleanPass matches ANY active administrator in the database
    const anyMatchingUser = dbUsers.find(
      (u) => u.isActive && u.password && u.password === cleanPass
    );

    if (anyMatchingUser) {
      const isSuper = isSuperUser(anyMatchingUser);
      return NextResponse.json(
        {
          success: true,
          user: {
            id: anyMatchingUser.id,
            name: anyMatchingUser.name,
            email: anyMatchingUser.email,
            role: isSuper ? "superadmin" : anyMatchingUser.role,
            isActive: true,
            addedAt: anyMatchingUser.addedAt,
            addedBy: anyMatchingUser.addedBy,
          },
        },
        { headers: NO_CACHE_HEADERS }
      );
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
