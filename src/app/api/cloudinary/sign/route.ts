import { NextRequest, NextResponse } from "next/server";
import { generateUploadSignature } from "@/lib/cloudinary";
import { verifyAuth } from "@/lib/authGuard";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/** Upload parameters the server is willing to sign. */
const ALLOWED_SIGN_PARAMS = [
  "timestamp",
  "folder",
  "upload_preset",
  "source",
  "tags",
  "context",
  "eager",
] as const;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const body = await request.json().catch(() => null);
    const paramsToSign = body?.paramsToSign;

    if (!paramsToSign || typeof paramsToSign !== "object") {
      return NextResponse.json(
        { error: "Missing paramsToSign parameter" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // Sign only known-safe upload parameters. Signing whatever the caller sends
    // would let an authenticated editor mint signatures for arbitrary
    // operations, including overwriting existing assets by public_id.
    const filtered: Record<string, string | number> = {};
    for (const key of ALLOWED_SIGN_PARAMS) {
      const value = (paramsToSign as Record<string, unknown>)[key];
      if (value !== undefined && (typeof value === "string" || typeof value === "number")) {
        filtered[key] = value;
      }
    }

    if (filtered.timestamp === undefined) {
      return NextResponse.json(
        { error: "A timestamp is required to sign an upload." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const signature = generateUploadSignature(filtered);
    return NextResponse.json({ signature }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("Cloudinary sign error:", error);
    return NextResponse.json(
      { error: "Failed to generate Cloudinary signature" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
