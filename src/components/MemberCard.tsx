"use client";

import React from "react";
import Image from "next/image";
import { Phone, EnvelopeSimple } from "@phosphor-icons/react";
import type { Member, Language } from "@/data/mockData";
import { isValidImageSrc } from "@/lib/validation";

export function initials(name: string) {
  const parts = name
    .replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.)\s*/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function hasRealPhoto(url?: string) {
  return Boolean(url) && isValidImageSrc(url) && !url!.includes("images.unsplash.com");
}

export function MemberPortrait({
  member,
  lang,
  sizeClass = "w-full h-full",
  textClass = "text-2xl",
}: {
  member: Member;
  lang: Language;
  sizeClass?: string;
  textClass?: string;
}) {
  const name = lang === "ne" ? member.nameNe : member.nameEn;

  if (hasRealPhoto(member.photoUrl)) {
    return (
      <div className={`relative overflow-hidden bg-tint flex items-center justify-center ${sizeClass}`}>
        <Image
          src={member.photoUrl}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, 300px"
          className="object-contain"
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

export function MemberCard({
  member,
  lang,
  showRole = true,
}: {
  member: Member;
  lang: Language;
  showRole?: boolean;
}) {
  const rawName = (lang === "ne" ? member.nameNe : member.nameEn)?.trim() || "";
  const name = rawName
    .replace(/श्री\s+गणश\s+ज्ञवाली/g, "श्री गणेश ज्ञवाली")
    .replace(/श्री\s+ज्ञ्याननिष्ठ/g, "श्री ज्ञाननिष्ठ")
    .replace(/\s+/g, " ");

  const rawSecondary = (lang === "ne" ? member.nameEn : member.nameNe)?.trim() || "";
  const secondaryName = rawSecondary
    .replace(/श्री\s+गणश\s+ज्ञवाली/g, "श्री गणेश ज्ञवाली")
    .replace(/श्री\s+ज्ञ्याननिष्ठ/g, "श्री ज्ञाननिष्ठ")
    .replace(/\s+/g, " ");

  const rawRole = (lang === "ne" ? member.roleNe : member.roleEn)?.trim() || "";
  const isAdvisor = member.committeeType === "advisor";
  const isAdvisorRole =
    rawRole === "सल्लाहकार" ||
    rawRole.toLowerCase() === "advisor" ||
    rawRole === "." ||
    rawRole === "।" ||
    rawRole === "-" ||
    rawRole === "_";

  const isPlaceholderRole = !rawRole || rawRole === "." || rawRole === "।" || rawRole === "-" || rawRole === "_";

  // Don't show "सल्लाहकार"; remove the role badge component in that section for advisors or generic advisor roles
  const shouldShowRole = showRole && !isAdvisor && !isAdvisorRole && !isPlaceholderRole;
  const role = rawRole.toLowerCase() === "membar" ? "Member" : rawRole;

  const bio = lang === "ne" ? member.bioNe : member.bioEn;

  return (
    <article
      key={member.id}
      className="rounded-card border border-line bg-surface p-6 flex flex-col justify-between space-y-4 hover:border-accent transition-all group"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-card overflow-hidden border border-line flex-shrink-0 bg-tint">
            <MemberPortrait
              member={member}
              lang={lang}
              sizeClass="w-full h-full"
              textClass="text-2xl"
            />
          </div>
          <div className="space-y-1 min-w-0">
            {shouldShowRole && (
              <span className="inline-block px-2 py-0.5 rounded-chip text-[11px] font-bold bg-accent text-on-accent">
                {role}
              </span>
            )}
            <h3 className="text-base font-bold text-fg leading-snug truncate">
              {name}
            </h3>
            {secondaryName && (
              <div className="text-xs text-accent font-semibold truncate">
                {secondaryName}
              </div>
            )}
          </div>
        </div>

        {bio && (
          <p className="text-xs leading-relaxed text-muted line-clamp-3">
            {bio}
          </p>
        )}
      </div>

      {(member.phone || member.email) && (
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
      )}
    </article>
  );
}
