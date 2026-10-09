import { NextResponse } from "next/server";
import { MEMBER_AUTH_COOKIE_NAME } from "@/lib/memberAuth";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function POST() {
  const res = NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
  res.cookies.set({
    name: MEMBER_AUTH_COOKIE_NAME,
    value: "",
    maxAge: 0,
    path: "/",
  });
  return res;
}
