import { NextRequest, NextResponse } from "next/server";
import { fetchRosterEntries, saveRosterEntry, deleteRosterEntry } from "@/lib/supabase/data";
import { verifyAuth } from "@/lib/authGuard";
import { isValidImageSrc } from "@/lib/validation";
import type { RosterEntry } from "@/data/mockData";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

const ALLOWED_KINDS = ["former_official", "former_advisor"];

export async function GET() {
  try {
    return NextResponse.json(await fetchRosterEntries(), { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/roster] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch roster" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response!;

  try {
    const body = (await request.json().catch(() => null)) as RosterEntry | null;
    if (!body || !ALLOWED_KINDS.includes(body.kind)) {
      return NextResponse.json(
        { error: "Unknown roster type." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    if (!body.nameEn?.trim() || !body.nameNe?.trim()) {
      return NextResponse.json(
        { error: "Name in both English and Nepali is required." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    if (body.photoUrl && !isValidImageSrc(body.photoUrl)) {
      return NextResponse.json(
        { error: "The photograph link is not a valid URL." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const saved = await saveRosterEntry({
      id: body.id,
      kind: body.kind,
      nameEn: String(body.nameEn).trim().slice(0, 120),
      nameNe: String(body.nameNe).trim().slice(0, 120),
      photoUrl: body.photoUrl ?? "",
      order: Number(body.order) || 0,
    });

    return NextResponse.json({ success: true, data: saved }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/roster] POST error:", error);
    return NextResponse.json(
      { error: "Failed to save roster entry" },
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
    await deleteRosterEntry(id);
    return NextResponse.json({ success: true, id }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/roster] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete roster entry" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
