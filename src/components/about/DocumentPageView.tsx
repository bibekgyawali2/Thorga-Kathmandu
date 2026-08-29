"use client";

import React, { useState } from "react";
import { FileText } from "@phosphor-icons/react";
import { useRemoteData } from "@/hooks/useRemoteData";
import { AboutPage, EmptyState } from "./AboutPage";
import { DocumentViewer } from "@/components/DocumentViewer";
import { getStoredLanguage, type Language, type PageDocument } from "@/data/mockData";

export function DocumentPageView({
  slug,
  titleNe,
  titleEn,
  introNe,
  introEn,
}: {
  slug: PageDocument["slug"];
  titleNe: string;
  titleEn: string;
  introNe: string;
  introEn: string;
}) {
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const [documents, setDocuments] = useState<PageDocument[]>([]);
  const remote = useRemoteData<PageDocument[]>("/api/documents", setDocuments);

  const visible = documents.filter((d) => d.slug === slug);

  return (
    <AboutPage
      lang={lang}
      setLang={setLang}
      titleNe={titleNe}
      titleEn={titleEn}
      introNe={introNe}
      introEn={introEn}
      remote={remote}
    >
      {remote.loading && visible.length === 0 ? (
        <div className="rounded-card border border-line bg-surface h-[60vh] animate-pulse" aria-busy="true" />
      ) : visible.length > 0 ? (
        <div className="space-y-10">
          {visible.map((doc) => (
            <DocumentViewer key={doc.id} document={doc} lang={lang} />
          ))}
        </div>
      ) : (
        <EmptyState
          lang={lang}
          icon={<FileText size={32} weight="duotone" />}
          messageNe="यस पृष्ठमा अझै कुनै कागजात राखिएको छैन।"
          messageEn="No document has been attached to this page yet."
        />
      )}
    </AboutPage>
  );
}
