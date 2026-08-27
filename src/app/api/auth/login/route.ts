import { NextRequest, NextResponse } from "next/server";
import { AdminUser, initialAdminUsers } from "@/lib/adminAuth";
import { fetchSiteSetting, saveSiteSetting } from "@/lib/supabase/data";
import { signJWT, AUTH_COOKIE_NAME, DEFAULT_JWT_EXPIRY_SECONDS } from "@/lib/jwt";
import { hashPassword, verifyPassword, timingSafeEqual } from "@/lib/password";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

/**
 * Single generic failure message. Distinguishing "no such user" from "wrong
 * password" would let an attacker enumerate valid administrator accounts.
 */
const GENERIC_FAILURE = "Invalid username or password.";

// ---------------------------------------------------------------------------
// Login throttling
//
// Best effort, per server instance. A serverless deployment runs several
// instances so this slows credential stuffing rather than stopping it; put a
// WAF or platform-level rate limit in front for a hard guarantee.
// ---------------------------------------------------------------------------

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, { count: number; firstAt: number }>();

function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function isThrottled(key: string): boolean {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record) return false;
  if (now - record.firstAt > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string): void {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record || now - record.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now });
    return;
  }
  record.count += 1;

  // Bound memory on a long-lived instance.
  if (attempts.size > 5000) {
    for (const [k, v] of attempts) {
      if (now - v.firstAt > WINDOW_MS) attempts.delete(k);
    }
  }
}

function clearFailures(key: string): void {
  attempts.delete(key);
}

function superadminEmail(): string {
  return (
    process.env.SUPERADMIN_EMAIL ||
    process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL ||
    "superadmin@thorgaktm.org.np"
  ).toLowerCase();
}

function isSuperUser(user: AdminUser): boolean {
  return (
    user.role === "superadmin" ||
    user.id === "usr-superadmin" ||
    (user.email || "").toLowerCase() === superadminEmail()
  );
}

/**
 * Resolves the single account an identifier refers to. Returns null when the
 * identifier matches nothing, or matches more than one account, because an
 * ambiguous identifier must never authenticate anybody.
 */
function resolveUser(users: AdminUser[], identifier: string): AdminUser | null {
  const id = identifier.toLowerCase();
  const envAdminUser = (process.env.ADMIN_USERNAME || "").toLowerCase();

  const matches = users.filter((u) => {
    const email = (u.email || "").toLowerCase();
    const name = (u.name || "").toLowerCase();
    const prefix = email.split("@")[0];
    if (email === id || name === id || (prefix && prefix === id)) return true;
    // A configured ADMIN_USERNAME is an alias for the superadmin account only.
    if (envAdminUser && id === envAdminUser && isSuperUser(u)) return true;
    return false;
  });

  return matches.length === 1 ? matches[0] : null;
}

export async function POST(req: NextRequest) {
  const throttleKey = clientKey(req);

  if (isThrottled(throttleKey)) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many failed sign-in attempts. Please try again in 15 minutes.",
      },
      { status: 429, headers: NO_CACHE_HEADERS }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const username = typeof body?.username === "string" ? body.username : "";
    const password = typeof body?.password === "string" ? body.password : "";

    const cleanId = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      return NextResponse.json(
        { success: false, error: "Username and password are required." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const dbUsers = await fetchSiteSetting<AdminUser[]>("admin_users", initialAdminUsers);
    const candidate = resolveUser(dbUsers, cleanId);

    if (!candidate) {
      recordFailure(throttleKey);
      return NextResponse.json(
        { success: false, error: GENERIC_FAILURE },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    if (!candidate.isActive) {
      recordFailure(throttleKey);
      return NextResponse.json(
        {
          success: false,
          error:
            "This administrative account has been deactivated. Please contact the superadmin.",
        },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    let authenticated = false;
    let passwordToPersist: string | null = null;

    if (candidate.password) {
      const result = await verifyPassword(cleanPass, candidate.password);
      authenticated = result.valid;
      if (result.valid && result.needsRehash) {
        // Upgrade a legacy plaintext or weaker-parameter record in place.
        passwordToPersist = await hashPassword(cleanPass);
      }
    } else if (isSuperUser(candidate)) {
      // Bootstrap path: the superadmin account has no stored password yet, so
      // the server-only ADMIN_PASSWORD gets it started. The value is hashed and
      // stored on first successful use, and this branch stops applying after
      // that. There is no hardcoded default, so with ADMIN_PASSWORD unset the
      // account simply cannot be signed into.
      const envPassword = process.env.ADMIN_PASSWORD;
      if (envPassword && envPassword.length > 0) {
        authenticated = timingSafeEqual(cleanPass, envPassword);
        if (authenticated) passwordToPersist = await hashPassword(cleanPass);
      }
    }

    if (!authenticated) {
      recordFailure(throttleKey);
      return NextResponse.json(
        { success: false, error: GENERIC_FAILURE },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    if (passwordToPersist) {
      try {
        const updated = dbUsers.map((u) =>
          u.id === candidate.id ? { ...u, password: passwordToPersist! } : u
        );
        if (!dbUsers.some((u) => u.id === candidate.id)) {
          updated.unshift({ ...candidate, password: passwordToPersist });
        }
        await saveSiteSetting("admin_users", updated);
      } catch (error) {
        // A failed upgrade must not block a valid sign-in; it retries next time.
        console.error("[auth/login] password upgrade failed:", error);
      }
    }

    clearFailures(throttleKey);

    const isSuper = isSuperUser(candidate);
    const finalRole = isSuper ? "superadmin" : candidate.role;

    const token = await signJWT(
      {
        sub: candidate.id,
        email: candidate.email,
        name: candidate.name,
        role: finalRole,
        isSuperadmin: isSuper,
      },
      DEFAULT_JWT_EXPIRY_SECONDS
    );

    const expTimestamp = Math.floor(Date.now() / 1000) + DEFAULT_JWT_EXPIRY_SECONDS;

    const response = NextResponse.json(
      {
        success: true,
        token,
        exp: expTimestamp,
        user: {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          role: finalRole,
          isSuperadmin: isSuper,
          isActive: true,
          addedAt: candidate.addedAt,
          addedBy: candidate.addedBy,
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
