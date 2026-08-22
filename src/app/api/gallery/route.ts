import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { fetchGallery, saveGalleryItem, deleteGalleryItem } from "@/lib/supabase/data";
import { GalleryItem } from "@/data/mockData";
import { revalidateTag } from "next/cache";

export async function GET(request: NextRequest) {
  try {
    const data = await fetchGallery();
    const json = JSON.stringify(data);

    // Compute ETag from data hash for conditional requests
    const etag = `"${createHash("sha1").update(json).digest("hex")}"`;

    // Return 304 if client has the same version
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
    console.error("[api/gallery] GET error:", error);
    return Response.json(
      { error: "Failed to fetch gallery" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GalleryItem;
    await saveGalleryItem(body);
    revalidateTag("gallery", "max");
    return Response.json({ success: true, data: body });
  } catch (error) {
    console.error("[api/gallery] POST error:", error);
    return Response.json({ error: "Failed to save gallery item" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return Response.json({ error: "ID is required" }, { status: 400 });
    await deleteGalleryItem(id);
    revalidateTag("gallery", "max");
    return Response.json({ success: true, id });
  } catch (error) {
    console.error("[api/gallery] DELETE error:", error);
    return Response.json({ error: "Failed to delete gallery item" }, { status: 500 });
  }
}
