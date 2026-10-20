"use client";

import React, { useState, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Language,
  BibhidItem,
  getStoredLanguage,
  subscribeBibhid,
  getStoredBibhidSnapshot,
  getServerBibhidSnapshot,
  saveStoredBibhid,
} from "@/data/mockData";
import { useRemoteData } from "@/hooks/useRemoteData";
import { DataStatus } from "@/components/DataStatus";
import { PdfModalViewer } from "@/components/PdfModalViewer";
import { getGoogleDriveViewUrl } from "@/lib/googleDrive";
import {
  ArrowLeft,
  FilePdf,
  MagnifyingGlass,
  X,
  Eye,
  ArrowSquareOut,
  FolderOpen,
} from "@phosphor-icons/react";

export default function BibhidPage() {
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());

  const items = useSyncExternalStore(
    subscribeBibhid,
    getStoredBibhidSnapshot,
    getServerBibhidSnapshot
  );

  const remote = useRemoteData<BibhidItem[]>("/api/bibhid", saveStoredBibhid);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeViewerItem, setActiveViewerItem] = useState<BibhidItem | null>(null);

  // Derive unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      const cat = lang === "ne" ? (item.categoryNe || item.categoryEn) : (item.categoryEn || item.categoryNe);
      if (cat && cat.trim()) set.add(cat.trim());
    });
    return Array.from(set);
  }, [items, lang]);

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const activeTitle = (lang === "ne" ? item.titleNe || item.titleEn : item.titleEn || item.titleNe).toLowerCase();
      const otherTitle = (lang === "ne" ? item.titleEn : item.titleNe)?.toLowerCase() || "";
      const desc = ((lang === "ne" ? item.descriptionNe : item.descriptionEn) || "").toLowerCase();
      const cat = (lang === "ne" ? item.categoryNe || item.categoryEn : item.categoryEn || item.categoryNe) || "";

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        activeTitle.includes(query) ||
        otherTitle.includes(query) ||
        desc.includes(query) ||
        cat.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "all" ||
        cat.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory, lang]);

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
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-line pb-8">
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
              {lang === "ne" ? "विविध" : "Miscellaneous"}
            </h1>
          </div>

          <div className="text-xs font-mono text-muted bg-surface px-3 py-1.5 rounded-control border border-line self-start md:self-end">
            {lang === "ne" ? `जम्मा: ${filteredItems.length}` : `Total: ${filteredItems.length}`}
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === "ne" ? "कागजात वा शीर्षक खोज्नुहोस्..." : "Search documents or title..."}
              className="w-full pl-10 pr-10 py-2.5 rounded-control border border-line bg-surface text-fg text-sm placeholder:text-muted/70 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-fg transition-colors"
                title={lang === "ne" ? "खोज हटाउनुहोस्" : "Clear search"}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category Chips */}
          {categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors ${
                  selectedCategory === "all"
                    ? "bg-accent text-on-accent"
                    : "bg-surface border border-line text-muted hover:text-fg hover:bg-tint"
                }`}
              >
                {lang === "ne" ? "सबै" : "All"} ({items.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? "bg-accent text-on-accent"
                      : "bg-surface border border-line text-muted hover:text-fg hover:bg-tint"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Documents Grid */}
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center rounded-card border border-dashed border-line bg-surface/50 p-8 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-tint text-accent flex items-center justify-center">
              <FolderOpen size={30} weight="duotone" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="font-bold text-fg text-base">
                {lang === "ne" ? "कुनै कागजात फेला परेन" : "No documents found"}
              </h3>
            </div>
            {(searchQuery || selectedCategory !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-surface border border-line text-xs font-semibold text-fg hover:bg-tint transition-colors"
              >
                <X size={14} />
                <span>{lang === "ne" ? "फिल्टर हटाउनुहोस्" : "Reset Filters"}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const mainTitle = lang === "ne" ? item.titleNe || item.titleEn : item.titleEn || item.titleNe;
              const secondaryTitle = lang === "ne" ? item.titleEn : item.titleNe;
              const desc = lang === "ne" ? item.descriptionNe || item.descriptionEn : item.descriptionEn || item.descriptionNe;
              const cat = lang === "ne" ? item.categoryNe || item.categoryEn : item.categoryEn || item.categoryNe;

              return (
                <div
                  key={item.id}
                  className="group relative bg-surface border border-line hover:border-accent/40 rounded-card p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="space-y-4">
                    {/* Top Row: Category */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-tint text-accent">
                        <FilePdf size={13} weight="fill" />
                        <span>{cat || (lang === "ne" ? "विविध" : "General")}</span>
                      </span>
                    </div>

                    {/* Titles */}
                    <div className="space-y-1">
                      <h3 className="font-bold text-fg text-base sm:text-lg leading-snug group-hover:text-accent transition-colors">
                        {mainTitle}
                      </h3>
                      {secondaryTitle && secondaryTitle !== mainTitle && (
                        <p className="text-xs text-muted line-clamp-1 italic">
                          {secondaryTitle}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    {desc && (
                      <p className="text-xs text-muted leading-relaxed line-clamp-3">
                        {desc}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-6 mt-4 border-t border-line/70 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveViewerItem(item)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-control bg-accent text-on-accent text-xs font-semibold hover:opacity-95 transition-opacity cursor-pointer shadow-sm"
                    >
                      <Eye size={16} />
                      <span>{lang === "ne" ? "PDF हेर्नुहोस्" : "View PDF"}</span>
                    </button>

                    <a
                      href={getGoogleDriveViewUrl(item.driveUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-control border border-line bg-ground hover:bg-tint text-muted hover:text-accent transition-colors"
                      title={lang === "ne" ? "Google Drive मा खोल्नुहोस्" : "Open in Google Drive"}
                      aria-label="Open in Google Drive"
                    >
                      <ArrowSquareOut size={18} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* PDF Modal Viewer */}
      {activeViewerItem && (
        <PdfModalViewer
          url={activeViewerItem.driveUrl}
          title={lang === "ne" ? activeViewerItem.titleNe || activeViewerItem.titleEn : activeViewerItem.titleEn || activeViewerItem.titleNe}
          category={lang === "ne" ? activeViewerItem.categoryNe : activeViewerItem.categoryEn}
          lang={lang}
          onClose={() => setActiveViewerItem(null)}
        />
      )}

      <SiteFooter lang={lang} />
    </div>
  );
}
