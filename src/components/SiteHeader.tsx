"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Language,
  saveStoredLanguage,
  subscribeBranding,
  getStoredBrandingSnapshot,
  getServerBrandingSnapshot,
} from "@/data/mockData";
import { formatBikramSambat, formatGregorian } from "@/lib/nepaliDate";
import {
  Buildings,
  SlidersHorizontal,
  Sun,
  Moon,
  List,
  X,
  ShieldCheck,
} from "@phosphor-icons/react";

export const NAV_LINKS = [
  { href: "/", ne: "गृहपृष्ठ", en: "Home" },
  { href: "/#about", ne: "हाम्रो बारेमा", en: "About Us" },
  { href: "/committee", ne: "कार्यसमिति", en: "Committee" },
  { href: "/past-leaders", ne: "पूर्व नेतृत्व", en: "Past Leaders" },
  { href: "/events", ne: "कार्यक्रम", en: "Events" },
  { href: "/publications", ne: "प्रकाशन", en: "Publications" },
  { href: "/gallery", ne: "तस्बिरहरू", en: "Gallery" },
  { href: "/#contact", ne: "सम्पर्क", en: "Contact" },
];

function subscribeTheme(callback: () => void) {
  if (typeof document === "undefined") return () => {};
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getThemeSnapshot(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return (document.documentElement.dataset.theme as "light" | "dark") || "light";
}

function getServerThemeSnapshot(): "light" | "dark" {
  return "light";
}

function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
}

function getDateSnapshot(): string {
  return todayKey();
}

/** The server cannot know the visitor's local date, so it renders no date. */
function getServerDateSnapshot(): string | null {
  return null;
}

function subscribeDate(onChange: () => void) {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 500);
  const timer = setTimeout(onChange, midnight.getTime() - now.getTime());
  return () => clearTimeout(timer);
}

/**
 * Temple skyline behind the identity band. Decorative only, so it is hidden
 * from assistive technology and sits under the content at low opacity.
 */
function SkylineWatermark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      className="absolute inset-x-0 bottom-0 h-16 sm:h-20 w-full text-accent opacity-[0.13] pointer-events-none"
      fill="currentColor"
    >
      <path d="M0 120V96h34l10-14 10 14h26V78l18-12 18 12v18h30l14-20 14 20h28V72l22-14 22 14v24h26l12-18 12 18h32V84l16-12 16 12v12h30l14-22 14 22h26V70l20-13 20 13v26h28l12-16 12 16h30V80l18-13 18 13v16h28l14-20 14 20h26V74l22-14 22 14v22h26l12-18 12 18h32V82l16-12 16 12v14h30l14-20 14 20h26V76l20-13 20 13v20h28l12-16 12 16h30V86l18-12 18 12v10h28l14-18 14 18h26V120z" />
    </svg>
  );
}

