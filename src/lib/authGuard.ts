import { NextRequest, NextResponse } from "next/server";
import { verifyJWT, JWTPayload, AUTH_COOKIE_NAME } from "./jwt";
import { AdminRole } from "./adminAuth";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export interface AuthCheckResult {
  authorized: boolean;
  user?: JWTPayload;
  token?: string;
  response?: NextResponse;
}

/**
 * Extracts and verifies JWT from Request Authorization header or HTTP-only cookie.
 */
export async function verifyAuth(
  req: Request | NextRequest,
  requiredRole?: AdminRole
): Promise<AuthCheckResult> {
  let token: string | null = null;

  // 1. Check Authorization: Bearer <token>
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.substring(7).trim();
  }

  // 2. Fallback: Check Cookie
  if (!token) {
    if ("cookies" in req && typeof req.cookies?.get === "function") {
      token = req.cookies.get(AUTH_COOKIE_NAME)?.value || null;
    } else {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`));
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }
  }

  if (!token) {
    const res = NextResponse.json(
      {
        success: false,
        error: "Authentication required. Please log in.",
        expired: false,
        code: "UNAUTHORIZED",
      },
      { status: 401, headers: NO_CACHE_HEADERS }
    );
    return { authorized: false, response: res };
  }

  const result = await verifyJWT(token);

  if (!result.valid || !result.payload) {
    const isExpired = !!result.expired;
    const res = NextResponse.json(
      {
        success: false,
        error: isExpired
          ? "Your session has expired. Please log in again."
          : "Invalid or corrupt authentication token.",
        expired: isExpired,
        code: "UNAUTHORIZED",
      },
      { status: 401, headers: NO_CACHE_HEADERS }
    );

    // Clear expired / invalid cookie
    res.cookies.set(AUTH_COOKIE_NAME, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return { authorized: false, response: res };
  }

  const user = result.payload;

  // Role permissions check if requiredRole is provided
  if (requiredRole) {
    const roleHierarchy: Record<AdminRole, number> = {
      editor: 1,
      admin: 2,
      superadmin: 3,
    };

    const userLevel = roleHierarchy[user.role] || 1;
    const requiredLevel = roleHierarchy[requiredRole] || 1;

    if (userLevel < requiredLevel && !user.isSuperadmin) {
      const res = NextResponse.json(
        {
          success: false,
          error: "You do not have sufficient permissions to perform this action.",
          expired: false,
          code: "FORBIDDEN",
        },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
      return { authorized: false, response: res };
    }
  }

  return {
    authorized: true,
    user,
    token,
  };
}
