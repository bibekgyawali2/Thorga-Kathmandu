import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/authGuard";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized || !auth.user) {
    return auth.response || NextResponse.json(
      {
        authenticated: false,
        error: "Session expired or invalid.",
        expired: true,
      },
      { status: 401, headers: NO_CACHE_HEADERS }
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      token: auth.token,
      exp: auth.user.exp,
      user: {
        id: auth.user.sub,
        name: auth.user.name,
        email: auth.user.email,
        role: auth.user.role,
        isSuperadmin: auth.user.isSuperadmin,
      },
    },
    { headers: NO_CACHE_HEADERS }
  );
}
