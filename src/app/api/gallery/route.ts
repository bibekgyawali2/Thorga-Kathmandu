import { NextRequest } from "next/server";
import { fetchGallery, saveGalleryItem, saveGalleryItemsBatch, deleteGalleryItem } from "@/lib/supabase/data";
import { GalleryItem } from "@/data/mockData";
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
    const data = await fetchGallery();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[api/gallery] GET error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch gallery" }), {
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
    const body = await request.json();

    // Support atomic batch saving multiple gallery items
    if (Array.isArray(body)) {
      const validItems = body.filter(
        (item): item is GalleryItem => Boolean(item && item.titleEn && item.titleNe && item.imageUrl)
      );
      const savedItems = await saveGalleryItemsBatch(validItems);
      return new Response(JSON.stringify({ success: true, data: savedItems }), {
        status: 200,
        headers: NO_CACHE_HEADERS,
      });
    }

    const singleItem = body as GalleryItem;
    if (!singleItem.titleEn || !singleItem.titleNe || !singleItem.imageUrl) {
      return new Response(
        JSON.stringify({ error: "Photo title and image URL are required." }),
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const saved = await saveGalleryItem(singleItem);
    return new Response(JSON.stringify({ success: true, data: saved }), {
      status: 200,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[api/gallery] POST error:", error);
    return new Response(JSON.stringify({ error: "Failed to save gallery item" }), {
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
    await deleteGalleryItem(id);
    return new Response(JSON.stringify({ success: true, id }), {
      status: 200,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[api/gallery] DELETE error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete gallery item" }), {
      status: 500,
      headers: NO_CACHE_HEADERS,
    });
  }
}
