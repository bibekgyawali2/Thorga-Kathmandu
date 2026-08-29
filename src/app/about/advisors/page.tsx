"use client";

import React, { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Users, Phone, EnvelopeSimple } from "@phosphor-icons/react";
import { AboutPage, EmptyState } from "@/components/about/AboutPage";
import { useRemoteData } from "@/hooks/useRemoteData";
import { isValidImageSrc } from "@/lib/validation";
import {
  Language,
  Member,
  getStoredLanguage,
  subscribeMembers,
  getStoredMembersSnapshot,
  getServerMembersSnapshot,
  saveStoredMembers,
} from "@/data/mockData";

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

export default function CurrentAdvisorsPage() {
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const members = useSyncExternalStore(
    subscribeMembers,
    getStoredMembersSnapshot,
    getServerMembersSnapshot
  );
  const remote = useRemoteData<Member[]>("/api/members", saveStoredMembers);

  const advisors = members.filter((m) => m.committeeType === "advisor");

  return (
    <AboutPage
      lang={lang}
      setLang={setLang}
      titleNe="वर्तमान सल्लाहाकारहरु"
      titleEn="Current Advisors"
      introNe="संस्थालाई नीतिगत तथा संस्थागत विषयमा मार्गदर्शन गर्ने वर्तमान सल्लाहाकार परिषद्।"
      introEn="The advisory council currently guiding the forum on policy and institutional matters."
      remote={remote}
    >
      {advisors.length === 0 ? (
        <EmptyState
          lang={lang}
          icon={<Users size={32} weight="duotone" />}
          messageNe="हाल कुनै सल्लाहाकार सूचीबद्ध हुनुहुन्न।"
          messageEn="No advisors are currently listed."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {advisors.map((advisor) => {
            const name = lang === "ne" ? advisor.nameNe : advisor.nameEn;
            return (
              <article
                key={advisor.id}
                className="rounded-card border border-line bg-surface overflow-hidden"
              >
                <div className="relative aspect-[4/5] w-full bg-accent-soft">
                  {isValidImageSrc(advisor.photoUrl) &&
                  !advisor.photoUrl.includes("images.unsplash.com") ? (
                    <Image
                      src={advisor.photoUrl}
                      alt={name}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-accent"
                    >
                      {initials(advisor.nameEn)}
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-1.5">
                  <p className="text-xs font-semibold text-accent">
                    {lang === "ne" ? advisor.roleNe : advisor.roleEn}
                  </p>
                  <h2 className="text-base font-bold text-fg leading-snug">{name}</h2>
                  {(lang === "ne" ? advisor.bioNe : advisor.bioEn) && (
                    <p className="text-xs leading-relaxed text-muted line-clamp-3">
                      {lang === "ne" ? advisor.bioNe : advisor.bioEn}
                    </p>
                  )}
                  <div className="pt-2 space-y-1 text-xs text-muted">
                    {advisor.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={13} className="text-accent" />
                        <span className="font-mono">{advisor.phone}</span>
                      </div>
                    )}
                    {advisor.email && (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <EnvelopeSimple size={13} className="text-accent flex-shrink-0" />
                        <span className="truncate">{advisor.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AboutPage>
  );
}
