import { NextRequest } from "next/server";
import { fetchGalleryAlbums, saveGalleryAlbum, deleteGalleryAlbum } from "@/lib/supabase/data";
import { GalleryAlbum } from "@/data/mockData";
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
    const data = await fetchGalleryAlbums();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[api/gallery/albums] GET error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch gallery albums" }), {
      status: 500,
      headers: NO_CACHE_HEADERS,
    });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const body = (await request.json()) as GalleryAlbum;
    if (!body.titleEn?.trim() || !body.titleNe?.trim()) {
      return new Response(
        JSON.stringify({ error: "Album title in both English and Nepali is required." }),
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const saved = await saveGalleryAlbum(body);
    return new Response(JSON.stringify({ success: true, data: saved }), {
      status: 200,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[api/gallery/albums] POST error:", error);
    return new Response(JSON.stringify({ error: "Failed to save gallery album" }), {
      status: 500,
      headers: NO_CACHE_HEADERS,
    });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return new Response(JSON.stringify({ error: "ID is required" }), {
        status: 400,
        headers: NO_CACHE_HEADERS,
      });
    }
    await deleteGalleryAlbum(id);
    return new Response(JSON.stringify({ success: true, id }), {
      status: 200,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[api/gallery/albums] DELETE error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete gallery album" }), {
      status: 500,
      headers: NO_CACHE_HEADERS,
    });
  }
}
