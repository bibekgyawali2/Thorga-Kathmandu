import { NextRequest, NextResponse } from "next/server";
import { fetchPageDocuments, savePageDocument, deletePageDocument } from "@/lib/supabase/data";
import { verifyAuth } from "@/lib/authGuard";
import { isValidUrl } from "@/lib/validation";
import type { PageDocument } from "@/data/mockData";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

const ALLOWED_SLUGS = ["statute", "life-members", "certificates"];
const ALLOWED_TYPES = ["pdf", "image"];

/**
 * Life Members and Statute are single-document pages, so a new upload replaces
 * whatever was there. Certificates may hold several.
 */
const SINGLE_DOCUMENT_SLUGS = new Set(["statute", "life-members"]);

export async function GET() {
  try {
    return NextResponse.json(await fetchPageDocuments(), { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/documents] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response!;

  try {
    const body = (await request.json().catch(() => null)) as PageDocument | null;
    if (!body || !ALLOWED_SLUGS.includes(body.slug)) {
      return NextResponse.json(
        { error: "Unknown document page." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    if (!ALLOWED_TYPES.includes(body.fileType)) {
      return NextResponse.json(
        { error: "Only PDF and image files are supported." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    if (!body.fileUrl || !isValidUrl(body.fileUrl)) {
      return NextResponse.json(
        { error: "A valid file link is required." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    if (!body.titleEn?.trim() || !body.titleNe?.trim()) {
      return NextResponse.json(
        { error: "Document title in both English and Nepali is required." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // Replace the existing file on single-document pages.
    if (SINGLE_DOCUMENT_SLUGS.has(body.slug)) {
      const existing = await fetchPageDocuments();
      await Promise.all(
        existing
          .filter((d) => d.slug === body.slug && d.id !== body.id)
          .map((d) => deletePageDocument(d.id))
      );
    }

    const saved = await savePageDocument({
      id: body.id,
      slug: body.slug,
      titleEn: String(body.titleEn).trim().slice(0, 200),
      titleNe: String(body.titleNe).trim().slice(0, 200),
      fileUrl: body.fileUrl,
      fileType: body.fileType,
      pageCount:
        body.pageCount === null || body.pageCount === undefined
          ? null
          : Math.max(1, Math.min(500, Number(body.pageCount) || 1)),
      order: Number(body.order) || 0,
    });

    return NextResponse.json({ success: true, data: saved }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/documents] POST error:", error);
    return NextResponse.json(
      { error: "Failed to save document" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response!;

  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    await deletePageDocument(id);
    return NextResponse.json({ success: true, id }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/documents] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
