"use client";

import React, { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
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
  subscribeHeroContent,
  getStoredHeroSnapshot,
  getServerHeroSnapshot,
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
  Buildings,
  GraduationCap,
  Heart,
  Tree,
  MapPin,
  EnvelopeSimple,
  ShieldCheck,
  ArrowRight,
  Sparkle,
  X,
} from "@phosphor-icons/react";

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
        <Image
          src={member.photoUrl}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, 300px"
          className="object-cover"
        />
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
  const [members] = useState<Member[]>(initialMembers);
  const [events] = useState<EventItem[]>(initialEvents);
  const [publications] = useState<Publication[]>(initialPublications);
  const [gallery] = useState<GalleryItem[]>(initialGallery);
  const heroContent = useSyncExternalStore(
    subscribeHeroContent,
    getStoredHeroSnapshot,
    getServerHeroSnapshot
  );

  const [activePdfPreview, setActivePdfPreview] = useState<Publication | null>(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [committeeFilter, setCommitteeFilter] = useState<"current" | "advisor" | "all">("current");

  // Filtered members for Executive Committee section
  const filteredCommitteeMembers = members.filter((m) => {
    if (m.committeeType === "past") return false;
    if (committeeFilter === "all") return true;
    return m.committeeType === committeeFilter;
  });

  // Curated showcase subsets
  const publicationsShowcase = publications.slice(0, 3);
  const upcomingEventsShowcase = events.filter((e) => e.status === "upcoming").slice(0, 2);
  const galleryShowcase = gallery.slice(0, 3);

  return (
    <div className="min-h-[100dvh] bg-ground text-fg font-sans selection:bg-accent selection:text-on-accent">
      <SiteHeader lang={lang} setLang={setLang} />

      {/* SECTION 1: HERO (Fully Dynamic from Admin Panel) */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-line bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-chip bg-accent-soft text-accent text-xs font-semibold">
                <Globe size={14} />
                <span>{lang === "ne" ? heroContent.badgeNe : heroContent.badgeEn}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-fg leading-[1.15]">
                {lang === "ne" ? heroContent.titleNe : heroContent.titleEn}
              </h1>

              <p className="text-base sm:text-lg max-w-[55ch] leading-relaxed text-muted">
                {lang === "ne" ? heroContent.descriptionNe : heroContent.descriptionEn}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/committee"
                  className="px-6 py-3 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
                >
                  <Users size={18} />
                  <span>{lang === "ne" ? "कार्यसमिति सदस्यहरू" : "Executive Committee"}</span>
                </Link>
                <Link
                  href="/publications"
                  className="px-6 py-3 rounded-control bg-tint hover:bg-accent-soft text-fg text-xs font-semibold border border-line transition-all flex items-center gap-2"
                >
                  <BookOpen size={18} />
                  <span>{lang === "ne" ? "स्मारिका तथा प्रकाशन" : "Explore Publications"}</span>
                </Link>
              </div>
            </div>

            {/* Right Visual Frame */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-card overflow-hidden border border-line bg-surface shadow-lg">
                <div className="relative h-96 w-full">
                  <Image
                    src={heroContent.imageUrl}
                    alt={lang === "ne" ? heroContent.imageCaptionNe : heroContent.imageCaptionEn}
                    fill
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 inset-x-0 p-6 space-y-2 text-white">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-chip bg-accent text-on-accent text-xs font-semibold">
                    <ShieldCheck size={14} />
                    <span>{lang === "ne" ? heroContent.imageBadgeNe : heroContent.imageBadgeEn}</span>
                  </div>
                  <h3 className="text-lg font-bold leading-snug">
                    {lang === "ne" ? heroContent.imageCaptionNe : heroContent.imageCaptionEn}
                  </h3>
                  <p className="text-xs text-white/80">
                    {lang === "ne" ? heroContent.imageSubtitleNe : heroContent.imageSubtitleEn}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: OBJECTIVES & CORE PILLARS */}
      <section id="about" className="py-20 border-b border-line bg-ground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-chip bg-accent-soft text-accent text-xs font-semibold">
              <ShieldCheck size={16} weight="duotone" />
              <span>{lang === "ne" ? "संस्थागत उद्देश्य तथा सेवा अभियान" : "Institutional Mission & Core Pillars"}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
              {lang === "ne" ? "उद्देश्य तथा कार्यक्षेत्र" : "Objectives and Core Pillars"}
            </h2>
            <p className="text-base leading-relaxed text-muted max-w-[65ch]">
              {lang === "ne"
                ? "थोर्गाबाट विभिन्न पेसा, व्यवसाय तथा अध्ययनका सिलसिलामा काठमाडौँ उपत्यकामा बसोबास गरिरहेका सम्पूर्ण समुदायलाई एउटै छातामुनि संगठित गर्दै गाउँको चौतर्फी उन्नतिमा टेवा पुर्याउनु हाम्रो मुख्य ध्येय हो।"
                : "Organizing native families of Thorga living in Kathmandu under one institutional umbrella to foster community mutual aid, scholarship programs, and rural development."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 01 */}
            <article className="rounded-card border border-line bg-surface p-6 flex flex-col justify-between space-y-4 hover:border-accent transition-all group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-control bg-accent-soft text-accent flex items-center justify-center">
                  <Heart size={26} weight="duotone" />
                </div>
                <h3 className="text-lg font-bold text-fg">
                  {lang === "ne" ? "सामाजिक कल्याण कोष" : "Social Welfare Fund"}
                </h3>
                <p className="text-xs leading-relaxed text-muted">
                  {lang === "ne"
                    ? "काठमाडौँ र थोर्गामा आकस्मिक स्वास्थ्य उपचार तथा प्राकृतिक विपद्को समयमा तत्काल आर्थिक तथा भौतिक सहयोग।"
                    : "Emergency healthcare support, patient assistance, and disaster relief for families in need."}
                </p>
              </div>
              <span className="font-mono text-[11px] font-bold text-accent">01 / WELFARE</span>
            </article>

            {/* Pillar 02 */}
            <article className="rounded-card border border-line bg-surface p-6 flex flex-col justify-between space-y-4 hover:border-accent transition-all group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-control bg-accent-soft text-accent flex items-center justify-center">
                  <GraduationCap size={26} weight="duotone" />
                </div>
                <h3 className="text-lg font-bold text-fg">
                  {lang === "ne" ? "शिक्षा तथा छात्रवृत्ति" : "Scholarships & Youth"}
                </h3>
                <p className="text-xs leading-relaxed text-muted">
                  {lang === "ne"
                    ? "थोर्गाका जेहेन्दार तथा विपन्न विद्यार्थीहरूका लागि वार्षिक छात्रवृत्ति तथा करियर काउन्सिलिङ कार्यक्रम।"
                    : "Annual merit scholarships, school library aids, and higher education mentorship for village students."}
                </p>
              </div>
              <span className="font-mono text-[11px] font-bold text-accent">02 / EDUCATION</span>
            </article>

            {/* Pillar 03 */}
            <article className="rounded-card border border-line bg-surface p-6 flex flex-col justify-between space-y-4 hover:border-accent transition-all group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-control bg-accent-soft text-accent flex items-center justify-center">
                  <Buildings size={26} weight="duotone" />
                </div>
                <h3 className="text-lg font-bold text-fg">
                  {lang === "ne" ? "गाउँ विकास पूर्वाधार" : "Rural Infrastructure"}
                </h3>
                <p className="text-xs leading-relaxed text-muted">
                  {lang === "ne"
                    ? "खानेपानी, सडक स्तरोन्नति, सामुदायिक भवन निर्माण तथा स्थानीय स्वास्थ्य चौकी सहयोगमा निरन्तर पैरवी।"
                    : "Liaison for drinking water supply, road accessibility, and community health post equipment in Thorga."}
                </p>
              </div>
              <span className="font-mono text-[11px] font-bold text-accent">03 / VILLAGE</span>
            </article>

            {/* Pillar 04 */}
            <article className="rounded-card border border-line bg-surface p-6 flex flex-col justify-between space-y-4 hover:border-accent transition-all group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-control bg-accent-soft text-accent flex items-center justify-center">
                  <Tree size={26} weight="duotone" />
                </div>
                <h3 className="text-lg font-bold text-fg">
                  {lang === "ne" ? "सांस्कृतिक संरक्षण" : "Heritage & Culture"}
                </h3>
                <p className="text-xs leading-relaxed text-muted">
                  {lang === "ne"
                    ? "रुरु क्षेत्रको धार्मिक तथा ऐतिहासिक गरिमा संरक्षण, स्मारिका प्रकाशन तथा मौलिक चाडपर्व मिलन।"
                    : "Preserving Ruru area cultural traditions, historic landmarks, publishing souvenirs, and annual festivals."}
                </p>
              </div>
              <span className="font-mono text-[11px] font-bold text-accent">04 / CULTURE</span>
            </article>
          </div>
        </div>
      </section>

      {/* SECTION 3: EXECUTIVE COMMITTEE */}
      <section id="members" className="py-20 border-b border-line bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold tracking-tight text-fg">
                {lang === "ne" ? "वर्तमान कार्यसमिति (२०८१ देखि २०८४)" : "Executive Committee (2024 to 2027)"}
              </h2>
              <p className="text-sm text-muted max-w-[60ch]">
                {lang === "ne"
                  ? "संस्थाको नीति निर्माण तथा दैनिक कार्य सञ्चालन गर्ने निर्वाचित कार्यसमिति"
                  : "Elected leadership overseeing social programs, finances, and village coordination"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCommitteeFilter("current")}
                className={`px-3.5 py-1.5 rounded-control text-xs font-semibold transition-colors ${
                  committeeFilter === "current"
                    ? "bg-accent text-on-accent shadow-sm"
                    : "bg-surface border border-line text-fg hover:bg-tint"
                }`}
              >
                {lang === "ne" ? "वर्तमान कार्यसमिति" : "Current Committee"}
              </button>
              <button
                type="button"
                onClick={() => setCommitteeFilter("advisor")}
                className={`px-3.5 py-1.5 rounded-control text-xs font-semibold transition-colors ${
                  committeeFilter === "advisor"
                    ? "bg-accent text-on-accent shadow-sm"
                    : "bg-surface border border-line text-fg hover:bg-tint"
                }`}
              >
                {lang === "ne" ? "सल्लाहकार परिषद्" : "Advisors"}
              </button>
              <button
                type="button"
                onClick={() => setCommitteeFilter("all")}
                className={`px-3.5 py-1.5 rounded-control text-xs font-semibold transition-colors ${
                  committeeFilter === "all"
                    ? "bg-accent text-on-accent shadow-sm"
                    : "bg-surface border border-line text-fg hover:bg-tint"
                }`}
              >
                {lang === "ne" ? "सबै सदस्यहरू" : "All Members"}
              </button>
              <Link
                href="/committee"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-sm transition-colors ml-2"
              >
                <span>{lang === "ne" ? "पूर्ण सूची" : "Full Directory"}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {filteredCommitteeMembers.length === 0 ? (
            <div className="rounded-card border border-dashed border-line p-12 text-center space-y-2">
              <Users size={32} className="text-accent mx-auto" weight="duotone" />
              <p className="text-sm font-semibold text-fg">
                {lang === "ne" ? "यस वर्गमा कुनै सदस्य छैन" : "No members in this category yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredCommitteeMembers.slice(0, 8).map((member) => (
                <article
                  key={member.id}
                  className="rounded-card border border-line bg-ground overflow-hidden flex flex-col justify-between hover:border-accent hover:shadow-sm transition-all group"
                >
                  {/* Top Portrait Photo Frame - Compact Height */}
                  <div className="relative h-44 w-full bg-tint overflow-hidden">
                    <Portrait
                      member={member}
                      lang={lang}
                      sizeClass="w-full h-full"
                      textClass="text-3xl"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-block px-2 py-0.5 rounded-chip text-[11px] font-bold bg-accent text-on-accent shadow-sm">
                        {lang === "ne" ? member.roleNe : member.roleEn}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Details Content */}
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-0.5">
                      <h3 className="text-[15px] font-bold text-fg group-hover:text-accent transition-colors leading-snug">
                        {lang === "ne" ? member.nameNe : member.nameEn}
                      </h3>
                      <div className="text-[11px] font-semibold text-accent truncate">
                        {lang === "ne" ? member.nameEn : member.nameNe}
                      </div>
                      {member.bioNe && (
                        <p className="text-xs leading-relaxed text-muted line-clamp-2 pt-1">
                          {lang === "ne" ? member.bioNe : member.bioEn}
                        </p>
                      )}
                    </div>

                    {/* Contact Footer */}
                    {(member.phone || member.email) && (
                      <div className="pt-2 border-t border-line flex flex-col gap-1 text-[11px] text-muted">
                        {member.phone && (
                          <a
                            href={`tel:${member.phone}`}
                            className="flex items-center gap-1.5 hover:text-accent font-mono transition-colors"
                          >
                            <Phone size={12} className="text-accent flex-shrink-0" />
                            <span className="truncate">{member.phone}</span>
                          </a>
                        )}
                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            className="flex items-center gap-1.5 hover:text-accent transition-colors"
                          >
                            <EnvelopeSimple size={12} className="text-accent flex-shrink-0" />
                            <span className="truncate">{member.email}</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>


      {/* SECTION 4: PUBLICATIONS SHOWCASE */}
      <section className="py-20 border-b border-line bg-ground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-chip bg-accent-soft text-accent text-xs font-semibold">
                <BookOpen size={16} weight="duotone" />
                <span>{lang === "ne" ? "वार्षिक स्मारिका तथा मुखपत्र" : "Souvenirs & Publications"}</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-fg">
                {lang === "ne" ? "प्रकाशन तथा दस्तावेज सङ्ग्रह" : "Publications & PDF Archive"}
              </h2>
              <p className="text-sm text-muted max-w-[60ch]">
                {lang === "ne"
                  ? "संस्थाका वार्षिक स्मारिकाहरू, विधान तथा आधिकारिक लेखा प्रतिवेदन डाउनलोड गर्नुहोस्"
                  : "Download official annual souvenirs, constitution bylaws, and certified audit reports"}
              </p>
            </div>

            <Link
              href="/publications"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-sm transition-colors"
            >
              <span>{lang === "ne" ? "सबै प्रकाशनहरू हेर्नुहोस्" : "View All Publications"}</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {publicationsShowcase.map((pub) => (
              <article
                key={pub.id}
                className="rounded-card border border-line bg-surface overflow-hidden flex flex-col justify-between hover:border-accent transition-all group"
              >
                <div className="relative h-48 w-full p-4 flex items-center justify-center bg-tint overflow-hidden">
                  {pub.coverImageUrl && (
                    <Image
                      src={pub.coverImageUrl}
                      alt={pub.titleEn}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover opacity-40 group-hover:opacity-60 transition-opacity"
                    />
                  )}
                  <div className="relative z-10 w-36 h-40 rounded-control shadow-md p-3 flex flex-col justify-between bg-surface border border-line">
                    <FileText size={22} className="text-accent" weight="duotone" />
                    <div className="text-[11px] font-bold text-fg line-clamp-2">
                      {lang === "ne" ? pub.titleNe : pub.titleEn}
                    </div>
                    <div className="text-[9px] text-muted font-mono flex justify-between border-t border-line pt-1">
                      <span>{pub.pages} Pgs</span>
                      <span>{pub.fileSize}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-[11px] font-semibold text-accent">
                      {lang === "ne" ? pub.categoryNe : pub.categoryEn}
                    </div>
                    <h3 className="text-sm font-bold text-fg leading-snug mt-0.5">
                      {lang === "ne" ? pub.titleNe : pub.titleEn}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-line flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActivePdfPreview(pub)}
                      className="flex-1 py-1.5 px-2 rounded-control text-xs font-semibold flex items-center justify-center gap-1 bg-tint hover:bg-accent-soft text-fg transition-colors"
                    >
                      <Eye size={14} />
                      <span>{lang === "ne" ? "हेर्नुहोस्" : "Preview"}</span>
                    </button>
                    <a
                      href={pub.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 px-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Download size={14} />
                      <span>{lang === "ne" ? "डाउनलोड" : "Download"}</span>
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: EVENTS & SOCIAL PROGRAMS SHOWCASE */}
      <section className="py-20 border-b border-line bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-chip bg-accent-soft text-accent text-xs font-semibold">
                <Calendar size={16} weight="duotone" />
                <span>{lang === "ne" ? "आगामी कार्यक्रम" : "Upcoming Gatherings"}</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-fg">
                {lang === "ne" ? "कार्यक्रम तथा गतिविधिहरू" : "Events & Social Programs"}
              </h2>
              <p className="text-sm text-muted max-w-[60ch]">
                {lang === "ne"
                  ? "काठमाडौँ तथा थोर्गा गाउँमा आयोजना हुने आगामी कार्यक्रमहरू"
                  : "Community gatherings, general assemblies, health camps, and cultural events"}
              </p>
            </div>

            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-sm transition-colors"
            >
              <span>{lang === "ne" ? "सबै कार्यक्रम हेर्नुहोस्" : "View Full Events Calendar"}</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingEventsShowcase.map((event) => (
              <article
                key={event.id}
                className="rounded-card border border-line bg-ground overflow-hidden flex flex-col sm:flex-row hover:border-accent transition-all group"
              >
                <div className="sm:w-48 relative h-44 sm:h-auto flex-shrink-0 bg-tint">
                  <Image
                    src={event.imageUrl}
                    alt={event.titleEn}
                    fill
                    sizes="(max-width: 640px) 100vw, 192px"
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-chip bg-surface text-[10px] font-bold text-accent shadow-sm">
                    {lang === "ne" ? event.categoryNe : event.categoryEn}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-accent">
                      <Calendar size={14} />
                      <span>{lang === "ne" ? event.dateNe : event.dateEn}</span>
                    </div>
                    <h3 className="text-base font-bold text-fg leading-snug">
                      {lang === "ne" ? event.titleNe : event.titleEn}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted line-clamp-2">
                      {lang === "ne" ? event.descriptionNe : event.descriptionEn}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-line text-xs text-muted flex items-center gap-1.5">
                    <MapPin size={14} className="text-accent flex-shrink-0" />
                    <span>{lang === "ne" ? event.locationNe : event.locationEn}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: PHOTO GALLERY SHOWCASE */}
      <section className="py-20 border-b border-line bg-ground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-chip bg-accent-soft text-accent text-xs font-semibold">
                <Sparkle size={16} weight="duotone" />
                <span>{lang === "ne" ? "तस्बिर सङ्ग्रह" : "Photo Gallery"}</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-fg">
                {lang === "ne" ? "सामाजिक कार्य तथा दृश्य अभिलेख" : "Community Action Visual Archive"}
              </h2>
              <p className="text-sm text-muted max-w-[60ch]">
                {lang === "ne"
                  ? "थोर्गा गाउँ तथा काठमाडौँमा सञ्चालन गरिएका विभिन्न गतिविधिहरूका झलकहरू"
                  : "Moments from our rural development projects, gatherings, and youth welfare initiatives"}
              </p>
            </div>

            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-sm transition-colors"
            >
              <span>{lang === "ne" ? "सबै तस्बिरहरू हेर्नुहोस्" : "Explore Full Gallery"}</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryShowcase.map((item) => (
              <Link
                key={item.id}
                href="/gallery"
                className="relative h-64 rounded-card overflow-hidden border border-line bg-surface group shadow-sm hover:border-accent transition-all"
              >
                <Image
                  src={item.imageUrl}
                  alt={item.titleEn}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-75 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 inset-x-0 p-5 space-y-1 text-white">
                  <div className="text-[10px] font-bold text-accent">{item.categoryEn}</div>
                  <h3 className="text-sm font-bold leading-snug line-clamp-2">
                    {lang === "ne" ? item.titleNe : item.titleEn}
                  </h3>
                  <div className="text-[11px] text-white/80 font-mono">
                    {lang === "ne" ? item.dateNe : item.dateEn}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: CONTACT & LIAISON SECRETARIAT */}
      <section id="contact" className="py-20 border-b border-line bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Top Section Header */}
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-chip bg-accent-soft text-accent text-xs font-semibold">
              <EnvelopeSimple size={16} weight="duotone" />
              <span>{lang === "ne" ? "सम्पर्क तथा सचिवालय" : "Secretariat Liaison"}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
              {lang === "ne" ? "सम्पर्क तथा सदस्यता सोधपुछ" : "Contact & Membership Inquiries"}
            </h2>
            <p className="text-base text-muted max-w-[65ch] leading-relaxed">
              {lang === "ne"
                ? "नयाँ सदस्यता, आजीवन सदस्यता वा संस्थागत सहकार्यका लागि सम्पर्क फाराम भर्नुहोस् वा सिधै सचिवालयमा सम्पर्क गर्नुहोस्।"
                : "Fill in the details below for membership inquiries or organizational partnerships, or reach out directly to our liaison secretariat."}
            </p>
          </div>

          {/* Symmetrical Two-Column Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Contact Form */}
            <div className="lg:col-span-7">
              {contactSubmitted ? (
                <div className="rounded-card border border-accent/40 bg-accent-soft p-8 text-center space-y-4">
                  <CheckCircle size={48} className="text-accent mx-auto" weight="duotone" />
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-fg">
                      {lang === "ne" ? "सन्देश सफलतापूर्वक प्राप्त भयो!" : "Message Received Successfully!"}
                    </h3>
                    <p className="text-xs text-muted max-w-md mx-auto">
                      {lang === "ne"
                        ? "हाम्रो सम्पर्क सचिवालयले तपाईंलाई चाँडै सम्पर्क गर्नेछ। धन्यवाद।"
                        : "Our liaison secretariat will review your message and contact you shortly. Thank you."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setContactSubmitted(false)}
                    className="px-5 py-2.5 rounded-control bg-accent text-on-accent text-xs font-semibold shadow-sm hover:bg-accent-hover transition-colors"
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
                  className="rounded-card border border-line bg-ground p-6 sm:p-8 space-y-5 shadow-sm"
                >
                  <div className="text-sm font-bold text-fg border-b border-line pb-3 flex items-center justify-between">
                    <span>{lang === "ne" ? "सम्पर्क फाराम" : "Online Inquiry Form"}</span>
                    <span className="text-[11px] text-accent font-normal">{lang === "ne" ? "* अनिवार्य विवरण" : "* Required fields"}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">
                        {lang === "ne" ? "पूरा नाम" : "Full Name"} *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder={lang === "ne" ? "तपाईंको नाम" : "Your full name"}
                        className="w-full px-3.5 py-2.5 rounded-control border border-line bg-surface text-fg text-xs focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">
                        {lang === "ne" ? "सम्पर्क नम्बर" : "Phone Number"} *
                      </label>
                      <input
                        required
                        type="tel"
                        placeholder="+977 98..."
                        className="w-full px-3.5 py-2.5 rounded-control border border-line bg-surface text-fg text-xs focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">
                      {lang === "ne" ? "इमेल ठेगाना" : "Email Address"}
                    </label>
                    <input
                      type="email"
                      placeholder="example@mail.com"
                      className="w-full px-3.5 py-2.5 rounded-control border border-line bg-surface text-fg text-xs focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">
                      {lang === "ne" ? "सन्देश वा जिज्ञासा" : "Message / Query"} *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder={lang === "ne" ? "तपाईंको जिज्ञासा यहाँ लेख्नुहोस्..." : "Write your query here..."}
                      className="w-full px-3.5 py-2.5 rounded-control border border-line bg-surface text-fg text-xs focus:border-accent"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <EnvelopeSimple size={16} />
                    <span>{lang === "ne" ? "सन्देश पठाउनुहोस्" : "Submit Inquiry"}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Right Column: Liaison Offices & Direct Channels */}
            <div className="lg:col-span-5 space-y-4">
              {/* Kathmandu Secretariat Card */}
              <div className="rounded-card border border-line bg-ground p-6 space-y-3 shadow-sm hover:border-accent transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-control bg-accent-soft text-accent flex items-center justify-center flex-shrink-0">
                    <Buildings size={20} weight="duotone" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-fg">
                      {lang === "ne" ? "काठमाडौँ सम्पर्क सचिवालय" : "Kathmandu Secretariat"}
                    </div>
                    <div className="text-[11px] text-accent font-semibold">
                      {lang === "ne" ? "केन्द्रीय सम्पर्क कार्यालय" : "Main Liaison Secretariat"}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted space-y-2 pt-2 border-t border-line">
                  <div className="flex items-start gap-2">
                    <MapPin size={15} className="text-accent flex-shrink-0 mt-0.5" />
                    <span>
                      {lang === "ne"
                        ? "शंखमूल मार्ग, नयाँ बानेश्वर, काठमाडौँ, नेपाल"
                        : "Shankhamul Marg, New Baneshwor, Kathmandu, Nepal"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={15} className="text-accent flex-shrink-0" />
                    <a href="tel:+977014481234" className="hover:text-accent font-mono text-fg">
                      +977 01-4481234, 9851012345
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <EnvelopeSimple size={15} className="text-accent flex-shrink-0" />
                    <a href="mailto:info@thorgaktm.org.np" className="hover:text-accent text-fg">
                      info@thorgaktm.org.np
                    </a>
                  </div>
                </div>
              </div>

              {/* Thorga Village Center Card */}
              <div className="rounded-card border border-line bg-ground p-6 space-y-3 shadow-sm hover:border-accent transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-control bg-accent-soft text-accent flex items-center justify-center flex-shrink-0">
                    <MapPin size={20} weight="duotone" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-fg">
                      {lang === "ne" ? "थोर्गा गाउँ सम्पर्क केन्द्र" : "Thorga Village Center"}
                    </div>
                    <div className="text-[11px] text-accent font-semibold">
                      {lang === "ne" ? "गृहजिल्ला समन्वय केन्द्र" : "Village Coordination Hub"}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted space-y-2 pt-2 border-t border-line">
                  <div className="flex items-start gap-2">
                    <MapPin size={15} className="text-accent flex-shrink-0 mt-0.5" />
                    <span>
                      {lang === "ne"
                        ? "थोर्गा बजार, रुरुक्षेत्र-२, गुल्मी, लुम्बिनी प्रदेश"
                        : "Thorga Bazaar, Ruru Kshetra-2, Gulmi, Lumbini Province"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={15} className="text-accent flex-shrink-0" />
                    <a href="tel:+977079520123" className="hover:text-accent font-mono text-fg">
                      +977 079-520123
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* PDF PREVIEW MODAL */}
      {activePdfPreview && (
        <div className="fixed inset-0 z-50 bg-fg/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded-card max-w-2xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2 truncate">
                <FileText size={22} className="text-accent flex-shrink-0" weight="duotone" />
                <h3 className="text-base font-bold text-fg truncate">
                  {lang === "ne" ? activePdfPreview.titleNe : activePdfPreview.titleEn}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePdfPreview(null)}
                className="p-1 rounded-chip text-muted hover:text-fg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 text-center space-y-4 bg-tint rounded-card border border-line">
              <FileText size={44} className="text-accent mx-auto" weight="duotone" />
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-fg">
                  {lang === "ne" ? activePdfPreview.titleNe : activePdfPreview.titleEn}
                </h4>
                <div className="text-xs text-muted font-mono">
                  {activePdfPreview.fileSize} · {activePdfPreview.pages} Pages · {activePdfPreview.publishedYearEn}
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted max-w-md mx-auto">
                {lang === "ne" ? activePdfPreview.descriptionNe : activePdfPreview.descriptionEn}
              </p>
              <a
                href={activePdfPreview.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-sm"
              >
                <Download size={16} />
                <span>{lang === "ne" ? "पूर्ण PDF दस्तावेज डाउनलोड गर्नुहोस्" : "Download Complete PDF"}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      <SiteFooter lang={lang} />
    </div>
  );
}
