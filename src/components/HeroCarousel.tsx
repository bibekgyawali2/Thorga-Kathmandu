"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import type { Language } from "@/data/mockData";

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
 * Full-bleed institutional hero carousel.
 *
 * Autoplay pauses on hover and on keyboard focus, and never starts at all when
 * the visitor has asked for reduced motion. Slides cross-fade rather than
 * slide, so only opacity animates.
 */
export function HeroCarousel({
  slides,
  lang,
}: {
  slides: HeroSlide[];
  lang: Language;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

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

  return (
    <section
      aria-roledescription="carousel"
      aria-label={lang === "ne" ? "मुख्य तस्बिरहरू" : "Featured photographs"}
      className="relative w-full overflow-hidden bg-tint border-b border-line"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative h-[46vh] min-h-[280px] sm:h-[58vh] lg:h-[68vh] lg:max-h-[640px] w-full">
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
              className="object-cover object-center"
            />
          </div>
        ))}

        {/* Caption scrim, only tall enough to carry the caption text. */}
        {caption && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent pt-16 pb-5">
            <div className="max-w-7xl mx-auto px-14 sm:px-16 lg:px-20">
              <p className="text-white text-sm sm:text-base font-semibold drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                {caption}
              </p>
            </div>
          </div>
        )}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={previous}
              aria-label={lang === "ne" ? "अघिल्लो तस्बिर" : "Previous photograph"}
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/85 hover:bg-white text-fg flex items-center justify-center shadow-lg transition-colors"
            >
              <CaretLeft size={20} weight="bold" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label={lang === "ne" ? "अर्को तस्बिर" : "Next photograph"}
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/85 hover:bg-white text-fg flex items-center justify-center shadow-lg transition-colors"
            >
              <CaretRight size={20} weight="bold" />
            </button>

            <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={
                    lang === "ne" ? `तस्बिर ${i + 1} मा जानुहोस्` : `Go to photograph ${i + 1}`
                  }
                  aria-current={i === index}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? "w-6 bg-white" : "w-2 bg-white/55 hover:bg-white/80"
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
