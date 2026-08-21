"use client";

import React, { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  Member,
  EventItem,
  Publication,
  GalleryItem,
  Language,
  initialMembers,
  initialEvents,
  initialPublications,
  initialGallery,
} from "@/data/mockData";
import {
  Users,
  BookOpen,
  Calendar,
  Phone,
  FileText,
  Download,
  Eye,
  CheckCircle,
  Globe,
  Upload,
  X,
  Buildings,
  GraduationCap,
  Heart,
  Tree,
  MapPin,
  EnvelopeSimple,
  ShieldCheck,
  Clock,
  SlidersHorizontal,
  Sun,
  Moon,
  List,
} from "@phosphor-icons/react";

// Admin surfaces are code-split so the management UI never ships to a
// visitor who only reads the public page.
const AdminPanel = dynamic(() => import("./AdminPanel"), { ssr: false });

/*
  PHOTOGRAPHY TODO
  The committee and past-leadership portraits in mockData.ts are Unsplash
  stock faces attached to named officers. Any photoUrl still pointing at
  images.unsplash.com renders as a monogram instead, because a stock
  stranger under a real person's name and phone number damages the
  organisation's credibility. Replace with real photographs at:
    - 6 current committee members, 4:5 portrait, min 600x750
    - 1 advisor, same crop
    - 2 past presidents, same crop
  Once a real URL is set (Cloudinary or otherwise) the photo renders
  automatically with no code change.
*/

