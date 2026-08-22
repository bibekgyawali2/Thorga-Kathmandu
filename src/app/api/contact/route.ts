import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { fetchContactSettings, saveContactSettings } from "@/lib/supabase/data";
import { ContactSettings } from "@/data/mockData";
import { revalidateTag } from "next/cache";

export async function GET(request: NextRequest) {
  try {
    const data = await fetchContactSettings();
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
    console.error("[api/contact] GET error:", error);
    return Response.json(
      { error: "Failed to fetch contact settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ContactSettings;
    await saveContactSettings(body);
    revalidateTag("contact", "max");

    return Response.json({ success: true, data: body });
  } catch (error) {
    console.error("[api/contact] POST error:", error);
    return Response.json(
      { error: "Failed to save contact settings" },
      { status: 500 }
    );
  }
}
