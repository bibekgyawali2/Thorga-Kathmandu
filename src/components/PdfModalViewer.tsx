"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  FileText,
  FilePdf,
  X,
  Download,
  ArrowSquareOut,
  CaretLeft,
  CaretRight,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowsOut,
  Spinner,
  ArrowClockwise,
  Eye,
  Rows,
  Square,
} from "@phosphor-icons/react";
import {
  documentUrl,
  isCloudinaryAsset,
  isCloudinaryPdf,
  getCloudinaryPdfPageUrl,
} from "@/lib/documentUrl";
import {
  isGoogleDriveUrl,
  getGoogleDrivePreviewUrl,
  getGoogleDriveViewUrl,
  getGoogleDriveDownloadUrl,
} from "@/lib/googleDrive";
import type { Language } from "@/data/mockData";

export interface PdfModalViewerProps {
  url: string;
  title: string;
  category?: string;
  pages?: number | null;
  fileSize?: string | null;
  lang?: Language;
  onClose: () => void;
}

export function PdfModalViewer({
  url,
  title,
  category,
  pages: totalPagesProp,
  fileSize,
  lang = "ne",
  onClose,
}: PdfModalViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [inputPage, setInputPage] = useState("1");
  const [lastKnownPage, setLastKnownPage] = useState<number | null>(totalPagesProp || null);
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState<"single" | "scroll">("single");
  const [imageLoading, setImageLoading] = useState(true);
  const [renderFailed, setRenderFailed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isDrive = isGoogleDriveUrl(url);
  const isCldPdf = isCloudinaryPdf(url);

  // Close on Escape key, change pages on Arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && viewMode === "single") {
        setCurrentPage((p) => Math.max(1, p - 1));
      } else if (e.key === "ArrowRight" && viewMode === "single") {
        setCurrentPage((p) => (lastKnownPage && p >= lastKnownPage ? p : p + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, lastKnownPage, viewMode]);

  // Keep inputPage synced with currentPage
  useEffect(() => {
    setInputPage(String(currentPage));
    setImageLoading(true);
  }, [currentPage]);

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(inputPage, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      if (lastKnownPage && parsed > lastKnownPage) {
        setCurrentPage(lastKnownPage);
      } else {
        setCurrentPage(parsed);
      }
    } else {
      setInputPage(String(currentPage));
    }
  };

  const handleZoom = (delta: number) => {
    setZoom((z) => Math.min(200, Math.max(60, z + delta)));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Build target URLs
  const viewInNewTabUrl = isDrive
    ? getGoogleDriveViewUrl(url)
    : isCloudinaryAsset(url)
    ? documentUrl(url, "inline", title)
    : url;

  const downloadUrl = isDrive
    ? getGoogleDriveDownloadUrl(url)
    : isCloudinaryAsset(url)
    ? documentUrl(url, "download", title)
    : url;

  const currentPageImageUrl = !renderFailed && isCldPdf
    ? getCloudinaryPdfPageUrl(url, currentPage, { width: 1600 })
    : null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 cursor-pointer"
    >
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        className={`bg-surface border border-line rounded-card w-full flex flex-col shadow-e3 overflow-hidden cursor-default animate-fade-in transition-all ${
          isFullscreen
            ? "max-w-none h-full rounded-none border-0"
            : "max-w-5xl h-[92vh] max-h-[92vh]"
        }`}
      >
        {/* HEADER BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 border-b border-line bg-tint/60 select-none">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-control bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
              <FilePdf size={22} className="text-accent" weight="duotone" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-fg truncate">
                {title}
              </h3>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted font-mono truncate">
                {category && <span className="font-semibold text-accent">{category}</span>}
                {category && (lastKnownPage || fileSize) && <span>•</span>}
                {lastKnownPage && (
                  <span>
                    {lastKnownPage} {lang === "ne" ? "पृष्ठहरू" : "Pages"}
                  </span>
                )}
                {fileSize && <span>• {fileSize}</span>}
                {isDrive && (
                  <span className="px-1.5 py-0.5 rounded-chip text-[9px] font-semibold bg-accent/10 text-accent border border-accent/20">
                    Google Drive
                  </span>
                )}
                {isCldPdf && (
                  <span className="px-1.5 py-0.5 rounded-chip text-[9px] font-semibold bg-accent/10 text-accent border border-accent/20">
                    {lang === "ne" ? "डिजिटल पाठक" : "Digital Reader"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2">
            <a
              href={viewInNewTabUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 sm:px-3 py-1.5 rounded-control border border-line bg-surface hover:bg-tint text-xs font-semibold text-fg flex items-center gap-1.5 transition-colors shadow-e1"
              title={lang === "ne" ? "नयाँ ट्याबमा खोल्नुहोस्" : "Open in new tab"}
            >
              <ArrowSquareOut size={14} className="text-accent" />
              <span className="hidden sm:inline">
                {lang === "ne" ? "नयाँ ट्याबमा" : "New Tab"}
              </span>
            </a>

            <a
              href={downloadUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 sm:px-3 py-1.5 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-e1"
              title={lang === "ne" ? "डाउनलोड" : "Download PDF"}
            >
              <Download size={14} />
              <span className="hidden sm:inline">
                {lang === "ne" ? "डाउनलोड" : "Download"}
              </span>
            </a>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-control text-muted hover:text-fg hover:bg-surface border border-transparent hover:border-line transition-colors cursor-pointer hidden md:flex items-center justify-center"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              <ArrowsOut size={17} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-control text-muted hover:text-fg hover:bg-surface border border-transparent hover:border-line transition-colors cursor-pointer"
              aria-label="Close"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* CONTROLS TOOLBAR (For Cloudinary Multi-page PDF) */}
        {isCldPdf && !renderFailed && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-line bg-surface/90 text-xs select-none">
            {/* PAGINATION CONTROLS */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-2.5 py-1 rounded-control border border-line bg-surface hover:bg-tint text-fg font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                title="Previous page"
              >
                <CaretLeft size={14} />
                <span className="hidden xs:inline">{lang === "ne" ? "अघिल्लो" : "Prev"}</span>
              </button>

              <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1 font-mono">
                <span className="text-muted text-[11px]">{lang === "ne" ? "पृष्ठ" : "Page"}</span>
                <input
                  type="text"
                  value={inputPage}
                  onChange={(e) => setInputPage(e.target.value)}
                  onBlur={handlePageInputSubmit}
                  className="w-11 px-1.5 py-0.5 rounded border border-line bg-ground text-center text-xs font-bold text-fg focus:outline-none focus:border-accent"
                />
                {lastKnownPage && (
                  <span className="text-muted text-[11px]">/ {lastKnownPage}</span>
                )}
              </form>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => (lastKnownPage && p >= lastKnownPage ? p : p + 1))}
                disabled={lastKnownPage !== null && currentPage >= lastKnownPage}
                className="px-2.5 py-1 rounded-control border border-line bg-surface hover:bg-tint text-fg font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                title="Next page"
              >
                <span className="hidden xs:inline">{lang === "ne" ? "अर्को" : "Next"}</span>
                <CaretRight size={14} />
              </button>
            </div>

            {/* VIEW MODE & ZOOM CONTROLS */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* VIEW MODE TOGGLE */}
              {lastKnownPage && lastKnownPage <= 30 && (
                <div className="hidden sm:flex items-center border border-line rounded-control p-0.5 bg-ground">
                  <button
                    type="button"
                    onClick={() => setViewMode("single")}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                      viewMode === "single"
                        ? "bg-surface text-accent shadow-sm"
                        : "text-muted hover:text-fg"
                    }`}
                    title="Single Page View"
                  >
                    <Square size={12} />
                    <span>{lang === "ne" ? "एकल" : "Single"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("scroll")}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                      viewMode === "scroll"
                        ? "bg-surface text-accent shadow-sm"
                        : "text-muted hover:text-fg"
                    }`}
                    title="Continuous Scroll View"
                  >
                    <Rows size={12} />
                    <span>{lang === "ne" ? "स्क्रोल" : "Scroll"}</span>
                  </button>
                </div>
              )}

              {/* ZOOM CONTROLS */}
              <div className="flex items-center gap-1 border border-line rounded-control p-0.5 bg-ground">
                <button
                  type="button"
                  onClick={() => handleZoom(-15)}
                  disabled={zoom <= 60}
                  className="p-1 rounded text-muted hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Zoom Out"
                >
                  <MagnifyingGlassMinus size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(100)}
                  className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-fg hover:text-accent transition-colors"
                  title="Reset Zoom to 100%"
                >
                  {zoom}%
                </button>
                <button
                  type="button"
                  onClick={() => handleZoom(15)}
                  disabled={zoom >= 200}
                  className="p-1 rounded text-muted hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Zoom In"
                >
                  <MagnifyingGlassPlus size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN VIEWER CANVAS */}
        <div className="flex-1 bg-neutral-900/95 dark:bg-black/95 overflow-auto relative p-3 sm:p-6 flex flex-col items-center justify-start min-h-[420px] select-none">
          {/* 1. GOOGLE DRIVE HOSTED PDF */}
          {isDrive ? (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4 max-w-4xl">
              <div className="w-full rounded-control p-3 bg-neutral-800/80 border border-neutral-700/60 text-xs text-neutral-300 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FilePdf size={18} className="text-accent" />
                  <span>
                    {lang === "ne"
                      ? "यो कागजात Google Drive मा होस्ट गरिएको छ।"
                      : "This document is securely hosted on Google Drive."}
                  </span>
                </div>
                <a
                  href={getGoogleDriveViewUrl(url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline font-semibold flex items-center gap-1"
                >
                  <ArrowSquareOut size={13} />
                  {lang === "ne" ? "सिधै खोल्नुहोस्" : "Open directly"}
                </a>
              </div>
              <iframe
                src={getGoogleDrivePreviewUrl(url)}
                title={title}
                className="w-full flex-1 min-h-[520px] rounded-control border border-neutral-700 bg-neutral-900 shadow-2xl"
                allow="autoplay"
              />
            </div>
          ) : isCldPdf && !renderFailed && currentPageImageUrl ? (
            /* 2. CLOUDINARY RASTERIZED PDF VIEWER */
            viewMode === "single" ? (
              <div className="relative flex flex-col items-center justify-center my-auto transition-transform duration-150" style={{ width: `${zoom}%`, maxWidth: "1200px" }}>
                {imageLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/60 backdrop-blur-sm z-10 rounded-card p-6 min-h-[300px]">
                    <Spinner size={32} className="text-accent animate-spin mb-2" />
                    <span className="text-xs text-neutral-300 font-mono">
                      {lang === "ne" ? "पृष्ठ लोड हुँदैछ..." : `Loading Page ${currentPage}...`}
                    </span>
                  </div>
                )}

                <div className="relative bg-white shadow-2xl rounded-sm overflow-hidden border border-neutral-800 transition-all">
                  <Image
                    key={`${url}-page-${currentPage}`}
                    src={currentPageImageUrl}
                    alt={`${title} - Page ${currentPage}`}
                    width={1600}
                    height={2263}
                    priority={currentPage === 1}
                    unoptimized
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                      setImageLoading(false);
                      if (currentPage === 1) {
                        setRenderFailed(true);
                      } else {
                        setLastKnownPage(currentPage - 1);
                        setCurrentPage(currentPage - 1);
                      }
                    }}
                    className="w-full h-auto object-contain block"
                  />
                </div>

                <div className="mt-3 text-[11px] text-neutral-400 font-mono">
                  {lang === "ne" ? "पृष्ठ" : "Page"} {currentPage}
                  {lastKnownPage ? ` / ${lastKnownPage}` : ""}
                </div>
              </div>
            ) : (
              /* CONTINUOUS SCROLL VIEW */
              <div className="w-full max-w-3xl space-y-6 my-auto" style={{ width: `${zoom}%` }}>
                {Array.from({ length: lastKnownPage || 1 }, (_, i) => i + 1).map((pg) => {
                  const pageImg = getCloudinaryPdfPageUrl(url, pg, { width: 1400 });
                  if (!pageImg) return null;
                  return (
                    <div key={`scroll-page-${pg}`} className="flex flex-col items-center">
                      <div className="bg-white shadow-2xl rounded-sm overflow-hidden border border-neutral-800 w-full">
                        <Image
                          src={pageImg}
                          alt={`${title} - Page ${pg}`}
                          width={1400}
                          height={1980}
                          loading="lazy"
                          unoptimized
                          className="w-full h-auto object-contain block"
                        />
                      </div>
                      <span className="mt-2 text-[10px] text-neutral-400 font-mono">
                        {lang === "ne" ? "पृष्ठ" : "Page"} {pg}
                      </span>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* 3. FALLBACK IFRAME / DIRECT VIEWER */
            <div className="w-full h-full flex flex-col items-center justify-center space-y-3 max-w-4xl">
              <iframe
                src={documentUrl(url, "inline", title)}
                title={title}
                className="w-full flex-1 min-h-[500px] rounded-control border border-neutral-700 bg-white shadow-2xl"
              />
              <p className="text-xs text-neutral-400 text-center">
                {lang === "ne"
                  ? "यदि PDF यहाँ खुलेन भने माथिको 'नयाँ ट्याबमा' बटन क्लिक गर्नुहोस् वा सिधै डाउनलोड गर्नुहोस्।"
                  : "If the embedded PDF does not open here, please click 'New Tab' above or download it directly."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
