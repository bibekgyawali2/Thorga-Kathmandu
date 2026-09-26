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
  MapPin,
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-10">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-accent transition-colors"
          >
            <ArrowLeft size={16} />
            <span>{lang === "ne" ? "मुख्य पृष्ठमा फर्कनुहोस्" : "Back to Home"}</span>
          </Link>
          <div className="text-xs font-mono text-muted flex items-center gap-1.5">
            <Handshake size={14} className="text-accent" />
            <span>{lang === "ne" ? "आफ्नै समुदाय, आफ्नै व्यवसाय" : "Community Business Showcase"}</span>
          </div>
        </div>

        {/* Page Hero Header with Authentic Nepali Slogan */}
        <div className="rounded-card border border-line bg-surface p-6 sm:p-10 shadow-e1 relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-accent-soft/40 pointer-events-none blur-2xl" />

          <div className="max-w-3xl space-y-4 relative z-10">

            <h1 className="type-section text-2xl sm:text-4xl font-extrabold text-fg">
              {lang === "ne" ? "पेशा तथा व्यवसाय" : "Professions & Community Businesses"}
            </h1>

            {/* Slogan from user sketch */}
            <p className="text-base sm:text-lg font-semibold text-accent leading-relaxed">
              {lang === "ne"
                ? "के तपाई कुनै सामान वा सेवा खरिदगर्दै हुनुहुन्छ ? आफ्नैलाई सम्झनुहोस।"
                : "Looking to purchase goods or hire services? Prioritize our own community members."}
            </p>

          </div>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === "ne" ? "व्यवसाय वा सेवा खोज्नुहोस्..." : "Search business, service, or category..."}
                className="w-full pl-9 pr-4 py-2.5 rounded-control border border-line bg-surface text-fg text-xs focus:border-accent"
              />
            </div>

            <div className="text-xs font-mono text-muted flex items-center gap-2">
              <span>{lang === "ne" ? "कुल प्रविष्टिहरू:" : "Total listings:"}</span>
              <span className="font-bold text-accent px-2 py-0.5 rounded-chip bg-accent-soft">
                {filteredBusinesses.length}
              </span>
            </div>
          </div>

          {/* Category Filter Pills (Derived from sketch categories) */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-control text-sm sm:text-base font-semibold transition-all cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-accent text-on-accent shadow-e1"
                  : "bg-surface border border-line text-fg hover:bg-tint hover:border-accent/40"
              }`}
            >
              {lang === "ne" ? "सबै वर्गहरू" : "All Categories"}
            </button>
            {BUSINESS_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-control text-sm sm:text-base font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-accent text-on-accent shadow-e1"
                    : "bg-surface border border-line text-fg hover:bg-tint hover:border-accent/40"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Business Showcase Listings Grid */}
        {filteredBusinesses.length === 0 ? (
          <div className="p-16 text-center space-y-4 rounded-card border border-dashed border-line bg-surface">
            <Storefront size={40} className="text-accent mx-auto" weight="duotone" />
            <div className="text-base font-bold text-fg">
              {lang === "ne" ? "यस वर्गमा कुनै व्यवसाय फेला परेन" : "No business listings found"}
            </div>
            <p className="text-xs text-muted max-w-md mx-auto">
              {lang === "ne"
                ? "कृपया खोजी शब्द परिवर्तन गर्नुहोस् वा अन्य वर्ग छनोट गर्नुहोस्।"
                : "Try adjusting your search criteria or selecting a different category."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((item) => {
              const isDrive = isGoogleDriveUrl(item.fileUrl);
              const isPdf = item.fileType === "pdf";

              return (
                <article
                  key={item.id}
                  className="rounded-card border border-line bg-surface overflow-hidden flex flex-col justify-between hover:border-accent transition-all duration-200 shadow-e1 hover:shadow-e2 group"
                >
                  {/* Media Banner / Visual Display Area */}
                  <div
                    onClick={() => {
                      if (isPdf) {
                        setActivePdf({ url: item.fileUrl, title: item.title });
                      } else {
                        const imgUrl = isDrive ? getGoogleDriveImageUrl(item.fileUrl) : item.fileUrl;
                        setActiveImage({ url: imgUrl, title: item.title });
                      }
                    }}
                    className="relative h-56 w-full bg-tint/60 border-b border-line overflow-hidden flex items-center justify-center p-2 cursor-pointer group/media"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (isPdf) {
                          setActivePdf({ url: item.fileUrl, title: item.title });
                        } else {
                          const imgUrl = isDrive ? getGoogleDriveImageUrl(item.fileUrl) : item.fileUrl;
                          setActiveImage({ url: imgUrl, title: item.title });
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
                          <span className="text-xs font-bold text-fg line-clamp-1 block">
                            {item.title}
                          </span>
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
                          alt={item.title}
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
                          alt={item.title}
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
                          setActivePdf({ url: item.fileUrl, title: item.title });
                        } else {
                          const imgUrl = isDrive ? getGoogleDriveImageUrl(item.fileUrl) : item.fileUrl;
                          setActiveImage({ url: imgUrl, title: item.title });
                        }
                      }}
                      className="absolute top-3 right-3 p-1.5 rounded-chip bg-surface/90 hover:bg-surface text-fg border border-line shadow-xs transition-colors cursor-pointer"
                      title={lang === "ne" ? "विस्तृत हेर्नुहोस्" : "Expand"}
                    >
                      <ArrowsOut size={15} />
                    </button>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-fg leading-snug group-hover:text-accent transition-colors">
                          {item.title}
                        </h3>
                        {item.contactAddress && (
                          <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-muted font-normal shrink-0">
                            <MapPin size={13} className="text-accent flex-shrink-0" />
                            <span>{item.contactAddress}</span>
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-xs leading-relaxed text-muted line-clamp-3">
                          {item.description}
                        </p>
                      )}

                      {/* Contact metadata */}
                      {(item.contactPhone || item.contactEmail) && (
                        <div className="pt-3 space-y-1.5 text-xs text-muted border-t border-line/60">
                          {item.contactPhone && (
                            <div className="flex items-center gap-2 font-mono text-fg">
                              <Phone size={14} className="text-accent flex-shrink-0" />
                              <a href={`tel:${item.contactPhone}`} className="hover:text-accent transition-colors">
                                {item.contactPhone}
                              </a>
                            </div>
                          )}
                          {item.contactEmail && (
                            <div className="flex items-center gap-2 font-mono">
                              <EnvelopeSimple size={14} className="text-accent flex-shrink-0" />
                              <a href={`mailto:${item.contactEmail}`} className="hover:text-accent transition-colors truncate">
                                {item.contactEmail}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Links */}
                    {(isPdf || isDrive) && (
                      <div className="pt-4 border-t border-line flex items-center gap-2">
                        {isPdf && (
                          <>
                            <button
                              type="button"
                              onClick={() => setActivePdf({ url: item.fileUrl, title: item.title })}
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
                            {!isPdf && <span>{lang === "ne" ? "गुगल ड्राइभमा खोल्नुहोस्" : "Open in Google Drive"}</span>}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
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
              {activeImage.title}
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
              alt={activeImage.title}
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
