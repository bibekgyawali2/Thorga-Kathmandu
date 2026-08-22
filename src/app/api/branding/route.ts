import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { fetchBrandingSettings, saveBrandingSettings } from "@/lib/supabase/data";
import { BrandingSettings } from "@/data/mockData";
import { revalidateTag } from "next/cache";

export async function GET(request: NextRequest) {
  try {
    const data = await fetchBrandingSettings();
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
    console.error("[api/branding] GET error:", error);
    return Response.json(
      { error: "Failed to fetch branding settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BrandingSettings;
    await saveBrandingSettings(body);
    revalidateTag("branding", "max");

    return Response.json({ success: true, data: body });
  } catch (error) {
    console.error("[api/branding] POST error:", error);
    return Response.json(
      { error: "Failed to save branding settings" },
      { status: 500 }
    );
  }
}
