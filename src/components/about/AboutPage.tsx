"use client";

import React from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DataStatus } from "@/components/DataStatus";
import { ArrowLeft } from "@phosphor-icons/react";
import type { Language } from "@/data/mockData";

/**
 * Shared shell for every page under About Us: site chrome, breadcrumb back to
 * the home page, page heading, and the refresh-failure strip.
 */
export function AboutPage({
  lang,
  setLang,
  titleNe,
  titleEn,
  introNe,
  introEn,
  remote,
  children,
}: {
  lang: Language;
  setLang: (l: Language) => void;
  titleNe: string;
  titleEn: string;
  introNe?: string;
  introEn?: string;
  remote?: { error: boolean; refetch: () => void };
  children: React.ReactNode;
}) {
  const intro = lang === "ne" ? introNe : introEn;

  return (
    <div className="min-h-screen bg-ground text-fg font-sans flex flex-col justify-between selection:bg-accent selection:text-on-accent">
      <SiteHeader lang={lang} setLang={setLang} />
      {remote && <DataStatus error={remote.error} refetch={remote.refetch} lang={lang} />}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-accent transition-colors"
        >
          <ArrowLeft size={14} />
          {lang === "ne" ? "मुख्य पृष्ठमा फर्कनुहोस्" : "Back to home"}
        </Link>

        <header className="space-y-3 border-b border-line pb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-fg leading-tight">
            {lang === "ne" ? titleNe : titleEn}
          </h1>
          {intro && (
            <p className="text-sm sm:text-base leading-relaxed text-muted max-w-[65ch]">{intro}</p>
          )}
        </header>

        {children}
      </main>

      <SiteFooter lang={lang} />
    </div>
  );
}

/** Shown when a page has no content entered in the admin panel yet. */
export function EmptyState({
  lang,
  icon,
  messageNe,
  messageEn,
}: {
  lang: Language;
  icon: React.ReactNode;
  messageNe: string;
  messageEn: string;
}) {
  return (
    <div className="rounded-card border border-dashed border-line bg-surface p-12 text-center space-y-3">
      <div className="flex justify-center text-accent">{icon}</div>
      <p className="text-sm font-semibold text-fg">{lang === "ne" ? messageNe : messageEn}</p>
      <p className="text-xs text-muted">
        {lang === "ne"
          ? "व्यवस्थापन प्यानलबाट सामग्री थप्न सकिन्छ।"
          : "Content can be added from the admin panel."}
      </p>
    </div>
  );
}
