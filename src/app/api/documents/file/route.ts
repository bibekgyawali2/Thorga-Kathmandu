import { NextRequest, NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Streams a Cloudinary-hosted document through this origin.
 *
 * Two separate problems make the raw Cloudinary link unusable for PDFs:
 *
 *  1. Cloudinary blocks public delivery of PDF and ZIP files by default, so
 *     the asset URL returns 401. Signed delivery URLs do not bypass that; the
 *     authenticated download endpoint does.
 *  2. Browsers ignore the `download` attribute on cross-origin links, so even
 *     where delivery works, "Download" navigates instead of saving the file.
 *
 * Proxying fixes both: bytes come from Cloudinary's authenticated endpoint,
 * and they reach the browser same-origin so Content-Disposition is honoured.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/**
 * Parses a delivery URL belonging to this account, returning its public id and
 * format. Anything pointing elsewhere returns null, so this route cannot be
 * used as an open proxy for arbitrary URLs.
 */
function parseOwnAsset(raw: string): { publicId: string; format: string } | null {
  if (!CLOUD_NAME) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;
  if (url.hostname !== "res.cloudinary.com") return null;

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments[0] !== CLOUD_NAME) return null;
  if (segments[1] !== "image" && segments[1] !== "raw") return null;
  if (segments[2] !== "upload") return null;

  // Everything after /upload/ minus any transformation segment and the
  // version marker is the public id.
  let rest = segments.slice(3);
  if (rest.length > 1 && /^v\d+$/.test(rest[0])) rest = rest.slice(1);
  else if (rest.length > 2 && /^v\d+$/.test(rest[1])) rest = rest.slice(2);

  const joined = rest.join("/");
  const dot = joined.lastIndexOf(".");
  if (dot === -1) return null;

  const publicId = joined.slice(0, dot);
  const format = joined.slice(dot + 1).toLowerCase();

  if (!publicId || !/^[a-z0-9]+$/.test(format)) return null;
  return { publicId, format };
}

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  const disposition =
    request.nextUrl.searchParams.get("mode") === "download" ? "attachment" : "inline";
  const requestedName = request.nextUrl.searchParams.get("name");

  if (!raw) {
    return NextResponse.json({ error: "A url parameter is required." }, { status: 400 });
  }

  const asset = parseOwnAsset(raw);
  if (!asset) {
    return NextResponse.json(
      { error: "That link does not point at a document on this site." },
      { status: 400 }
    );
  }

  try {
    const signed = cloudinary.utils.private_download_url(asset.publicId, asset.format, {
      resource_type: "image",
      type: "upload",
      expires_at: Math.floor(Date.now() / 1000) + 300,
    });

    const upstream = await fetch(signed);
    if (!upstream.ok || !upstream.body) {
      console.error("[api/documents/file] upstream returned", upstream.status);
      return NextResponse.json(
        { error: "The document could not be retrieved." },
        { status: 502 }
      );
    }

    // Strip anything that could break out of the header value, keeping
    // Devanagari so Nepali filenames survive.
    const safeName = (requestedName || asset.publicId.split("/").pop() || "document")
      .replace(/[^\wऀ-ॿ.\- ]+/g, "")
      .slice(0, 80);

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": CONTENT_TYPES[asset.format] ?? "application/octet-stream",
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(safeName)}.${asset.format}"`,
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[api/documents/file] error:", error);
    return NextResponse.json({ error: "The document could not be retrieved." }, { status: 500 });
  }
}
