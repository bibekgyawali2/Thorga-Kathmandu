import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { fetchPublications, savePublicationItem, deletePublicationItem } from "@/lib/supabase/data";
import { Publication } from "@/data/mockData";
import { revalidateTag } from "next/cache";

export async function GET(request: NextRequest) {
  try {
    const data = await fetchPublications();
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
    console.error("[api/publications] GET error:", error);
    return Response.json(
      { error: "Failed to fetch publications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Publication;
    await savePublicationItem(body);
    revalidateTag("publications", "max");
    return Response.json({ success: true, data: body });
  } catch (error) {
    console.error("[api/publications] POST error:", error);
    return Response.json({ error: "Failed to save publication" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return Response.json({ error: "ID is required" }, { status: 400 });
    await deletePublicationItem(id);
    revalidateTag("publications", "max");
    return Response.json({ success: true, id });
  } catch (error) {
    console.error("[api/publications] DELETE error:", error);
    return Response.json({ error: "Failed to delete publication" }, { status: 500 });
  }
}
