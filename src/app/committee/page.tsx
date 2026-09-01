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
  saveStoredMembers,
} from "@/data/mockData";
import {
  Users,
  Phone,
  EnvelopeSimple,
  MagnifyingGlass,
  ArrowLeft,
} from "@phosphor-icons/react";
import { isValidImageSrc } from "@/lib/validation";
import { useRemoteData } from "@/hooks/useRemoteData";
import { DataStatus } from "@/components/DataStatus";

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
  return Boolean(url) && isValidImageSrc(url) && !url!.includes("images.unsplash.com");
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
          sizes="(max-width: 640px) 100vw, 300px"
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

export default function CommitteePage() {
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const members = useSyncExternalStore(
    subscribeMembers,
    getStoredMembersSnapshot,
    getServerMembersSnapshot
  );
  const remote = useRemoteData<Member[]>("/api/members", saveStoredMembers);
  const [filter, setFilter] = useState<"current" | "officials" | "advisor">("current");
  const [search, setSearch] = useState("");

  const filteredMembers = members.filter((m) => {
    if (m.committeeType === "past") return false;
    const matchesCategory = m.committeeType === filter;
    const matchesSearch =
      m.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      m.nameNe.includes(search) ||
      m.roleEn.toLowerCase().includes(search.toLowerCase()) ||
      m.roleNe.includes(search);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-ground text-fg font-sans flex flex-col justify-between selection:bg-accent selection:text-on-accent">
      <SiteHeader lang={lang} setLang={setLang} />
      <DataStatus error={remote.error} refetch={remote.refetch} lang={lang} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Breadcrumb & Navigation Back */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-accent transition-colors"
          >
            <ArrowLeft size={16} />
            <span>{lang === "ne" ? "मुख्य पृष्ठमा फर्कनुहोस्" : "Back to Home"}</span>
          </Link>
          <div className="text-xs font-mono text-muted">
            {lang === "ne" ? "कार्यसमिति अभिलेख" : "Executive Committee Directory"}
          </div>
        </div>

        {/* Page Title & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-line pb-8">
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
              {lang === "ne" ? "हाम्रो नेतृत्व" : "Our Leadership"}
            </h1>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <MagnifyingGlass size={16} className="absolute left-3 top-3 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === "ne" ? "सदस्य वा पद खोज्नुहोस्..." : "Search member or designation..."}
              className="w-full pl-9 pr-4 py-2.5 rounded-control border border-line bg-surface text-fg text-xs focus:border-accent"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("current")}
            className={`px-4 py-2 rounded-control text-xs font-semibold transition-colors ${
              filter === "current" ? "bg-accent text-on-accent" : "bg-surface border border-line text-fg hover:bg-tint"
            }`}
          >
            {lang === "ne" ? "हाम्रो नेतृत्व" : "Our Leadership"}
          </button>
          <button
            type="button"
            onClick={() => setFilter("officials")}
            className={`px-4 py-2 rounded-control text-xs font-semibold transition-colors ${
              filter === "officials" ? "bg-accent text-on-accent" : "bg-surface border border-line text-fg hover:bg-tint"
            }`}
          >
            {lang === "ne" ? "वर्तमान समिति" : "Current Committee"}
          </button>
          <button
            type="button"
            onClick={() => setFilter("advisor")}
            className={`px-4 py-2 rounded-control text-xs font-semibold transition-colors ${
              filter === "advisor" ? "bg-accent text-on-accent" : "bg-surface border border-line text-fg hover:bg-tint"
            }`}
          >
            {lang === "ne" ? "सल्लाहकार परिषद्" : "Advisory Council"}
          </button>
        </div>

        {/* Members Roster Grid */}
        {filteredMembers.length === 0 ? (
          <div className="p-16 text-center space-y-3 rounded-card border border-dashed border-line bg-surface">
            <Users size={36} className="text-accent mx-auto" weight="duotone" />
            <div className="text-base font-bold text-fg">
              {lang === "ne" ? "कुनै सदस्य फेला परेन" : "No members found"}
            </div>
            <p className="text-xs text-muted">
              {lang === "ne" ? "कृपया खोजी शब्द परिवर्तन गर्नुहोस्।" : "Try adjusting your search criteria."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <article
                key={member.id}
                className="rounded-card border border-line bg-surface p-6 flex flex-col justify-between space-y-4 hover:border-accent transition-all group"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-card overflow-hidden border border-line flex-shrink-0 bg-tint">
                      <Portrait member={member} lang={lang} sizeClass="w-full h-full" textClass="text-2xl" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="inline-block px-2 py-0.5 rounded-chip text-[11px] font-bold bg-accent text-on-accent">
                        {lang === "ne" ? member.roleNe : member.roleEn}
                      </span>
                      <h3 className="text-base font-bold text-fg leading-snug truncate">
                        {lang === "ne" ? member.nameNe : member.nameEn}
                      </h3>
                      <div className="text-xs text-accent font-semibold truncate">
                        {lang === "ne" ? member.nameEn : member.nameNe}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-muted line-clamp-3">
                    {lang === "ne" ? member.bioNe : member.bioEn}
                  </p>
                </div>

                <div className="pt-3 border-t border-line space-y-1.5 text-xs text-muted">
                  {member.phone && (
                    <a
                      href={`tel:${member.phone}`}
                      className="flex items-center gap-2 hover:text-accent transition-colors"
                    >
                      <Phone size={14} className="text-accent flex-shrink-0" />
                      <span className="font-mono">{member.phone}</span>
                    </a>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="flex items-center gap-2 hover:text-accent transition-colors truncate"
                    >
                      <EnvelopeSimple size={14} className="text-accent flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </a>
                  )}
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
