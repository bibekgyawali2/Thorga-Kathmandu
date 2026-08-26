import { NextRequest } from "next/server";
import { fetchBrandingSettings, saveBrandingSettings } from "@/lib/supabase/data";
import { BrandingSettings } from "@/data/mockData";
import { verifyAuth } from "@/lib/authGuard";

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
    const data = await fetchBrandingSettings();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[api/branding] GET error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch branding settings" }),
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const body = (await request.json()) as BrandingSettings;
    await saveBrandingSettings(body);
    return new Response(JSON.stringify({ success: true, data: body }), {
      status: 200,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[api/branding] POST error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to save branding settings" }),
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
