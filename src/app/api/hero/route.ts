import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { fetchHeroContent, saveHeroContent } from "@/lib/supabase/data";
import { HeroContent } from "@/data/mockData";
import { revalidateTag } from "next/cache";

export async function GET(request: NextRequest) {
  try {
    const data = await fetchHeroContent();
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
    console.error("[api/hero] GET error:", error);
    return Response.json(
      { error: "Failed to fetch hero content" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as HeroContent;
    if (!body || !body.titleNe || !body.titleEn) {
      return Response.json(
        { error: "Hero title (Nepali and English) are required." },
        { status: 400 }
      );
    }

    await saveHeroContent(body);
    revalidateTag("hero", "max");

    return Response.json({ success: true, data: body });
  } catch (error) {
    console.error("[api/hero] POST error:", error);
    return Response.json(
      { error: "Failed to save hero content to database" },
      { status: 500 }
    );
  }
}
