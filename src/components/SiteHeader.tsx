"use client";

import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
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
  CaretDown,
} from "@phosphor-icons/react";

export interface NavLink {
  href: string;
  ne: string;
  en: string;
  /** Present when the item opens a dropdown instead of navigating directly. */
  children?: { href: string; ne: string; en: string }[];
}

export const ABOUT_LINKS = [
  { href: "/about/organisation", ne: "संस्था परिचय", en: "Organisation Profile" },
  { href: "/about/thorga", ne: "थोर्गाको परिचय", en: "About Thorga" },
  { href: "/committee", ne: "हाम्रो नेतृत्व", en: "Our Leadership" },
  { href: "/about/advisors", ne: "वर्तमान सल्लाहकारहरू", en: "Current Advisors" },
  { href: "/about/former-office-bearers", ne: "हालसम्मका पदाधिकारीहरू", en: "Former Office Bearers" },
  { href: "/about/former-advisors", ne: "हालसम्मका सल्लाहकारहरू", en: "Former Advisors" },
  { href: "/about/statute", ne: "संस्थाको विधान", en: "Organisation Statute" },
  { href: "/about/life-members", ne: "आजीवन सदस्यहरू", en: "Life Members" },
  { href: "/about/certificates", ne: "दर्ता प्रमाणपत्रहरू", en: "Registration Certificates" },
];

export const PUBLICATION_LINKS = [
  { href: "/publications", ne: "सबै प्रकाशन", en: "All Publications" },
  { href: "/publications/souvenir", ne: "स्मारिका", en: "Souvenir" },
  { href: "/publications/bulletin", ne: "बुलेटिन", en: "Bulletin" },
  { href: "/publications/calendar", ne: "क्यालेण्डर", en: "Calendar" },
  { href: "/publications/phone-directory", ne: "फोन डायरी", en: "Phone Directory" },
  { href: "/publications/other", ne: "अन्य", en: "Other" },
];

export const NAV_LINKS: NavLink[] = [
  { href: "/", ne: "गृहपृष्ठ", en: "Home" },
  { href: "/about/organisation", ne: "हाम्रो बारेमा", en: "About Us", children: ABOUT_LINKS },
  {
    href: "/publications",
    ne: "संस्थाका प्रकाशनहरू",
    en: "Sansthaka Prakashanharu",
    children: PUBLICATION_LINKS,
  },
  {
    href: "/publications/thorga-sambandhi-anya-prakashan",
    ne: "थोर्गा सम्बन्धी अन्य प्रकाशन",
    en: "Thorga Sambandhi Anya Prakashan",
  },
  { href: "/events", ne: "गतिविधिहरू", en: "Activities" },
  { href: "/gallery", ne: "तस्बिरहरू", en: "Gallery" },
  { href: "/#contact", ne: "सम्पर्क", en: "Contact" },
];

