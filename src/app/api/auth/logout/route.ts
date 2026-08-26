import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/jwt";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function POST() {
  const response = NextResponse.json(
    { success: true, message: "Logged out successfully" },
    { headers: NO_CACHE_HEADERS }
  );

  response.cookies.set(AUTH_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return response;
}

export async function GET() {
  return POST();
}
