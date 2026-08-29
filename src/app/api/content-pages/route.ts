import { NextRequest, NextResponse } from "next/server";
import { fetchContentPages, saveContentPage } from "@/lib/supabase/data";
import { verifyAuth } from "@/lib/authGuard";
import type { ContentPage } from "@/data/mockData";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

const ALLOWED_SLUGS = ["organisation", "thorga"];
const MAX_BODY = 40000;

export async function GET() {
  try {
    return NextResponse.json(await fetchContentPages(), { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/content-pages] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pages" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response!;

  try {
    const body = (await request.json().catch(() => null)) as ContentPage | null;
    if (!body || !ALLOWED_SLUGS.includes(body.slug)) {
      return NextResponse.json(
        { error: "Unknown page." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    if (!body.titleEn?.trim() || !body.titleNe?.trim()) {
      return NextResponse.json(
        { error: "Page title in both English and Nepali is required." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const saved = await saveContentPage({
      slug: body.slug,
      titleEn: String(body.titleEn).trim(),
      titleNe: String(body.titleNe).trim(),
      bodyEn: String(body.bodyEn ?? "").slice(0, MAX_BODY),
      bodyNe: String(body.bodyNe ?? "").slice(0, MAX_BODY),
    });

    return NextResponse.json({ success: true, data: saved }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/content-pages] POST error:", error);
    return NextResponse.json(
      { error: "Failed to save page" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
