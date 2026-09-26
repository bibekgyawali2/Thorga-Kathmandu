"use client";

import React from "react";
import Image from "next/image";
import {
  FilePdf,
  Image as ImageIcon,
  Eye,
  Download,
  ArrowSquareOut,
  ArrowsOut,
  Phone,
  EnvelopeSimple,
  GoogleLogo,
} from "@phosphor-icons/react";
import type { BusinessItem, Language } from "@/data/mockData";
import {
  isGoogleDriveUrl,
  getGoogleDriveViewUrl,
  getGoogleDriveImageUrl,
  getGoogleDriveDownloadUrl,
} from "@/lib/googleDrive";
import { documentUrl } from "@/lib/documentUrl";
import { isValidImageSrc } from "@/lib/validation";

export interface BusinessCardProps {
  item: BusinessItem;
  lang: Language;
  onPreviewPdf: (payload: { url: string; title: string }) => void;
  onPreviewImage: (payload: { url: string; title: string }) => void;
}

export function BusinessCard({
  item,
  lang,
  onPreviewPdf,
  onPreviewImage,
}: BusinessCardProps) {
  const isDrive = isGoogleDriveUrl(item.fileUrl);
  const isPdf = item.fileType === "pdf";
  const hasBody = Boolean(
    item.description || item.contactPhone || item.contactEmail || isPdf || isDrive
  );

  return (
    <article className="rounded-card border border-line bg-surface overflow-hidden flex flex-col justify-between hover:border-accent transition-all duration-200 shadow-e1 hover:shadow-e2 group">
      {/* Media Banner / Visual Display Area */}
      <div
        onClick={() => {
          if (isPdf) {
            onPreviewPdf({
              url: item.fileUrl,
              title:
                item.title && item.title !== "."
                  ? item.title
                  : lang === "ne"
                  ? "कागजात"
                  : "Document",
            });
          } else {
            const imgUrl = isDrive ? getGoogleDriveImageUrl(item.fileUrl) : item.fileUrl;
            onPreviewImage({ url: imgUrl, title: item.title });
          }
        }}
        className={`relative ${
          hasBody ? "h-56 sm:h-60 border-b border-line" : "h-64 sm:h-72"
        } w-full bg-tint/60 overflow-hidden flex items-center justify-center p-2 cursor-pointer group/media`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (isPdf) {
              onPreviewPdf({
                url: item.fileUrl,
                title:
                  item.title && item.title !== "."
                    ? item.title
                    : lang === "ne"
                    ? "कागजात"
                    : "Document",
              });
            } else {
              const imgUrl = isDrive ? getGoogleDriveImageUrl(item.fileUrl) : item.fileUrl;
              onPreviewImage({ url: imgUrl, title: item.title });
            }
          }
        }}
        title={lang === "ne" ? "विस्तृत हेर्न थिच्नुहोस्" : "Click to view full image"}
      >
        {isPdf ? (
          /* PDF Document Card Frame */
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center space-y-2 p-4 text-center">
            <div className="w-14 h-14 rounded-control bg-danger/10 text-danger flex items-center justify-center shadow-xs">
              <FilePdf size={36} weight="duotone" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-chip bg-surface border border-line text-muted inline-block">
                PDF Document {isDrive && "• Google Drive"}
              </span>
            </div>
          </div>
        ) : isDrive ? (
          /* Google Drive Image */
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={getGoogleDriveImageUrl(item.fileUrl)}
              alt={item.title && item.title !== "." ? item.title : "Business"}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-contain group-hover:scale-105 transition-transform duration-200"
              unoptimized
            />
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-chip bg-black/75 backdrop-blur-xs text-white text-[10px] flex items-center gap-1 font-mono">
              <GoogleLogo size={12} />
              <span>Google Drive</span>
            </div>
          </div>
        ) : isValidImageSrc(item.fileUrl) ? (
          /* Cloudinary or Standard Image */
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={item.fileUrl}
              alt={item.title && item.title !== "." ? item.title : "Business"}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-contain group-hover:scale-105 transition-transform duration-200"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted">
            <ImageIcon size={36} />
            <span className="text-[11px] mt-1 font-mono">Image</span>
          </div>
        )}

        {/* Fullscreen Expand Trigger Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (isPdf) {
              onPreviewPdf({
                url: item.fileUrl,
                title:
                  item.title && item.title !== "."
                    ? item.title
                    : lang === "ne"
                    ? "कागजात"
                    : "Document",
              });
            } else {
              const imgUrl = isDrive ? getGoogleDriveImageUrl(item.fileUrl) : item.fileUrl;
              onPreviewImage({ url: imgUrl, title: item.title });
            }
          }}
          className="absolute top-3 right-3 p-1.5 rounded-chip bg-surface/90 hover:bg-surface text-fg border border-line shadow-xs transition-colors cursor-pointer"
          title={lang === "ne" ? "विस्तृत हेर्नुहोस्" : "Expand"}
        >
          <ArrowsOut size={15} />
        </button>
      </div>

      {/* Body Info */}
      {hasBody && (
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
          {(item.description || item.contactPhone || item.contactEmail) && (
            <div className="space-y-2">
              {item.description && (
                <p className="text-xs leading-relaxed text-muted line-clamp-3">
                  {item.description}
                </p>
              )}

              {/* Contact metadata */}
              {(item.contactPhone || item.contactEmail) && (
                <div className="pt-2 space-y-1.5 text-xs text-muted border-t border-line/60">
                  {item.contactPhone && (
                    <div className="flex items-center gap-2 font-mono text-fg">
                      <Phone size={14} className="text-accent flex-shrink-0" />
                      <a
                        href={`tel:${item.contactPhone}`}
                        className="hover:text-accent transition-colors"
                      >
                        {item.contactPhone}
                      </a>
                    </div>
                  )}
                  {item.contactEmail && (
                    <div className="flex items-center gap-2 font-mono">
                      <EnvelopeSimple size={14} className="text-accent flex-shrink-0" />
                      <a
                        href={`mailto:${item.contactEmail}`}
                        className="hover:text-accent transition-colors truncate"
                      >
                        {item.contactEmail}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Links */}
          {(isPdf || isDrive) && (
            <div className="pt-3 border-t border-line flex items-center gap-2">
              {isPdf && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      onPreviewPdf({
                        url: item.fileUrl,
                        title:
                          item.title && item.title !== "."
                            ? item.title
                            : lang === "ne"
                            ? "कागजात"
                            : "Document",
                      })
                    }
                    className="flex-1 py-2 px-3 rounded-control text-xs font-semibold flex items-center justify-center gap-1.5 bg-tint hover:bg-accent-soft text-accent transition-colors cursor-pointer"
                  >
                    <Eye size={15} />
                    <span>{lang === "ne" ? "PDF हेर्नुहोस्" : "View PDF"}</span>
                  </button>
                  <a
                    href={
                      isDrive
                        ? getGoogleDriveDownloadUrl(item.fileUrl)
                        : documentUrl(item.fileUrl, "download", item.title)
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-e1"
                    title={lang === "ne" ? "डाउनलोड" : "Download"}
                  >
                    <Download size={15} />
                  </a>
                </>
              )}

              {isDrive && (
                <a
                  href={getGoogleDriveViewUrl(item.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-control border border-line bg-surface hover:bg-tint text-muted hover:text-fg transition-colors ${
                    !isPdf ? "w-full justify-center flex items-center gap-1.5 text-xs font-medium" : ""
                  }`}
                  title={lang === "ne" ? "गुगल ड्राइभमा खोल्नुहोस्" : "Open in Google Drive"}
                >
                  <ArrowSquareOut size={16} />
                  {!isPdf && (
                    <span>
                      {lang === "ne" ? "गुगल ड्राइभमा खोल्नुहोस्" : "Open in Google Drive"}
                    </span>
                  )}
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
