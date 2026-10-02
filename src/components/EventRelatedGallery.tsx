"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Language,
  GalleryItem,
  GalleryAlbum,
} from "@/data/mockData";
import { Images, ArrowSquareOut, ArrowsOut } from "@phosphor-icons/react";
import { isValidImageSrc } from "@/lib/validation";

interface EventRelatedGalleryProps {
  galleryId?: string;
  lang: Language;
  albums: GalleryAlbum[];
  gallery: GalleryItem[];
  onZoomImage: (image: { url: string; title: string }) => void;
}

export const EventRelatedGallery = React.memo(function EventRelatedGallery({
  galleryId,
  lang,
  albums,
  gallery,
  onZoomImage,
}: EventRelatedGalleryProps) {
  if (!galleryId) return null;

  const linkedItem = useMemo(
    () => gallery.find((g) => g.id === galleryId) || null,
    [gallery, galleryId]
  );
  const linkedAlbum = useMemo(
    () => albums.find((a) => a.id === galleryId) || null,
    [albums, galleryId]
  );

  if (!linkedItem && !linkedAlbum && !galleryId) return null;

  const albumTargetUrl = linkedAlbum
    ? `/gallery?album=${encodeURIComponent(linkedAlbum.id)}`
    : `/gallery?album=${encodeURIComponent(galleryId)}`;

  const photoTargetUrl = linkedItem
    ? `/gallery?photo=${encodeURIComponent(linkedItem.id)}`
    : "/gallery";

  const targetUrl = linkedAlbum ? albumTargetUrl : linkedItem ? photoTargetUrl : albumTargetUrl;

  return (
    <div className="space-y-3 pt-4 border-t border-line">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
          <Images size={16} className="text-accent" />
          <span>{lang === "ne" ? "सम्बन्धित ग्यालरी" : "Related Gallery"}</span>
        </h4>
        <Link
          href={targetUrl}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover transition-colors group/link"
        >
          <span>
            {linkedAlbum
              ? lang === "ne"
                ? "यो एल्बम हेर्नुहोस्"
                : "View This Album"
              : linkedItem
              ? lang === "ne"
                ? "यो तस्बिर हेर्नुहोस्"
                : "View Photo"
              : lang === "ne"
              ? "एल्बम हेर्नुहोस्"
              : "View Album"}
          </span>
          <ArrowSquareOut
            size={13}
            className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform"
          />
        </Link>
      </div>

      {linkedItem && (
        <div className="p-3.5 rounded-card bg-ground border border-line flex flex-col sm:flex-row items-center gap-4">
          {isValidImageSrc(linkedItem.imageUrl) && (
            <Link
              href={photoTargetUrl}
              className="relative w-full sm:w-44 h-32 rounded-control overflow-hidden bg-tint flex-shrink-0 group/gimg border border-line cursor-pointer"
            >
              <Image
                src={linkedItem.imageUrl}
                alt={lang === "ne" ? linkedItem.titleNe : linkedItem.titleEn}
                fill
                sizes="(max-width: 640px) 100vw, 176px"
                className="object-cover group-hover/gimg:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/gimg:opacity-100 transition-opacity flex items-center justify-center text-white">
                <ArrowsOut size={20} />
              </div>
            </Link>
          )}
          <div className="flex-1 space-y-1.5 min-w-0 w-full">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-chip bg-accent-soft text-accent">
                {lang === "ne" ? linkedItem.categoryNe : linkedItem.categoryEn}
              </span>
              <span className="text-[11px] text-muted font-mono">
                {lang === "ne" ? linkedItem.dateNe : linkedItem.dateEn}
              </span>
            </div>
            <Link
              href={photoTargetUrl}
              className="text-sm font-bold text-fg hover:text-accent transition-colors truncate block"
            >
              {lang === "ne" ? linkedItem.titleNe : linkedItem.titleEn}
            </Link>
            <p className="text-xs text-muted">
              {lang === "ne"
                ? "यस गतिविधिसँग सम्बन्धित तस्बिर ग्यालरीमा उपलब्ध छ। पूर्ण आकारमा हेर्न थिच्नुहोस्।"
                : "Photo associated with this event is available in the gallery. Click to view."}
            </p>
          </div>
        </div>
      )}

      {linkedAlbum && (
        <div className="p-3.5 rounded-card bg-ground border border-line space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 min-w-0">
              <Link
                href={albumTargetUrl}
                className="text-sm font-bold text-fg hover:text-accent transition-colors truncate block"
              >
                {lang === "ne" ? linkedAlbum.titleNe : linkedAlbum.titleEn}
              </Link>
              {Boolean(linkedAlbum.descriptionNe || linkedAlbum.descriptionEn) && (
                <p className="text-xs text-muted line-clamp-1">
                  {lang === "ne"
                    ? linkedAlbum.descriptionNe || linkedAlbum.descriptionEn
                    : linkedAlbum.descriptionEn || linkedAlbum.descriptionNe}
                </p>
              )}
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-chip bg-accent-soft text-accent flex-shrink-0">
              {linkedAlbum.images?.length || 0} {lang === "ne" ? "तस्बिरहरू" : "photos"}
            </span>
          </div>

          {linkedAlbum.images && linkedAlbum.images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {linkedAlbum.images.slice(0, 6).map((img, idx) => (
                <div
                  key={img.id || idx}
                  onClick={() =>
                    onZoomImage({
                      url: img.imageUrl,
                      title:
                        lang === "ne"
                          ? img.captionNe || linkedAlbum.titleNe
                          : img.captionEn || linkedAlbum.titleEn,
                    })
                  }
                  className="relative aspect-square rounded-control overflow-hidden bg-tint cursor-zoom-in group/aimg border border-line"
                >
                  <Image
                    src={img.imageUrl}
                    alt={
                      lang === "ne"
                        ? img.captionNe || linkedAlbum.titleNe
                        : img.captionEn || linkedAlbum.titleEn
                    }
                    fill
                    sizes="120px"
                    className="object-cover group-hover/aimg:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/aimg:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ArrowsOut size={16} />
                  </div>
                  {idx === 5 && linkedAlbum.images.length > 6 && (
                    <Link
                      href={albumTargetUrl}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute inset-0 bg-black/75 hover:bg-black/90 flex flex-col items-center justify-center text-white font-bold text-xs transition-colors cursor-pointer"
                      title={lang === "ne" ? "बाँकी तस्बिरहरू एल्बममा हेर्नुहोस्" : "View all photos in album"}
                    >
                      <span>+{linkedAlbum.images.length - 6}</span>
                      <span className="text-[9px] font-medium text-white/80">
                        {lang === "ne" ? "थप" : "more"}
                      </span>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-line/60 flex items-center justify-between">
            <span className="text-[11px] text-muted">
              {lang === "ne"
                ? "यस गतिविधिका सम्पूर्ण तस्बिरहरू यस एल्बममा सङ्ग्रहित छन्।"
                : "All event photos are archived in this album."}
            </span>
            <Link
              href={albumTargetUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-accent text-on-accent text-xs font-semibold hover:bg-accent-hover transition-colors shadow-sm"
            >
              <Images size={14} />
              <span>{lang === "ne" ? "एल्बम खोल्नुहोस्" : "Open Album"}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
});
