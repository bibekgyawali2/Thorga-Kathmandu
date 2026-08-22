import { NextRequest } from "next/server";
import { fetchContactSettings, saveContactSettings } from "@/lib/supabase/data";
import { ContactSettings } from "@/data/mockData";

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
    const data = await fetchContactSettings();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[api/contact] GET error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch contact settings" }),
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ContactSettings;
    await saveContactSettings(body);
    return new Response(JSON.stringify({ success: true, data: body }), {
      status: 200,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[api/contact] POST error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to save contact settings" }),
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