const NAV_ITEMS: { href: string; ne: string; en: string }[] = [
  { href: "#about", ne: "हाम्रो बारेमा", en: "About" },
  { href: "#members", ne: "कार्यसमिति", en: "Committee" },
  { href: "#past-members", ne: "पूर्व नेतृत्व", en: "Past Leaders" },
  { href: "#events", ne: "कार्यक्रम", en: "Events" },
  { href: "#publications", ne: "प्रकाशन", en: "Publications" },
  { href: "#gallery", ne: "तस्बिरहरू", en: "Gallery" },
  { href: "#contact", ne: "सम्पर्क", en: "Contact" },
];

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

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function readTheme(): "light" | "dark" {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function readServerTheme(): "light" | "dark" {
  return "light";
}

function hasRealPhoto(url?: string) {
  return Boolean(url) && !url!.includes("images.unsplash.com");
}

function Portrait({
  member,
  lang,
  sizeClass,
  textClass,
}: {
  member: Member;
  lang: Language;
  sizeClass: string;
  textClass: string;
}) {
  const name = lang === "ne" ? member.nameNe : member.nameEn;

  if (hasRealPhoto(member.photoUrl)) {
    return (
      <div className={`relative overflow-hidden bg-tint ${sizeClass}`}>
        <Image src={member.photoUrl} alt={name} fill className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`bg-accent-soft text-accent flex items-center justify-center font-bold ${sizeClass} ${textClass}`}
      aria-hidden="true"
    >
      {initials(member.nameEn)}
    </div>
  );
}

export default function MainPortal() {
  const [lang, setLang] = useState<Language>("ne");
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [publications, setPublications] = useState<Publication[]>(initialPublications);
  const [gallery] = useState<GalleryItem[]>(initialGallery);

  const [memberFilter, setMemberFilter] = useState<"all" | "current" | "past" | "advisor">("current");
  const [eventFilter, setEventFilter] = useState<"upcoming" | "completed">("upcoming");
  const [galleryCategory, setGalleryCategory] = useState<string>("all");

  const [adminView, setAdminView] = useState<"admin" | "upload" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<GalleryItem | null>(null);
  const [activePdfPreview, setActivePdfPreview] = useState<Publication | null>(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // The theme is owned by the data-theme attribute that the pre-paint script
  // in layout.tsx sets, so React reads it rather than keeping a second copy
  // that could disagree with what the visitor is actually looking at.
  const theme = useSyncExternalStore(subscribeTheme, readTheme, readServerTheme);
  const isDark = theme === "dark";

  const toggleTheme = useCallback(() => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("thorga-theme", next);
    } catch {
      // Private browsing or blocked storage. The toggle still works for this visit.
    }
  }, []);

  // The page is bilingual, so the document language has to follow the toggle
  // for screen readers and for the Devanagari leading rule in globals.css.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Scroll reveal. Re-runs when a filter changes so freshly mounted cards are
  // observed too. Motion here communicates sequence as the visitor arrives at
  // a section; it is skipped entirely under prefers-reduced-motion via CSS.
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (typeof IntersectionObserver === "undefined") {
      nodes.forEach((node) => {
        node.dataset.visible = "true";
      });
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.visible = "true";
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [lang, memberFilter, eventFilter, galleryCategory, publications.length, events.length, members.length]);

  const closeAdmin = useCallback(() => setAdminView(null), []);

  const filteredMembers = members.filter((m) => {
    if (memberFilter === "all") return true;
    return m.committeeType === memberFilter;
  });

  const pastMembers = members.filter((m) => m.committeeType === "past");
  const filteredEvents = events.filter((e) => e.status === eventFilter);
  const filteredGallery = gallery.filter((g) => {
    if (galleryCategory === "all") return true;
    return g.categoryEn.toLowerCase() === galleryCategory.toLowerCase();
  });

  const [featuredMember, ...rosterMembers] = filteredMembers;
  const [featuredPub, ...restPubs] = publications;
  const [leadImage, ...restGallery] = filteredGallery;

  const filterBtn = (active: boolean) =>
    `px-4 py-2 rounded-control text-xs font-semibold transition-colors ${
      active
        ? "bg-accent text-on-accent"
        : "bg-surface border border-line text-fg hover:bg-accent-soft"
    }`;

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-control border border-line bg-surface text-fg text-xs placeholder:text-muted focus:border-accent";

  const pillars = [
    {
      icon: Heart,
      titleNe: "सामाजिक कल्याण कोष",
      titleEn: "Social Welfare Fund",
      bodyNe: "काठमाडौँ र थोर्गामा आकस्मिक स्वास्थ्य उपचार तथा प्राकृतिक विपद्को समयमा तत्काल आर्थिक तथा भौतिक सहयोग।",
      bodyEn: "Emergency healthcare support, patient assistance, and disaster relief for families in need.",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1000&q=80",
      span: "lg:col-span-4",
    },
    {
      icon: GraduationCap,
      titleNe: "शिक्षा तथा छात्रवृत्ति",
      titleEn: "Scholarships and Youth",
      bodyNe: "थोर्गाका जेहेन्दार तथा विपन्न विद्यार्थीहरूका लागि वार्षिक छात्रवृत्ति तथा करियर काउन्सिलिङ कार्यक्रम।",
      bodyEn: "Annual merit scholarships, school library aids, and higher education mentorship for village students.",
      image: null,
      span: "lg:col-span-2",
    },
    {
      icon: Buildings,
      titleNe: "गाउँ विकास पूर्वाधार",
      titleEn: "Rural Infrastructure",
      bodyNe: "खानेपानी, सडक स्तरोन्नति, सामुदायिक भवन निर्माण तथा स्थानीय स्वास्थ्य चौकी सहयोगमा निरन्तर पैरवी।",
      bodyEn: "Liaison for drinking water supply, road accessibility, and community health post equipment in Thorga.",
      image: null,
      span: "lg:col-span-2",
    },
    {
      icon: Tree,
      titleNe: "सांस्कृतिक संरक्षण",
      titleEn: "Heritage and Culture",
      bodyNe: "रुरु क्षेत्रको धार्मिक तथा ऐतिहासिक गरिमा संरक्षण, स्मारिका प्रकाशन तथा मौलिक चाडपर्व मिलन।",
      bodyEn: "Preserving Ruru area cultural traditions, historic landmarks, publishing souvenirs, and annual festivals.",
      image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1000&q=80",
      span: "lg:col-span-4",
    },
  ];

  const galleryFilters = [
    { key: "all", ne: "सबै", en: "All" },
    { key: "Education", ne: "शिक्षा", en: "Education" },
    { key: "Culture", ne: "संस्कृति", en: "Culture" },
    { key: "Development", ne: "विकास निर्माण", en: "Development" },
  ];

  const facts = [
    {
      icon: ShieldCheck,
      valueNe: "दर्ता नं. ४१२/०५८",
      valueEn: "Regd No. 412/058",
      labelNe: "नेपाल सरकार दर्ता",
      labelEn: "Government of Nepal registration",
    },
    {
      icon: Clock,
      valueNe: "वि.सं. २०५८",
      valueEn: "2058 BS",
      labelNe: "संस्था स्थापना वर्ष",
      labelEn: "Year the forum was founded",
    },
    {
      icon: MapPin,
      valueNe: "रुरुक्षेत्र वडा २ र ३",
      valueEn: "Ruru Kshetra Ward 2 and 3",
      labelNe: "कार्यक्षेत्र, गुल्मी जिल्ला",
      labelEn: "Working area, Gulmi district",
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-ground text-fg font-sans selection:bg-accent selection:text-on-accent">
      {/* Utility strip */}
      <div className="bg-tint border-b border-line text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-fg">
            {lang === "ne"
              ? "नेपाल सरकार दर्ता नं. ४१२/०५८ | गुल्मी र काठमाडौँ सम्पर्क सञ्जाल"
              : "Govt Regd No. 412/058 | Gulmi and Kathmandu Community Network"}
          </span>
          <div className="flex items-center gap-4 text-muted">
            <a href="tel:+97714481234" className="flex items-center gap-1 hover:text-accent transition-colors">
              <Phone size={14} className="text-accent" /> +977 01-4481234
            </a>
            <a
              href="mailto:info@thorgaktm.org.np"
              className="flex items-center gap-1 hover:text-accent transition-colors"
            >
              <EnvelopeSimple size={14} className="text-accent" /> info@thorgaktm.org.np
            </a>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-control bg-accent text-on-accent flex items-center justify-center flex-shrink-0">
              <Buildings size={24} weight="duotone" />
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-bold tracking-tight leading-tight truncate text-fg">
                {lang === "ne" ? "थोर्गा काठमाडौं सम्पर्क तथा विकास मञ्च" : "Thorga Kathmandu Liaison Forum"}
              </div>
              <div className="text-[11px] font-medium text-muted truncate">
                {lang === "ne" ? "स्थापना २०५८ (गैरनाफामूलक सामाजिक संस्था)" : "Est. 2001 (Non-Profit Community NGO)"}
              </div>
            </div>
          </div>

          <nav className="hidden xl:flex items-center gap-5 text-[13px] font-medium text-muted">
            {NAV_ITEMS.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-accent transition-colors">
                {lang === "ne" ? item.ne : item.en}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                isDark
                  ? lang === "ne"
                    ? "उज्यालो थिममा जानुहोस्"
                    : "Switch to light theme"
                  : lang === "ne"
                  ? "अँध्यारो थिममा जानुहोस्"
                  : "Switch to dark theme"
              }
              className="p-2 rounded-control border border-line text-fg hover:bg-tint transition-colors"
            >
              {isDark ? <Sun size={18} weight="bold" /> : <Moon size={18} weight="bold" />}
            </button>

            <div className="inline-flex rounded-control border border-line p-1 bg-ground">
              <button
                type="button"
                onClick={() => setLang("ne")}
                aria-pressed={lang === "ne"}
                className={`px-2.5 py-1 text-xs font-semibold rounded-chip transition-colors ${
                  lang === "ne" ? "bg-accent text-on-accent" : "text-muted hover:text-fg"
                }`}
              >
                नेपाली
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                aria-pressed={lang === "en"}
                className={`px-2.5 py-1 text-xs font-semibold rounded-chip transition-colors ${
                  lang === "en" ? "bg-accent text-on-accent" : "text-muted hover:text-fg"
                }`}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAdminView("admin")}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-control border border-line text-xs font-medium text-fg hover:bg-tint transition-colors"
            >
              <SlidersHorizontal size={14} />
              {lang === "ne" ? "व्यवस्थापन प्यानल" : "Admin Panel"}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={lang === "ne" ? "मेनु" : "Menu"}
              className="xl:hidden p-2 rounded-control border border-line text-fg hover:bg-tint transition-colors"
            >
              {menuOpen ? <X size={18} /> : <List size={18} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            id="mobile-nav"
            className="xl:hidden border-t border-line bg-surface px-4 sm:px-6 py-3 grid grid-cols-2 gap-x-4 gap-y-1"
          >
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="py-2 text-sm font-medium text-fg hover:text-accent transition-colors"
              >
                {lang === "ne" ? item.ne : item.en}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setAdminView("admin");
              }}
              className="sm:hidden py-2 text-sm font-medium text-left text-fg hover:text-accent transition-colors"
            >
              {lang === "ne" ? "व्यवस्थापन प्यानल" : "Admin Panel"}
            </button>
          </nav>
        )}
      </header>

      {/* SECTION 1: HERO (Layout family: asymmetric 7/5 split) */}
      <section className="border-b border-line pt-16 lg:pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-chip bg-accent-soft text-accent text-xs font-semibold">
                <Globe size={14} />
                {lang === "ne" ? "थोर्गा, गुल्मी र काठमाडौँ सम्पर्क सञ्जाल" : "Thorga, Gulmi and Kathmandu Liaison"}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] text-fg">
                {lang === "ne"
                  ? "थोर्गाको पहिचान, काठमाडौँमा एकता र सेवाको अभियान"
                  : "Uniting Thorga Heritage, Advancing Community Welfare"}
              </h1>

              <p className="text-base sm:text-lg max-w-[58ch] leading-relaxed text-muted">
                {lang === "ne"
                  ? "काठमाडौँ उपत्यकाका थोर्गाबासीलाई एकताबद्ध गर्दै गाउँको शिक्षा, स्वास्थ्य र पूर्वाधार विकासमा समर्पित संस्था।"
                  : "A non-profit forum connecting Thorga families in Kathmandu for mutual assistance, youth scholarships, and village development."}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="#publications"
                  className="px-6 py-3 rounded-control bg-accent hover:bg-accent-hover active:translate-y-px text-on-accent text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <BookOpen size={18} />
                  {lang === "ne" ? "प्रकाशन हेर्नुहोस्" : "Explore Publications"}
                </a>
                <a
                  href="#members"
                  className="px-6 py-3 rounded-control border border-line bg-surface hover:bg-tint active:translate-y-px text-fg text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Users size={18} />
                  {lang === "ne" ? "कार्यसमिति" : "Executive Members"}
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-3">
              <div className="relative h-80 sm:h-96 w-full rounded-card overflow-hidden bg-tint">
                <Image
                  src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1000&q=80"
                  alt={
                    lang === "ne"
                      ? "गुल्मीको थोर्गा वरपरको पहाडी दृश्य"
                      : "Hillside landscape around Thorga in Gulmi district"
                  }
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {lang === "ne"
                  ? "गुल्मी जिल्ला, रुरुक्षेत्र गाउँपालिका वडा नं. २ र ३ (साविक थोर्गा गा.वि.स.)"
                  : "Gulmi District, Ruru Kshetra Ward 2 and 3 (former Thorga VDC)"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: CREDENTIALS BAND (Layout family: horizontal fact row) */}
      <section className="border-b border-line bg-tint py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {facts.map((fact) => (
            <div key={fact.valueEn} className="flex items-start gap-3">
              <fact.icon size={22} className="text-accent flex-shrink-0 mt-0.5" weight="duotone" />
              <div>
                <div className="text-base font-bold text-fg">
                  {lang === "ne" ? fact.valueNe : fact.valueEn}
                </div>
                <div className="text-xs text-muted">{lang === "ne" ? fact.labelNe : fact.labelEn}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: OBJECTIVES (Layout family: asymmetric bento, 4 items in 4 cells) */}
      <section id="about" className="py-20 border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4 mb-12 reveal">
            <h2 className="text-3xl font-bold tracking-tight text-fg">
              {lang === "ne" ? "उद्देश्य तथा कार्यक्षेत्र" : "Objectives and Core Pillars"}
            </h2>
            <p className="text-base leading-relaxed text-muted max-w-[65ch]">
              {lang === "ne"
                ? "थोर्गाबाट विभिन्न पेसा, व्यवसाय तथा अध्ययनका सिलसिलामा काठमाडौँ उपत्यकामा बसोबास गरिरहेका सम्पूर्ण समुदायलाई एउटै छातामुनि संगठित गर्दै गाउँको चौतर्फी उन्नतिमा टेवा पुर्याउनु हाम्रो मुख्य ध्येय हो।"
                : "Organizing the native families of Thorga living in Kathmandu valley under one institutional umbrella to foster community mutual aid, scholarship programs, and rural progress."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5">
            {pillars.map((pillar) => (
              <article
                key={pillar.titleEn}
                className={`reveal rounded-card border border-line bg-surface overflow-hidden flex flex-col ${pillar.span}`}
              >
                {pillar.image && (
                  <div className="relative h-44 w-full bg-tint">
                    <Image
                      src={pillar.image}
                      alt={lang === "ne" ? pillar.titleNe : pillar.titleEn}
                      fill
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-6 space-y-3 flex-1">
                  <pillar.icon size={26} className="text-accent" weight="duotone" />
                  <h3 className="text-lg font-bold text-fg">
                    {lang === "ne" ? pillar.titleNe : pillar.titleEn}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">
                    {lang === "ne" ? pillar.bodyNe : pillar.bodyEn}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: EXECUTIVE COMMITTEE (Layout family: featured lead plus roster) */}
      <section id="members" className="py-20 border-b border-line bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 reveal">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tight text-fg">
                {lang === "ne" ? "वर्तमान कार्यसमिति (२०८१ देखि २०८४)" : "Executive Committee (2024 to 2027)"}
              </h2>
              <p className="text-sm text-muted max-w-[60ch]">
                {lang === "ne"
                  ? "संस्थाको नीति निर्माण तथा दैनिक कार्य सञ्चालन गर्ने निर्वाचित कार्यसमिति"
                  : "Elected leadership overseeing social programs, finances, and village coordination"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setMemberFilter("current")} className={filterBtn(memberFilter === "current")}>
                {lang === "ne" ? "वर्तमान कार्यसमिति" : "Current Committee"}
              </button>
              <button type="button" onClick={() => setMemberFilter("advisor")} className={filterBtn(memberFilter === "advisor")}>
                {lang === "ne" ? "सल्लाहकार परिषद्" : "Advisors"}
              </button>
              <button type="button" onClick={() => setMemberFilter("all")} className={filterBtn(memberFilter === "all")}>
                {lang === "ne" ? "सबै सदस्यहरू" : "All Members"}
              </button>
            </div>
          </div>

          {filteredMembers.length === 0 ? (
            <div className="rounded-card border border-dashed border-line p-12 text-center space-y-2">
              <Users size={32} className="text-accent mx-auto" weight="duotone" />
              <p className="text-sm font-semibold text-fg">
                {lang === "ne" ? "यस वर्गमा कुनै सदस्य छैन" : "No members in this category yet"}
              </p>
              <p className="text-xs text-muted">
                {lang === "ne"
                  ? "व्यवस्थापन प्यानलबाट नयाँ सदस्य थप्न सकिन्छ।"
                  : "New members can be added from the admin panel."}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {featuredMember && (
                <article className="reveal rounded-card border border-line bg-ground overflow-hidden grid grid-cols-1 sm:grid-cols-12">
                  <Portrait
                    member={featuredMember}
                    lang={lang}
                    sizeClass="sm:col-span-4 h-64 sm:h-auto min-h-[16rem] w-full"
                    textClass="text-6xl"
                  />
                  <div className="sm:col-span-8 p-6 sm:p-8 space-y-3">
                    <div className="text-xs font-semibold text-accent">
                      {lang === "ne" ? featuredMember.roleNe : featuredMember.roleEn}
                    </div>
                    <h3 className="text-2xl font-bold text-fg">
                      {lang === "ne" ? featuredMember.nameNe : featuredMember.nameEn}
                    </h3>
                    <div className="text-sm text-muted">
                      {lang === "ne" ? featuredMember.nameEn : featuredMember.nameNe}
                    </div>
                    <p className="text-sm leading-relaxed text-muted max-w-[60ch]">
                      {lang === "ne" ? featuredMember.bioNe : featuredMember.bioEn}
                    </p>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 pt-2 text-xs text-muted">
                      {featuredMember.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone size={13} className="text-accent" />
                          {featuredMember.phone}
                        </span>
                      )}
                      {featuredMember.email && (
                        <span className="flex items-center gap-1.5">
                          <EnvelopeSimple size={13} className="text-accent" />
                          {featuredMember.email}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              )}

              {rosterMembers.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {rosterMembers.map((member) => (
                    <article
                      key={member.id}
                      className="reveal rounded-card border border-line bg-ground overflow-hidden flex"
                    >
                      <Portrait
                        member={member}
                        lang={lang}
                        sizeClass="w-24 flex-shrink-0"
                        textClass="text-2xl"
                      />
                      <div className="p-4 space-y-1 min-w-0">
                        <div className="text-[11px] font-semibold text-accent">
                          {lang === "ne" ? member.roleNe : member.roleEn}
                        </div>
                        <h3 className="text-sm font-bold text-fg">
                          {lang === "ne" ? member.nameNe : member.nameEn}
                        </h3>
                        <p className="text-xs leading-relaxed text-muted line-clamp-2">
                          {lang === "ne" ? member.bioNe : member.bioEn}
                        </p>
                        {member.phone && (
                          <div className="text-xs text-muted pt-1 truncate">{member.phone}</div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 5: PAST LEADERSHIP (Layout family: vertical archive timeline) */}
      <section id="past-members" className="py-20 border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3 mb-10 reveal">
            <h2 className="text-3xl font-bold tracking-tight text-fg">
              {lang === "ne" ? "पूर्व नेतृत्व तथा ऐतिहासिक कार्यकाल" : "Past Leadership and Tenure Archive"}
            </h2>
            <p className="text-sm text-muted max-w-[65ch]">
              {lang === "ne"
                ? "मञ्च स्थापना कालदेखि संस्थाको नेतृत्व गरी योगदान पुर्याउनुहुने श्रद्धेय पूर्व अध्यक्षहरू"
                : "Honoring former presidents and founding conveners who shaped our organizational journey"}
            </p>
          </div>

          <ol className="relative max-w-3xl border-l border-line ml-3 space-y-10">
            {pastMembers.map((pastMember) => (
              <li key={pastMember.id} className="reveal relative pl-8">
                <span className="absolute left-0 top-2 -translate-x-1/2 w-3 h-3 rounded-full bg-accent" />
                <div className="flex items-start gap-4">
                  <Portrait
                    member={pastMember}
                    lang={lang}
                    sizeClass="w-14 h-14 rounded-full flex-shrink-0"
                    textClass="text-base"
                  />
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-accent">
                      {lang === "ne" ? pastMember.tenureNe : pastMember.tenureEn}
                    </div>
                    <h3 className="text-base font-bold text-fg">
                      {lang === "ne" ? pastMember.nameNe : pastMember.nameEn}
                    </h3>
                    <div className="text-xs text-muted">
                      {lang === "ne" ? pastMember.roleNe : pastMember.roleEn}
                    </div>
                    <p className="text-sm leading-relaxed text-muted max-w-[60ch] pt-1">
                      {lang === "ne" ? pastMember.bioNe : pastMember.bioEn}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* SECTION 6: EVENTS (Layout family: horizontal scroll-snap track) */}
      <section id="events" className="py-20 border-b border-line bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 reveal">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tight text-fg">
                {lang === "ne" ? "कार्यक्रम तथा गतिविधिहरू" : "Events and Social Programs"}
              </h2>
              <p className="text-sm text-muted max-w-[60ch]">
                {lang === "ne"
                  ? "काठमाडौँ तथा थोर्गा गाउँमा आयोजना हुने आगामी तथा सम्पन्न कार्यक्रमहरू"
                  : "Community gatherings, general assemblies, health camps, and blood donations"}
              </p>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setEventFilter("upcoming")} className={filterBtn(eventFilter === "upcoming")}>
                {lang === "ne" ? "आगामी कार्यक्रम" : "Upcoming Events"}
              </button>
              <button type="button" onClick={() => setEventFilter("completed")} className={filterBtn(eventFilter === "completed")}>
                {lang === "ne" ? "सम्पन्न कार्यक्रम" : "Completed Events"}
              </button>
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="rounded-card border border-dashed border-line p-12 text-center space-y-2">
              <Calendar size={32} className="text-accent mx-auto" weight="duotone" />
              <p className="text-sm font-semibold text-fg">
                {lang === "ne" ? "यस वर्गमा कुनै कार्यक्रम छैन" : "Nothing scheduled in this view"}
              </p>
            </div>
          ) : (
            <div className="track flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              {filteredEvents.map((event) => (
                <article
                  key={event.id}
                  className="reveal snap-start flex-shrink-0 w-[300px] sm:w-[360px] rounded-card border border-line bg-ground overflow-hidden flex flex-col"
                >
                  <div className="relative h-44 w-full bg-tint">
                    <Image
                      src={event.imageUrl}
                      alt={lang === "ne" ? event.titleNe : event.titleEn}
                      fill
                      sizes="360px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-accent">
                        {lang === "ne" ? event.categoryNe : event.categoryEn}
                      </div>
                      <h3 className="text-base font-bold leading-snug text-fg">
                        {lang === "ne" ? event.titleNe : event.titleEn}
                      </h3>
                      <p className="text-xs leading-relaxed text-muted line-clamp-3">
                        {lang === "ne" ? event.descriptionNe : event.descriptionEn}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-3 border-t border-line text-xs text-muted">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Calendar size={14} className="text-accent" />
                        <span className="font-semibold text-fg">
                          {lang === "ne" ? event.dateNe : event.dateEn}
                        </span>
                        <Clock size={14} className="ml-2" />
                        {lang === "ne" ? event.timeNe : event.timeEn}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-accent" />
                        {lang === "ne" ? event.locationNe : event.locationEn}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 7: PUBLICATIONS (Layout family: featured document plus shelf) */}
      <section id="publications" className="py-20 border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 reveal">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tight text-fg">
                {lang === "ne" ? "प्रकाशन, मुखपत्र तथा प्रतिवेदन" : "Publications and Annual Reports"}
              </h2>
              <p className="text-sm text-muted max-w-[60ch]">
                {lang === "ne"
                  ? "संस्थाका वार्षिक स्मारिकाहरू, विधान तथा आधिकारिक लेखा प्रतिवेदन डाउनलोड गर्नुहोस्"
                  : "Download official souvenirs, constitution by-laws, and certified audit reports"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAdminView("upload")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-control border border-line bg-surface hover:bg-tint text-fg text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <Upload size={16} className="text-accent" />
              {lang === "ne" ? "नयाँ PDF अपलोड" : "Upload PDF"}
            </button>
          </div>

          {featuredPub && (
            <article className="reveal rounded-card border border-line bg-surface overflow-hidden grid grid-cols-1 sm:grid-cols-12 mb-5">
              <div className="sm:col-span-5 relative min-h-[14rem] bg-accent-soft">
                {featuredPub.coverImageUrl ? (
                  <Image
                    src={featuredPub.coverImageUrl}
                    alt={lang === "ne" ? featuredPub.titleNe : featuredPub.titleEn}
                    fill
                    sizes="(max-width: 640px) 100vw, 40vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileText size={56} className="text-accent" weight="duotone" />
                  </div>
                )}
              </div>
              <div className="sm:col-span-7 p-6 sm:p-8 space-y-3">
                <div className="text-xs font-semibold text-accent">
                  {lang === "ne" ? featuredPub.categoryNe : featuredPub.categoryEn}
                </div>
                <h3 className="text-xl font-bold leading-snug text-fg">
                  {lang === "ne" ? featuredPub.titleNe : featuredPub.titleEn}
                </h3>
                <p className="text-sm leading-relaxed text-muted max-w-[60ch]">
                  {lang === "ne" ? featuredPub.descriptionNe : featuredPub.descriptionEn}
                </p>
                <div className="font-mono text-xs text-muted">
                  {lang === "ne" ? featuredPub.publishedYearNe : featuredPub.publishedYearEn} · {featuredPub.pages} pages · {featuredPub.fileSize}
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActivePdfPreview(featuredPub)}
                    className="px-4 py-2 rounded-control border border-line bg-ground hover:bg-tint text-fg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Eye size={15} />
                    {lang === "ne" ? "हेर्नुहोस्" : "Preview"}
                  </button>
                  <a
                    href={featuredPub.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Download size={15} />
                    {lang === "ne" ? "डाउनलोड" : "Download"}
                  </a>
                </div>
              </div>
            </article>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {restPubs.map((pub) => (
              <article
                key={pub.id}
                className="reveal rounded-card border border-line bg-surface p-5 flex gap-5"
              >
                <div className="relative w-24 h-32 flex-shrink-0 rounded-chip overflow-hidden bg-accent-soft">
                  {pub.coverImageUrl ? (
                    <Image
                      src={pub.coverImageUrl}
                      alt={lang === "ne" ? pub.titleNe : pub.titleEn}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText size={28} className="text-accent" weight="duotone" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-accent">
                      {lang === "ne" ? pub.categoryNe : pub.categoryEn}
                    </div>
                    <h3 className="text-sm font-bold leading-snug text-fg">
                      {lang === "ne" ? pub.titleNe : pub.titleEn}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted line-clamp-2">
                      {lang === "ne" ? pub.descriptionNe : pub.descriptionEn}
                    </p>
                    <div className="font-mono text-[11px] text-muted">
                      {lang === "ne" ? pub.publishedYearNe : pub.publishedYearEn} · {pub.pages} pages · {pub.fileSize}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActivePdfPreview(pub)}
                      className="px-3 py-1.5 rounded-control border border-line bg-ground hover:bg-tint text-fg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Eye size={14} />
                      {lang === "ne" ? "हेर्नुहोस्" : "Preview"}
                    </button>
                    <a
                      href={pub.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Download size={14} />
                      {lang === "ne" ? "डाउनलोड" : "Download"}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8: GALLERY (Layout family: asymmetric masonry with lightbox) */}
      <section id="gallery" className="py-20 border-b border-line bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 reveal">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tight text-fg">
                {lang === "ne" ? "सामाजिक कार्य तथा तस्बिर सङ्ग्रह" : "Community Action Photo Gallery"}
              </h2>
              <p className="text-sm text-muted max-w-[60ch]">
                {lang === "ne"
                  ? "थोर्गा गाउँ तथा काठमाडौँ उपत्यकामा सञ्चालन गरिएका विभिन्न ऐतिहासिक गतिविधिहरू"
                  : "Moments from our rural development projects, gatherings, and youth welfare initiatives"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {galleryFilters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setGalleryCategory(filter.key)}
                  className={filterBtn(galleryCategory === filter.key)}
                >
                  {lang === "ne" ? filter.ne : filter.en}
                </button>
              ))}
            </div>
          </div>

          {filteredGallery.length === 0 ? (
            <div className="rounded-card border border-dashed border-line p-12 text-center space-y-2">
              <Tree size={32} className="text-accent mx-auto" weight="duotone" />
              <p className="text-sm font-semibold text-fg">
                {lang === "ne" ? "यस वर्गमा तस्बिर छैन" : "No photographs in this category"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {leadImage && (
                <figure className="reveal sm:col-span-2 lg:row-span-2 space-y-2 flex flex-col">
                  <button
                    type="button"
                    onClick={() => setSelectedGalleryImage(leadImage)}
                    className="relative block w-full h-64 lg:flex-1 lg:min-h-[20rem] rounded-card overflow-hidden bg-tint group"
                  >
                    <Image
                      src={leadImage.imageUrl}
                      alt={lang === "ne" ? leadImage.titleNe : leadImage.titleEn}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </button>
                  <figcaption className="space-y-0.5">
                    <div className="text-[11px] font-semibold text-accent">
                      {lang === "ne" ? leadImage.categoryNe : leadImage.categoryEn}
                    </div>
                    <div className="text-sm font-bold text-fg">
                      {lang === "ne" ? leadImage.titleNe : leadImage.titleEn}
                    </div>
                  </figcaption>
                </figure>
              )}

              {restGallery.map((item) => (
                <figure key={item.id} className="reveal space-y-2">
                  <button
                    type="button"
                    onClick={() => setSelectedGalleryImage(item)}
                    className="relative block w-full h-44 rounded-card overflow-hidden bg-tint group"
                  >
                    <Image
                      src={item.imageUrl}
                      alt={lang === "ne" ? item.titleNe : item.titleEn}
                      fill
                      sizes="(max-width: 640px) 100vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </button>
                  <figcaption className="space-y-0.5">
                    <div className="text-[11px] font-semibold text-accent">
                      {lang === "ne" ? item.categoryNe : item.categoryEn}
                    </div>
                    <div className="text-xs font-bold text-fg line-clamp-2">
                      {lang === "ne" ? item.titleNe : item.titleEn}
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 9: CONTACT AND WELFARE FUND (Layout family: split form and details) */}
      <section id="contact" className="py-20 border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-6 space-y-6 reveal">
              <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tight text-fg">
                  {lang === "ne" ? "सम्पर्क तथा सदस्यता सोधपुछ" : "Contact and Membership Inquiries"}
                </h2>
                <p className="text-sm text-muted max-w-[60ch]">
                  {lang === "ne"
                    ? "नयाँ सदस्यता, आजीवन सदस्यता वा संस्थागत सहकार्यका लागि सम्पर्क फाराम भर्नुहोस्"
                    : "Fill in the details below for membership inquiries or organizational partnership"}
                </p>
              </div>

              {contactSubmitted ? (
                <div className="rounded-card border border-line bg-accent-soft p-6 text-center space-y-3">
                  <CheckCircle size={40} className="text-accent mx-auto" weight="duotone" />
                  <h3 className="text-lg font-bold text-fg">
                    {lang === "ne" ? "सन्देश प्राप्त भयो" : "Message received"}
                  </h3>
                  <p className="text-xs text-muted">
                    {lang === "ne"
                      ? "हाम्रो सचिवालयले तपाईंलाई चाँडै सम्पर्क गर्नेछ। धन्यवाद।"
                      : "Our secretariat will contact you shortly. Thank you."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setContactSubmitted(false)}
                    className="px-4 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors"
                  >
                    {lang === "ne" ? "अर्को सन्देश पठाउनुहोस्" : "Send Another Message"}
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setContactSubmitted(true);
                  }}
                  className="rounded-card border border-line bg-surface p-6 space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="contact-name" className="text-xs font-semibold text-fg block">
                        {lang === "ne" ? "पूरा नाम" : "Full Name"} *
                      </label>
                      <input
                        id="contact-name"
                        required
                        type="text"
                        autoComplete="name"
                        placeholder={lang === "ne" ? "तपाईंको नाम" : "Your full name"}
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="contact-phone" className="text-xs font-semibold text-fg block">
                        {lang === "ne" ? "सम्पर्क नम्बर" : "Phone Number"} *
                      </label>
                      <input
                        id="contact-phone"
                        required
                        type="tel"
                        autoComplete="tel"
                        placeholder="+977 98..."
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="contact-email" className="text-xs font-semibold text-fg block">
                      {lang === "ne" ? "इमेल ठेगाना" : "Email Address"}
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      autoComplete="email"
                      placeholder="example@mail.com"
                      className={inputCls}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="contact-message" className="text-xs font-semibold text-fg block">
                      {lang === "ne" ? "सन्देश वा जिज्ञासा" : "Message / Query"} *
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={4}
                      placeholder={lang === "ne" ? "तपाईंको जिज्ञासा यहाँ लेख्नुहोस्..." : "Write your query here..."}
                      className={inputCls}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-control bg-accent hover:bg-accent-hover active:translate-y-px text-on-accent text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <EnvelopeSimple size={16} />
                    {lang === "ne" ? "सन्देश पठाउनुहोस्" : "Submit Inquiry"}
                  </button>
                </form>
              )}
            </div>

            <div className="lg:col-span-6 space-y-5 reveal">
              <div className="rounded-card border border-line bg-surface p-6 space-y-4">
                <h3 className="text-lg font-bold text-fg">
                  {lang === "ne" ? "कार्यालय तथा सम्पर्क ठेगाना" : "Liaison Office Locations"}
                </h3>

                <div className="divide-y divide-line text-xs">
                  <div className="pb-4 space-y-1">
                    <div className="font-bold text-accent">
                      {lang === "ne" ? "काठमाडौँ सम्पर्क सचिवालय" : "Kathmandu Secretariat"}
                    </div>
                    <div className="text-fg">
                      {lang === "ne"
                        ? "शंखमूल मार्ग, नयाँ बानेश्वर, काठमाडौँ, नेपाल"
                        : "Shankhamul Marg, New Baneshwor, Kathmandu, Nepal"}
                    </div>
                    <div className="text-muted">
                      {lang === "ne" ? "फोन" : "Phone"}: +977 01-4481234, 9851012345
                    </div>
                  </div>

                  <div className="pt-4 space-y-1">
                    <div className="font-bold text-accent">
                      {lang === "ne" ? "थोर्गा गाउँ सम्पर्क केन्द्र" : "Thorga Village Center"}
                    </div>
                    <div className="text-fg">
                      {lang === "ne"
                        ? "थोर्गा बजार, रुरुक्षेत्र-२, गुल्मी, लुम्बिनी प्रदेश"
                        : "Thorga Bazaar, Ruru Kshetra-2, Gulmi, Lumbini Province"}
                    </div>
                    <div className="text-muted">{lang === "ne" ? "फोन" : "Phone"}: +977 079-520123</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-surface border-t border-line text-xs py-12 text-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2 font-bold text-base text-fg">
                <Buildings size={20} className="text-accent" weight="duotone" />
                {lang === "ne" ? "थोर्गा काठमाडौं सम्पर्क तथा विकास मञ्च" : "Thorga Kathmandu Liaison Forum"}
              </div>
              <p className="text-xs max-w-md leading-relaxed">
                {lang === "ne"
                  ? "गुल्मी जिल्लाको ऐतिहासिक तथा पर्यटकीय थलो थोर्गाका बासिन्दाहरूलाई काठमाडौँमा जोड्ने तथा गाउँको सर्वाङ्गीण विकासमा समर्पित गैरनाफामूलक संस्था।"
                  : "A registered non-profit forum connecting native families of Thorga, Gulmi in Kathmandu for community welfare, cultural preservation, and youth scholarships."}
              </p>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-fg">{lang === "ne" ? "शीघ्र लिङ्कहरू" : "Quick Links"}</div>
              <ul className="space-y-1">
                <li>
                  <a href="#about" className="hover:text-accent transition-colors">
                    {lang === "ne" ? "हाम्रो बारेमा" : "About Us"}
                  </a>
                </li>
                <li>
                  <a href="#members" className="hover:text-accent transition-colors">
                    {lang === "ne" ? "कार्यसमिति सदस्य" : "Executive Committee"}
                  </a>
                </li>
                <li>
                  <a href="#publications" className="hover:text-accent transition-colors">
                    {lang === "ne" ? "वार्षिक स्मारिका" : "Publications and PDF"}
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-accent transition-colors">
                    {lang === "ne" ? "सम्पर्क तथा सचिवालय" : "Contact & Secretariat"}
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-fg">{lang === "ne" ? "सम्पर्क" : "Headquarters"}</div>
              <div className="leading-relaxed">
                Kathmandu Secretariat: Shankhamul, New Baneshwor
                <br />
                Thorga Center: Ruru-2, Gulmi
                <br />
                Email: info@thorgaktm.org.np
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <div>&copy; 2026 Thorga Kathmandu Samparka Tatha Bikash Manch. All rights reserved.</div>
            <div>{lang === "ne" ? "नेपाल सरकार दर्ता नं. ४१२/०५८" : "Govt Regd. No. 412/058"}</div>
          </div>
        </div>
      </footer>

      <AdminPanel
        lang={lang}
        view={adminView}
        onClose={closeAdmin}
        memberCount={members.length}
        onAddMember={(member) => {
          setMembers((prev) => [member, ...prev]);
          setAdminView(null);
        }}
        onAddPublication={(publication) => {
          setPublications((prev) => [publication, ...prev]);
          setAdminView(null);
        }}
        onAddEvent={(event) => {
          setEvents((prev) => [event, ...prev]);
          setAdminView(null);
        }}
      />

      {/* PDF preview */}
      {activePdfPreview && (
        <div
          className="fixed inset-0 z-50 bg-fg/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface border border-line rounded-card w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-line flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={18} className="text-accent flex-shrink-0" weight="duotone" />
                <h3 className="text-sm font-bold text-fg truncate">
                  {lang === "ne" ? activePdfPreview.titleNe : activePdfPreview.titleEn}
                </h3>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={activePdfPreview.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download size={14} />
                  {lang === "ne" ? "डाउनलोड" : "Download"}
                </a>
                <button
                  type="button"
                  onClick={() => setActivePdfPreview(null)}
                  aria-label={lang === "ne" ? "बन्द गर्नुहोस्" : "Close"}
                  className="p-1.5 rounded-control text-muted hover:text-fg hover:bg-tint transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <iframe
              src={activePdfPreview.pdfUrl}
              title={lang === "ne" ? activePdfPreview.titleNe : activePdfPreview.titleEn}
              className="flex-1 w-full min-h-[60vh] bg-ground"
            />

            <div className="p-4 border-t border-line font-mono text-xs text-muted">
              {lang === "ne" ? activePdfPreview.publishedYearNe : activePdfPreview.publishedYearEn} · {activePdfPreview.pages} pages · {activePdfPreview.fileSize}
            </div>
          </div>
        </div>
      )}

      {/* Gallery lightbox */}
      {selectedGalleryImage && (
        <div
          className="fixed inset-0 z-50 bg-fg/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedGalleryImage(null)}
        >
          <div
            className="bg-surface border border-line rounded-card w-full max-w-4xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedGalleryImage(null)}
                aria-label={lang === "ne" ? "बन्द गर्नुहोस्" : "Close"}
                className="p-1.5 rounded-control text-muted hover:text-fg hover:bg-tint transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="relative h-[55vh] w-full bg-tint">
              <Image
                src={selectedGalleryImage.imageUrl}
                alt={lang === "ne" ? selectedGalleryImage.titleNe : selectedGalleryImage.titleEn}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
            <div className="p-6 space-y-1">
              <div className="text-xs font-semibold text-accent">
                {lang === "ne" ? selectedGalleryImage.categoryNe : selectedGalleryImage.categoryEn}
              </div>
              <h3 className="text-lg font-bold text-fg">
                {lang === "ne" ? selectedGalleryImage.titleNe : selectedGalleryImage.titleEn}
              </h3>
              <div className="text-xs text-muted">
                {lang === "ne" ? selectedGalleryImage.dateNe : selectedGalleryImage.dateEn}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
