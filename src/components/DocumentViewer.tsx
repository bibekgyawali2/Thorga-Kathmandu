"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  CaretLeft,
  CaretRight,
  ArrowSquareOut,
  Download,
  FileText,
} from "@phosphor-icons/react";
import type { Language, PageDocument } from "@/data/mockData";
import { documentUrl, isCloudinaryAsset } from "@/lib/documentUrl";
import {
  isGoogleDriveUrl,
  getGoogleDrivePreviewUrl,
  getGoogleDriveViewUrl,
  getGoogleDriveDownloadUrl,
} from "@/lib/googleDrive";

/**
 * Renders a document inline so a visitor can read it without downloading.
 *
 * PDFs stored on Cloudinary are rendered page by page as images using
 * Cloudinary's own pg_<n> transformation. That works on every browser,
 * including iOS and Android, where an <iframe> pointed at a PDF usually shows
 * nothing at all. Anything else falls back to an iframe, and there is always a
 * plain link out for people who would rather use their own reader.
 */

const CLOUDINARY_PDF = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)\.pdf$/i;

function cloudinaryPageImage(url: string, page: number): string | null {
  const match = url.match(CLOUDINARY_PDF);
  if (!match) return null;
  const [, prefix, rest] = match;
  // Strip any transformation Cloudinary already carries so ours is not nested.
  return `${prefix}pg_${page},f_jpg,q_auto,w_1600/${rest}.jpg`;
}

export function DocumentViewer({
  document: doc,
  lang,
}: {
  document: PageDocument;
  lang: Language;
}) {
  const [page, setPage] = useState(1);
  // Set when Cloudinary cannot render the page, so we stop trying and show the
  // iframe instead of a broken image.
  const [renderFailed, setRenderFailed] = useState(false);
  // Discovered by walking past the last page when no page count was stored.
  const [lastKnownPage, setLastKnownPage] = useState<number | null>(doc.pageCount);

  const title = lang === "ne" ? doc.titleNe : doc.titleEn;

  // Dedicated Google Drive PDF Viewer
  if (isGoogleDriveUrl(doc.fileUrl)) {
    const previewUrl = getGoogleDrivePreviewUrl(doc.fileUrl);
    const viewUrl = getGoogleDriveViewUrl(doc.fileUrl);
    const downloadUrl = getGoogleDriveDownloadUrl(doc.fileUrl);

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-line">
          <h3 className="text-sm font-bold text-fg flex items-center gap-2 min-w-0">
            <FileText size={18} weight="duotone" className="text-accent flex-shrink-0" />
            <span className="truncate">{title}</span>
            <span className="px-2 py-0.5 rounded-chip text-[10px] font-semibold bg-accent/10 text-accent flex-shrink-0">
              Google Drive PDF
            </span>
          </h3>
          <div className="flex items-center gap-3">
            <a
              href={viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
            >
              <ArrowSquareOut size={14} />
              {lang === "ne" ? "नयाँ ट्याबमा" : "Open in Google Drive"}
            </a>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-fg transition-colors"
            >
              <Download size={14} />
              {lang === "ne" ? "डाउनलोड" : "Download"}
            </a>
          </div>
        </div>

        <div className="relative w-full rounded-card overflow-hidden border border-line bg-surface shadow-e1">
          <iframe
            src={previewUrl}
            title={title}
            className="w-full h-[75vh] min-h-[520px] border-0"
            allow="autoplay"
          />
        </div>

        <p className="text-[11px] text-muted flex items-center gap-1.5">
          <span>
            {lang === "ne"
              ? "यदि यहाँ PDF खुलेन भने"
              : "If the embedded PDF does not load in your browser,"}
          </span>
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline font-medium"
          >
            {lang === "ne" ? "Google Drive मा सिधै खोल्नुहोस्" : "open directly in Google Drive"}
          </a>
        </p>
      </div>
    );
  }

  if (doc.fileType === "image") {
    return (
      <figure className="space-y-3">
        <div className="relative w-full rounded-card overflow-hidden border border-line bg-tint">
          <Image
            src={doc.fileUrl}
            alt={title}
            width={1600}
            height={2200}
            sizes="(max-width: 1024px) 100vw, 900px"
            className="w-full h-auto object-contain"
          />
        </div>
        <figcaption className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-semibold text-fg">{title}</span>
          <a
            href={isCloudinaryAsset(doc.fileUrl) ? documentUrl(doc.fileUrl, "inline", title) : doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
          >
            <ArrowSquareOut size={14} />
            {lang === "ne" ? "पूरा आकारमा हेर्नुहोस्" : "View full size"}
          </a>
        </figcaption>
      </figure>
    );
  }

  const pageImage = renderFailed ? null : cloudinaryPageImage(doc.fileUrl, page);
  const atLastPage = lastKnownPage !== null && page >= lastKnownPage;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-fg flex items-center gap-2 min-w-0">
          <FileText size={17} weight="duotone" className="text-accent flex-shrink-0" />
          <span className="truncate">{title}</span>
        </h3>
        <div className="flex items-center gap-3">
          <a
            href={isCloudinaryAsset(doc.fileUrl) ? documentUrl(doc.fileUrl, "inline", title) : doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
          >
            <ArrowSquareOut size={14} />
            {lang === "ne" ? "नयाँ ट्याबमा" : "Open in new tab"}
          </a>
          <a
            href={
              isCloudinaryAsset(doc.fileUrl)
                ? documentUrl(doc.fileUrl, "download", title)
                : doc.fileUrl
            }
            download
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-fg transition-colors"
          >
            <Download size={14} />
            {lang === "ne" ? "डाउनलोड" : "Download"}
          </a>
        </div>
      </div>

      {pageImage ? (
        <>
          <div className="relative w-full rounded-card overflow-hidden border border-line bg-tint">
            <Image
              key={pageImage}
              src={pageImage}
              alt={
                lang === "ne"
                  ? `${title}, पृष्ठ ${page}`
                  : `${title}, page ${page}`
              }
              width={1600}
              height={2263}
              sizes="(max-width: 1024px) 100vw, 900px"
              className="w-full h-auto object-contain"
              onError={() => {
                if (page === 1) {
                  // Cloudinary will not rasterise this file at all.
                  setRenderFailed(true);
                } else {
                  // We walked past the end; step back and remember where it is.
                  setLastKnownPage(page - 1);
                  setPage(page - 1);
                }
              }}
            />
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-control border border-line bg-surface hover:bg-tint text-fg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <CaretLeft size={13} />
              {lang === "ne" ? "अघिल्लो" : "Previous"}
            </button>

            <span className="text-xs font-mono text-muted">
              {lang === "ne" ? "पृष्ठ" : "Page"} {page}
              {lastKnownPage !== null ? ` / ${lastKnownPage}` : ""}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={atLastPage}
              className="px-3 py-1.5 rounded-control border border-line bg-surface hover:bg-tint text-fg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {lang === "ne" ? "अर्को" : "Next"}
              <CaretRight size={13} />
            </button>
          </div>
        </>
      ) : (
        <>
          <iframe
            src={isCloudinaryAsset(doc.fileUrl) ? documentUrl(doc.fileUrl, "inline", title) : doc.fileUrl}
            title={title}
            className="w-full h-[70vh] min-h-[420px] rounded-card border border-line bg-surface"
          />
          <p className="text-xs text-muted">
            {lang === "ne"
              ? "यदि दस्तावेज यहाँ देखिएन भने माथिको लिङ्कबाट नयाँ ट्याबमा खोल्नुहोस्।"
              : "If the document does not appear here, open it in a new tab using the link above."}
          </p>
        </>
      )}
    </div>
  );
}
