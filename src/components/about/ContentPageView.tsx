"use client";

import React, { useState } from "react";
import { Article } from "@phosphor-icons/react";
import { useRemoteData } from "@/hooks/useRemoteData";
import { AboutPage, EmptyState } from "./AboutPage";
import { getStoredLanguage, type ContentPage, type Language } from "@/data/mockData";

/**
 * A free-text page. The body is stored and rendered as plain text split into
 * paragraphs on blank lines, never as HTML, so nothing an editor types can
 * inject markup into the page.
 */
export function ContentPageView({
  slug,
  fallbackTitleNe,
  fallbackTitleEn,
}: {
  slug: string;
  fallbackTitleNe: string;
  fallbackTitleEn: string;
}) {
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const [pages, setPages] = useState<ContentPage[]>([]);
  const remote = useRemoteData<ContentPage[]>("/api/content-pages", setPages);

  const page = pages.find((p) => p.slug === slug);
  const body = page ? (lang === "ne" ? page.bodyNe : page.bodyEn) : "";
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <AboutPage
      lang={lang}
      setLang={setLang}
      titleNe={page?.titleNe || fallbackTitleNe}
      titleEn={page?.titleEn || fallbackTitleEn}
      remote={remote}
    >
      {remote.loading && paragraphs.length === 0 ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-4 rounded-chip bg-tint animate-pulse" style={{ width: `${90 - i * 12}%` }} />
          ))}
        </div>
      ) : paragraphs.length > 0 ? (
        <article className="space-y-4 max-w-[70ch]">
          {paragraphs.map((paragraph, i) => (
            <p key={i} className="text-sm sm:text-base leading-relaxed text-fg whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </article>
      ) : (
        <EmptyState
          lang={lang}
          icon={<Article size={32} weight="duotone" />}
          messageNe="यस पृष्ठको सामग्री अझै थपिएको छैन।"
          messageEn="Content for this page has not been added yet."
        />
      )}
    </AboutPage>
  );
}
