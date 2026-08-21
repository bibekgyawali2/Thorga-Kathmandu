"use client";

import React, { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Language,
  Member,
  getStoredLanguage,
  subscribeMembers,
  getStoredMembersSnapshot,
  getServerMembersSnapshot,
} from "@/data/mockData";
import {
  Clock,
  ArrowLeft,
  ShieldCheck,
  Calendar,
} from "@phosphor-icons/react";

function initials(name: string) {
  const parts = name
    .replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.)\s*/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hasRealPhoto(url?: string) {
  return Boolean(url) && !url!.includes("images.unsplash.com");
}

function Portrait({
  member,
  lang,
  sizeClass,
  textClass,
}: {
  member: Member;
  lang: Language;
  sizeClass: string;
  textClass: string;
}) {
  const name = lang === "ne" ? member.nameNe : member.nameEn;

  if (hasRealPhoto(member.photoUrl)) {
    return (
      <div className={`relative overflow-hidden bg-tint ${sizeClass}`}>
        <Image
          src={member.photoUrl}
          alt={name}
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`bg-accent-soft text-accent flex items-center justify-center font-bold ${sizeClass} ${textClass}`}
      aria-hidden="true"
    >
      {initials(member.nameEn)}
    </div>
  );
}

export default function PastLeadersPage() {
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const members = useSyncExternalStore(
    subscribeMembers,
    getStoredMembersSnapshot,
    getServerMembersSnapshot
  );

  const pastMembers = members.filter((m) => m.committeeType === "past");

  return (
    <div className="min-h-screen bg-ground text-fg font-sans flex flex-col justify-between selection:bg-accent selection:text-on-accent">
      <SiteHeader lang={lang} setLang={setLang} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
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
            {lang === "ne" ? "ऐतिहासिक नेतृत्व अभिलेख" : "Historical Leadership Archive"}
          </div>
        </div>

        {/* Page Header */}
        <div className="space-y-4 border-b border-line pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-chip bg-accent-soft text-accent text-xs font-semibold">
            <Clock size={16} weight="duotone" />
            <span>{lang === "ne" ? "संस्थापक तथा पूर्व अध्यक्षहरू" : "Founders & Past Presidents"}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
            {lang === "ne" ? "पूर्व नेतृत्व तथा ऐतिहासिक कार्यकाल" : "Past Leadership & Tenure Archive"}
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-muted max-w-3xl">
            {lang === "ne"
              ? "वि.सं. २०५८ मा संस्था स्थापना भएदेखि हालसम्म मञ्चको नेतृत्व सम्हाल्दै काठमाडौँमा थोर्गाबासीहरूलाई एकताबद्ध गर्न र गाउँको चौतर्फी विकासमा नेतृत्वदायी योगदान पुर्याउनुहुने श्रद्धेय पूर्व अध्यक्षहरू।"
              : "Honoring former presidents, founding conveners, and executive leaders who guided the forum since its establishment in 2001 (2058 BS)."}
          </p>
        </div>

        {/* Timeline Archive */}
        {pastMembers.length === 0 ? (
          <div className="p-16 text-center space-y-3 rounded-card border border-dashed border-line bg-surface">
            <Clock size={36} className="text-accent mx-auto" weight="duotone" />
            <div className="text-base font-bold text-fg">
              {lang === "ne" ? "कुनै पूर्व नेतृत्व विवरण उपलब्ध छैन" : "No past leadership records available"}
            </div>
            <p className="text-xs text-muted">
              {lang === "ne" ? "प्रशासक प्यानलबाट पूर्व नेतृत्व विवरण थप गर्न सकिन्छ।" : "Past leaders can be added via the administrative panel."}
            </p>
          </div>
        ) : (
          <div className="relative border-l-2 border-accent/40 ml-4 sm:ml-8 space-y-12 pb-6">
            {pastMembers.map((pastMember) => (
              <div key={pastMember.id} className="relative pl-6 sm:pl-10">
                {/* Timeline Bullet Marker */}
                <span className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-surface border-2 border-accent" />

                <article className="rounded-card border border-line bg-surface p-6 sm:p-7 flex flex-col sm:flex-row gap-6 items-start hover:border-accent transition-all">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-card overflow-hidden border border-line flex-shrink-0 bg-tint">
                    <Portrait member={pastMember} lang={lang} sizeClass="w-full h-full" textClass="text-2xl" />
                  </div>

                  <div className="flex-1 space-y-2.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-chip text-xs font-bold bg-accent-soft text-accent">
                        <Calendar size={13} />
                        {lang === "ne" ? pastMember.tenureNe : pastMember.tenureEn}
                      </span>
                      <span className="text-xs font-bold text-fg">
                        {lang === "ne" ? pastMember.roleNe : pastMember.roleEn}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-fg">
                        {lang === "ne" ? pastMember.nameNe : pastMember.nameEn}
                      </h3>
                      <div className="text-xs text-accent font-semibold mt-0.5">
                        {lang === "ne" ? pastMember.nameEn : pastMember.nameNe}
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed text-muted">
                      {lang === "ne" ? pastMember.bioNe : pastMember.bioEn}
                    </p>

                    <div className="pt-2 border-t border-line flex items-center gap-2 text-xs text-muted">
                      <ShieldCheck size={14} className="text-accent" />
                      <span>{lang === "ne" ? "कार्यकाल पूर्ण सम्पन्न" : "Tenure successfully completed"}</span>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
      </main>

      <SiteFooter lang={lang} />
    </div>
  );
}
