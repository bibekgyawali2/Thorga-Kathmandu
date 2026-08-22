import { NextRequest } from "next/server";
import { fetchPublications, savePublicationItem, deletePublicationItem } from "@/lib/supabase/data";
import { Publication } from "@/data/mockData";

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
    const data = await fetchPublications();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[api/publications] GET error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch publications" }), {
      status: 500,
      headers: NO_CACHE_HEADERS,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Publication;
    const saved = await savePublicationItem(body);
    return new Response(JSON.stringify({ success: true, data: saved }), {
      status: 200,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[api/publications] POST error:", error);
    return new Response(JSON.stringify({ error: "Failed to save publication" }), {
      status: 500,
      headers: NO_CACHE_HEADERS,
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return new Response(JSON.stringify({ error: "ID is required" }), {
        status: 400,
        headers: NO_CACHE_HEADERS,
      });
    }
    await deletePublicationItem(id);
    return new Response(JSON.stringify({ success: true, id }), {
      status: 200,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[api/publications] DELETE error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete publication" }), {
      status: 500,
      headers: NO_CACHE_HEADERS,
    });
  }
}
