"use client";

import React, { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Member,
  Publication,
  Language,
  EventItem,
  GalleryItem,
  HeroContent,
  BrandingSettings,
  ContactSettings,
  getStoredLanguage,
  subscribeHeroContent,
  getStoredHeroSnapshot,
  getServerHeroSnapshot,
  saveStoredHeroContent,
  subscribeContactSettings,
  getStoredContactSettingsSnapshot,
  getServerContactSettingsSnapshot,
  saveStoredContactSettings,
  saveStoredBranding,
  subscribeMembers,
  getStoredMembersSnapshot,
  getServerMembersSnapshot,
  saveStoredMembers,
  subscribeEvents,
  getStoredEventsSnapshot,
  getServerEventsSnapshot,
  saveStoredEvents,
  subscribePublications,
  getStoredPublicationsSnapshot,
  getServerPublicationsSnapshot,
  saveStoredPublications,
  subscribeGallery,
  getStoredGallerySnapshot,
  getServerGallerySnapshot,
  saveStoredGallery,
  GalleryAlbum,
  subscribeGalleryAlbums,
  getStoredGalleryAlbumsSnapshot,
  getServerGalleryAlbumsSnapshot,
  saveStoredGalleryAlbums,
} from "@/data/mockData";
import { useRemoteData } from "@/hooks/useRemoteData";
import { documentUrl } from "@/lib/documentUrl";
import { PdfModalViewer } from "@/components/PdfModalViewer";
import { DataStatus } from "@/components/DataStatus";
import { HeroCarousel, type HeroSlide } from "@/components/HeroCarousel";
import {
  isValidName,
  isValidPhone,
  isValidEmail,
  isValidMessage,
  isValidImageSrc,
} from "@/lib/validation";
import { useDialog } from "@/components/Dialog";
import { useToast } from "@/components/Toast";
import {
  Users,
  BookOpen,
  Calendar,
  Clock,
  Phone,
  FileText,
  Download,
  Eye,
  CheckCircle,
  Buildings,
  MapPin,
  EnvelopeSimple,
  ArrowRight,
  Sparkle,
  X,
  UsersThree,
  Bank,
  HandHeart,
  TrendUp,
  ArrowsOut,
  ArrowSquareOut,
  Images,
} from "@phosphor-icons/react";
import {
  isGoogleDriveUrl,
  getGoogleDrivePreviewUrl,
  getGoogleDriveViewUrl,
  getGoogleDriveDownloadUrl,
} from "@/lib/googleDrive";

/**
 * The forum's four stated areas of work. Parallel concerns that run at the
 * same time, so they carry no numbering.
 */
