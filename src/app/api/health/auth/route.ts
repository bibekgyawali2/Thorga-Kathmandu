import { NextRequest, NextResponse } from "next/server";
import { fetchSiteSetting } from "@/lib/supabase/data";
import { initialAdminUsers, type AdminUser } from "@/lib/adminAuth";
import { timingSafeEqual } from "@/lib/password";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

/**
 * Deployment diagnostic for the admin login path.
 *
 * Reports whether each piece of configuration the login route depends on is
 * present, and whether the administrator roster is actually readable from this
 * environment. It never returns names, emails, passwords or any secret value,
 * and it is gated behind REVALIDATE_SECRET so it cannot be probed anonymously.
 *
 *   curl -H "x-diagnostic-secret: $REVALIDATE_SECRET" https://yoursite/api/health/auth
 */
export async function GET(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  const provided = req.headers.get("x-diagnostic-secret");

  if (!secret || !provided || !timingSafeEqual(provided, secret)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: NO_CACHE_HEADERS }
    );
  }

  const jwtSecret = process.env.JWT_SECRET ?? "";

  let roster: AdminUser[] = [];
  let rosterError: string | null = null;
  try {
    roster = await fetchSiteSetting<AdminUser[]>("admin_users", initialAdminUsers);
  } catch (error) {
    rosterError = error instanceof Error ? error.message : "unknown error";
  }

  // The seed roster carries no password, so falling back to it means the real
  // roster could not be read and every login will fail with "Invalid username
  // or password" no matter what is typed.
  const usingSeedRoster =
    roster.length === initialAdminUsers.length &&
    roster.every((u) => !u.password);

  const withPassword = roster.filter((u) => Boolean(u.password)).length;

  return NextResponse.json(
    {
      config: {
        jwtSecretSet: jwtSecret.length > 0,
        jwtSecretLongEnough: jwtSecret.length >= 32,
        databaseUrlSet: Boolean(process.env.DATABASE_URL),
        serviceRoleKeySet:
          Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) &&
          !String(process.env.SUPABASE_SERVICE_ROLE_KEY).includes("placeholder"),
        supabaseUrlSet: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      },
      roster: {
        readable: !usingSeedRoster && roster.length > 0,
        accountsFound: roster.length,
        accountsWithPassword: withPassword,
        usingSeedRoster,
        error: rosterError,
      },
      verdict: usingSeedRoster
        ? "Login cannot succeed: the administrator roster is not readable from this environment. Set a working DATABASE_URL (use the Supabase transaction pooler on serverless) or a real SUPABASE_SERVICE_ROLE_KEY."
        : jwtSecret.length < 32
        ? "Login cannot succeed: JWT_SECRET is missing or shorter than 32 characters."
        : withPassword === 0
        ? "Roster is readable but no account has a password set. Use scripts/set-admin-password.mjs."
        : "Configuration looks correct. A 401 here means the password itself is wrong.",
    },
    { headers: NO_CACHE_HEADERS }
  );
}
