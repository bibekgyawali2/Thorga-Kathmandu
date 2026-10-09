import { NextRequest, NextResponse } from "next/server";
import { fetchMemberSpecialUsers, updateMemberSpecialLastLogin } from "@/lib/supabase/data";
import { signMemberJWT, MEMBER_AUTH_COOKIE_NAME, DEFAULT_MEMBER_JWT_EXPIRY_SECONDS } from "@/lib/memberAuth";
import { verifyPassword } from "@/lib/password";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

const attempts = new Map<string, { count: number; firstAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  const ip = clientKey(req);
  const now = Date.now();
  const rec = attempts.get(ip);
  if (rec && now - rec.firstAt < WINDOW_MS && rec.count >= MAX_ATTEMPTS) {
    return NextResponse.json(
      {
        success: false,
        error: "धेरै पटक गलत प्रयास भयो। कृपया १५ मिनेटपछि पुनः प्रयास गर्नुहोस्।",
      },
      { status: 429, headers: NO_CACHE_HEADERS }
    );
  }

  try {
    const body = await req.json();
    const identifier = String(body.username || body.phone || "").trim().toLowerCase();
    const password = String(body.password || "").trim();

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: "प्रयोगकर्ता नाम वा फोन र पासवर्ड आवश्यक छ।" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const users = await fetchMemberSpecialUsers();
    const user = users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === identifier) ||
        (u.phone && u.phone.replace(/\D/g, "") === identifier.replace(/\D/g, ""))
    );

    if (!user) {
      const cur = attempts.get(ip) || { count: 0, firstAt: now };
      attempts.set(ip, { count: cur.count + 1, firstAt: cur.firstAt });
      return NextResponse.json(
        { success: false, error: "प्रयोगकर्ता नाम वा पासवर्ड मिलेन।" },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "तपाईंको सदस्य पहुँच निष्क्रिय गरिएको छ। कृपया प्रशासकसँग सम्पर्क गर्नुहोस्।",
        },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    const verify = await verifyPassword(password, user.password);
    if (!verify.valid) {
      const cur = attempts.get(ip) || { count: 0, firstAt: now };
      attempts.set(ip, { count: cur.count + 1, firstAt: cur.firstAt });
      return NextResponse.json(
        { success: false, error: "प्रयोगकर्ता नाम वा पासवर्ड मिलेन।" },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    attempts.delete(ip);
    await updateMemberSpecialLastLogin(user.id);

    const token = await signMemberJWT({
      id: user.id,
      name: user.name,
      username: user.username,
    });

    const res = NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          phone: user.phone,
        },
      },
      { status: 200, headers: NO_CACHE_HEADERS }
    );

    res.cookies.set({
      name: MEMBER_AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: DEFAULT_MEMBER_JWT_EXPIRY_SECONDS,
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("[member-login] error:", err);
    return NextResponse.json(
      { success: false, error: "लगइन प्रक्रियामा त्रुटि भयो।" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
