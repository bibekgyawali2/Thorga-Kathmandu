import { NextRequest, NextResponse } from "next/server";
import {
  fetchPageDocuments,
  savePageDocument,
  deletePageDocument,
  deletePageDocumentsBySlugExcept,
  reorderPageDocuments,
} from "@/lib/supabase/data";
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

const ALLOWED_SLUGS = [
  "statute",
  "life-members",
  "certificates",
  "former-officials",
  "former-advisors",
  "calendar",
  "phone-directory",
  "bulletin",
  "souvenir",
  "sansthan-prakashan",
  "thorga-sambandhi-anya-prakashan",
  "other",
];
const ALLOWED_TYPES = ["pdf", "image"];

/**
 * Pages that hold exactly one file, so a new upload replaces whatever was
 * there. Registration Certificates is the only page that may hold several.
 */
const SINGLE_DOCUMENT_SLUGS = new Set([
  "statute",
  "life-members",
  "calendar",
  "phone-directory",
  "bulletin",
  "souvenir",
  "other",
]);

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get("slug") || undefined;
    return NextResponse.json(await fetchPageDocuments(slug), { headers: NO_CACHE_HEADERS });
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
    const body = (await request.json().catch(() => null)) as
      | (PageDocument & { reorder?: { id: string; order: number }[] })
      | { reorder?: { id: string; order: number }[] }
      | null;

    if (!body) {
      return NextResponse.json(
        { error: "Request body is required." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // Support atomic batch reorder in a single query
    if (body.reorder && Array.isArray(body.reorder)) {
      await reorderPageDocuments(body.reorder);
      return NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
    }

    const docBody = body as PageDocument;
    if (!docBody.slug || !ALLOWED_SLUGS.includes(docBody.slug)) {
      return NextResponse.json(
        { error: "Unknown document page." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    if (!ALLOWED_TYPES.includes(docBody.fileType)) {
      return NextResponse.json(
        { error: "Only PDF and image files are supported." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    if (!docBody.fileUrl || !isValidUrl(docBody.fileUrl)) {
      return NextResponse.json(
        { error: "A valid file link is required." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    if (!docBody.titleEn?.trim() || !docBody.titleNe?.trim()) {
      return NextResponse.json(
        { error: "Document title in both English and Nepali is required." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // Replace existing file on single-document pages in a single atomic DELETE query.
    if (SINGLE_DOCUMENT_SLUGS.has(docBody.slug)) {
      await deletePageDocumentsBySlugExcept(docBody.slug, docBody.id);
    }

    const saved = await savePageDocument({
      id: docBody.id,
      slug: docBody.slug,
      titleEn: String(docBody.titleEn).trim().slice(0, 200),
      titleNe: String(docBody.titleNe).trim().slice(0, 200),
      fileUrl: docBody.fileUrl,
      fileType: docBody.fileType,
      pageCount:
        docBody.pageCount === null || docBody.pageCount === undefined
          ? null
          : Math.max(1, Math.min(500, Number(docBody.pageCount) || 1)),
      order: Number(docBody.order) || 0,
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
