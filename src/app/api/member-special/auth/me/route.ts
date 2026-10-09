import { NextRequest, NextResponse } from "next/server";
import { verifyMemberOrAdminAuth } from "@/lib/memberAuth";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(req: NextRequest) {
  const check = await verifyMemberOrAdminAuth(req);
  if (!check.authorized) {
    return NextResponse.json({ authenticated: false }, { status: 401, headers: NO_CACHE_HEADERS });
  }

  return NextResponse.json(
    {
      authenticated: true,
      role: check.role,
      user: check.user,
    },
    { status: 200, headers: NO_CACHE_HEADERS }
  );
}
