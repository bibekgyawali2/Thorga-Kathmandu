"use client";

import React from "react";
import Image from "next/image";
import { isValidImageSrc } from "@/lib/validation";
import type { Language, RosterEntry } from "@/data/mockData";

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

/**
 * Photograph and name only. These rosters deliberately carry no role, tenure
 * or contact detail, so the card stays to those two fields.
 */
export function RosterGrid({ entries, lang }: { entries: RosterEntry[]; lang: Language }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
      {entries.map((entry) => {
        const name = lang === "ne" ? entry.nameNe : entry.nameEn;
        return (
          <figure
            key={entry.id}
            className="rounded-card border border-line bg-surface overflow-hidden text-center"
          >
            <div className="relative aspect-[4/5] w-full bg-accent-soft">
              {isValidImageSrc(entry.photoUrl) ? (
                <Image
                  src={entry.photoUrl}
                  alt={name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-accent"
                >
                  {initials(entry.nameEn)}
                </div>
              )}
            </div>
            <figcaption className="p-3">
              <p className="text-sm font-bold text-fg leading-snug">{name}</p>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
