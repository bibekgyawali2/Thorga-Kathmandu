import { NextRequest, NextResponse } from "next/server";
import {
  fetchMemberSpecialUsers,
  saveMemberSpecialUser,
  deleteMemberSpecialUser,
} from "@/lib/supabase/data";
import { verifyAuth } from "@/lib/authGuard";
import { hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

// GET: Admins only can view member user roster
export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const users = await fetchMemberSpecialUsers();
    const sanitized = users.map((u) => ({
      ...u,
      password: undefined,
      hasPassword: Boolean(u.password),
    }));
    return NextResponse.json(sanitized, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/member-special/users] GET error:", error);
    return NextResponse.json(
      { error: "प्रयोगकर्ता सूची लोड गर्न सकिएन।" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// POST: Admins only can create or update member user accounts
export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const username = String(body.username || "").trim().toLowerCase();

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "सदस्यको पूरा नाम (कम्तिमा २ अक्षर) आवश्यक छ।" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    if (!username || username.length < 3) {
      return NextResponse.json(
        { error: "प्रयोगकर्ता नाम (कम्तिमा ३ अक्षर) आवश्यक छ।" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const isNew = !body.id;
    let hashedPassword = "";

    if (body.password && String(body.password).trim()) {
      const plain = String(body.password).trim();
      if (plain.length < 6) {
        return NextResponse.json(
          { error: "पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ।" },
          { status: 400, headers: NO_CACHE_HEADERS }
        );
      }
      hashedPassword = await hashPassword(plain);
    } else if (isNew) {
      return NextResponse.json(
        { error: "नयाँ सदस्य खाताको लागि पासवर्ड आवश्यक छ।" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const saved = await saveMemberSpecialUser({
      id: body.id,
      name,
      username,
      password: hashedPassword || undefined,
      phone: body.phone?.trim() || "",
      notes: body.notes?.trim() || "",
      isActive: body.isActive !== false,
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          ...saved,
          password: undefined,
          hasPassword: true,
        },
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error("[api/member-special/users] POST error:", error);
    return NextResponse.json(
      { error: "सदस्य खाता सुरक्षित गर्न सकिएन।" },
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

    await deleteMemberSpecialUser(id);
    return NextResponse.json({ success: true, id }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/member-special/users] DELETE error:", error);
    return NextResponse.json(
      { error: "सदस्य खाता मेटाउन सकिएन।" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
