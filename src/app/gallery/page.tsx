"use client";

import React, { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Language,
  GalleryItem,
  getStoredLanguage,
  subscribeGallery,
  getStoredGallerySnapshot,
  getServerGallerySnapshot,
  saveStoredGallery,
} from "@/data/mockData";
import {
  Image as ImageIcon,
  ArrowLeft,
  X,
} from "@phosphor-icons/react";
import { isValidImageSrc } from "@/lib/validation";
import { useRemoteData } from "@/hooks/useRemoteData";
import { DataStatus } from "@/components/DataStatus";

export default function GalleryPage() {
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const gallery = useSyncExternalStore(
    subscribeGallery,
    getStoredGallerySnapshot,
    getServerGallerySnapshot
  );
  const remote = useRemoteData<GalleryItem[]>("/api/gallery", saveStoredGallery);
  const [activePhoto, setActivePhoto] = useState<GalleryItem | null>(null);

  return (
    <div className="min-h-screen bg-ground text-fg font-sans flex flex-col justify-between selection:bg-accent selection:text-on-accent">
      <SiteHeader lang={lang} setLang={setLang} />
      <DataStatus error={remote.error} refetch={remote.refetch} lang={lang} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-accent transition-colors"
          >
            <ArrowLeft size={16} />
            <span>{lang === "ne" ? "मुख्य पृष्ठमा फर्कनुहोस्" : "Back to Home"}</span>
          </Link>
          <div className="text-xs font-mono text-muted">
            {lang === "ne" ? "तस्बिर सङ्ग्रहहरू तथा अभिलेख" : "Photo Galleries & Archives"}
          </div>
        </div>

        {/* Page Header */}
        <div className="border-b border-line pb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
            {lang === "ne" ? "तस्बिर सङ्ग्रहहरू" : "Photo Gallery"}
          </h1>
        </div>

        {/* Gallery Grid */}
        {gallery.length === 0 ? (
          <div className="p-16 text-center space-y-3 rounded-card border border-dashed border-line bg-surface">
            <ImageIcon size={36} className="text-accent mx-auto" weight="duotone" />
            <div className="text-base font-bold text-fg">
              {lang === "ne" ? "हाल कुनै तस्बिर उपलब्ध छैन" : "No photos available yet"}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gallery.map((item) => (
              <article
                key={item.id}
                onClick={() => setActivePhoto(item)}
                className="relative h-72 rounded-card overflow-hidden border border-line bg-surface cursor-pointer group shadow-e1 hover:border-accent transition-all flex items-center justify-center"
              >
                {isValidImageSrc(item.imageUrl) ? (
                  <Image
                    src={item.imageUrl}
                    alt={lang === "ne" ? item.titleNe : item.titleEn}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted">
                    <ImageIcon size={40} weight="duotone" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-75 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 inset-x-0 p-5 space-y-1 text-white">
                  <h3 className="text-base font-bold leading-snug">
                    {lang === "ne" ? item.titleNe : item.titleEn}
                  </h3>
                  {Boolean(item.dateNe || item.dateEn) && (
                    <div className="text-xs text-white/80 font-mono">
                      {lang === "ne" ? item.dateNe : item.dateEn}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {activePhoto && (
        <div
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-surface rounded-card overflow-hidden border border-line shadow-e3"
          >
            <button
              type="button"
              onClick={() => setActivePhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-chip bg-black/60 text-white hover:bg-black transition-colors"
            >
              <X size={20} />
            </button>
            <div className="relative h-[65vh] w-full bg-black flex items-center justify-center">
              {isValidImageSrc(activePhoto.imageUrl) ? (
                <Image
                  src={activePhoto.imageUrl}
                  alt={lang === "ne" ? activePhoto.titleNe : activePhoto.titleEn}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              ) : (
                <div className="text-white/60 flex flex-col items-center gap-2">
                  <ImageIcon size={48} weight="duotone" />
                  <span className="text-xs font-mono">No Image Preview Available</span>
                </div>
              )}
            </div>
            <div className="p-6 space-y-1 bg-surface border-t border-line">
              <h3 className="text-lg font-bold text-fg">
                {lang === "ne" ? activePhoto.titleNe : activePhoto.titleEn}
              </h3>
              {Boolean(activePhoto.dateNe || activePhoto.dateEn) && (
                <div className="text-xs text-muted font-mono">
                  {lang === "ne" ? activePhoto.dateNe : activePhoto.dateEn}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <SiteFooter lang={lang} />
    </div>
  );
}
