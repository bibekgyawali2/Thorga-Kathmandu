import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";

const VALID_TAGS = ["gallery", "events", "members", "publications"] as const;
type ValidTag = (typeof VALID_TAGS)[number];

/**
 * POST /api/revalidate?tag=<gallery|events|members|publications>
 *
 * Optionally protected by the REVALIDATE_SECRET env variable.
 * Called by the admin panel after saving data to Supabase.
 */
export async function POST(request: NextRequest) {
  // Optional secret check
  const secret = process.env.REVALIDATE_SECRET;
  if (secret) {
    const authHeader = request.headers.get("x-revalidate-secret");
    if (authHeader !== secret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const tag = request.nextUrl.searchParams.get("tag") as ValidTag | null;

  if (!tag || !VALID_TAGS.includes(tag)) {
    return Response.json(
      {
        error: `Invalid tag. Must be one of: ${VALID_TAGS.join(", ")}`,
      },
      { status: 400 }
    );
  }

  // Mark tag as stale; next request to any cached resource with this tag
  // will use stale-while-revalidate semantics.
  revalidateTag(tag, "max");

  return Response.json({
    revalidated: true,
    tag,
    now: Date.now(),
  });
}
