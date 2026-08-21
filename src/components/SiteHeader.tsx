"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Language, saveStoredLanguage } from "@/data/mockData";
import {
  Buildings,
  SlidersHorizontal,
  Sun,
  Moon,
  List,
  X,
  Phone,
  EnvelopeSimple,
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

export function SiteHeader({
  lang,
  setLang,
}: {
  lang: Language;
  setLang: (l: Language) => void;
}) {
  const pathname = usePathname();
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem("thorga-theme", next);
      } catch {}
    }
  };

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    saveStoredLanguage(newLang);
  };

  return (
    <>
      {/* Top Utility Bar */}
      <div className="bg-tint border-b border-line text-xs sm:text-sm py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="font-medium text-fg text-xs sm:text-[13px]">
              {lang === "ne"
                ? "गुल्मी र काठमाडौँ सम्पर्क सञ्जाल"
                : "Gulmi and Kathmandu Liaison Network"}
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-muted text-xs">
            <a href="tel:+97714481234" className="flex items-center gap-1 hover:text-accent transition-colors font-mono">
              <Phone size={13} className="text-accent" /> +977 01-4481234
            </a>
            <a href="mailto:info@thorgaktm.org.np" className="hidden md:flex items-center gap-1 hover:text-accent transition-colors">
              <EnvelopeSimple size={13} className="text-accent" /> info@thorgaktm.org.np
            </a>

            {/* Small Compact Admin Panel Button at Top */}
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-chip border border-line bg-surface hover:border-accent hover:text-accent text-[11px] font-semibold text-fg transition-colors"
            >
              <SlidersHorizontal size={12} className="text-accent" />
              <span>{lang === "ne" ? "व्यवस्थापन" : "Admin"}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Nav Header */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-card bg-accent text-on-accent flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
              <Buildings size={24} weight="duotone" />
            </div>
            <div className="text-lg sm:text-xl font-bold tracking-tight text-fg leading-tight">
              {lang === "ne" ? "थोर्गा काठमाडौं सम्पर्क तथा विकास मञ्च" : "Thorga Kathmandu Liaison Forum"}
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center gap-5 xl:gap-6 text-[15px] xl:text-[16px] font-semibold text-fg/80">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`py-1 hover:text-accent transition-colors ${
                    isActive ? "text-accent font-bold border-b-2 border-accent" : ""
                  }`}
                >
                  {lang === "ne" ? link.ne : link.en}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Light and Dark Mode"
              className="p-2 rounded-control border border-line bg-surface text-fg hover:bg-tint transition-colors"
            >
              {theme === "dark" ? <Sun size={17} weight="bold" /> : <Moon size={17} weight="bold" />}
            </button>

            {/* Language Switcher */}
            <div className="inline-flex rounded-control border border-line p-0.5 bg-surface">
              <button
                type="button"
                onClick={() => handleLangChange("ne")}
                className={`px-2.5 py-1 text-xs sm:text-sm font-semibold rounded-chip transition-all ${
                  lang === "ne" ? "bg-accent text-on-accent shadow-sm" : "text-muted hover:text-fg"
                }`}
              >
                नेपाली
              </button>
              <button
                type="button"
                onClick={() => handleLangChange("en")}
                className={`px-2.5 py-1 text-xs sm:text-sm font-semibold rounded-chip transition-all ${
                  lang === "en" ? "bg-accent text-on-accent shadow-sm" : "text-muted hover:text-fg"
                }`}
              >
                EN
              </button>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-control border border-line bg-surface text-fg hover:bg-tint transition-colors"
              aria-label="Open Mobile Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <List size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-line bg-surface px-4 py-4 space-y-2 shadow-lg">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 px-3 rounded-control text-base font-semibold text-fg hover:bg-tint transition-colors"
              >
                {lang === "ne" ? link.ne : link.en}
              </Link>
            ))}
            <div className="pt-2 border-t border-line">
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2.5 px-3 rounded-control text-base font-semibold text-accent hover:bg-tint"
              >
                <SlidersHorizontal size={16} />
                <span>{lang === "ne" ? "व्यवस्थापन प्यानल" : "Admin Portal"}</span>
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
