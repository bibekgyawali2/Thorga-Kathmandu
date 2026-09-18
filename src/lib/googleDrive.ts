/**
 * Utilities for detecting, parsing, and transforming Google Drive URLs.
 *
 * Google Drive links can be shared in various formats:
 * - https://drive.google.com/file/d/<ID>/view?usp=sharing
 * - https://drive.google.com/open?id=<ID>
 * - https://drive.google.com/uc?id=<ID>&export=download
 * - https://docs.google.com/document/d/<ID>/edit
 *
 * Google blocks embedding `/view` URLs in iframes with X-Frame-Options: SAMEORIGIN.
 * Converting the file ID to `/preview` enables responsive, cross-browser iframe embedding.
 */

export function isGoogleDriveUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  return /^(https?:\/\/)?(drive\.google\.com|docs\.google\.com)\//i.test(url.trim());
}

export function getGoogleDriveFileId(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  // Pattern 1: /file/d/<id>
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (fileMatch) return fileMatch[1];

  // Pattern 2: /d/<id> (docs, sheets, presentations)
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/i);
  if (dMatch) return dMatch[1];

  // Pattern 3: ?id=<id> or &id=<id>
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (idMatch) return idMatch[1];

  return null;
}

/**
 * Returns an embeddable iframe preview URL for Google Drive files.
 * Format: https://drive.google.com/file/d/<ID>/preview
 */
export function getGoogleDrivePreviewUrl(url?: string | null): string {
  const id = getGoogleDriveFileId(url);
  if (!id) return url || "";
  return `https://drive.google.com/file/d/${id}/preview`;
}

/**
 * Returns a standard direct view URL for opening in a new tab.
 * Format: https://drive.google.com/file/d/<ID>/view?usp=sharing
 */
export function getGoogleDriveViewUrl(url?: string | null): string {
  const id = getGoogleDriveFileId(url);
  if (!id) return url || "";
  return `https://drive.google.com/file/d/${id}/view?usp=sharing`;
}

/**
 * Returns a direct download URL for Google Drive files.
 * Format: https://drive.google.com/uc?export=download&id=<ID>
 */
export function getGoogleDriveDownloadUrl(url?: string | null): string {
  const id = getGoogleDriveFileId(url);
  if (!id) return url || "";
  return `https://drive.google.com/uc?export=download&id=${id}`;
}
