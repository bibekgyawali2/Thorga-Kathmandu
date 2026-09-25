import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { verifyAuth } from "@/lib/authGuard";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const VALID_TAGS = [
  "gallery",
  "events",
  "members",
  "publications",
  "hero",
  "branding",
  "contact",
  "settings",
  "users",
  "businesses",
] as const;
type ValidTag = (typeof VALID_TAGS)[number];

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

/**
 * POST /api/revalidate?tag=<gallery|events|members|publications>
 */
export async function POST(request: NextRequest) {
  // Cache purging is an authenticated operation. Accept either the shared
  // revalidate secret (for webhooks and deploy hooks) or a signed admin
  // session. An unconfigured secret does not open the endpoint up.
  const secret = process.env.REVALIDATE_SECRET;
  const providedSecret = request.headers.get("x-revalidate-secret");
  const secretMatches = Boolean(secret && providedSecret && providedSecret === secret);

  if (!secretMatches) {
    const auth = await verifyAuth(request);
    if (!auth.authorized) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }
  }

  const tag = request.nextUrl.searchParams.get("tag") as ValidTag | null;

  if (tag && VALID_TAGS.includes(tag)) {
    try {
      revalidateTag(tag, "max");
    } catch {}
  }

  return Response.json(
    {
      revalidated: true,
      tag: tag || "all",
      now: Date.now(),
    },
    { headers: NO_CACHE_HEADERS }
  );
}
