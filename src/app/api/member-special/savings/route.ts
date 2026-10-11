import { NextRequest, NextResponse } from "next/server";
import {
  fetchMemberSpecialPreviousSavings,
  saveMemberSpecialPreviousSavings,
} from "@/lib/supabase/data";
import { PreviousYearSaving } from "@/data/mockData";
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

// GET: Authorized Members OR Admins can read previous year savings
export async function GET(req: NextRequest) {
  const check = await verifyMemberOrAdminAuth(req);
  if (!check.authorized) {
    return check.response!;
  }

  try {
    const data = await fetchMemberSpecialPreviousSavings();
    return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/member-special/savings] GET error:", error);
    return NextResponse.json(
      { error: "गत वर्षको बचत मौज्दात लोड गर्न सकिएन।" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// POST: Admins only can add/update previous year savings
export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const body = await req.json();

    // If an entire array was provided
    if (Array.isArray(body)) {
      const saved = await saveMemberSpecialPreviousSavings(body);
      return NextResponse.json({ success: true, data: saved }, { headers: NO_CACHE_HEADERS });
    }

    const amount = Number(body.amount);
    if (isNaN(amount) || amount < 0) {
      return NextResponse.json(
        { error: "वैध बचत रकम प्रविष्ट गर्नुहोस्।" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const existingList = await fetchMemberSpecialPreviousSavings();
    const targetId = body.id || (existingList.length > 0 ? existingList[0].id : crypto.randomUUID());

    const itemToSave: PreviousYearSaving = {
      id: targetId,
      fiscalYear: body.fiscalYear?.trim() || "२०८०/०८१",
      amount: amount,
      remarks: body.remarks?.trim() || "",
      updatedAt: new Date().toISOString(),
    };

    const existsIndex = existingList.findIndex((item) => item.id === targetId);
    let updatedList: PreviousYearSaving[];

    if (existsIndex >= 0) {
      updatedList = existingList.map((item, idx) => (idx === existsIndex ? itemToSave : item));
    } else if (existingList.length > 0 && !body.id) {
      // If no ID specified and list already has items, update the first one
      updatedList = [itemToSave, ...existingList.slice(1)];
    } else {
      updatedList = [itemToSave, ...existingList];
    }

    const saved = await saveMemberSpecialPreviousSavings(updatedList);
    return NextResponse.json({ success: true, data: saved }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/member-special/savings] POST error:", error);
    return NextResponse.json(
      { error: "गत वर्षको बचत सुरक्षित गर्न सकिएन।" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// DELETE: Admins only can delete a savings entry
export async function DELETE(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "ID आवश्यक छ।" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const existingList = await fetchMemberSpecialPreviousSavings();
    const updatedList = existingList.filter((item) => item.id !== id);
    const saved = await saveMemberSpecialPreviousSavings(updatedList);

    return NextResponse.json({ success: true, data: saved }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/member-special/savings] DELETE error:", error);
    return NextResponse.json(
      { error: "गत वर्षको बचत मेटाउन सकिएन।" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
