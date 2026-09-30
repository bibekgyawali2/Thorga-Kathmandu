"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import type { ContentPage, HeroContent, Language } from "@/data/mockData";

export interface HeroSlide {
  id: string;
  imageUrl: string;
  titleNe: string;
  titleEn: string;
  captionNe?: string;
  captionEn?: string;
}

const AUTOPLAY_MS = 6500;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Extracts cleanly truncated introductory sentences (~240-340 chars)
 * ending at a sentence terminator (। or .).
 */
function extractIntro(text: string, maxLen = 290): string {
  if (!text) return "";
  const cleaned = text.trim();
  if (cleaned.length <= maxLen) return cleaned;

  let lastEnd = -1;
  for (let i = 0; i < Math.min(cleaned.length, maxLen + 60); i++) {
    if (cleaned[i] === "।" || cleaned[i] === ".") {
      lastEnd = i;
    }
  }

  if (lastEnd > 150) {
    return cleaned.slice(0, lastEnd + 1).trim();
  }
  return cleaned.slice(0, maxLen).trim() + "...";
}

/**
 * Full-bleed institutional hero banner with carousel background
 * and introduction excerpt from संस्था परिचय (Organisation Profile).
 */
export function HeroCarousel({
  slides,
  lang,
  heroContent,
  organisationPage,
}: {
  slides: HeroSlide[];
  lang: Language;
  heroContent?: HeroContent;
  organisationPage?: ContentPage;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // If organisationPage is not passed from parent, fetch it directly
  const [internalPage, setInternalPage] = useState<ContentPage | null>(null);

  useEffect(() => {
    if (organisationPage) return;
    let active = true;
    fetch("/api/content-pages")
      .then((res) => (res.ok ? res.json() : []))
      .then((pages: ContentPage[]) => {
        if (!active) return;
        const org = pages.find((p) => p.slug === "organisation");
        if (org) setInternalPage(org);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [organisationPage]);

  const activePage = organisationPage || internalPage;

  const count = slides.length;

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  const next = useCallback(() => go(index + 1), [go, index]);
  const previous = useCallback(() => go(index - 1), [go, index]);

  useEffect(() => {
    if (count <= 1 || paused || prefersReducedMotion()) return;

    timer.current = setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, AUTOPLAY_MS);

    return () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
  }, [count, paused]);

  if (count === 0) return null;

  const active = slides[index];
  const caption = lang === "ne" ? active.captionNe : active.captionEn;

  const defaultBadgeNe = "संस्था परिचय • वि.सं. २०६६";
  const defaultBadgeEn = "About Organisation • Estd. 2009";

  const defaultTitleNe = "थोर्गा-काठमाडौं सम्पर्क तथा विकास मञ्च";
  const defaultTitleEn = "Thorga-Kathmandu Liaison & Development Forum";

  const defaultIntroNe =
    "अवसरको खोजीमा आफ्‌नो जन्मभूमि छोडेर बाहिर गई बस्न वाध्य हरेक मानिसहरूमा आफ्‌नो गाउँ, टोल, छरछिमेकका बन्धुवान्धबहरू प्रति ठूलो आकर्षण र प्रेम हुन्छ । बसाइँ सरेर मानिस जहाँ गए पनि आफ्‌ना संस्कृति, परम्परा, रीतिरिवाज ऊसँगै जान्छन् । उसको हृदयमा आफू जन्मेको, हुर्केको, कखरा सिकेको जन्मभूमि प्रतिको अगाध माया छचल्किएर आउँछ नै ।";
  const defaultIntroEn =
    "Every person who leaves their birthplace in search of opportunities carries an immense bond and affection for their village, neighborhood, and kin. Wherever one migrates, our heritage, customs, and deep love for our native land remain deeply etched in our hearts.";

  const badge =
    lang === "ne"
      ? heroContent?.badgeNe || defaultBadgeNe
      : heroContent?.badgeEn || defaultBadgeEn;

  const title =
    lang === "ne"
      ? heroContent?.titleNe || defaultTitleNe
      : heroContent?.titleEn || defaultTitleEn;

  // Prefer live organisation page content, fallback to default organisation intro
  const rawIntro =
    lang === "ne"
      ? activePage?.bodyNe || defaultIntroNe
      : activePage?.bodyEn || defaultIntroEn;

  const introText = extractIntro(rawIntro, 290);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={lang === "ne" ? "मुख्य ब्यानर तथा संस्था परिचय" : "Hero Banner & Organisation Profile"}
      className="relative w-full overflow-hidden bg-tint border-b border-line"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative min-h-[460px] sm:min-h-[500px] lg:min-h-[540px] lg:h-[72vh] lg:max-h-[660px] w-full flex items-center">
        {/* Background Rotating Slides */}
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            aria-hidden={i !== index}
            className="absolute inset-0 transition-opacity duration-700 ease-out"
            style={{ opacity: i === index ? 1 : 0 }}
          >
            <Image
              src={slide.imageUrl}
              alt={lang === "ne" ? slide.titleNe : slide.titleEn}
              fill
              sizes="100vw"
              priority={i === 0}
              className="object-cover object-center scale-[1.02]"
            />
          </div>
        ))}

        {/* Transparent overlay pinned to bottom with bottom padding */}
        <div className="absolute inset-x-0 bottom-0 z-10 w-full pointer-events-none pb-8 sm:pb-10 md:pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl sm:max-w-3xl pointer-events-auto space-y-2.5 sm:space-y-3">
              {/* Main Headline */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                {title}
              </h1>

              {/* Introduction paragraph directly from संस्था परिचय ending with continue reading link */}
              <p className="text-xs sm:text-sm md:text-base text-white/95 leading-relaxed font-normal drop-shadow-[0_1px_6px_rgba(0,0,0,0.95)] max-w-3xl">
                {introText}{" "}
                <Link
                  href="/about/organisation"
                  className="inline-flex items-center gap-1 font-semibold text-amber-300 hover:text-amber-200 underline decoration-amber-300/80 underline-offset-4 transition-colors cursor-pointer ml-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]"
                >
                  <span>{lang === "ne" ? "थप पढ्नुहोस् »" : "Continue reading »"}</span>
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Slide Photo Caption at bottom-right with frosted chip */}
        {caption && (
          <div className="absolute right-4 sm:right-6 bottom-3 sm:bottom-4 z-10 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white/80 text-[11px] font-medium max-w-xs truncate pointer-events-none">
            <span className="text-amber-300">📷</span>
            <span className="truncate">{caption}</span>
          </div>
        )}

        {/* Carousel Controls */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={previous}
              aria-label={lang === "ne" ? "अघिल्लो तस्बिर" : "Previous photograph"}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center backdrop-blur-sm shadow-e2 transition-colors cursor-pointer"
            >
              <CaretLeft size={20} weight="bold" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label={lang === "ne" ? "अर्को तस्बिर" : "Next photograph"}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center backdrop-blur-sm shadow-e2 transition-colors cursor-pointer"
            >
              <CaretRight size={20} weight="bold" />
            </button>

            <div className="absolute bottom-3 sm:bottom-4 inset-x-0 z-20 flex items-center justify-center gap-2">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={
                    lang === "ne" ? `तस्बिर ${i + 1} मा जानुहोस्` : `Go to photograph ${i + 1}`
                  }
                  aria-current={i === index}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    i === index ? "w-6 bg-accent" : "w-2 bg-white/55 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
