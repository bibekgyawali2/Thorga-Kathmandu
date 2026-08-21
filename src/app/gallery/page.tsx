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
} from "@/data/mockData";
import {
  Image as ImageIcon,
  ArrowLeft,
  X,
  Camera,
} from "@phosphor-icons/react";
import { isValidImageSrc } from "@/lib/validation";

export default function GalleryPage() {
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const gallery = useSyncExternalStore(
    subscribeGallery,
    getStoredGallerySnapshot,
    getServerGallerySnapshot
  );
  const [category, setCategory] = useState("all");
  const [activePhoto, setActivePhoto] = useState<GalleryItem | null>(null);

  const categories = [
    { key: "all", ne: "सबै तस्बिरहरू", en: "All Photos" },
    { key: "Education", ne: "शिक्षा तथा पुस्तकालय", en: "Education & Libraries" },
    { key: "Culture", ne: "संस्कृति तथा सम्पदा", en: "Culture & Heritage" },
    { key: "Development", ne: "विकास निर्माण", en: "Village Development" },
  ];

  const filteredGallery = gallery.filter((item) => {
    if (category === "all") return true;
    return item.categoryEn.toLowerCase() === category.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-ground text-fg font-sans flex flex-col justify-between selection:bg-accent selection:text-on-accent">
      <SiteHeader lang={lang} setLang={setLang} />

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
            {lang === "ne" ? "तस्बिर सङ्ग्रह तथा अभिलेख" : "Photo Gallery & Archives"}
          </div>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-line pb-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-chip bg-accent-soft text-accent text-xs font-semibold">
              <Camera size={16} weight="duotone" />
              <span>{lang === "ne" ? "सामाजिक कार्य तथा दृश्य अभिलेख" : "Community Action Visual Archive"}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
              {lang === "ne" ? "सामुदायिक तस्बिर सङ्ग्रह" : "Community Photo Gallery"}
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-muted">
              {lang === "ne"
                ? "थोर्गा गाउँ तथा काठमाडौँ उपत्यकामा सञ्चालन गरिएका शैक्षिक, सांस्कृतिक, पूर्वाधार विकास तथा सामाजिक कार्यक्रमहरूका ऐतिहासिक क्षणहरू।"
                : "A visual journey of rural development projects, school library handovers, temple preservation, and cultural gatherings."}
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCategory(cat.key)}
                className={`px-3.5 py-2 rounded-control text-xs font-semibold transition-colors ${
                  category === cat.key
                    ? "bg-accent text-on-accent shadow-sm"
                    : "bg-surface border border-line text-fg hover:bg-tint"
                }`}
              >
                {lang === "ne" ? cat.ne : cat.en}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredGallery.length === 0 ? (
          <div className="p-16 text-center space-y-3 rounded-card border border-dashed border-line bg-surface">
            <ImageIcon size={36} className="text-accent mx-auto" weight="duotone" />
            <div className="text-base font-bold text-fg">
              {lang === "ne" ? "यस वर्गमा कुनै तस्बिर छैन" : "No photos found in this category"}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGallery.map((item) => (
              <article
                key={item.id}
                onClick={() => setActivePhoto(item)}
                className="relative h-72 rounded-card overflow-hidden border border-line bg-surface cursor-pointer group shadow-sm hover:border-accent transition-all flex items-center justify-center"
              >
                {isValidImageSrc(item.imageUrl) ? (
                  <Image
                    src={item.imageUrl}
                    alt={lang === "ne" ? item.titleNe : item.titleEn}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted">
                    <ImageIcon size={40} weight="duotone" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-75 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 inset-x-0 p-5 space-y-1 text-white">
                  <div className="text-[11px] font-bold text-accent">
                    {lang === "ne" ? item.categoryNe : item.categoryEn}
                  </div>
                  <h3 className="text-base font-bold leading-snug">
                    {lang === "ne" ? item.titleNe : item.titleEn}
                  </h3>
                  <div className="text-xs text-white/80 font-mono">
                    {lang === "ne" ? item.dateNe : item.dateEn}
                  </div>
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
            className="relative max-w-4xl w-full bg-surface rounded-card overflow-hidden border border-line shadow-2xl"
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
            <div className="p-6 space-y-1.5 bg-surface border-t border-line">
              <div className="text-xs font-bold text-accent">
                {lang === "ne" ? activePhoto.categoryNe : activePhoto.categoryEn}
              </div>
              <h3 className="text-lg font-bold text-fg">
                {lang === "ne" ? activePhoto.titleNe : activePhoto.titleEn}
              </h3>
              <div className="text-xs text-muted font-mono">
                {lang === "ne" ? activePhoto.dateNe : activePhoto.dateEn}
              </div>
            </div>
          </div>
        </div>
      )}

      <SiteFooter lang={lang} />
    </div>
  );
}
