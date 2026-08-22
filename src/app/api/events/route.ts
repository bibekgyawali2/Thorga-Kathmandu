import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { fetchEvents, saveEventItem, deleteEventItem } from "@/lib/supabase/data";
import { EventItem } from "@/data/mockData";
import { revalidateTag } from "next/cache";

export async function GET(request: NextRequest) {
  try {
    const data = await fetchEvents();
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
    console.error("[api/events] GET error:", error);
    return Response.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EventItem;
    await saveEventItem(body);
    revalidateTag("events", "max");
    return Response.json({ success: true, data: body });
  } catch (error) {
    console.error("[api/events] POST error:", error);
    return Response.json({ error: "Failed to save event" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return Response.json({ error: "ID is required" }, { status: 400 });
    await deleteEventItem(id);
    revalidateTag("events", "max");
    return Response.json({ success: true, id });
  } catch (error) {
    console.error("[api/events] DELETE error:", error);
    return Response.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
