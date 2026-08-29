"use client";

import React, { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Language,
  Publication,
  getStoredLanguage,
  subscribePublications,
  getStoredPublicationsSnapshot,
  getServerPublicationsSnapshot,
  saveStoredPublications,
} from "@/data/mockData";
import {
  BookOpen,
  FileText,
  Download,
  Eye,
  ArrowLeft,
  X,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { isValidImageSrc } from "@/lib/validation";
import { useRemoteData } from "@/hooks/useRemoteData";
import { DataStatus } from "@/components/DataStatus";

export default function PublicationsPage() {
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const publications = useSyncExternalStore(
    subscribePublications,
    getStoredPublicationsSnapshot,
    getServerPublicationsSnapshot
  );
  const remote = useRemoteData<Publication[]>("/api/publications", saveStoredPublications);
  const [search, setSearch] = useState("");
  const [activePdfPreview, setActivePdfPreview] = useState<Publication | null>(null);

  const filteredPubs = publications.filter((p) => {
    const term = search.toLowerCase();
    return (
      p.titleEn.toLowerCase().includes(term) ||
      p.titleNe.includes(search) ||
      p.categoryEn.toLowerCase().includes(term) ||
      p.categoryNe.includes(search)
    );
  });

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
            {lang === "ne" ? "प्रकाशन तथा दस्तावेज अभिलेख" : "Publications & PDF Archives"}
          </div>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-line pb-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-chip bg-accent-soft text-accent text-xs font-semibold">
              <BookOpen size={16} weight="duotone" />
              <span>{lang === "ne" ? "मुखपत्र, स्मारिका तथा प्रतिवेदन" : "Official Publications & Reports"}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
              {lang === "ne" ? "प्रकाशन, मुखपत्र तथा दस्तावेजहरू" : "Publications & PDF Documents"}
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-muted">
              {lang === "ne"
                ? "संस्थाका वार्षिक स्मारिकाहरू, विधान, नियमावली तथा आधिकारिक लेखापरीक्षण प्रतिवेदनहरू डाउनलोड तथा अध्ययन गर्नुहोस्।"
                : "Browse and download official annual souvenirs, constitution bylaws, literature bulletins, and certified audit reports."}
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <MagnifyingGlass size={16} className="absolute left-3 top-3 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === "ne" ? "दस्तावेज खोज्नुहोस्..." : "Search document..."}
              className="w-full pl-9 pr-4 py-2.5 rounded-control border border-line bg-surface text-fg text-xs focus:border-accent"
            />
          </div>
        </div>

        {/* Publications Grid */}
        {filteredPubs.length === 0 ? (
          <div className="p-16 text-center space-y-3 rounded-card border border-dashed border-line bg-surface">
            <FileText size={36} className="text-accent mx-auto" weight="duotone" />
            <div className="text-base font-bold text-fg">
              {lang === "ne" ? "कुनै दस्तावेज फेला परेन" : "No publications found"}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPubs.map((pub) => (
              <article
                key={pub.id}
                className="rounded-card border border-line bg-surface overflow-hidden flex flex-col justify-between hover:border-accent transition-all group"
              >
                {/* Visual Document Card Spine */}
                <div className="relative h-60 w-full p-4 flex items-center justify-center overflow-hidden bg-tint">
                  {pub.coverImageUrl && isValidImageSrc(pub.coverImageUrl) && (
                    <Image
                      src={pub.coverImageUrl}
                      alt={lang === "ne" ? pub.titleNe : pub.titleEn}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover opacity-40 group-hover:opacity-60 transition-opacity"
                    />
                  )}

                  <div className="relative z-10 w-44 h-52 rounded-control shadow-e2 p-4 flex flex-col justify-between bg-surface border border-line">
                    <div className="flex items-center justify-between">
                      <FileText size={26} className="text-accent" weight="duotone" />
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-chip bg-accent-soft text-accent uppercase">
                        PDF
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-fg line-clamp-2 leading-tight">
                        {lang === "ne" ? pub.titleNe : pub.titleEn}
                      </div>
                      <div className="text-[10px] text-muted font-mono">
                        {lang === "ne" ? pub.publishedYearNe : pub.publishedYearEn}
                      </div>
                    </div>
                    <div className="text-[10px] flex justify-between border-t border-line pt-1 text-muted font-mono">
                      <span>{pub.pages} Pgs</span>
                      <span>{pub.fileSize}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-accent">
                      {lang === "ne" ? pub.categoryNe : pub.categoryEn}
                    </div>
                    <h3 className="text-base font-bold text-fg leading-snug">
                      {lang === "ne" ? pub.titleNe : pub.titleEn}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted line-clamp-3">
                      {lang === "ne" ? pub.descriptionNe : pub.descriptionEn}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-line flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActivePdfPreview(pub)}
                      className="flex-1 py-2 px-3 rounded-control text-xs font-semibold flex items-center justify-center gap-1.5 bg-tint hover:bg-accent-soft text-fg transition-colors"
                    >
                      <Eye size={15} />
                      <span>{lang === "ne" ? "पूर्वावलोकन" : "Preview"}</span>
                    </button>
                    <a
                      href={pub.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-e1"
                    >
                      <Download size={15} />
                      <span>{lang === "ne" ? "डाउनलोड" : "Download"}</span>
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* PDF PREVIEW MODAL */}
      {activePdfPreview && (
        <div className="fixed inset-0 z-50 bg-fg/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded-card max-w-2xl w-full p-6 space-y-6 shadow-e3">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2 truncate">
                <FileText size={22} className="text-accent flex-shrink-0" weight="duotone" />
                <h3 className="text-base font-bold text-fg truncate">
                  {lang === "ne" ? activePdfPreview.titleNe : activePdfPreview.titleEn}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePdfPreview(null)}
                className="p-1 rounded-chip text-muted hover:text-fg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 text-center space-y-4 bg-tint rounded-card border border-line">
              <FileText size={44} className="text-accent mx-auto" weight="duotone" />
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-fg">
                  {lang === "ne" ? activePdfPreview.titleNe : activePdfPreview.titleEn}
                </h4>
                <div className="text-xs text-muted font-mono">
                  {activePdfPreview.fileSize} · {activePdfPreview.pages} Pages · {activePdfPreview.publishedYearEn}
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted max-w-md mx-auto">
                {lang === "ne" ? activePdfPreview.descriptionNe : activePdfPreview.descriptionEn}
              </p>
              <a
                href={activePdfPreview.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-e1"
              >
                <Download size={16} />
                <span>{lang === "ne" ? "पूर्ण PDF दस्तावेज डाउनलोड गर्नुहोस्" : "Download Complete PDF"}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      <SiteFooter lang={lang} />
    </div>
  );
}
