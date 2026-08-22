import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";

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
  // Optional secret check
  const secret = process.env.REVALIDATE_SECRET;
  if (secret) {
    const authHeader = request.headers.get("x-revalidate-secret");
    if (authHeader !== secret) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: NO_CACHE_HEADERS });
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
