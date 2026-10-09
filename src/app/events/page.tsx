"use client";

import React, { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Language,
  EventItem,
  GalleryItem,
  GalleryAlbum,
  getStoredLanguage,
  subscribeEvents,
  getStoredEventsSnapshot,
  getServerEventsSnapshot,
  saveStoredEvents,
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
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  X,
  Eye,
  ArrowsOut,
  Images,
} from "@phosphor-icons/react";
import { isValidImageSrc } from "@/lib/validation";
import { useRemoteData } from "@/hooks/useRemoteData";
import { DataStatus } from "@/components/DataStatus";
import { EventRelatedGallery } from "@/components/EventRelatedGallery";

export default function EventsPage() {
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const events = useSyncExternalStore(
    subscribeEvents,
    getStoredEventsSnapshot,
    getServerEventsSnapshot
  );
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

  const remote = useRemoteData<EventItem[]>("/api/events", saveStoredEvents);
  useRemoteData<GalleryItem[]>("/api/gallery", saveStoredGallery);
  useRemoteData<GalleryAlbum[]>("/api/gallery/albums", saveStoredGalleryAlbums);

  const [statusFilter, setStatusFilter] = useState<"upcoming" | "completed">("completed");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<{ url: string; title: string } | null>(null);

  const filteredEvents = events.filter((e) => e.status === statusFilter);

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
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-line pb-8">
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
              {lang === "ne" ? "गतिविधिहरू" : "Activities"}
            </h1>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter("completed")}
              className={`px-4 py-2.5 rounded-control text-xs font-semibold transition-colors ${statusFilter === "completed"
                  ? "bg-accent text-on-accent shadow-e1"
                  : "bg-surface border border-line text-fg hover:bg-tint"
                }`}
            >
              {lang === "ne" ? "सम्पन्न गतिविधिहरू" : "Completed Activities"}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("upcoming")}
              className={`px-4 py-2.5 rounded-control text-xs font-semibold transition-colors ${statusFilter === "upcoming"
                  ? "bg-accent text-on-accent shadow-e1"
                  : "bg-surface border border-line text-fg hover:bg-tint"
                }`}
            >
              {lang === "ne" ? "आगामी गतिविधिहरू" : "Upcoming Activities"}
            </button>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="p-16 text-center space-y-3 rounded-card border border-dashed border-line bg-surface">
            <Calendar size={36} className="text-accent mx-auto" weight="duotone" />
            <div className="text-base font-bold text-fg">
              {lang === "ne" ? "यस वर्गमा कुनै गतिविधि छैन" : "No activities scheduled in this category"}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredEvents.map((event) => (
              <article
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="rounded-card border border-line bg-surface overflow-hidden flex flex-col sm:flex-row hover:border-accent transition-all group cursor-pointer shadow-e1 hover:shadow-e2"
              >
                <div className="sm:w-56 relative h-52 sm:h-auto min-h-[160px] flex-shrink-0 bg-tint/60 flex items-center justify-center overflow-hidden p-2">
                  {isValidImageSrc(event.imageUrl) ? (
                    <Image
                      src={event.imageUrl}
                      alt={lang === "ne" ? event.titleNe : event.titleEn}
                      fill
                      sizes="(max-width: 640px) 100vw, 224px"
                      className="object-contain group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <Calendar size={40} className="text-accent" weight="duotone" />
                  )}
                  {Boolean(
                    (lang === "ne" ? event.categoryNe : event.categoryEn)?.trim() &&
                    event.categoryNe !== "साधारण सभा" &&
                    event.categoryEn !== "General Assembly"
                  ) && (
                      <div className="absolute top-3 left-3 px-2 py-0.5 rounded-chip bg-surface/95 text-[11px] font-bold text-accent shadow-e1">
                        {lang === "ne" ? event.categoryNe : event.categoryEn}
                      </div>
                    )}
                  {Boolean(event.galleryId) && (
                    <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-chip bg-surface/95 text-[11px] font-bold text-accent shadow-e1 flex items-center gap-1">
                      <Images size={13} weight="fill" />
                      <span>{lang === "ne" ? "तस्बिर सङ्ग्रह" : "Photo Album"}</span>
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1 font-bold text-accent">
                        <Calendar size={14} />
                        {lang === "ne" ? event.dateNe : event.dateEn}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {lang === "ne" ? event.timeNe : event.timeEn}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-fg leading-snug group-hover:text-accent transition-colors">
                      {lang === "ne" ? event.titleNe : event.titleEn}
                    </h3>

                    <p className="text-xs leading-relaxed text-muted line-clamp-3">
                      {lang === "ne" ? event.descriptionNe || event.descriptionEn : event.descriptionEn || event.descriptionNe}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-line flex items-center justify-between gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <MapPin size={14} className="text-accent flex-shrink-0" />
                      <span className="truncate">{lang === "ne" ? event.locationNe : event.locationEn}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-accent group-hover:underline flex-shrink-0 whitespace-nowrap">
                      <Eye size={14} />
                      <span>{lang === "ne" ? "विवरण हेर्नुहोस्" : "View Details"}</span>
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* EVENT DETAILS DIALOG MODAL */}
      {selectedEvent && (
        <div
          onClick={() => {
            setSelectedEvent(null);
            setZoomedImageUrl(null);
          }}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 cursor-pointer overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl lg:max-w-5xl w-full max-h-[90vh] bg-surface rounded-card border border-line shadow-e3 overflow-hidden cursor-default my-auto flex flex-col md:flex-row animate-fade-in"
          >
            <button
              type="button"
              onClick={() => {
                setSelectedEvent(null);
                setZoomedImageUrl(null);
              }}
              className="absolute top-3 right-3 z-20 p-2 rounded-chip bg-surface/90 hover:bg-surface text-fg border border-line shadow-sm transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {isValidImageSrc(selectedEvent.imageUrl) && (
              <div className="relative md:w-[320px] lg:w-[360px] h-48 sm:h-60 md:h-auto min-h-[220px] bg-black/95 flex items-center justify-center p-3 sm:p-4 group/img flex-shrink-0 border-b md:border-b-0 md:border-r border-line">
                <Image
                  src={selectedEvent.imageUrl}
                  alt={lang === "ne" ? selectedEvent.titleNe : selectedEvent.titleEn}
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  className="object-contain cursor-zoom-in"
                  onClick={() =>
                    setZoomedImageUrl({
                      url: selectedEvent.imageUrl,
                      title: lang === "ne" ? selectedEvent.titleNe : selectedEvent.titleEn,
                    })
                  }
                  priority
                />
                <button
                  type="button"
                  onClick={() =>
                    setZoomedImageUrl({
                      url: selectedEvent.imageUrl,
                      title: lang === "ne" ? selectedEvent.titleNe : selectedEvent.titleEn,
                    })
                  }
                  className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-chip bg-black/75 hover:bg-black text-white text-[11px] font-semibold flex items-center gap-1 backdrop-blur-sm border border-white/20 shadow-md transition-all cursor-pointer"
                  title={lang === "ne" ? "पूर्ण आकारमा हेर्नुहोस्" : "View Fullscreen"}
                >
                  <ArrowsOut size={13} />
                  <span>{lang === "ne" ? "ठूलो बनाउनुहोस्" : "Expand"}</span>
                </button>
              </div>
            )}

            {/* BIG DETAILS SECTION */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 flex flex-col justify-between">
              <div className="space-y-4 pr-6">
                <div className="flex flex-wrap items-center gap-2">
                  {Boolean(
                    (lang === "ne" ? selectedEvent.categoryNe : selectedEvent.categoryEn)?.trim() &&
                    selectedEvent.categoryNe !== "साधारण सभा" &&
                    selectedEvent.categoryEn !== "General Assembly"
                  ) && (
                      <span className="px-3 py-1 rounded-chip bg-accent-soft text-accent text-xs font-bold">
                        {lang === "ne" ? selectedEvent.categoryNe : selectedEvent.categoryEn}
                      </span>
                    )}
                  <span
                    className={`px-3 py-1 rounded-chip text-xs font-bold ${selectedEvent.status === "upcoming"
                        ? "bg-accent text-on-accent"
                        : "bg-tint text-muted"
                      }`}
                  >
                    {selectedEvent.status === "upcoming"
                      ? lang === "ne" ? "आयोजना हुने" : "Scheduled"
                      : lang === "ne" ? "सम्पन्न" : "Concluded"}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-fg leading-snug tracking-tight">
                  {lang === "ne" ? selectedEvent.titleNe : selectedEvent.titleEn}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-card bg-ground border border-line text-xs">
                  <div className="flex items-center gap-2.5">
                    <Calendar size={20} className="text-accent flex-shrink-0" weight="duotone" />
                    <div>
                      <div className="text-[10px] text-muted uppercase font-bold">{lang === "ne" ? "मिति" : "Date"}</div>
                      <div className="text-xs sm:text-sm font-bold text-fg">{lang === "ne" ? selectedEvent.dateNe : selectedEvent.dateEn}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock size={20} className="text-accent flex-shrink-0" weight="duotone" />
                    <div>
                      <div className="text-[10px] text-muted uppercase font-bold">{lang === "ne" ? "समय" : "Time"}</div>
                      <div className="text-xs sm:text-sm font-bold text-fg">{lang === "ne" ? selectedEvent.timeNe : selectedEvent.timeEn}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin size={20} className="text-accent flex-shrink-0" weight="duotone" />
                    <div>
                      <div className="text-[10px] text-muted uppercase font-bold">{lang === "ne" ? "स्थान" : "Location"}</div>
                      <div className="text-xs sm:text-sm font-bold text-fg">{lang === "ne" ? selectedEvent.locationNe : selectedEvent.locationEn}</div>
                    </div>
                  </div>
                </div>

                {Boolean(selectedEvent.descriptionNe || selectedEvent.descriptionEn) && (
                  <div className="space-y-2.5 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                      {lang === "ne" ? "गतिविधिको विस्तृत विवरण" : "Activity Description & Details"}
                    </h4>
                    <p className="text-sm sm:text-base leading-relaxed text-fg/90 whitespace-pre-line bg-ground/50 p-4 sm:p-5 rounded-card border border-line/60 font-sans">
                      {lang === "ne"
                        ? selectedEvent.descriptionNe || selectedEvent.descriptionEn
                        : selectedEvent.descriptionEn || selectedEvent.descriptionNe}
                    </p>
                  </div>
                )}

                {/* RELATED GALLERY SECTION */}
                <EventRelatedGallery
                  galleryId={selectedEvent.galleryId}
                  lang={lang}
                  albums={albums}
                  gallery={gallery}
                  onZoomImage={setZoomedImageUrl}
                />
              </div>

              <div className="pt-4 border-t border-line flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEvent(null);
                    setZoomedImageUrl(null);
                  }}
                  className="px-6 py-2.5 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  {lang === "ne" ? "बन्द गर्नुहोस्" : "Close"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* FULLSCREEN IMAGE LIGHTBOX */}
      {zoomedImageUrl && isValidImageSrc(zoomedImageUrl.url) && (
        <div
          onClick={() => setZoomedImageUrl(null)}
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between text-white p-2 border-b border-white/10"
          >
            <span className="font-bold text-sm sm:text-base text-white/90">
              {zoomedImageUrl.title}
            </span>
            <button
              type="button"
              onClick={() => setZoomedImageUrl(null)}
              className="p-2 rounded-chip bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>
          <div
            className="relative flex-1 w-full h-[82vh] flex items-center justify-center p-2"
            onClick={() => setZoomedImageUrl(null)}
          >
            <Image
              src={zoomedImageUrl.url}
              alt={zoomedImageUrl.title}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>
        </div>
      )}

      <SiteFooter lang={lang} />
    </div>
  );
}
