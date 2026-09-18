/**
 * Builds links for documents stored on Cloudinary.
 *
 * Cloudinary blocks public delivery of PDFs by default, so a direct link to
 * the asset returns 401, and browsers ignore the `download` attribute on
 * cross-origin links regardless. Both are solved by routing through
 * /api/documents/file, which streams the file from Cloudinary's authenticated
 * endpoint under our own origin.
 *
 * URLs hosted anywhere else are returned untouched.
 */

import {
  isGoogleDriveUrl,
  getGoogleDriveDownloadUrl,
  getGoogleDriveViewUrl,
} from "./googleDrive";

export function isCloudinaryAsset(url: string | undefined | null): boolean {
  return typeof url === "string" && /^https:\/\/res\.cloudinary\.com\//i.test(url);
}

export function isCloudinaryPdf(url: string | undefined | null): boolean {
  return (
    typeof url === "string" &&
    isCloudinaryAsset(url) &&
    url.toLowerCase().endsWith(".pdf")
  );
}

/**
 * Builds a transformed image URL for a specific page of a Cloudinary-hosted PDF.
 * This delivers a crystal-clear rasterized page image without iframe restrictions,
 * CORS errors, or PDF plugin compatibility issues on mobile/desktop browsers.
 */
export function getCloudinaryPdfPageUrl(
  url: string | null | undefined,
  page: number = 1,
  options: { width?: number; quality?: string; format?: string } = {}
): string | null {
  if (!url || typeof url !== "string") return null;
  if (!/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//i.test(url)) return null;
  if (!url.toLowerCase().endsWith(".pdf")) return null;

  const uploadIndex = url.indexOf("/upload/");
  if (uploadIndex === -1) return null;

  const prefix = url.substring(0, uploadIndex + 8);
  let rest = url.substring(uploadIndex + 8);

  const lastDot = rest.lastIndexOf(".");
  if (lastDot !== -1) rest = rest.substring(0, lastDot);

  const width = options.width ?? 1600;
  const format = options.format ?? "jpg";
  const quality = options.quality ?? "auto";

  return `${prefix}pg_${page},f_${format},q_${quality},w_${width}/${rest}.${format}`;
}

export function documentUrl(
  url: string,
  mode: "inline" | "download" = "inline",
  name?: string
): string {
  if (isGoogleDriveUrl(url)) {
    return mode === "download"
      ? getGoogleDriveDownloadUrl(url)
      : getGoogleDriveViewUrl(url);
  }
  if (!isCloudinaryAsset(url)) return url;
  const params = new URLSearchParams({ url, mode });
  if (name) params.set("name", name);
  return `/api/documents/file?${params.toString()}`;
}

