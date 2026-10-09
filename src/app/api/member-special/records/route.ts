import { NextRequest, NextResponse } from "next/server";
import {
  fetchMemberSpecialRecords,
  saveMemberSpecialRecord,
  deleteMemberSpecialRecord,
} from "@/lib/supabase/data";
import { verifyMemberOrAdminAuth } from "@/lib/memberAuth";
import { verifyAuth } from "@/lib/authGuard";
import { isGoogleDriveUrl } from "@/lib/googleDrive";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

// GET: Authorized Members OR Admins can read records
export async function GET(req: NextRequest) {
  const check = await verifyMemberOrAdminAuth(req);
  if (!check.authorized) {
    return check.response!;
  }

  try {
    const data = await fetchMemberSpecialRecords();
    return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/member-special/records] GET error:", error);
    return NextResponse.json(
      { error: "अभिलेख लोड गर्न असफल भयो।" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// POST: Admins only can add or edit records
export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const body = await req.json();
    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { error: "अभिलेखको शीर्षक आवश्यक छ।" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const driveUrl = String(body.driveUrl || "").trim();
    if (!driveUrl) {
      return NextResponse.json(
        { error: "गुगल ड्राइभ (Google Drive) लिङ्क आवश्यक छ।" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // STRICT CHECK: Only allow Google Drive link!
    if (!isGoogleDriveUrl(driveUrl)) {
      return NextResponse.json(
        {
          error:
            "अभिलेखको लागि केवल गुगल ड्राइभ (Google Drive) को लिङ्क मात्र मान्य छ। कृपया वैध Google Drive सेयरिङ लिङ्क राख्नुहोस्।",
        },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const saved = await saveMemberSpecialRecord({
      id: body.id,
      title: body.title.trim(),
      driveUrl: driveUrl,
      category: body.category?.trim() || "साधारण अभिलेख",
      dateBs: body.dateBs?.trim() || "",
      description: body.description?.trim() || "",
      displayOrder: Number(body.displayOrder) || 0,
    });

    return NextResponse.json({ success: true, data: saved }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/member-special/records] POST error:", error);
    return NextResponse.json(
      { error: "अभिलेख सुरक्षित गर्न सकिएन।" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// DELETE: Admins only
export async function DELETE(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "अभिलेख ID आवश्यक छ।" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    await deleteMemberSpecialRecord(id);
    return NextResponse.json({ success: true, id }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/member-special/records] DELETE error:", error);
    return NextResponse.json(
      { error: "अभिलेख मेटाउन सकिएन।" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
