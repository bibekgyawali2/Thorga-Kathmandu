import { NextResponse } from "next/server";
import { AdminUser, DEFAULT_ADMIN_CONFIG, initialAdminUsers, SUPERADMIN_EMAIL } from "@/lib/adminAuth";
import { fetchSiteSetting } from "@/lib/supabase/data";
import { signJWT, AUTH_COOKIE_NAME, DEFAULT_JWT_EXPIRY_SECONDS } from "@/lib/jwt";

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

    let authenticatedUser: AdminUser | null = null;

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
        authenticatedUser = directUser;
      }
    }

    // 3. Generic identifier ("admin", "superadmin", "administrator", or default)
    if (!authenticatedUser) {
      const isGenericAdminId =
        cleanId === "admin" ||
        cleanId === "superadmin" ||
        cleanId === "administrator" ||
        cleanId === envAdminUser ||
        cleanId === superEmail ||
        cleanId === "admin@thorgaktm.org.np" ||
        cleanId === "superadmin@thorgaktm.org.np";

      if (isGenericAdminId) {
        const userWithPass = dbUsers.find((u) => {
          if (!u.isActive) return false;
          const p = u.password || envAdminPass;
          return cleanPass === p;
        });

        if (userWithPass) {
          authenticatedUser = userWithPass;
        } else if (cleanPass === envAdminPass || cleanPass === DEFAULT_ADMIN_CONFIG.password) {
          authenticatedUser = dbUsers.find((u) => isSuperUser(u)) || {
            id: "usr-superadmin",
            name: "System Superadmin",
            email: superEmail,
            role: "superadmin" as const,
            isActive: true,
            addedAt: "2026-08-01",
            addedBy: "System",
          };
        }
      }
    }

    // 4. Global match: Check if cleanPass matches ANY active administrator in the database
    if (!authenticatedUser) {
      const anyMatchingUser = dbUsers.find(
        (u) => u.isActive && u.password && u.password === cleanPass
      );
      if (anyMatchingUser) {
        authenticatedUser = anyMatchingUser;
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password." },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    const isSuper = isSuperUser(authenticatedUser);
    const finalRole = isSuper ? "superadmin" : authenticatedUser.role;

    // 5. Generate signed JWT token
    const token = await signJWT(
      {
        sub: authenticatedUser.id,
        email: authenticatedUser.email,
        name: authenticatedUser.name,
        role: finalRole,
        isSuperadmin: isSuper,
      },
      DEFAULT_JWT_EXPIRY_SECONDS
    );

    const expTimestamp = Math.floor(Date.now() / 1000) + DEFAULT_JWT_EXPIRY_SECONDS;

    // 6. Build response and set secure HTTP-only cookie
    const response = NextResponse.json(
      {
        success: true,
        token,
        exp: expTimestamp,
        user: {
          id: authenticatedUser.id,
          name: authenticatedUser.name,
          email: authenticatedUser.email,
          role: finalRole,
          isSuperadmin: isSuper,
          isActive: true,
          addedAt: authenticatedUser.addedAt,
          addedBy: authenticatedUser.addedBy,
        },
      },
      { headers: NO_CACHE_HEADERS }
    );

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      path: "/",
      maxAge: DEFAULT_JWT_EXPIRY_SECONDS,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Auth login error:", error);
    return NextResponse.json(
      { success: false, error: "Authentication failed." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