function subscribeTheme(callback: () => void) {
  if (typeof document === "undefined") return () => { };
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


/**
 * Desktop dropdown for a nav item that has children. Opens on click, closes on
 * Escape, on outside click, and after a child link is followed.
 */
function NavDropdown({
  link,
  lang,
  pathname,
}: {
  link: NavLink;
  lang: Language;
  pathname: string;
}) {
  // The pathname the menu was opened on. Comparing it against the current
  // pathname closes the menu after navigation without setting state in an
  // effect, which would cascade an extra render.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const setOpen = useCallback(
    (next: boolean) => setOpenedOn(next ? pathname : null),
    [pathname]
  );
  const container = useRef<HTMLDivElement>(null);

  const sectionActive = (link.children ?? []).some((child) => pathname === child.href);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (container.current && !container.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`px-3 py-2 rounded-control text-[15px] font-semibold transition-colors flex items-center gap-1.5 ${sectionActive || open
            ? "bg-on-nav/15 text-on-nav"
            : "text-on-nav/85 hover:bg-on-nav/10 hover:text-on-nav"
          }`}
      >
        {lang === "ne" ? link.ne : link.en}
        <CaretDown
          size={12}
          weight="bold"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-80 rounded-card border border-line bg-surface shadow-e2 py-2">
          {(link.children ?? []).map((child) => {
            const active = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={() => setOpen(false)}
                className={`block px-4 py-2 text-sm font-medium transition-colors ${active
                    ? "bg-accent-soft text-accent font-semibold"
                    : "text-fg hover:bg-tint hover:text-accent"
                  }`}
              >
                {lang === "ne" ? child.ne : child.en}
              </Link>
            );
          })}
        </div>
      )}
    </div>
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

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
          <div className="flex items-center justify-between gap-3 sm:gap-6">
            {/* Left Logo slot */}
            <Link href="/" className="flex-shrink-0" aria-label={lang === "ne" ? "गृहपृष्ठ" : "Home"}>
              <div className="w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-surface border-2 border-accent/25 flex items-center justify-center overflow-hidden shadow-e1 p-1">
                {branding.logoUrl ? (
                  <Image
                    src={branding.logoUrl}
                    alt={lang === "ne" ? "संस्थाको छाप" : "Organisation emblem"}
                    width={112}
                    height={112}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Buildings size={40} weight="duotone" className="text-accent" />
                )}
              </div>
            </Link>

            {/* Name, motto and date */}
            <div className="flex-1 min-w-0 text-center px-1 sm:px-2 flex flex-col items-center justify-center space-y-1">
              <Link href="/" className="block group">
                <div className="text-lg sm:text-2xl lg:text-[1.75rem] font-extrabold tracking-tight text-fg leading-tight group-hover:text-accent transition-colors">
                  {lang === "ne"
                    ? "थोर्गा काठमाडौं सम्पर्क तथा विकास मञ्च"
                    : "Thorga Kathmandu Liaison and Development Forum"}
                </div>
              </Link>
              {/* Date line with small gap directly under title */}
              <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 text-[11px] sm:text-xs font-medium text-muted/90 pt-0.5">
                {lang === "ne" && bsDate && <span>{bsDate}</span>}
                {lang === "ne" && bsDate && adDate && (
                  <span aria-hidden="true" className="text-line">
                    |
                  </span>
                )}
                {adDate && <span>{adDate}</span>}
              </div>
            </div>

            {/* Right Logo slot */}
            <div className="flex-shrink-0 flex w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-surface border-2 border-accent/25 items-center justify-center overflow-hidden shadow-e1 p-1">
              {branding.logoUrl ? (
                <Image
                  src={branding.logoUrl}
                  alt={lang === "ne" ? "संस्थाको छाप" : "Organisation emblem"}
                  width={112}
                  height={112}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Buildings size={40} weight="duotone" className="text-accent" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Band 2: primary navigation */}
      <header className="sticky top-0 z-40 bg-nav text-on-nav shadow-e2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 min-h-[46px]">
          <nav className="hidden xl:flex items-center gap-1 py-1">
            {NAV_LINKS.map((link) => {
              if (link.children) {
                return (
                  <NavDropdown key={link.href} link={link} lang={lang} pathname={pathname} />
                );
              }
              // In-page anchors such as /#contact live on the home page, so a
              // naive path comparison lit them up alongside the real Home item.
              // Only whole-page routes take the active state.
              const isActive = !link.href.includes("#") && pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-control text-[15px] font-semibold transition-colors ${isActive
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
            {/* Language toggle commented out temporarily */}
            {/* <div className="hidden sm:inline-flex rounded-control bg-on-nav/10 p-0.5">
              <button
                type="button"
                onClick={() => handleLangChange("ne")}
                aria-pressed={lang === "ne"}
                className={`px-2.5 py-1 text-xs font-semibold rounded-chip transition-colors ${lang === "ne" ? "bg-on-nav text-nav" : "text-on-nav/80 hover:text-on-nav"
                  }`}
              >
                नेपाली
              </button>
              <button
                type="button"
                onClick={() => handleLangChange("en")}
                aria-pressed={lang === "en"}
                className={`px-2.5 py-1 text-xs font-semibold rounded-chip transition-colors ${lang === "en" ? "bg-on-nav text-nav" : "text-on-nav/80 hover:text-on-nav"
                  }`}
              >
                EN
              </button>
            </div> */}

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
            {NAV_LINKS.map((link) =>
              link.children ? (
                <div key={link.href} className="py-1">
                  <p className="px-3 py-1.5 text-[13px] font-bold text-on-nav/60">
                    {lang === "ne" ? link.ne : link.en}
                  </p>
                  {link.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 pl-6 pr-3 rounded-control text-[14px] font-medium text-on-nav/90 hover:bg-on-nav/10 hover:text-on-nav transition-colors"
                    >
                      {lang === "ne" ? child.ne : child.en}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 px-3 rounded-control text-[15px] font-semibold text-on-nav/90 hover:bg-on-nav/10 hover:text-on-nav transition-colors"
                >
                  {lang === "ne" ? link.ne : link.en}
                </Link>
              )
            )}

            <div className="pt-2 mt-2 border-t border-on-nav/15 flex items-center justify-end gap-3">
              {/* Language toggle commented out temporarily */}
              {/* <div className="inline-flex rounded-control bg-on-nav/10 p-0.5 sm:hidden">
                <button
                  type="button"
                  onClick={() => handleLangChange("ne")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-chip ${lang === "ne" ? "bg-on-nav text-nav" : "text-on-nav/80"
                    }`}
                >
                  नेपाली
                </button>
                <button
                  type="button"
                  onClick={() => handleLangChange("en")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-chip ${lang === "en" ? "bg-on-nav text-nav" : "text-on-nav/80"
                    }`}
                >
                  EN
                </button>
              </div> */}
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
