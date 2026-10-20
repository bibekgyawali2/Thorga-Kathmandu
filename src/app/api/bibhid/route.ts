import { NextRequest } from "next/server";
import { fetchBibhidItems, saveBibhidItem, deleteBibhidItem } from "@/lib/supabase/data";
import { BibhidItem } from "@/data/mockData";
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
    const data = await fetchBibhidItems();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[api/bibhid] GET error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch bibhid items" }), {
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
    const body = (await request.json()) as BibhidItem;
    if (!body.titleNe?.trim() && !body.titleEn?.trim()) {
      return new Response(
        JSON.stringify({ error: "Title is required (Nepali or English)." }),
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    if (!body.driveUrl?.trim()) {
      return new Response(
        JSON.stringify({ error: "Google Drive URL is required." }),
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const saved = await saveBibhidItem({
      ...body,
      titleEn: body.titleEn?.trim() || body.titleNe?.trim() || "",
      titleNe: body.titleNe?.trim() || body.titleEn?.trim() || "",
      driveUrl: body.driveUrl.trim(),
      descriptionEn: body.descriptionEn?.trim() || "",
      descriptionNe: body.descriptionNe?.trim() || "",
      categoryEn: body.categoryEn?.trim() || "General",
      categoryNe: body.categoryNe?.trim() || "विविध",
      displayOrder: Number(body.displayOrder) || 0,
    });

    return new Response(JSON.stringify({ success: true, data: saved }), {
      status: 200,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[api/bibhid] POST error:", error);
    return new Response(JSON.stringify({ error: "Failed to save bibhid item" }), {
      status: 500,
      headers: NO_CACHE_HEADERS,
    });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const body = (await request.json()) as BibhidItem;
    if (!body.id?.trim()) {
      return new Response(
        JSON.stringify({ error: "Item ID is required." }),
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    if (!body.titleNe?.trim() && !body.titleEn?.trim()) {
      return new Response(
        JSON.stringify({ error: "Title is required (Nepali or English)." }),
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    if (!body.driveUrl?.trim()) {
      return new Response(
        JSON.stringify({ error: "Google Drive URL is required." }),
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const saved = await saveBibhidItem({
      ...body,
      titleEn: body.titleEn?.trim() || body.titleNe?.trim() || "",
      titleNe: body.titleNe?.trim() || body.titleEn?.trim() || "",
      driveUrl: body.driveUrl.trim(),
      descriptionEn: body.descriptionEn?.trim() || "",
      descriptionNe: body.descriptionNe?.trim() || "",
      categoryEn: body.categoryEn?.trim() || "General",
      categoryNe: body.categoryNe?.trim() || "विविध",
      displayOrder: Number(body.displayOrder) || 0,
    });

    return new Response(JSON.stringify({ success: true, data: saved }), {
      status: 200,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[api/bibhid] PUT error:", error);
    return new Response(JSON.stringify({ error: "Failed to update bibhid item" }), {
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
    let id = request.nextUrl.searchParams.get("id");
    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {}
    }

    if (!id) {
      return new Response(JSON.stringify({ error: "ID is required" }), {
        status: 400,
        headers: NO_CACHE_HEADERS,
      });
    }

    await deleteBibhidItem(id);
    return new Response(JSON.stringify({ success: true, id }), {
      status: 200,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[api/bibhid] DELETE error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete bibhid item" }), {
      status: 500,
      headers: NO_CACHE_HEADERS,
    });
  }
}
