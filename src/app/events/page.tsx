"use client";

import React, { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Language,
  getStoredLanguage,
  subscribeEvents,
  getStoredEventsSnapshot,
  getServerEventsSnapshot,
} from "@/data/mockData";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  CalendarCheck,
} from "@phosphor-icons/react";

export default function EventsPage() {
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const events = useSyncExternalStore(
    subscribeEvents,
    getStoredEventsSnapshot,
    getServerEventsSnapshot
  );
  const [statusFilter, setStatusFilter] = useState<"upcoming" | "completed">("upcoming");

  const filteredEvents = events.filter((e) => e.status === statusFilter);

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
            {lang === "ne" ? "कार्यक्रम तथा गतिविधि सञ्जाल" : "Community Events & Program Calendar"}
          </div>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-line pb-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-chip bg-accent-soft text-accent text-xs font-semibold">
              <CalendarCheck size={16} weight="duotone" />
              <span>{lang === "ne" ? "सामुदायिक भेला तथा कार्यक्रम" : "Community Gatherings & Programs"}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
              {lang === "ne" ? "कार्यक्रम तथा सामाजिक गतिविधिहरू" : "Events & Social Programs"}
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-muted">
              {lang === "ne"
                ? "वार्षिक साधारण सभा, निःशुल्क स्वास्थ्य शिविर, रक्तदान, चाडपर्व शुभकामना आदान-प्रदान तथा गाउँ विकास कार्यक्रमहरूको तालिका।"
                : "Schedule of upcoming general assemblies, free specialist health camps, blood donation drives, and cultural festivals."}
            </p>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter("upcoming")}
              className={`px-4 py-2.5 rounded-control text-xs font-semibold transition-colors ${
                statusFilter === "upcoming"
                  ? "bg-accent text-on-accent shadow-sm"
                  : "bg-surface border border-line text-fg hover:bg-tint"
              }`}
            >
              {lang === "ne" ? "आगामी कार्यक्रमहरू" : "Upcoming Events"}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("completed")}
              className={`px-4 py-2.5 rounded-control text-xs font-semibold transition-colors ${
                statusFilter === "completed"
                  ? "bg-accent text-on-accent shadow-sm"
                  : "bg-surface border border-line text-fg hover:bg-tint"
              }`}
            >
              {lang === "ne" ? "सम्पन्न कार्यक्रमहरू" : "Completed Events"}
            </button>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="p-16 text-center space-y-3 rounded-card border border-dashed border-line bg-surface">
            <Calendar size={36} className="text-accent mx-auto" weight="duotone" />
            <div className="text-base font-bold text-fg">
              {lang === "ne" ? "यस वर्गमा कुनै कार्यक्रम छैन" : "No events scheduled in this category"}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredEvents.map((event) => (
              <article
                key={event.id}
                className="rounded-card border border-line bg-surface overflow-hidden flex flex-col sm:flex-row hover:border-accent transition-all group"
              >
                <div className="sm:w-56 relative h-48 sm:h-auto flex-shrink-0 bg-tint">
                  <Image
                    src={event.imageUrl}
                    alt={lang === "ne" ? event.titleNe : event.titleEn}
                    fill
                    sizes="(max-width: 640px) 100vw, 224px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-chip bg-surface/95 text-[11px] font-bold text-accent shadow-sm">
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

                    <h3 className="text-lg font-bold text-fg leading-snug">
                      {lang === "ne" ? event.titleNe : event.titleEn}
                    </h3>

                    <p className="text-xs leading-relaxed text-muted line-clamp-3">
                      {lang === "ne" ? event.descriptionNe : event.descriptionEn}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-line flex items-center justify-between text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} className="text-accent flex-shrink-0" />
                      <span>{lang === "ne" ? event.locationNe : event.locationEn}</span>
                    </span>
                    <span className="font-semibold text-accent">
                      {event.status === "upcoming"
                        ? lang === "ne" ? "आयोजना हुने" : "Scheduled"
                        : lang === "ne" ? "सम्पन्न" : "Concluded"}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <SiteFooter lang={lang} />
    </div>
  );
}
