"use client";

import React, { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Language,
  BusinessItem,
  BUSINESS_CATEGORIES,
  getStoredLanguage,
  subscribeBusinesses,
  getStoredBusinessesSnapshot,
  getServerBusinessesSnapshot,
  saveStoredBusinesses,
} from "@/data/mockData";
import {
  Storefront,
  ArrowLeft,
  MagnifyingGlass,
  FilePdf,
  Image as ImageIcon,
  Eye,
  Download,
  ArrowSquareOut,
  ArrowsOut,
  Phone,
  EnvelopeSimple,
  X,
  GoogleLogo,
  Handshake,
} from "@phosphor-icons/react";
import {
  isGoogleDriveUrl,
  getGoogleDrivePreviewUrl,
  getGoogleDriveViewUrl,
  getGoogleDriveImageUrl,
  getGoogleDriveDownloadUrl,
} from "@/lib/googleDrive";
import { documentUrl } from "@/lib/documentUrl";
import { PdfModalViewer } from "@/components/PdfModalViewer";
import { isValidImageSrc } from "@/lib/validation";
import { useRemoteData } from "@/hooks/useRemoteData";
import { DataStatus } from "@/components/DataStatus";
import { BusinessCard } from "@/components/BusinessCard";

export default function BusinessShowcasePage() {
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const businesses = useSyncExternalStore(
    subscribeBusinesses,
    getStoredBusinessesSnapshot,
    getServerBusinessesSnapshot
  );
  const remote = useRemoteData<BusinessItem[]>("/api/businesses", saveStoredBusinesses);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Modals for PDF and Image viewing
  const [activePdf, setActivePdf] = useState<{ url: string; title: string } | null>(null);
  const [activeImage, setActiveImage] = useState<{ url: string; title: string } | null>(null);

  const filteredBusinesses = businesses.filter((b) => {
    const term = search.toLowerCase();
    const matchesSearch =
      b.title.toLowerCase().includes(term) ||
      (b.description && b.description.toLowerCase().includes(term)) ||
      (b.category && b.category.toLowerCase().includes(term));

    const matchesCategory =
      selectedCategory === "all" || b.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-ground text-fg font-sans flex flex-col justify-between selection:bg-accent selection:text-on-accent">
      <SiteHeader lang={lang} setLang={setLang} />
      <DataStatus error={remote.error} refetch={remote.refetch} lang={lang} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6">
        {/* Minimal Header Section */}
        <div className="border-b border-line pb-4 space-y-2.5">
          {/* Breadcrumb Navigation & Slogan Badge */}
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-accent transition-colors"
            >
              <ArrowLeft size={14} />
              <span>{lang === "ne" ? "मुख्य पृष्ठमा फर्कनुहोस्" : "Back to Home"}</span>
            </Link>
            <div className="text-[11px] font-mono text-muted flex items-center gap-1.5">
              <Handshake size={13} className="text-accent" />
              <span>{lang === "ne" ? "आफ्नै समुदाय, आफ्नै व्यवसाय" : "Community Business Showcase"}</span>
            </div>
          </div>

          {/* Small Title Section & Slogan */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pt-1">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-fg">
                {lang === "ne" ? "पेशा तथा व्यवसाय" : "Professions & Community Businesses"}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-accent mt-0.5">
                {lang === "ne"
                  ? "के तपाई कुनै सामान वा सेवा खरिदगर्दै हुनुहुन्छ ? आफ्नैलाई सम्झनुहोस।"
                  : "Looking to purchase goods or hire services? Prioritize our own community members."}
              </p>
            </div>
            <div className="text-xs font-mono text-muted shrink-0">
              <span>{lang === "ne" ? "कुल प्रविष्टि:" : "Total listings:"} </span>
              <span className="font-bold text-fg">{filteredBusinesses.length}</span>
            </div>
          </div>
        </div>

        {/* Minimal Search & Category Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-accent text-on-accent shadow-xs"
                  : "bg-surface border border-line text-muted hover:text-fg hover:bg-tint"
              }`}
            >
              {lang === "ne" ? "सबै" : "All"}
            </button>
            {BUSINESS_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-accent text-on-accent shadow-xs"
                    : "bg-surface border border-line text-muted hover:text-fg hover:bg-tint"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-64 shrink-0">
            <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === "ne" ? "व्यवसाय वा सेवा खोज्नुहोस्..." : "Search..."}
              className="w-full pl-8 pr-3 py-1.5 rounded-control border border-line bg-surface text-fg text-xs placeholder:text-muted focus:outline-hidden focus:border-accent"
            />
          </div>
        </div>

        {/* Business Showcase Listings Grid */}
        {filteredBusinesses.length === 0 ? (
          <div className="p-10 text-center space-y-3 rounded-2xl border border-dashed border-line bg-surface/50">
            <Storefront size={32} className="text-accent mx-auto" weight="duotone" />
            <div className="text-sm font-bold text-fg">
              {lang === "ne" ? "यस वर्गमा कुनै व्यवसाय फेला परेन" : "No business listings found"}
            </div>
            <p className="text-xs text-muted max-w-md mx-auto">
              {lang === "ne"
                ? "कृपया खोजी शब्द परिवर्तन गर्नुहोस् वा अन्य वर्ग छनोट गर्नुहोस्।"
                : "Try adjusting your search criteria or selecting a different category."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBusinesses.map((item) => (
              <BusinessCard
                key={item.id}
                item={item}
                lang={lang}
                compact
                onPreviewPdf={setActivePdf}
                onPreviewImage={setActiveImage}
              />
            ))}
          </div>
        )}
      </main>

      {/* PDF MODAL VIEWER */}
      {activePdf && (
        <PdfModalViewer
          url={activePdf.url}
          title={activePdf.title}
          category={lang === "ne" ? "पेशा तथा व्यवसाय" : "Business Document"}
          lang={lang}
          onClose={() => setActivePdf(null)}
        />
      )}

      {/* IMAGE LIGHTBOX MODAL */}
      {activeImage && (
        <div
          onClick={() => setActiveImage(null)}
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between text-white p-2 border-b border-white/10"
          >
            <span className="font-bold text-sm sm:text-base text-white/90">
              {activeImage.title && activeImage.title !== "." ? activeImage.title : (lang === "ne" ? "व्यवसाय" : "Business")}
            </span>
            <button
              type="button"
              onClick={() => setActiveImage(null)}
              className="p-2 rounded-chip bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>
          <div
            className="relative flex-1 w-full h-[82vh] flex items-center justify-center p-2"
            onClick={() => setActiveImage(null)}
          >
            <Image
              src={activeImage.url}
              alt={activeImage.title && activeImage.title !== "." ? activeImage.title : "Business"}
              fill
              sizes="100vw"
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}

      <SiteFooter lang={lang} />
    </div>
  );
}
