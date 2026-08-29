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

export function isCloudinaryAsset(url: string | undefined | null): boolean {
  return typeof url === "string" && /^https:\/\/res\.cloudinary\.com\//i.test(url);
}

export function documentUrl(
  url: string,
  mode: "inline" | "download" = "inline",
  name?: string
): string {
  if (!isCloudinaryAsset(url)) return url;
  const params = new URLSearchParams({ url, mode });
  if (name) params.set("name", name);
  return `/api/documents/file?${params.toString()}`;
}
