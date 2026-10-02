"use client";

import React, { useState, useEffect, useSyncExternalStore, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Language,
  GalleryItem,
  GalleryAlbum,
  getStoredLanguage,
  subscribeGallery,
  getStoredGallerySnapshot,
  getServerGallerySnapshot,
  saveStoredGallery,
  subscribeGalleryAlbums,
  getStoredGalleryAlbumsSnapshot,
  getServerGalleryAlbumsSnapshot,
  saveStoredGalleryAlbums,
} from "@/data/mockData";
import {
  Image as ImageIcon,
  Images,
  ArrowLeft,
  CaretLeft,
  CaretRight,
  X,
  CalendarBlank,
} from "@phosphor-icons/react";
import { isValidImageSrc } from "@/lib/validation";
import { useRemoteData } from "@/hooks/useRemoteData";
import { DataStatus } from "@/components/DataStatus";

function GalleryContent() {
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const searchParams = useSearchParams();

  const gallery = useSyncExternalStore(
    subscribeGallery,
    getStoredGallerySnapshot,
    getServerGallerySnapshot
  );

  const albums = useSyncExternalStore(
    subscribeGalleryAlbums,
    getStoredGalleryAlbumsSnapshot,
    getServerGalleryAlbumsSnapshot
  );

  const remoteGallery = useRemoteData<GalleryItem[]>("/api/gallery", saveStoredGallery);
  const remoteAlbums = useRemoteData<GalleryAlbum[]>("/api/gallery/albums", saveStoredGalleryAlbums);

  const [activeTab, setActiveTab] = useState<"albums" | "photos">(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("album") || sp.get("albumId") || sp.get("tab") === "albums") {
        return "albums";
      }
    }
    return "photos";
  });
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeSinglePhoto, setActiveSinglePhoto] = useState<GalleryItem | null>(null);

  // Sync URL query params with state
  useEffect(() => {
    const albumParam = searchParams.get("album") || searchParams.get("albumId");
    const photoParam = searchParams.get("photo") || searchParams.get("photoId");
    const tabParam = searchParams.get("tab");

    if (albumParam) {
      setActiveTab("albums");
      if (albums.length > 0) {
        const foundAlbum = albums.find((a) => a.id === albumParam);
        if (foundAlbum && selectedAlbum?.id !== foundAlbum.id) {
          setSelectedAlbum(foundAlbum);
        }
      }
    } else if (photoParam) {
      setActiveTab("photos");
      if (gallery.length > 0) {
        const foundPhoto = gallery.find((p) => p.id === photoParam);
        if (foundPhoto && activeSinglePhoto?.id !== foundPhoto.id) {
          setActiveSinglePhoto(foundPhoto);
        }
      }
    } else if (tabParam === "albums") {
      setActiveTab((prev) => (prev === "albums" ? prev : "albums"));
    } else if (tabParam === "photos") {
      setActiveTab((prev) => (prev === "photos" ? prev : "photos"));
    }
  }, [searchParams, albums, gallery, selectedAlbum?.id, activeSinglePhoto?.id]);

  // Handle browser popstate navigation (Back / Forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const sp = new URLSearchParams(window.location.search);
      const albumId = sp.get("album") || sp.get("albumId");
      const photoId = sp.get("photo") || sp.get("photoId");
      const tab = sp.get("tab");

      if (albumId) {
        setActiveTab("albums");
        const found = albums.find((a) => a.id === albumId);
        if (found) setSelectedAlbum(found);
      } else {
        setSelectedAlbum(null);
      }

      if (photoId) {
        setActiveTab("photos");
        const found = gallery.find((g) => g.id === photoId);
        if (found) setActiveSinglePhoto(found);
      } else {
        setActiveSinglePhoto(null);
      }

      if (tab === "albums" || tab === "photos") {
        setActiveTab(tab);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [albums, gallery]);

  const openAlbum = useCallback((album: GalleryAlbum) => {
    setSelectedAlbum(album);
    setLightboxIndex(null);
    if (typeof window !== "undefined") {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("album", album.id);
      newUrl.searchParams.delete("albumId");
      newUrl.searchParams.delete("photo");
      newUrl.searchParams.delete("photoId");
      newUrl.searchParams.set("tab", "albums");
      window.history.pushState(null, "", newUrl.pathname + newUrl.search);
    }
  }, []);

  const closeAlbumModal = useCallback(() => {
    setSelectedAlbum(null);
    setLightboxIndex(null);
    if (typeof window !== "undefined") {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("album");
      newUrl.searchParams.delete("albumId");
      newUrl.searchParams.set("tab", "albums");
      window.history.pushState(null, "", newUrl.pathname + newUrl.search);
    }
  }, []);

  const openSinglePhoto = useCallback((item: GalleryItem) => {
    setActiveSinglePhoto(item);
    if (typeof window !== "undefined") {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("photo", item.id);
      newUrl.searchParams.delete("photoId");
      newUrl.searchParams.delete("album");
      newUrl.searchParams.delete("albumId");
      newUrl.searchParams.set("tab", "photos");
      window.history.pushState(null, "", newUrl.pathname + newUrl.search);
    }
  }, []);

  const closeSinglePhoto = useCallback(() => {
    setActiveSinglePhoto(null);
    if (typeof window !== "undefined") {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("photo");
      newUrl.searchParams.delete("photoId");
      newUrl.searchParams.set("tab", "photos");
      const searchStr = newUrl.searchParams.toString();
      window.history.pushState(null, "", newUrl.pathname + (searchStr ? `?${searchStr}` : ""));
    }
  }, []);

  // Lightbox navigation helpers
  const handlePrevPhoto = useCallback(() => {
    if (!selectedAlbum || lightboxIndex === null) return;
    setLightboxIndex((prev) =>
      prev !== null && prev > 0 ? prev - 1 : selectedAlbum.images.length - 1
    );
  }, [selectedAlbum, lightboxIndex]);

  const handleNextPhoto = useCallback(() => {
    if (!selectedAlbum || lightboxIndex === null) return;
    setLightboxIndex((prev) =>
      prev !== null && prev < selectedAlbum.images.length - 1 ? prev + 1 : 0
    );
  }, [selectedAlbum, lightboxIndex]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxIndex(null);
      } else if (e.key === "ArrowLeft") {
        handlePrevPhoto();
      } else if (e.key === "ArrowRight") {
        handleNextPhoto();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, handlePrevPhoto, handleNextPhoto]);

  const requestedAlbumId = searchParams.get("album") || searchParams.get("albumId");

  return (
    <div className="min-h-screen bg-ground text-fg font-sans flex flex-col justify-between selection:bg-accent selection:text-on-accent">
      <SiteHeader lang={lang} setLang={setLang} />
      <DataStatus
        error={remoteGallery.error || remoteAlbums.error}
        refetch={() => {
          remoteGallery.refetch();
          remoteAlbums.refetch();
        }}
        lang={lang}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Top Bar / Breadcrumb */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-accent transition-colors"
          >
            <ArrowLeft size={16} />
            <span>{lang === "ne" ? "मुख्य पृष्ठमा फर्कनुहोस्" : "Back to Home"}</span>
          </Link>
        </div>

        {/* Page Header with Subtab Navigation */}
        <div className="border-b border-line pb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
                {lang === "ne" ? "तस्बिर सङ्ग्रहहरू" : "Photo Gallery"}
              </h1>
              <p className="text-sm text-muted mt-1">
                {lang === "ne"
                  ? "सम्पर्क समाजका विविध कार्यक्रम, गतिविधि तथा ऐतिहासिक क्षणका तस्बिरहरू"
                  : "Photos of various programs, activities, and historic moments"}
              </p>
            </div>

            {/* View Switcher Tabs - Single Photos first, then Albums */}
            <div className="inline-flex items-center p-1 rounded-card bg-tint border border-line self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("photos");
                  closeAlbumModal();
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-chip text-xs font-bold transition-all ${
                  activeTab === "photos"
                    ? "bg-surface text-accent shadow-e1"
                    : "text-muted hover:text-fg"
                }`}
              >
                <ImageIcon size={16} weight={activeTab === "photos" ? "fill" : "regular"} />
                <span>{lang === "ne" ? "एकल तस्बिरहरू" : "Single Photos"}</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-accent/10 text-accent font-semibold">
                  {gallery.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("albums");
                  closeAlbumModal();
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-chip text-xs font-bold transition-all ${
                  activeTab === "albums"
                    ? "bg-surface text-accent shadow-e1"
                    : "text-muted hover:text-fg"
                }`}
              >
                <Images size={16} weight={activeTab === "albums" ? "fill" : "regular"} />
                <span>{lang === "ne" ? "तस्बिर एल्बमहरू" : "Photo Albums"}</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-accent/10 text-accent font-semibold">
                  {albums.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading / notice if specific album was requested via URL */}
        {requestedAlbumId && !selectedAlbum && (
          <div>
            {remoteAlbums.loading ? (
              <div className="p-4 rounded-card bg-surface border border-line flex items-center gap-3 text-xs text-muted">
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span>{lang === "ne" ? "अनुरोध गरिएको एल्बम लोड हुँदैछ..." : "Loading requested album..."}</span>
              </div>
            ) : albums.length > 0 && !albums.some((a) => a.id === requestedAlbumId) ? (
              <div className="p-4 rounded-card bg-surface border border-line flex items-center justify-between gap-4 text-xs">
                <span className="text-muted">
                  {lang === "ne"
                    ? "खोजी गरिएको एल्बम फेला परेन। तल उपलब्ध एल्बमहरू हेर्न सक्नुहुन्छ:"
                    : "Requested album could not be found. You can browse the available albums below:"}
                </span>
                <button
                  type="button"
                  onClick={closeAlbumModal}
                  className="text-accent font-bold hover:underline shrink-0"
                >
                  {lang === "ne" ? "सबै एल्बमहरू" : "View All"}
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 1: SINGLE PHOTOS VIEW */}
        {activeTab === "photos" && (
          <div>
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
                    onClick={() => openSinglePhoto(item)}
                    className="relative h-72 rounded-card overflow-hidden border border-line bg-black/90 cursor-pointer group shadow-e1 hover:border-accent transition-all flex items-center justify-center p-1"
                  >
                    {isValidImageSrc(item.imageUrl) ? (
                      <Image
                        src={item.imageUrl}
                        alt={lang === "ne" ? item.titleNe : item.titleEn}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-contain group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted">
                        <ImageIcon size={40} weight="duotone" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-75 group-hover:opacity-90 transition-opacity" />
                    {Boolean((lang === "ne" ? item.categoryNe || item.categoryEn : item.categoryEn || item.categoryNe)?.trim()) && (
                      <div className="absolute top-3 left-3 px-2 py-0.5 rounded-chip bg-black/65 backdrop-blur-sm text-[11px] font-semibold text-white/95 shadow-sm border border-white/10">
                        {lang === "ne" ? item.categoryNe || item.categoryEn : item.categoryEn || item.categoryNe}
                      </div>
                    )}
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
          </div>
        )}

        {/* TAB 2: ALBUMS VIEW */}
        {activeTab === "albums" && (
          <div>
            {albums.length === 0 ? (
              <div className="p-16 text-center space-y-3 rounded-card border border-dashed border-line bg-surface">
                <Images size={40} className="text-accent mx-auto" weight="duotone" />
                <div className="text-base font-bold text-fg">
                  {lang === "ne" ? "हाल कुनै तस्बिर एल्बम उपलब्ध छैन" : "No photo albums available yet"}
                </div>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  {lang === "ne"
                    ? "नयाँ एल्बमहरू थपिएपछि यहाँ प्रदर्शित हुनेछन्।"
                    : "Newly added albums will appear here."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {albums.map((album) => {
                  const displayTitle = lang === "ne" ? album.titleNe : album.titleEn;
                  const displayDate = lang === "ne" ? album.dateNe || album.dateEn : album.dateEn || album.dateNe;
                  const displayDesc = lang === "ne" ? album.descriptionNe || album.descriptionEn : album.descriptionEn || album.descriptionNe;
                  const coverImage = album.coverImageUrl || album.images[0]?.imageUrl || "";

                  return (
                    <article
                      key={album.id}
                      onClick={() => openAlbum(album)}
                      className="group rounded-card overflow-hidden border border-line bg-surface cursor-pointer shadow-e1 hover:shadow-e2 hover:border-accent transition-all flex flex-col"
                    >
                      {/* Album Cover */}
                      <div className="relative h-56 sm:h-60 w-full bg-black/90 overflow-hidden flex items-center justify-center p-1">
                        {isValidImageSrc(coverImage) ? (
                          <Image
                            src={coverImage}
                            alt={displayTitle}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <Images size={48} className="text-muted/50" weight="duotone" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                        {/* Photo Count Badge */}
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-chip bg-black/70 backdrop-blur-sm text-white text-xs font-bold flex items-center gap-1.5 shadow-sm border border-white/10">
                          <Images size={14} weight="fill" />
                          <span>
                            {album.images.length}{" "}
                            {lang === "ne" ? "तस्बिरहरू" : "Photos"}
                          </span>
                        </div>

                        {/* Date overlay if present */}
                        {Boolean(displayDate) && (
                          <div className="absolute bottom-3 left-4 flex items-center gap-1 text-[11px] font-mono text-white/90">
                            <CalendarBlank size={13} />
                            <span>{displayDate}</span>
                          </div>
                        )}
                      </div>

                      {/* Album Info */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-2.5">
                        <div>
                          <h3 className="text-base font-bold text-fg leading-snug group-hover:text-accent transition-colors line-clamp-2">
                            {displayTitle}
                          </h3>
                          {Boolean(displayDesc) && (
                            <p className="text-xs text-muted mt-1.5 line-clamp-2 leading-relaxed">
                              {displayDesc}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-line flex items-center justify-between text-xs text-accent font-semibold group-hover:underline">
                          <span>{lang === "ne" ? "एल्बम खोल्नुहोस्" : "Open Album"}</span>
                          <CaretRight size={14} />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ALBUM DETAIL MODAL / GRID */}
      {selectedAlbum && (
        <div
          onClick={closeAlbumModal}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full max-h-[90vh] bg-surface rounded-card border border-line shadow-e3 flex flex-col overflow-hidden animate-fade-in my-auto"
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-line flex items-start justify-between gap-4 bg-surface">
              <div className="space-y-1.5 pr-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-chip bg-accent-soft text-accent text-xs font-bold inline-flex items-center gap-1">
                    <Images size={14} weight="fill" />
                    {selectedAlbum.images.length} {lang === "ne" ? "तस्बिरहरू" : "Photos"}
                  </span>
                  {Boolean(selectedAlbum.dateNe || selectedAlbum.dateEn) && (
                    <span className="text-xs text-muted font-mono flex items-center gap-1">
                      <CalendarBlank size={13} />
                      {lang === "ne" ? selectedAlbum.dateNe || selectedAlbum.dateEn : selectedAlbum.dateEn || selectedAlbum.dateNe}
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-fg">
                  {lang === "ne" ? selectedAlbum.titleNe : selectedAlbum.titleEn}
                </h2>
                {Boolean(selectedAlbum.descriptionNe || selectedAlbum.descriptionEn) && (
                  <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-3xl">
                    {lang === "ne"
                      ? selectedAlbum.descriptionNe || selectedAlbum.descriptionEn
                      : selectedAlbum.descriptionEn || selectedAlbum.descriptionNe}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={closeAlbumModal}
                className="p-2 rounded-chip bg-tint text-muted hover:text-fg hover:bg-line transition-colors flex-shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Photos Grid Inside Album */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {selectedAlbum.images.length === 0 ? (
                <div className="p-12 text-center text-muted">
                  <Images size={36} className="mx-auto text-accent mb-2" weight="duotone" />
                  <p className="text-sm font-semibold text-fg">
                    {lang === "ne" ? "यस एल्बममा तस्बिरहरू छैनन्" : "No photos in this album"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedAlbum.images.map((photo, idx) => {
                    const caption = lang === "ne" ? photo.captionNe || photo.captionEn : photo.captionEn || photo.captionNe;
                    return (
                      <div
                        key={photo.id || idx}
                        onClick={() => setLightboxIndex(idx)}
                        className="group rounded-card border border-line bg-surface overflow-hidden cursor-pointer hover:border-accent hover:shadow-e2 transition-all flex flex-col"
                      >
                        <div className="relative aspect-[4/3] w-full bg-black/90 overflow-hidden flex items-center justify-center p-1">
                          {isValidImageSrc(photo.imageUrl) ? (
                            <Image
                              src={photo.imageUrl}
                              alt={caption || `Photo ${idx + 1}`}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-contain group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <ImageIcon size={32} className="text-muted" />
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />
                        </div>

                        {/* Caption under thumbnail if present */}
                        <div className="p-3 bg-surface border-t border-line/50 flex-1 flex flex-col justify-center">
                          {caption ? (
                            <p className="text-xs text-fg font-medium line-clamp-2 leading-snug">
                              {caption}
                            </p>
                          ) : (
                            <p className="text-[11px] text-muted italic">
                              {lang === "ne" ? `तस्बिर #${idx + 1}` : `Photo #${idx + 1}`}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN ALBUM PHOTO LIGHTBOX */}
      {selectedAlbum && lightboxIndex !== null && selectedAlbum.images[lightboxIndex] && (
        <div
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none"
        >
          {/* Top Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="p-4 sm:px-6 flex items-center justify-between text-white border-b border-white/10 bg-black/40"
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm sm:text-base text-white/90">
                {lang === "ne" ? selectedAlbum.titleNe : selectedAlbum.titleEn}
              </span>
              <span className="px-2 py-0.5 rounded-chip bg-white/10 text-xs font-mono text-white/80">
                {lightboxIndex + 1} / {selectedAlbum.images.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="p-2 rounded-chip bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Close Lightbox"
            >
              <X size={22} />
            </button>
          </div>

          {/* Main Photo Area with Navigation */}
          <div
            className="relative flex-1 w-full flex items-center justify-center p-2 sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Button */}
            {selectedAlbum.images.length > 1 && (
              <button
                type="button"
                onClick={handlePrevPhoto}
                className="absolute left-3 sm:left-6 z-10 p-3 rounded-full bg-black/60 text-white hover:bg-black/90 transition-all border border-white/20 cursor-pointer"
                aria-label="Previous Photo"
              >
                <CaretLeft size={24} weight="bold" />
              </button>
            )}

            {/* Photo */}
            <div className="relative w-full h-[70vh] sm:h-[75vh] flex items-center justify-center">
              {isValidImageSrc(selectedAlbum.images[lightboxIndex]?.imageUrl) ? (
                <Image
                  src={selectedAlbum.images[lightboxIndex].imageUrl}
                  alt={
                    (lang === "ne"
                      ? selectedAlbum.images[lightboxIndex].captionNe
                      : selectedAlbum.images[lightboxIndex].captionEn) ||
                    `Photo ${lightboxIndex + 1}`
                  }
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                />
              ) : (
                <div className="text-white/60 flex flex-col items-center gap-2">
                  <ImageIcon size={48} weight="duotone" />
                  <span className="text-xs font-mono">Image Not Found</span>
                </div>
              )}
            </div>

            {/* Next Button */}
            {selectedAlbum.images.length > 1 && (
              <button
                type="button"
                onClick={handleNextPhoto}
                className="absolute right-3 sm:right-6 z-10 p-3 rounded-full bg-black/60 text-white hover:bg-black/90 transition-all border border-white/20 cursor-pointer"
                aria-label="Next Photo"
              >
                <CaretRight size={24} weight="bold" />
              </button>
            )}
          </div>

          {/* Bottom Bar: Captions */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="p-4 sm:p-6 bg-black/60 backdrop-blur-sm border-t border-white/10 text-center max-w-4xl mx-auto w-full"
          >
            {(() => {
              const current = selectedAlbum.images[lightboxIndex];
              const primaryCaption = lang === "ne" ? current.captionNe || current.captionEn : current.captionEn || current.captionNe;
              const secondaryCaption = lang === "ne" ? (current.captionNe ? current.captionEn : "") : (current.captionEn ? current.captionNe : "");

              return (
                <div className="space-y-1">
                  {primaryCaption ? (
                    <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                      {primaryCaption}
                    </p>
                  ) : (
                    <p className="text-xs text-white/50 italic">
                      {lang === "ne" ? "कुनै क्याप्सन उपलब्ध छैन" : "No caption provided"}
                    </p>
                  )}
                  {Boolean(secondaryCaption) && (
                    <p className="text-xs text-white/70">
                      {secondaryCaption}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* SINGLE PHOTO LIGHTBOX MODAL */}
      {activeSinglePhoto && (
        <div
          onClick={closeSinglePhoto}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-surface rounded-card overflow-hidden border border-line shadow-e3"
          >
            <button
              type="button"
              onClick={closeSinglePhoto}
              className="absolute top-4 right-4 z-10 p-2 rounded-chip bg-black/60 text-white hover:bg-black transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="relative h-[65vh] w-full bg-black flex items-center justify-center">
              {isValidImageSrc(activeSinglePhoto.imageUrl) ? (
                <Image
                  src={activeSinglePhoto.imageUrl}
                  alt={lang === "ne" ? activeSinglePhoto.titleNe : activeSinglePhoto.titleEn}
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
            <div className="p-6 space-y-2 bg-surface border-t border-line">
              <div className="flex flex-wrap items-center gap-2">
                {Boolean((lang === "ne" ? activeSinglePhoto.categoryNe || activeSinglePhoto.categoryEn : activeSinglePhoto.categoryEn || activeSinglePhoto.categoryNe)?.trim()) && (
                  <span className="px-2.5 py-0.5 rounded-chip bg-accent-soft text-accent text-xs font-bold">
                    {lang === "ne" ? activeSinglePhoto.categoryNe || activeSinglePhoto.categoryEn : activeSinglePhoto.categoryEn || activeSinglePhoto.categoryNe}
                  </span>
                )}
                {Boolean(activeSinglePhoto.dateNe || activeSinglePhoto.dateEn) && (
                  <div className="text-xs text-muted font-mono">
                    {lang === "ne" ? activeSinglePhoto.dateNe : activeSinglePhoto.dateEn}
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-fg">
                {lang === "ne" ? activeSinglePhoto.titleNe : activeSinglePhoto.titleEn}
              </h3>
            </div>
          </div>
        </div>
      )}

      <SiteFooter lang={lang} />
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ground text-fg flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
        </div>
      }
    >
      <GalleryContent />
    </Suspense>
  );
}
