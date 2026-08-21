import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { fetchPublications } from "@/lib/supabase/data";

export async function GET(request: NextRequest) {
  try {
    const data = await fetchPublications();
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
    console.error("[api/publications] GET error:", error);
    return Response.json(
      { error: "Failed to fetch publications" },
      { status: 500 }
    );
  }
}
