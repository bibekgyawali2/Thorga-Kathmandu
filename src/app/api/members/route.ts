import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { fetchMembers } from "@/lib/supabase/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const data = await fetchMembers();
    const json = JSON.stringify(data);

    const etag = `"${createHash("sha1").update(json).digest("hex")}"`;

    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      });
    }

    return new Response(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ETag: etag,
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        Vary: "Accept-Encoding",
      },
    });
  } catch (error) {
    console.error("[api/members] GET error:", error);
    return Response.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
