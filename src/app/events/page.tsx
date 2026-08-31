"use client";

import React, { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Language,
  EventItem,
  getStoredLanguage,
  subscribeEvents,
  getStoredEventsSnapshot,
  getServerEventsSnapshot,
  saveStoredEvents,
} from "@/data/mockData";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  X,
  Eye,
} from "@phosphor-icons/react";
import { isValidImageSrc } from "@/lib/validation";
import { useRemoteData } from "@/hooks/useRemoteData";
import { DataStatus } from "@/components/DataStatus";

export default function EventsPage() {
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const events = useSyncExternalStore(
    subscribeEvents,
    getStoredEventsSnapshot,
    getServerEventsSnapshot
  );
  const remote = useRemoteData<EventItem[]>("/api/events", saveStoredEvents);
  const [statusFilter, setStatusFilter] = useState<"upcoming" | "completed">("upcoming");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

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
              onClick={() => setStatusFilter("upcoming")}
              className={`px-4 py-2.5 rounded-control text-xs font-semibold transition-colors ${
                statusFilter === "upcoming"
                  ? "bg-accent text-on-accent shadow-e1"
                  : "bg-surface border border-line text-fg hover:bg-tint"
              }`}
            >
              {lang === "ne" ? "आगामी गतिविधिहरू" : "Upcoming Activities"}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("completed")}
              className={`px-4 py-2.5 rounded-control text-xs font-semibold transition-colors ${
                statusFilter === "completed"
                  ? "bg-accent text-on-accent shadow-e1"
                  : "bg-surface border border-line text-fg hover:bg-tint"
              }`}
            >
              {lang === "ne" ? "सम्पन्न गतिविधिहरू" : "Completed Activities"}
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
                <div className="sm:w-56 relative h-48 sm:h-auto flex-shrink-0 bg-tint flex items-center justify-center overflow-hidden">
                  {isValidImageSrc(event.imageUrl) ? (
                    <Image
                      src={event.imageUrl}
                      alt={lang === "ne" ? event.titleNe : event.titleEn}
                      fill
                      sizes="(max-width: 640px) 100vw, 224px"
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <Calendar size={40} className="text-accent" weight="duotone" />
                  )}
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-chip bg-surface/95 text-[11px] font-bold text-accent shadow-e1">
                    {lang === "ne" ? event.categoryNe : event.categoryEn}
                  </div>
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

                  <div className="pt-3 border-t border-line flex items-center justify-between text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} className="text-accent flex-shrink-0" />
                      <span>{lang === "ne" ? event.locationNe : event.locationEn}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-accent group-hover:underline">
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
          onClick={() => setSelectedEvent(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-surface rounded-card border border-line shadow-e3 overflow-hidden cursor-default my-8 animate-fade-in"
          >
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-chip bg-black/60 text-white hover:bg-black transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {isValidImageSrc(selectedEvent.imageUrl) && (
              <div className="relative h-60 sm:h-72 w-full bg-black">
                <Image
                  src={selectedEvent.imageUrl}
                  alt={lang === "ne" ? selectedEvent.titleNe : selectedEvent.titleEn}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-chip bg-accent-soft text-accent text-xs font-bold">
                  {lang === "ne" ? selectedEvent.categoryNe : selectedEvent.categoryEn}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-chip text-xs font-bold ${
                    selectedEvent.status === "upcoming"
                      ? "bg-accent text-on-accent"
                      : "bg-tint text-muted"
                  }`}
                >
                  {selectedEvent.status === "upcoming"
                    ? lang === "ne" ? "आयोजना हुने" : "Scheduled"
                    : lang === "ne" ? "सम्पन्न" : "Concluded"}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-fg leading-snug">
                {lang === "ne" ? selectedEvent.titleNe : selectedEvent.titleEn}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-control bg-ground border border-line text-xs">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-accent flex-shrink-0" weight="duotone" />
                  <div>
                    <div className="text-[10px] text-muted uppercase font-bold">{lang === "ne" ? "मिति" : "Date"}</div>
                    <div className="font-semibold text-fg">{lang === "ne" ? selectedEvent.dateNe : selectedEvent.dateEn}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-accent flex-shrink-0" weight="duotone" />
                  <div>
                    <div className="text-[10px] text-muted uppercase font-bold">{lang === "ne" ? "समय" : "Time"}</div>
                    <div className="font-semibold text-fg">{lang === "ne" ? selectedEvent.timeNe : selectedEvent.timeEn}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-accent flex-shrink-0" weight="duotone" />
                  <div>
                    <div className="text-[10px] text-muted uppercase font-bold">{lang === "ne" ? "स्थान" : "Location"}</div>
                    <div className="font-semibold text-fg">{lang === "ne" ? selectedEvent.locationNe : selectedEvent.locationEn}</div>
                  </div>
                </div>
              </div>

              {Boolean(selectedEvent.descriptionNe || selectedEvent.descriptionEn) && (
                <div className="space-y-2 pt-2 border-t border-line">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                    {lang === "ne" ? "गतिविधिको विस्तृत विवरण" : "Activity Description & Details"}
                  </h4>
                  <p className="text-sm leading-relaxed text-fg/90 whitespace-pre-line bg-ground/50 p-4 rounded-control border border-line/60">
                    {lang === "ne"
                      ? selectedEvent.descriptionNe || selectedEvent.descriptionEn
                      : selectedEvent.descriptionEn || selectedEvent.descriptionNe}
                  </p>
                </div>
              )}

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="px-5 py-2.5 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors"
                >
                  {lang === "ne" ? "बन्द गर्नुहोस्" : "Close"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SiteFooter lang={lang} />
    </div>
  );
}
