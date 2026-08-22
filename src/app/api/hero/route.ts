import { NextRequest } from "next/server";
import { fetchHeroContent, saveHeroContent } from "@/lib/supabase/data";
import { HeroContent } from "@/data/mockData";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  try {
    const data = await fetchHeroContent();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[api/hero] GET error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch hero content" }),
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as HeroContent;
    if (!body || !body.titleNe || !body.titleEn) {
      return new Response(
        JSON.stringify({ error: "Hero title (Nepali and English) are required." }),
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    await saveHeroContent(body);

    return new Response(JSON.stringify({ success: true, data: body }), {
      status: 200,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[api/hero] POST error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to save hero content to database" }),
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