const PILLARS = [
  {
    icon: UsersThree,
    titleNe: "समुदाय र सम्बन्ध",
    titleEn: "Community and Kinship",
    bodyNe: "काठमाडौँमा रहेका थोर्गाबासीहरूबीच एकता र आत्मीय सम्बन्ध अभिवृद्धि गर्ने।",
    bodyEn: "Building unity and close ties among Thorga families living in Kathmandu.",
  },
  {
    icon: Bank,
    titleNe: "संस्कृति र सम्पदा",
    titleEn: "Culture and Heritage",
    bodyNe: "हाम्रा मौलिक परम्परा, सांस्कृतिक पहिचान र सम्पदाको संरक्षण गर्ने।",
    bodyEn: "Protecting our traditions, cultural identity and heritage.",
  },
  {
    icon: HandHeart,
    titleNe: "पारस्परिक सहयोग",
    titleEn: "Mutual Support",
    bodyNe: "सुख-दुःखमा एकआपसमा उभिँदै आवश्यक परेका सदस्यहरूलाई सहयोग पुऱ्याउने।",
    bodyEn: "Standing by one another in good times and hard, and supporting members in need.",
  },
  {
    icon: TrendUp,
    titleNe: "विकास",
    titleEn: "Development",
    bodyNe: "गाउँ तथा समुदायको सामाजिक उन्नति र विकासका कार्यहरूमा योगदान दिने।",
    bodyEn: "Contributing to the social progress and development of the village and community.",
  },
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

function hasRealPhoto(url?: string) {
  return Boolean(url) && isValidImageSrc(url) && !url!.includes("images.unsplash.com");
}

function Portrait({
  member,
  lang,
  sizeClass,
  textClass,
  imgFit = "contain",
}: {
  member: Member;
  lang: Language;
  sizeClass: string;
  textClass: string;
  imgFit?: "cover" | "contain";
}) {
  const name = lang === "ne" ? member.nameNe : member.nameEn;

  if (hasRealPhoto(member.photoUrl)) {
    return (
      <div className={`relative overflow-hidden ${sizeClass}`}>
        <Image
          src={member.photoUrl}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, 300px"
          className="object-contain"
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
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const members = useSyncExternalStore(
    subscribeMembers,
    getStoredMembersSnapshot,
    getServerMembersSnapshot
  );
  const events = useSyncExternalStore(
    subscribeEvents,
    getStoredEventsSnapshot,
    getServerEventsSnapshot
  );
  const publications = useSyncExternalStore(
    subscribePublications,
    getStoredPublicationsSnapshot,
    getServerPublicationsSnapshot
  );
  const gallery = useSyncExternalStore(
    subscribeGallery,
    getStoredGallerySnapshot,
    getServerGallerySnapshot
  );
  const heroContent = useSyncExternalStore(
    subscribeHeroContent,
    getStoredHeroSnapshot,
    getServerHeroSnapshot
  );
  const contactSettings = useSyncExternalStore(
    subscribeContactSettings,
    getStoredContactSettingsSnapshot,
    getServerContactSettingsSnapshot
  );

  // Synchronize dynamic collections and settings from Supabase database
  useRemoteData<HeroContent>("/api/hero", saveStoredHeroContent);
  useRemoteData<BrandingSettings>("/api/branding", saveStoredBranding);
  useRemoteData<ContactSettings>("/api/contact", saveStoredContactSettings);
  const membersRemote = useRemoteData<Member[]>("/api/members", saveStoredMembers);
  useRemoteData<EventItem[]>("/api/events", saveStoredEvents);
  useRemoteData<Publication[]>("/api/publications", saveStoredPublications);
  useRemoteData<GalleryItem[]>("/api/gallery", saveStoredGallery);
  const albums = useSyncExternalStore(
    subscribeGalleryAlbums,
    getStoredGalleryAlbumsSnapshot,
    getServerGalleryAlbumsSnapshot
  );
  useRemoteData<GalleryAlbum[]>("/api/gallery/albums", saveStoredGalleryAlbums);

  const [activePdfPreview, setActivePdfPreview] = useState<Publication | null>(null);
  const [selectedEventModal, setSelectedEventModal] = useState<EventItem | null>(null);
  const [zoomedEventImageUrl, setZoomedEventImageUrl] = useState<{ url: string; title: string } | null>(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string; email?: string; message?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean; phone?: boolean; email?: boolean; message?: boolean }>({});
  const [committeeFilter, setCommitteeFilter] = useState<"current" | "officials" | "advisor" | "all">("current");
  const { alert: dialogAlert } = useDialog();
  const toast = useToast();
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

  const validateField = (field: "name" | "phone" | "email" | "message", value: string) => {
    let error: string | undefined = undefined;
    if (field === "name") {
      if (!value.trim()) {
        error = lang === "ne" ? "कृपया आफ्नो पूरा नाम लेख्नुहोस्।" : "Full name is required.";
      } else if (!isValidName(value)) {
        error = lang === "ne" ? "नाम कम्तिमा २ अक्षरको हुनुपर्छ।" : "Name must be at least 2 characters.";
      }
    } else if (field === "phone") {
      if (!value.trim()) {
        error = lang === "ne" ? "कृपया आफ्नो सम्पर्क नम्बर लेख्नुहोस्।" : "Phone number is required.";
      } else if (!isValidPhone(value)) {
        error = lang === "ne" ? "कृपया मान्य फोन नम्बर लेख्नुहोस् (उदा. 9851012345)।" : "Please enter a valid phone number.";
      }
    } else if (field === "email") {
      if (value.trim() && !isValidEmail(value)) {
        error = lang === "ne" ? "कृपया मान्य इमेल ठेगाना लेख्नुहोस् (उदा. name@example.com)।" : "Please enter a valid email address.";
      }
    } else if (field === "message") {
      if (!value.trim()) {
        error = lang === "ne" ? "कृपया आफ्नो सन्देश वा जिज्ञासा लेख्नुहोस्।" : "Message is required.";
      } else if (!isValidMessage(value, 10)) {
        error = lang === "ne" ? "सन्देश कम्तिमा १० अक्षरको हुनुपर्छ।" : "Message must be at least 10 characters long.";
      }
    }

    setFormErrors((prev) => ({ ...prev, [field]: error }));
    return error;
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingInquiry) return;
    setTouched({ name: true, phone: true, email: true, message: true });

    const errName = validateField("name", inquiryForm.name);
    const errPhone = validateField("phone", inquiryForm.phone);
    const errEmail = validateField("email", inquiryForm.email);
    const errMessage = validateField("message", inquiryForm.message);

    if (errName || errPhone || errEmail || errMessage) {
      dialogAlert({
        title: lang === "ne" ? "फाराम विवरण अपूर्ण छ" : "Incomplete Form Details",
        description:
          lang === "ne"
            ? "कृपया फाराममा देखिएका त्रुटिहरू सच्याएर पुनः प्रयास गर्नुहोस्।"
            : "Please correct the highlighted errors before submitting.",
        type: "warning",
      });
      return;
    }

    setIsSubmittingInquiry(true);
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inquiryForm.name.trim(),
          phone: inquiryForm.phone.trim(),
          email: inquiryForm.email.trim(),
          message: inquiryForm.message.trim(),
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        // The form keeps its contents so nothing the visitor typed is lost.
        toast.error(
          lang === "ne" ? "सन्देश पठाउन सकिएन" : "Message could not be sent",
          result?.error ||
            (lang === "ne"
              ? "कृपया पुनः प्रयास गर्नुहोस् वा सचिवालयमा फोन गर्नुहोस्।"
              : "Please try again, or call the secretariat directly.")
        );
        return;
      }

      setContactSubmitted(true);
      setInquiryForm({ name: "", phone: "", email: "", message: "" });
      setFormErrors({});
      setTouched({});
      toast.success(
        lang === "ne" ? "सन्देश प्राप्त भयो" : "Inquiry submitted",
        lang === "ne"
          ? "तपाईंको सन्देश सचिवालयमा दर्ता भयो। हामी छिट्टै सम्पर्क गर्नेछौं।"
          : "Your message has reached the secretariat. We will be in touch shortly."
      );
    } catch {
      toast.error(
        lang === "ne" ? "सञ्जाल त्रुटि" : "Network error",
        lang === "ne"
          ? "इन्टरनेट जडान जाँच गरी पुनः प्रयास गर्नुहोस्।"
          : "Check your connection and try again."
      );
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  // Filtered members for Executive Committee section
  const filteredCommitteeMembers = members.filter((m) => {
    if (m.committeeType === "past") return false;
    if (committeeFilter === "all") return true;
    return m.committeeType === committeeFilter;
  });

  // Curated showcase subsets
  const publicationsShowcase = publications.slice(0, 3);
  const eventsShowcase = [
    ...events.filter((e) => e.status === "completed"),
    ...events.filter((e) => e.status === "upcoming"),
  ].slice(0, 2);
  const galleryShowcase = gallery.slice(0, 3);

  const heroSlides: HeroSlide[] = [
    ...(isValidImageSrc(heroContent.imageUrl)
      ? [
          {
            id: "hero-primary",
            imageUrl: heroContent.imageUrl,
            titleNe: heroContent.titleNe,
            titleEn: heroContent.titleEn,
            captionNe: heroContent.imageCaptionNe,
            captionEn: heroContent.imageCaptionEn,
          },
        ]
      : []),
    ...gallery
      .filter((item) => isValidImageSrc(item.imageUrl))
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        imageUrl: item.imageUrl,
        titleNe: item.titleNe,
        titleEn: item.titleEn,
        captionNe: item.titleNe,
        captionEn: item.titleEn,
      })),
  ];

  return (
    <div className="min-h-[100dvh] bg-ground text-fg font-sans selection:bg-accent selection:text-on-accent">
      <SiteHeader lang={lang} setLang={setLang} />
      <DataStatus error={membersRemote.error} refetch={membersRemote.refetch} lang={lang} />

      {/* SECTION 1: HERO CAROUSEL (full bleed, institutional portal style) */}
      <HeroCarousel slides={heroSlides} lang={lang} />

      <h1 className="sr-only">
        {lang === "ne" ? heroContent.titleNe : heroContent.titleEn}
      </h1>

      {/* SECTION 2: OBJECTIVES & CORE PILLARS */}
      <section id="about" className="py-20 sm:py-28 rule-soft bg-ground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl space-y-4">
            <h2 className="type-section text-fg">
              {lang === "ne" ? "उद्देश्य तथा कार्यक्षेत्र" : "Objectives and Core Pillars"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS.map((pillar) => (
              <article
                key={pillar.titleEn}
                className="rounded-card border border-line bg-surface p-7 flex flex-col gap-3 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-e2"
              >
                <div className="text-accent">
                  <pillar.icon size={26} weight="duotone" />
                </div>
                <h3 className="text-lg font-bold text-fg">
                  {lang === "ne" ? pillar.titleNe : pillar.titleEn}
                </h3>
                <p className="text-[13px] leading-[1.75] text-muted">
                  {lang === "ne" ? pillar.bodyNe : pillar.bodyEn}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: LEADERSHIP */}
      <section id="members" className="py-16 sm:py-20 rule-soft bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <h2 className="type-section text-fg">
                {lang === "ne" ? "हाम्रो नेतृत्व" : "Our Leadership"}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCommitteeFilter("current")}
                className={`px-3.5 py-1.5 rounded-control text-xs font-semibold transition-colors ${
                  committeeFilter === "current"
                    ? "bg-accent text-on-accent shadow-e1"
                    : "bg-surface border border-line text-fg hover:bg-tint"
                }`}
              >
                {lang === "ne" ? "हाम्रो नेतृत्व" : "Our Leadership"}
              </button>
              <button
                type="button"
                onClick={() => setCommitteeFilter("officials")}
                className={`px-3.5 py-1.5 rounded-control text-xs font-semibold transition-colors ${
                  committeeFilter === "officials"
                    ? "bg-accent text-on-accent shadow-e1"
                    : "bg-surface border border-line text-fg hover:bg-tint"
                }`}
              >
                {lang === "ne" ? "वर्तमान कार्यसमिति" : "Current Executive Committee"}
              </button>
              <button
                type="button"
                onClick={() => setCommitteeFilter("advisor")}
                className={`px-3.5 py-1.5 rounded-control text-xs font-semibold transition-colors ${
                  committeeFilter === "advisor"
                    ? "bg-accent text-on-accent shadow-e1"
                    : "bg-surface border border-line text-fg hover:bg-tint"
                }`}
              >
                {lang === "ne" ? "सल्लाहकार परिषद्" : "Advisory Council"}
              </button>
              <button
                type="button"
                onClick={() => setCommitteeFilter("all")}
                className={`px-3.5 py-1.5 rounded-control text-xs font-semibold transition-colors ${
                  committeeFilter === "all"
                    ? "bg-accent text-on-accent shadow-e1"
                    : "bg-surface border border-line text-fg hover:bg-tint"
                }`}
              >
                {lang === "ne" ? "सबै सदस्यहरू" : "All Members"}
              </button>
              <Link
                href="/committee"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-e1 transition-colors ml-2"
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
                  className="rounded-card border border-line bg-ground overflow-hidden flex flex-col justify-between hover:border-accent hover:shadow-e1 transition-all group"
                >
                  {/* Top Portrait Photo Frame - Full Uncropped Image */}
                  <div className="relative h-64 sm:h-72 w-full bg-tint/60 overflow-hidden flex items-center justify-center p-2">
                    <Portrait
                      member={member}
                      lang={lang}
                      sizeClass="w-full h-full"
                      textClass="text-3xl"
                      imgFit="contain"
                    />
                    {member.committeeType !== "advisor" &&
                      member.roleNe !== "सल्लाहकार" &&
                      member.roleEn !== "Advisor" &&
                      member.roleNe &&
                      member.roleNe !== "." &&
                      member.roleNe !== "।" && (
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <span className="inline-block px-2.5 py-1 rounded-chip text-[11px] font-bold bg-accent text-on-accent shadow-e1">
                            {lang === "ne" ? member.roleNe : member.roleEn}
                          </span>
                        </div>
                      )}
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
      <section className="py-16 sm:py-24 rule-soft bg-ground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <h2 className="type-section text-fg">
                {lang === "ne" ? "प्रकाशन तथा दस्तावेज सङ्ग्रह" : "Publications & PDF Archive"}
              </h2>
            </div>

            <Link
              href="/publications"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-e1 transition-colors"
            >
              <span>{lang === "ne" ? "सबै प्रकाशनहरू हेर्नुहोस्" : "View All Publications"}</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {publicationsShowcase.length === 0 ? (
            <div className="rounded-card border border-dashed border-line p-12 text-center space-y-2 bg-surface">
              <BookOpen size={32} className="text-accent mx-auto" weight="duotone" />
              <p className="text-sm font-semibold text-fg">
                {lang === "ne" ? "हाल कुनै नयाँ प्रकाशन उपलब्ध छैन" : "No publications uploaded yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {publicationsShowcase.map((pub) => (
                <article
                  key={pub.id}
                  className="rounded-card border border-line bg-surface overflow-hidden flex flex-col justify-between hover:border-accent transition-all group"
                >
                  <div className="relative h-48 w-full p-4 flex items-center justify-center bg-tint overflow-hidden">
                    {pub.coverImageUrl && isValidImageSrc(pub.coverImageUrl) && (
                      <Image
                        src={pub.coverImageUrl}
                        alt={pub.titleEn}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-contain opacity-50 group-hover:opacity-75 transition-opacity"
                      />
                    )}
                    <div className="relative z-10 w-36 h-40 rounded-control shadow-e2 p-3 flex flex-col justify-between bg-surface border border-line">
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
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-accent">
                        {lang === "ne" ? pub.categoryNe : pub.categoryEn}
                      </div>
                      <h3 className="text-base font-bold text-fg leading-snug">
                        {lang === "ne" ? pub.titleNe : pub.titleEn}
                      </h3>
                      <p className="text-xs leading-relaxed text-muted line-clamp-2">
                        {lang === "ne" ? pub.descriptionNe : pub.descriptionEn}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-line flex items-center justify-between">
                      {isGoogleDriveUrl(pub.pdfUrl) ? (
                        <a
                          href={getGoogleDriveViewUrl(pub.pdfUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors shadow-e1"
                        >
                          <ArrowSquareOut size={14} />
                          <span>{lang === "ne" ? "PDF हेर्नुहोस्" : "View PDF"}</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActivePdfPreview(pub)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors shadow-e1 cursor-pointer"
                        >
                          <Eye size={14} />
                          <span>{lang === "ne" ? "PDF हेर्नुहोस्" : "View PDF"}</span>
                        </button>
                      )}
                      <a
                        href={documentUrl(pub.pdfUrl, "download", lang === "ne" ? pub.titleNe : pub.titleEn)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted hover:text-fg font-medium flex items-center gap-1 transition-colors"
                      >
                        <Download size={14} />
                        <span>{lang === "ne" ? "डाउनलोड" : "Download"}</span>
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 5: UPCOMING EVENTS & PROGRAM ARCHIVE */}
      <section className="py-16 sm:py-20 rule-soft bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <h2 className="type-section text-fg">
                {lang === "ne" ? "सम्पन्न तथा आगामी गतिविधिहरू" : "Completed & Upcoming Activities"}
              </h2>
            </div>

            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-e1 transition-colors"
            >
              <span>{lang === "ne" ? "सबै गतिविधिहरू हेर्नुहोस्" : "View All Activities"}</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {eventsShowcase.length === 0 ? (
            <div className="rounded-card border border-dashed border-line p-12 text-center space-y-2 bg-ground">
              <Calendar size={32} className="text-accent mx-auto" weight="duotone" />
              <p className="text-sm font-semibold text-fg">
                {lang === "ne" ? "हाल कुनै गतिविधि छैन" : "No activities scheduled"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {eventsShowcase.map((event) => (
                <article
                  key={event.id}
                  onClick={() => setSelectedEventModal(event)}
                  className="rounded-card border border-line bg-ground overflow-hidden flex flex-col sm:flex-row hover:border-accent transition-all group cursor-pointer shadow-e1 hover:shadow-e2"
                >
                  <div className="sm:w-52 relative h-48 sm:h-auto min-h-[160px] flex-shrink-0 bg-tint/60 flex items-center justify-center overflow-hidden p-2">
                    {isValidImageSrc(event.imageUrl) ? (
                      <Image
                        src={event.imageUrl}
                        alt={event.titleEn}
                        fill
                        sizes="(max-width: 640px) 100vw, 208px"
                        className="object-contain group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <Calendar size={36} className="text-accent" weight="duotone" />
                    )}
                    {Boolean(
                      (lang === "ne" ? event.categoryNe : event.categoryEn)?.trim() &&
                      event.categoryNe !== "साधारण सभा" &&
                      event.categoryEn !== "General Assembly"
                    ) && (
                      <div className="absolute top-3 left-3 px-2 py-0.5 rounded-chip bg-surface text-[10px] font-bold text-accent shadow-e1">
                        {lang === "ne" ? event.categoryNe : event.categoryEn}
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-accent">
                        <Calendar size={14} />
                        <span>{lang === "ne" ? event.dateNe : event.dateEn}</span>
                      </div>
                      <h3 className="text-base font-bold text-fg leading-snug group-hover:text-accent transition-colors">
                        {lang === "ne" ? event.titleNe : event.titleEn}
                      </h3>
                      <p className="text-xs leading-relaxed text-muted line-clamp-2">
                        {lang === "ne" ? event.descriptionNe || event.descriptionEn : event.descriptionEn || event.descriptionNe}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-line text-xs text-muted flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-accent flex-shrink-0" />
                          <span>{lang === "ne" ? event.locationNe : event.locationEn}</span>
                        </span>
                        {event.galleryId && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent bg-accent-soft px-2 py-0.5 rounded-chip border border-accent/20">
                            <Images size={11} weight="bold" />
                            <span>{lang === "ne" ? "ग्यालरी जोडिएको" : "Gallery Attached"}</span>
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 font-semibold text-accent group-hover:underline">
                        <Eye size={13} />
                        <span>{lang === "ne" ? "विवरण" : "Details"}</span>
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 6: PHOTO GALLERY SHOWCASE */}
      <section className="py-16 sm:py-24 rule-soft bg-ground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <h2 className="type-section text-fg">
                {lang === "ne" ? "सामाजिक कार्य तथा दृश्य अभिलेख" : "Community Action Visual Archive"}
              </h2>
            </div>

            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-e1 transition-colors"
            >
              <span>{lang === "ne" ? "सबै तस्बिरहरू हेर्नुहोस्" : "Explore Full Gallery"}</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {galleryShowcase.length === 0 ? (
            <div className="rounded-card border border-dashed border-line p-12 text-center space-y-2 bg-surface">
              <Sparkle size={32} className="text-accent mx-auto" weight="duotone" />
              <p className="text-sm font-semibold text-fg">
                {lang === "ne" ? "हाल कुनै तस्बिर उपलब्ध छैन" : "No gallery photos uploaded yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryShowcase.map((item) => (
                <Link
                  key={item.id}
                  href="/gallery"
                  className="relative h-64 rounded-card overflow-hidden border border-line bg-black/85 group shadow-e1 hover:border-accent transition-all flex items-center justify-center p-1"
                >
                  {isValidImageSrc(item.imageUrl) ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.titleEn}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-contain group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <Sparkle size={36} className="text-accent" weight="duotone" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-75 group-hover:opacity-90 transition-opacity" />
                  <div className="absolute bottom-0 inset-x-0 p-5 space-y-1 text-white">
                    <h3 className="text-sm font-bold leading-snug line-clamp-2">
                      {lang === "ne" ? item.titleNe : item.titleEn}
                    </h3>
                    {Boolean(item.dateNe || item.dateEn) && (
                      <div className="text-[11px] text-white/80 font-mono">
                        {lang === "ne" ? item.dateNe : item.dateEn}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 7: CONTACT & LIAISON SECRETARIAT (Dynamically Configurable from Admin) */}
      <section id="contact" className="py-16 sm:py-20 rule-soft bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Top Section Header */}
          <div className="max-w-3xl space-y-3">
            <h2 className="type-section text-fg">
              {lang === "ne" ? contactSettings.contactHeadingNe : contactSettings.contactHeadingEn}
            </h2>
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
                        ? "हाम्रो सम्पर्क टोलीले तपाईंलाई चाँडै सम्पर्क गर्नेछ। धन्यवाद।"
                        : "Our team will review your message and contact you shortly. Thank you."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setContactSubmitted(false)}
                    className="px-5 py-2.5 rounded-control bg-accent text-on-accent text-xs font-semibold shadow-e1 hover:bg-accent-hover transition-colors"
                  >
                    {lang === "ne" ? "अर्को सन्देश पठाउनुहोस्" : "Send Another Message"}
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleInquirySubmit}
                  noValidate
                  className="rounded-card border border-line bg-ground p-6 sm:p-8 space-y-5 shadow-e1"
                >
                  <div className="text-sm font-bold text-fg border-b border-line pb-3 flex items-center justify-between">
                    <span>{lang === "ne" ? "सम्पर्क फाराम" : "Online Inquiry Form"}</span>
                    <span className="text-[11px] text-accent font-normal">{lang === "ne" ? "* अनिवार्य विवरण" : "* Required fields"}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg flex items-center justify-between">
                        <span>{lang === "ne" ? "पूरा नाम" : "Full Name"} *</span>
                      </label>
                      <input
                        type="text"
                        value={inquiryForm.name}
                        onChange={(e) => {
                          setInquiryForm({ ...inquiryForm, name: e.target.value });
                          if (touched.name) validateField("name", e.target.value);
                        }}
                        onBlur={() => {
                          setTouched((prev) => ({ ...prev, name: true }));
                          validateField("name", inquiryForm.name);
                        }}
                        placeholder={lang === "ne" ? "तपाईंको नाम" : "Your full name"}
                        className={`w-full px-3.5 py-2.5 rounded-control border bg-surface text-fg text-xs transition-colors focus:outline-none ${
                          touched.name && formErrors.name
                            ? "border-danger focus:border-danger focus:ring-1 focus:ring-danger"
                            : "border-line focus:border-accent"
                        }`}
                      />
                      {touched.name && formErrors.name && (
                        <p className="text-[11px] text-danger font-medium">{formErrors.name}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg flex items-center justify-between">
                        <span>{lang === "ne" ? "सम्पर्क नम्बर" : "Phone Number"} *</span>
                      </label>
                      <input
                        type="tel"
                        value={inquiryForm.phone}
                        onChange={(e) => {
                          setInquiryForm({ ...inquiryForm, phone: e.target.value });
                          if (touched.phone) validateField("phone", e.target.value);
                        }}
                        onBlur={() => {
                          setTouched((prev) => ({ ...prev, phone: true }));
                          validateField("phone", inquiryForm.phone);
                        }}
                        placeholder="+977 98..."
                        className={`w-full px-3.5 py-2.5 rounded-control border bg-surface text-fg text-xs transition-colors focus:outline-none ${
                          touched.phone && formErrors.phone
                            ? "border-danger focus:border-danger focus:ring-1 focus:ring-danger"
                            : "border-line focus:border-accent"
                        }`}
                      />
                      {touched.phone && formErrors.phone && (
                        <p className="text-[11px] text-danger font-medium">{formErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg flex items-center justify-between">
                      <span>{lang === "ne" ? "इमेल ठेगाना" : "Email Address"}</span>
                      <span className="text-[10px] text-muted font-normal">({lang === "ne" ? "ऐच्छिक" : "Optional"})</span>
                    </label>
                    <input
                      type="email"
                      value={inquiryForm.email}
                      onChange={(e) => {
                        setInquiryForm({ ...inquiryForm, email: e.target.value });
                        if (touched.email) validateField("email", e.target.value);
                      }}
                      onBlur={() => {
                        setTouched((prev) => ({ ...prev, email: true }));
                        validateField("email", inquiryForm.email);
                      }}
                      placeholder="example@mail.com"
                      className={`w-full px-3.5 py-2.5 rounded-control border bg-surface text-fg text-xs transition-colors focus:outline-none ${
                        touched.email && formErrors.email
                          ? "border-danger focus:border-danger focus:ring-1 focus:ring-danger"
                          : "border-line focus:border-accent"
                      }`}
                    />
                    {touched.email && formErrors.email && (
                      <p className="text-[11px] text-danger font-medium">{formErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg flex items-center justify-between">
                      <span>{lang === "ne" ? "सन्देश वा जिज्ञासा" : "Message / Query"} *</span>
                      <span className="text-[10px] text-muted font-mono">{inquiryForm.message.length}/10 {lang === "ne" ? "अक्षर न्यूनतम" : "min chars"}</span>
                    </label>
                    <textarea
                      rows={4}
                      value={inquiryForm.message}
                      onChange={(e) => {
                        setInquiryForm({ ...inquiryForm, message: e.target.value });
                        if (touched.message) validateField("message", e.target.value);
                      }}
                      onBlur={() => {
                        setTouched((prev) => ({ ...prev, message: true }));
                        validateField("message", inquiryForm.message);
                      }}
                      placeholder={lang === "ne" ? "तपाईंको जिज्ञासा यहाँ लेख्नुहोस् (कम्तिमा १० अक्षर)..." : "Write your query here (min 10 characters)..."}
                      className={`w-full px-3.5 py-2.5 rounded-control border bg-surface text-fg text-xs transition-colors focus:outline-none ${
                        touched.message && formErrors.message
                          ? "border-danger focus:border-danger focus:ring-1 focus:ring-danger"
                          : "border-line focus:border-accent"
                      }`}
                    />
                    {touched.message && formErrors.message && (
                      <p className="text-[11px] text-danger font-medium">{formErrors.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingInquiry}
                    aria-busy={isSubmittingInquiry}
                    className="w-full py-3 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-bold shadow-e1 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmittingInquiry ? (
                      <>
                        <span className="spinner" aria-hidden="true" />
                        <span>{lang === "ne" ? "पठाउँदै..." : "Sending..."}</span>
                      </>
                    ) : (
                      <>
                        <EnvelopeSimple size={16} />
                        <span>{lang === "ne" ? "सन्देश पठाउनुहोस्" : "Submit Inquiry"}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Right Column: Liaison Secretariat Card */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-card border border-line bg-ground p-6 sm:p-7 space-y-5 shadow-e1 hover:border-accent transition-all">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-control bg-accent-soft text-accent flex items-center justify-center flex-shrink-0">
                    <Buildings size={22} weight="duotone" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-fg leading-tight">
                      {lang === "ne" ? contactSettings.kathmanduTitleNe : contactSettings.kathmanduTitleEn}
                    </div>
                    <div className="text-xs text-accent font-semibold mt-0.5">
                      {lang === "ne" ? contactSettings.kathmanduSubtitleNe : contactSettings.kathmanduSubtitleEn}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted space-y-3 pt-3 border-t border-line">
                  {(contactSettings.phone1 || contactSettings.phone2) && (
                    <div className="flex items-center gap-2.5">
                      <Phone size={16} className="text-accent flex-shrink-0" />
                      <div className="flex flex-wrap items-center gap-2 font-mono text-fg">
                        {contactSettings.phone1 && (
                          <a href={`tel:${contactSettings.phone1}`} className="hover:text-accent transition-colors">
                            {contactSettings.phone1}
                          </a>
                        )}
                        {contactSettings.phone1 && contactSettings.phone2 && <span>,</span>}
                        {contactSettings.phone2 && (
                          <a href={`tel:${contactSettings.phone2}`} className="hover:text-accent transition-colors">
                            {contactSettings.phone2}
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {contactSettings.email && (
                    <div className="flex items-center gap-2.5">
                      <EnvelopeSimple size={16} className="text-accent flex-shrink-0" />
                      <a href={`mailto:${contactSettings.email}`} className="hover:text-accent text-fg transition-colors">
                        {contactSettings.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PDF PREVIEW MODAL */}
      {activePdfPreview && (
        <PdfModalViewer
          url={activePdfPreview.pdfUrl}
          title={lang === "ne" ? activePdfPreview.titleNe : activePdfPreview.titleEn}
          category={lang === "ne" ? activePdfPreview.categoryNe : activePdfPreview.categoryEn}
          pages={activePdfPreview.pages}
          fileSize={activePdfPreview.fileSize}
          lang={lang}
          onClose={() => setActivePdfPreview(null)}
        />
      )}

      {/* EVENT DETAILS DIALOG MODAL */}
      {selectedEventModal && (
        <div
          onClick={() => {
            setSelectedEventModal(null);
            setZoomedEventImageUrl(null);
          }}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 cursor-pointer overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl lg:max-w-5xl w-full max-h-[90vh] bg-surface rounded-card border border-line shadow-e3 overflow-hidden cursor-default my-auto flex flex-col md:flex-row animate-fade-in"
          >
            <button
              type="button"
              onClick={() => {
                setSelectedEventModal(null);
                setZoomedEventImageUrl(null);
              }}
              className="absolute top-3 right-3 z-20 p-2 rounded-chip bg-surface/90 hover:bg-surface text-fg border border-line shadow-sm transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {isValidImageSrc(selectedEventModal.imageUrl) && (
              <div className="relative md:w-[320px] lg:w-[360px] h-48 sm:h-60 md:h-auto min-h-[220px] bg-black/95 flex items-center justify-center p-3 sm:p-4 group/img flex-shrink-0 border-b md:border-b-0 md:border-r border-line">
                <Image
                  src={selectedEventModal.imageUrl}
                  alt={lang === "ne" ? selectedEventModal.titleNe : selectedEventModal.titleEn}
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  className="object-contain cursor-zoom-in"
                  onClick={() =>
                    setZoomedEventImageUrl({
                      url: selectedEventModal.imageUrl,
                      title: lang === "ne" ? selectedEventModal.titleNe : selectedEventModal.titleEn,
                    })
                  }
                  priority
                />
                <button
                  type="button"
                  onClick={() =>
                    setZoomedEventImageUrl({
                      url: selectedEventModal.imageUrl,
                      title: lang === "ne" ? selectedEventModal.titleNe : selectedEventModal.titleEn,
                    })
                  }
                  className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-chip bg-black/75 hover:bg-black text-white text-[11px] font-semibold flex items-center gap-1 backdrop-blur-sm border border-white/20 shadow-md transition-all cursor-pointer"
                  title={lang === "ne" ? "पूर्ण आकारमा हेर्नुहोस्" : "View Fullscreen"}
                >
                  <ArrowsOut size={13} />
                  <span>{lang === "ne" ? "ठूलो बनाउनुहोस्" : "Expand"}</span>
                </button>
              </div>
            )}

            {/* BIG DETAILS SECTION */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 flex flex-col justify-between">
              <div className="space-y-4 pr-6">
                <div className="flex flex-wrap items-center gap-2">
                  {Boolean(
                    (lang === "ne" ? selectedEventModal.categoryNe : selectedEventModal.categoryEn)?.trim() &&
                    selectedEventModal.categoryNe !== "साधारण सभा" &&
                    selectedEventModal.categoryEn !== "General Assembly"
                  ) && (
                    <span className="px-3 py-1 rounded-chip bg-accent-soft text-accent text-xs font-bold">
                      {lang === "ne" ? selectedEventModal.categoryNe : selectedEventModal.categoryEn}
                    </span>
                  )}
                  <span
                    className={`px-3 py-1 rounded-chip text-xs font-bold ${
                      selectedEventModal.status === "upcoming"
                        ? "bg-accent text-on-accent"
                        : "bg-tint text-muted"
                    }`}
                  >
                    {selectedEventModal.status === "upcoming"
                      ? lang === "ne" ? "आयोजना हुने" : "Scheduled"
                      : lang === "ne" ? "सम्पन्न" : "Concluded"}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-fg leading-snug tracking-tight">
                  {lang === "ne" ? selectedEventModal.titleNe : selectedEventModal.titleEn}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-card bg-ground border border-line text-xs">
                  <div className="flex items-center gap-2.5">
                    <Calendar size={20} className="text-accent flex-shrink-0" weight="duotone" />
                    <div>
                      <div className="text-[10px] text-muted uppercase font-bold">{lang === "ne" ? "मिति" : "Date"}</div>
                      <div className="text-xs sm:text-sm font-bold text-fg">{lang === "ne" ? selectedEventModal.dateNe : selectedEventModal.dateEn}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock size={20} className="text-accent flex-shrink-0" weight="duotone" />
                    <div>
                      <div className="text-[10px] text-muted uppercase font-bold">{lang === "ne" ? "समय" : "Time"}</div>
                      <div className="text-xs sm:text-sm font-bold text-fg">{lang === "ne" ? selectedEventModal.timeNe : selectedEventModal.timeEn}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin size={20} className="text-accent flex-shrink-0" weight="duotone" />
                    <div>
                      <div className="text-[10px] text-muted uppercase font-bold">{lang === "ne" ? "स्थान" : "Location"}</div>
                      <div className="text-xs sm:text-sm font-bold text-fg">{lang === "ne" ? selectedEventModal.locationNe : selectedEventModal.locationEn}</div>
                    </div>
                  </div>
                </div>

                {Boolean(selectedEventModal.descriptionNe || selectedEventModal.descriptionEn) && (
                  <div className="space-y-2.5 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                      {lang === "ne" ? "गतिविधिको विस्तृत विवरण" : "Activity Description & Details"}
                    </h4>
                    <p className="text-sm sm:text-base leading-relaxed text-fg/90 whitespace-pre-line bg-ground/50 p-4 sm:p-5 rounded-card border border-line/60 font-sans">
                      {lang === "ne"
                        ? selectedEventModal.descriptionNe || selectedEventModal.descriptionEn
                        : selectedEventModal.descriptionEn || selectedEventModal.descriptionNe}
                    </p>
                  </div>
                )}

                {/* RELATED GALLERY SECTION */}
                {(() => {
                  const linkedItem = selectedEventModal.galleryId
                    ? gallery.find((g) => g.id === selectedEventModal.galleryId)
                    : null;
                  const linkedAlbum = selectedEventModal.galleryId
                    ? albums.find((a) => a.id === selectedEventModal.galleryId)
                    : null;

                  if (!linkedItem && !linkedAlbum) return null;

                  return (
                    <div className="space-y-3 pt-4 border-t border-line">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                          <Images size={16} className="text-accent" />
                          <span>{lang === "ne" ? "सम्बन्धित ग्यालरी" : "Related Gallery"}</span>
                        </h4>
                        <Link
                          href="/gallery"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                        >
                          <span>{lang === "ne" ? "ग्यालरीमा हेर्नुहोस्" : "View in Gallery"}</span>
                          <ArrowSquareOut size={13} />
                        </Link>
                      </div>

                      {linkedItem && (
                        <div className="p-3.5 rounded-card bg-ground border border-line flex flex-col sm:flex-row items-center gap-4">
                          {isValidImageSrc(linkedItem.imageUrl) && (
                            <div
                              onClick={() =>
                                setZoomedEventImageUrl({
                                  url: linkedItem.imageUrl,
                                  title: lang === "ne" ? linkedItem.titleNe : linkedItem.titleEn,
                                })
                              }
                              className="relative w-full sm:w-44 h-32 rounded-control overflow-hidden bg-tint flex-shrink-0 cursor-zoom-in group/gimg border border-line"
                            >
                              <Image
                                src={linkedItem.imageUrl}
                                alt={lang === "ne" ? linkedItem.titleNe : linkedItem.titleEn}
                                fill
                                sizes="(max-width: 640px) 100vw, 176px"
                                className="object-cover group-hover/gimg:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/gimg:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <ArrowsOut size={20} />
                              </div>
                            </div>
                          )}
                          <div className="flex-1 space-y-1.5 min-w-0 w-full">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-chip bg-accent-soft text-accent">
                                {lang === "ne" ? linkedItem.categoryNe : linkedItem.categoryEn}
                              </span>
                              <span className="text-[11px] text-muted font-mono">
                                {lang === "ne" ? linkedItem.dateNe : linkedItem.dateEn}
                              </span>
                            </div>
                            <div className="text-sm font-bold text-fg truncate">
                              {lang === "ne" ? linkedItem.titleNe : linkedItem.titleEn}
                            </div>
                            <p className="text-xs text-muted">
                              {lang === "ne"
                                ? "यस गतिविधिसँग सम्बन्धित तस्बिर ग्यालरीमा उपलब्ध छ। पूर्ण आकारमा हेर्न तस्बिरमा थिच्नुहोस्।"
                                : "Photo associated with this event is available in the gallery. Click image to expand."}
                            </p>
                          </div>
                        </div>
                      )}

                      {linkedAlbum && (
                        <div className="p-3.5 rounded-card bg-ground border border-line space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5 min-w-0">
                              <div className="text-sm font-bold text-fg truncate">
                                {lang === "ne" ? linkedAlbum.titleNe : linkedAlbum.titleEn}
                              </div>
                              {Boolean(linkedAlbum.descriptionNe || linkedAlbum.descriptionEn) && (
                                <p className="text-xs text-muted line-clamp-1">
                                  {lang === "ne"
                                    ? linkedAlbum.descriptionNe || linkedAlbum.descriptionEn
                                    : linkedAlbum.descriptionEn || linkedAlbum.descriptionNe}
                                </p>
                              )}
                            </div>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-chip bg-accent-soft text-accent flex-shrink-0">
                              {linkedAlbum.images?.length || 0} {lang === "ne" ? "तस्बिरहरू" : "photos"}
                            </span>
                          </div>

                          {linkedAlbum.images && linkedAlbum.images.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                              {linkedAlbum.images.slice(0, 6).map((img, idx) => (
                                <div
                                  key={img.id || idx}
                                  onClick={() =>
                                    setZoomedEventImageUrl({
                                      url: img.imageUrl,
                                      title:
                                        lang === "ne"
                                          ? img.captionNe || linkedAlbum.titleNe
                                          : img.captionEn || linkedAlbum.titleEn,
                                    })
                                  }
                                  className="relative aspect-square rounded-control overflow-hidden bg-tint cursor-zoom-in group/aimg border border-line"
                                >
                                  <Image
                                    src={img.imageUrl}
                                    alt={
                                      lang === "ne"
                                        ? img.captionNe || linkedAlbum.titleNe
                                        : img.captionEn || linkedAlbum.titleEn
                                    }
                                    fill
                                    sizes="120px"
                                    className="object-cover group-hover/aimg:scale-105 transition-transform duration-200"
                                  />
                                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/aimg:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <ArrowsOut size={16} />
                                  </div>
                                  {idx === 5 && linkedAlbum.images.length > 6 && (
                                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white font-bold text-xs">
                                      +{linkedAlbum.images.length - 6}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="pt-4 border-t border-line flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEventModal(null);
                    setZoomedEventImageUrl(null);
                  }}
                  className="px-6 py-2.5 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  {lang === "ne" ? "बन्द गर्नुहोस्" : "Close"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN EVENT / GALLERY IMAGE LIGHTBOX */}
      {zoomedEventImageUrl && isValidImageSrc(zoomedEventImageUrl.url) && (
        <div
          onClick={() => setZoomedEventImageUrl(null)}
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between text-white p-2 border-b border-white/10"
          >
            <span className="font-bold text-sm sm:text-base text-white/90">
              {zoomedEventImageUrl.title}
            </span>
            <button
              type="button"
              onClick={() => setZoomedEventImageUrl(null)}
              className="p-2 rounded-chip bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>
          <div
            className="relative flex-1 w-full h-[82vh] flex items-center justify-center p-2"
            onClick={() => setZoomedEventImageUrl(null)}
          >
            <Image
              src={zoomedEventImageUrl.url}
              alt={zoomedEventImageUrl.title}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>
        </div>
      )}

      <SiteFooter lang={lang} />
    </div>
  );
}