export function SiteHeader({
  lang,
  setLang,
}: {
  lang: Language;
  setLang: (l: Language) => void;
}) {
  const pathname = usePathname();
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
  const branding = useSyncExternalStore(
    subscribeBranding,
    getStoredBrandingSnapshot,
    getServerBrandingSnapshot
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dateKey = useSyncExternalStore(subscribeDate, getDateSnapshot, getServerDateSnapshot);

  const today = dateKey
    ? (() => {
        const [y, m, d] = dateKey.split("-").map(Number);
        return new Date(y, m, d);
      })()
    : null;

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem("thorga-theme", next);
      } catch {
        // Storage blocked. The toggle still applies for this visit.
      }
    }
  };

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    saveStoredLanguage(newLang);
  };

  const bsDate = today ? formatBikramSambat(today) : null;
  const adDate = today ? formatGregorian(today) : null;

  return (
    <>
      {/* Band 1: institutional identity */}
      <div className="relative bg-tint border-b border-line overflow-hidden">
        <SkylineWatermark />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-3">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            {/* National emblem slot */}
            <Link href="/" className="flex-shrink-0" aria-label={lang === "ne" ? "गृहपृष्ठ" : "Home"}>
              <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-surface border-2 border-accent/25 flex items-center justify-center overflow-hidden shadow-sm">
                {branding.logoUrl ? (
                  <Image
                    src={branding.logoUrl}
                    alt={lang === "ne" ? "संस्थाको छाप" : "Organisation emblem"}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Buildings size={34} weight="duotone" className="text-accent" />
                )}
              </div>
            </Link>

            {/* Name and motto */}
            <div className="flex-1 min-w-0 text-center px-1">
              <Link href="/" className="block group">
                <div className="text-lg sm:text-2xl lg:text-[2rem] font-extrabold tracking-tight text-fg leading-tight group-hover:text-accent transition-colors">
                  {lang === "ne"
                    ? "थोर्गा काठमाडौं सम्पर्क तथा विकास मञ्च"
                    : "Thorga Kathmandu Liaison and Development Forum"}
                </div>
              </Link>
              <p className="mt-1 text-xs sm:text-sm text-muted font-medium">
                {lang === "ne"
                  ? "“गाउँ र सहरबीचको सेतु, समुदायको साझा प्रयास”"
                  : "“A bridge between the village and the city”"}
              </p>
            </div>

            {/* Registration seal */}
            <div className="flex-shrink-0 hidden sm:flex w-20 h-20 rounded-full border-2 border-accent/30 bg-surface flex-col items-center justify-center text-center shadow-sm">
              <ShieldCheck size={18} weight="duotone" className="text-accent" />
              <span className="text-[7px] sm:text-[9px] font-bold text-fg leading-tight mt-0.5">
                {lang === "ne" ? "दर्ता नं." : "REGD."}
              </span>
              <span className="text-[8px] sm:text-[10px] font-bold text-accent leading-none font-mono">
                {lang === "ne" ? "४१२/०५८" : "412/058"}
              </span>
            </div>
          </div>

          {/* Date line */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] sm:text-[13px] font-medium text-muted">
            {lang === "ne" && bsDate && <span>{bsDate}</span>}
            {lang === "ne" && bsDate && adDate && (
              <span aria-hidden="true" className="text-line">
                |
              </span>
            )}
            {adDate && <span>{adDate}</span>}
          </div>
        </div>
      </div>

      {/* Band 2: primary navigation */}
      <header className="sticky top-0 z-40 bg-nav text-on-nav shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 min-h-[52px]">
          <nav className="hidden xl:flex items-center gap-1 py-1.5">
            {NAV_LINKS.map((link) => {
              // In-page anchors such as /#about live on the home page, so a naive
              // path comparison lit them up alongside the real Home item. Only
              // whole-page routes take the active state.
              const isActive = !link.href.includes("#") && pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-control text-[15px] font-semibold transition-colors ${
                    isActive
                      ? "bg-on-nav/15 text-on-nav"
                      : "text-on-nav/85 hover:bg-on-nav/10 hover:text-on-nav"
                  }`}
                >
                  {lang === "ne" ? link.ne : link.en}
                </Link>
              );
            })}
          </nav>

          {/* Brand strip shown once the identity band has scrolled away */}
          <Link
            href="/"
            className="xl:hidden flex items-center gap-2 py-2 min-w-0 flex-1 text-on-nav font-bold text-sm"
          >
            <Buildings size={20} weight="duotone" className="flex-shrink-0" />
            <span className="truncate">
              {lang === "ne" ? "थोर्गा काठमाडौं मञ्च" : "Thorga Kathmandu Forum"}
            </span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <div className="hidden sm:inline-flex rounded-control bg-on-nav/10 p-0.5">
              <button
                type="button"
                onClick={() => handleLangChange("ne")}
                aria-pressed={lang === "ne"}
                className={`px-2.5 py-1 text-xs font-semibold rounded-chip transition-colors ${
                  lang === "ne" ? "bg-on-nav text-nav" : "text-on-nav/80 hover:text-on-nav"
                }`}
              >
                नेपाली
              </button>
              <button
                type="button"
                onClick={() => handleLangChange("en")}
                aria-pressed={lang === "en"}
                className={`px-2.5 py-1 text-xs font-semibold rounded-chip transition-colors ${
                  lang === "en" ? "bg-on-nav text-nav" : "text-on-nav/80 hover:text-on-nav"
                }`}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? lang === "ne"
                    ? "उज्यालो थिम"
                    : "Switch to light theme"
                  : lang === "ne"
                  ? "अँध्यारो थिम"
                  : "Switch to dark theme"
              }
              className="p-2 rounded-control text-on-nav/85 hover:bg-on-nav/10 hover:text-on-nav transition-colors"
            >
              {theme === "dark" ? <Sun size={17} weight="bold" /> : <Moon size={17} weight="bold" />}
            </button>

            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-on-nav/10 hover:bg-on-nav/20 text-on-nav text-xs font-semibold transition-colors"
            >
              <SlidersHorizontal size={13} />
              <span>{lang === "ne" ? "व्यवस्थापन" : "Admin"}</span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="primary-mobile-nav"
              aria-label={lang === "ne" ? "मेनु" : "Menu"}
              className="xl:hidden p-2 rounded-control text-on-nav hover:bg-on-nav/10 transition-colors"
            >
              {mobileMenuOpen ? <X size={22} /> : <List size={22} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div
            id="primary-mobile-nav"
            className="xl:hidden border-t border-on-nav/15 bg-nav px-4 py-3 space-y-1"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 px-3 rounded-control text-[15px] font-semibold text-on-nav/90 hover:bg-on-nav/10 hover:text-on-nav transition-colors"
              >
                {lang === "ne" ? link.ne : link.en}
              </Link>
            ))}

            <div className="pt-2 mt-2 border-t border-on-nav/15 flex items-center justify-between gap-3">
              <div className="inline-flex rounded-control bg-on-nav/10 p-0.5 sm:hidden">
                <button
                  type="button"
                  onClick={() => handleLangChange("ne")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-chip ${
                    lang === "ne" ? "bg-on-nav text-nav" : "text-on-nav/80"
                  }`}
                >
                  नेपाली
                </button>
                <button
                  type="button"
                  onClick={() => handleLangChange("en")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-chip ${
                    lang === "en" ? "bg-on-nav text-nav" : "text-on-nav/80"
                  }`}
                >
                  EN
                </button>
              </div>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 px-3 rounded-control text-sm font-semibold text-on-nav hover:bg-on-nav/10"
              >
                <SlidersHorizontal size={15} />
                <span>{lang === "ne" ? "व्यवस्थापन प्यानल" : "Admin Portal"}</span>
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
