import { NextRequest, NextResponse } from "next/server";
import {
  fetchMemberSpecialFinances,
  saveMemberSpecialFinance,
  deleteMemberSpecialFinance,
} from "@/lib/supabase/data";
import { verifyMemberOrAdminAuth } from "@/lib/memberAuth";
import { verifyAuth } from "@/lib/authGuard";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

// GET: Authorized Members OR Admins can read financial entries
export async function GET(req: NextRequest) {
  const check = await verifyMemberOrAdminAuth(req);
  if (!check.authorized) {
    return check.response!;
  }

  try {
    const data = await fetchMemberSpecialFinances();
    return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/member-special/finances] GET error:", error);
    return NextResponse.json(
      { error: "आर्थिक विवरण लोड गर्न सकिएन।" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// POST: Admins only can add or edit financial entries
export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const body = await req.json();
    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { error: "विवरण / शीर्षक आवश्यक छ।" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    if (body.type !== "income" && body.type !== "expense") {
      return NextResponse.json(
        { error: "प्रकार (आम्दानी वा खर्च) चयन गर्नुहोस्।" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const amount = Number(body.amount);
    if (isNaN(amount) || amount < 0) {
      return NextResponse.json(
        { error: "वैध रकम प्रविष्ट गर्नुहोस्।" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const saved = await saveMemberSpecialFinance({
      id: body.id,
      title: body.title.trim(),
      type: body.type,
      amount: amount,
      fiscalYear: body.fiscalYear?.trim() || "",
      dateBs: body.dateBs?.trim() || "",
      category: body.category?.trim() || "विविध",
      documentUrl: body.documentUrl?.trim() || "",
      remarks: body.remarks?.trim() || "",
      displayOrder: Number(body.displayOrder) || 0,
    });

    return NextResponse.json({ success: true, data: saved }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/member-special/finances] POST error:", error);
    return NextResponse.json(
      { error: "आर्थिक विवरण सुरक्षित गर्न सकिएन।" },
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
        { error: "ID आवश्यक छ।" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    await deleteMemberSpecialFinance(id);
    return NextResponse.json({ success: true, id }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/member-special/finances] DELETE error:", error);
    return NextResponse.json(
      { error: "आर्थिक विवरण मेटाउन सकिएन।" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
