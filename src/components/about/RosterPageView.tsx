"use client";

import React, { useState } from "react";
import { Users } from "@phosphor-icons/react";
import { useRemoteData } from "@/hooks/useRemoteData";
import { AboutPage, EmptyState } from "./AboutPage";
import { RosterGrid } from "./RosterGrid";
import { getStoredLanguage, type Language, type RosterEntry } from "@/data/mockData";

export function RosterPageView({
  kind,
  titleNe,
  titleEn,
  introNe,
  introEn,
}: {
  kind: RosterEntry["kind"];
  titleNe: string;
  titleEn: string;
  introNe: string;
  introEn: string;
}) {
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const [entries, setEntries] = useState<RosterEntry[]>([]);
  const remote = useRemoteData<RosterEntry[]>("/api/roster", setEntries);

  const visible = entries.filter((e) => e.kind === kind);

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-card border border-line bg-surface overflow-hidden">
              <div className="aspect-[4/5] w-full bg-tint animate-pulse" />
              <div className="p-3">
                <div className="h-3 w-3/4 mx-auto rounded-chip bg-tint animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : visible.length > 0 ? (
        <RosterGrid entries={visible} lang={lang} />
      ) : (
        <EmptyState
          lang={lang}
          icon={<Users size={32} weight="duotone" />}
          messageNe="यस सूचीमा अझै कुनै नाम थपिएको छैन।"
          messageEn="No names have been added to this list yet."
        />
      )}
    </AboutPage>
  );
}
