"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Member,
  EventItem,
  Publication,
  GalleryItem,
  HeroContent,
  Language,
  initialMembers,
  initialEvents,
  initialPublications,
  initialGallery,
  getStoredHeroSnapshot,
  saveStoredHeroContent,
} from "@/data/mockData";
import {
  getAdminSession,
  setAdminSession,
  clearAdminSession,
  verifyAdminCredentials,
  DEFAULT_ADMIN_CONFIG,
} from "@/lib/adminAuth";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import { useDialog } from "@/components/Dialog";
import {
  Users,
  BookOpen,
  Calendar,
  Image as ImageIcon,
  SlidersHorizontal,
  LockKey,
  SignOut,
  Plus,
  Trash,
  FileText,
  Database,
  ArrowSquareOut,
  EnvelopeSimple,
  Buildings,
  Sun,
  Moon,
  MagnifyingGlass,
  Sparkle,
  List,
  X,
  Globe,
  Translate,
} from "@phosphor-icons/react";

interface Inquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  date: string;
  read: boolean;
}

const mockInquiries: Inquiry[] = [
  {
    id: "inq-1",
    name: "Narayan Prasad Gyawali",
    phone: "+977 9841556677",
    email: "narayan.g@gmail.com",
    message: "I would like to apply for life membership of the Manch. Please send the registration form.",
    date: "2026-08-20",
    read: false,
  },
  {
    id: "inq-2",
    name: "Sita Sharma",
    phone: "+977 9851239876",
    email: "sita.sharma@yahoo.com",
    message: "Seeking details on how to contribute to the Thorga rural education scholarship fund.",
    date: "2026-08-18",
    read: true,
  },
];

const ADMIN_I18N = {
  ne: {
    brandTitle: "थोर्गा काठमाडौं मञ्च",
    brandSubtitle: "प्रशासन प्यानल",
    overview: "समग्र विवरण",
    hero: "मुख्य ब्यानर",
    members: "कार्यसमिति",
    publications: "प्रकाशनहरू",
    events: "कार्यक्रमहरू",
    gallery: "तस्बिरहरू",
    inquiries: "सम्पर्क सन्देश",
    settings: "सम्पर्क सेटिङ्स",
    publicPortal: "मुख्य वेबसाइट",
    quickActions: "द्रुत कार्यहरू",
    updateHero: "ब्यानर सम्पादन",
    updateHeroDesc: "शीर्षक, विवरण र तस्बिर",
    addMember: "सदस्य थप्नुहोस्",
    addMemberDesc: "द्विभाषी विवरण दर्ता",
    uploadPub: "प्रकाशन अपलोड",
    uploadPubDesc: "स्मारिका र प्रतिवेदन",
    scheduleEvent: "कार्यक्रम तालिका",
    scheduleEventDesc: "भेला र बैठकहरू",
    addGallery: "तस्बिर थप्नुहोस्",
    saveChanges: "परिवर्तन सुरक्षित गर्नुहोस्",
    savedSuccess: "सफलतापूर्वक सुरक्षित भयो।",
    logout: "लगआउट",
    theme: "रङ शैली",
    all: "सबै",
    current: "वर्तमान",
    advisor: "सल्लाहकार",
    past: "पूर्व नेतृत्व",
    search: "खोजी गर्नुहोस्...",
    noMembers: "कुनै सदस्य फेला परेन।",
    noInquiries: "इनबक्समा कुनै सन्देश छैन।",
    signInTitle: "प्रशासन लगइन",
    signInDesc: "वेबसाइटका सामग्री व्यवस्थापन गर्न आधिकारिक प्रमाण प्रविष्ट गर्नुहोस्।",
    username: "प्रयोगकर्ता नाम",
    password: "पासवर्ड",
    signInBtn: "लगइन गर्नुहोस्",
    loginError: "प्रयोगकर्ता नाम वा पासवर्ड मिलेन। कृपया पुनः प्रयास गर्नुहोस्।",
    removeMemberConfirmTitle: "सदस्य हटाउने पुष्टि",
    removeMemberConfirmDesc: "के तपाईं यस सदस्यलाई रोस्टरबाट हटाउन निश्चित हुनुहुन्छ? क्लाउडिनरीमा भएको तस्बिर पनि मेटिनेछ।",
    removePubConfirmTitle: "प्रकाशन हटाउने पुष्टि",
    removePubConfirmDesc: "के तपाईं यस प्रकाशनलाई मेटाउन निश्चित हुनुहुन्छ? सम्बन्धित PDF र कभर तस्बिर क्लाउडिनरीबाट मेटिनेछ।",
    removeEventConfirmTitle: "कार्यक्रम हटाउने पुष्टि",
    removeEventConfirmDesc: "के तपाईं यस कार्यक्रमलाई तालिकाबाट हटाउन निश्चित हुनुहुन्छ?",
    removeGalleryConfirmTitle: "तस्बिर हटाउने पुष्टि",
    removeGalleryConfirmDesc: "के तपाईं यस तस्बिरलाई ग्यालरीबाट मेटाउन निश्चित हुनुहुन्छ?",
    removeInquiryConfirmTitle: "सन्देश हटाउने पुष्टि",
    removeInquiryConfirmDesc: "के तपाईं यस सोधपुछ सन्देशलाई हटाउन निश्चित हुनुहुन्छ?",
    deleteBtn: "मेटाउनुहोस्",
    cancelBtn: "रद्द गर्नुहोस्",
    closeBtn: "बन्द गर्नुहोस्",
  },
  en: {
    brandTitle: "Thorga Kathmandu Forum",
    brandSubtitle: "Admin Panel",
    overview: "Overview",
    hero: "Hero Banner",
    members: "Committee",
    publications: "Publications",
    events: "Events",
    gallery: "Gallery",
    inquiries: "Inquiries",
    settings: "Settings",
    publicPortal: "Public Portal",
    quickActions: "Quick Actions",
    updateHero: "Update Hero Banner",
    updateHeroDesc: "Headline, text, visual photo",
    addMember: "Add Committee Member",
    addMemberDesc: "Bilingual profile setup",
    uploadPub: "Upload Publication",
    uploadPubDesc: "PDF souvenirs & reports",
    scheduleEvent: "Schedule Event",
    scheduleEventDesc: "Meetings and assemblies",
    addGallery: "Add Photo",
    saveChanges: "Save Changes",
    savedSuccess: "Changes saved successfully.",
    logout: "Sign Out",
    theme: "Toggle Theme",
    all: "All",
    current: "Current",
    advisor: "Advisors",
    past: "Past",
    search: "Search...",
    noMembers: "No members match the query.",
    noInquiries: "No messages in inbox.",
    signInTitle: "Admin Sign In",
    signInDesc: "Enter administrative credentials to manage portal data and content.",
    username: "Username",
    password: "Password",
    signInBtn: "Sign In",
    loginError: "Invalid username or password. Please try again.",
    removeMemberConfirmTitle: "Remove Member",
    removeMemberConfirmDesc: "Are you sure you want to remove this member? Associated photos on Cloudinary will also be deleted.",
    removePubConfirmTitle: "Delete Publication",
    removePubConfirmDesc: "Are you sure you want to delete this document? Associated PDF and cover on Cloudinary will also be deleted.",
    removeEventConfirmTitle: "Delete Event",
    removeEventConfirmDesc: "Are you sure you want to delete this scheduled event?",
    removeGalleryConfirmTitle: "Delete Photo",
    removeGalleryConfirmDesc: "Are you sure you want to delete this photo from the gallery?",
    removeInquiryConfirmTitle: "Delete Inquiry",
    removeInquiryConfirmDesc: "Are you sure you want to remove this public inquiry message?",
    deleteBtn: "Delete",
    cancelBtn: "Cancel",
    closeBtn: "Close",
  },
};

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

export default function AdminPage() {
  const [session, setSession] = useState(() => getAdminSession());
  const [lang, setLang] = useState<Language>("ne");
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
  const { alert: dialogAlert, confirm: dialogConfirm } = useDialog();

  const t = ADMIN_I18N[lang];

  const [activeTab, setActiveTab] = useState<
    "overview" | "hero" | "members" | "publications" | "events" | "gallery" | "inquiries" | "settings"
  >("overview");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Login form state
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState(false);

  // Managed Data States
  const [heroState, setHeroState] = useState<HeroContent>(() => getStoredHeroSnapshot());
  const [membersList, setMembersList] = useState<Member[]>(initialMembers);
  const [pubList, setPubList] = useState<Publication[]>(initialPublications);
  const [eventsList, setEventsList] = useState<EventItem[]>(initialEvents);
  const [galleryList, setGalleryList] = useState<GalleryItem[]>(initialGallery);
  const [inquiriesList, setInquiriesList] = useState<Inquiry[]>(mockInquiries);

  // Filter & Form States
  const [memberFilterCategory, setMemberFilterCategory] = useState<"all" | "current" | "advisor" | "past">("all");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddPubModal, setShowAddPubModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showAddGalleryModal, setShowAddGalleryModal] = useState(false);

  // New Member Form
  const [memberForm, setMemberForm] = useState({
    nameEn: "",
    nameNe: "",
    roleEn: "",
    roleNe: "",
    committeeType: "current" as "current" | "advisor" | "past",
    order: 10,
    phone: "",
    email: "",
    bioEn: "",
    bioNe: "",
    tenureEn: "",
    tenureNe: "",
    photoUrl: "",
  });

  // New Publication Form
  const [pubForm, setPubForm] = useState({
    titleEn: "",
    titleNe: "",
    categoryEn: "Souvenir",
    categoryNe: "स्मारिका",
    publishedYearEn: "2081 BS (2024)",
    publishedYearNe: "२०८१",
    descriptionEn: "",
    descriptionNe: "",
    pdfUrl: "",
    pages: 48,
    fileSize: "4.2 MB",
    coverImageUrl: "",
  });

  // New Event Form
  const [eventForm, setEventForm] = useState({
    titleEn: "",
    titleNe: "",
    categoryEn: "General Assembly",
    categoryNe: "साधारण सभा",
    dateEn: "2081 Ashoj 12",
    dateNe: "२०८१ असोज १२",
    timeEn: "11:00 AM",
    timeNe: "बिहान ११:०० बजे",
    locationEn: "Kathmandu",
    locationNe: "काठमाडौँ",
    descriptionEn: "",
    descriptionNe: "",
    imageUrl: "",
    status: "upcoming" as "upcoming" | "completed",
  });

  // New Gallery Form
  const [galleryForm, setGalleryForm] = useState({
    titleEn: "",
    titleNe: "",
    categoryEn: "Education",
    categoryNe: "शिक्षा",
    dateEn: "2081 Shrawan",
    dateNe: "२०८१ साउन",
    imageUrl: "",
  });

  // Settings State
  const [settings, setSettings] = useState({
    kathmanduAddress: "Shankhamul Marg, New Baneshwor, Kathmandu, Nepal",
    thorgaAddress: "Thorga Bazaar, Ruru Kshetra-2, Gulmi, Lumbini Province",
    contactPhone: "+977 01-4481234, 9851012345",
    contactEmail: "info@thorgaktm.org.np",
  });

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem("thorga-theme", next);
      } catch {}
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminCredentials(loginUser, loginPass)) {
      setAdminSession(loginUser);
      setSession({ username: loginUser, isAuthenticated: true, loginTime: Date.now() });
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    setSession(null);
  };

  const handleSaveHero = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredHeroContent(heroState);
    dialogAlert({
      title: lang === "ne" ? "ब्यानर सम्पादन भयो" : "Hero Banner Updated",
      description:
        lang === "ne"
          ? "मुख्य पृष्ठको ब्यानर विवरणहरू सफलतापूर्वक अद्यावधिक गरिएको छ।"
          : "Hero section headlines, text, and visual frame have been updated live.",
      type: "success",
    });
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.nameEn || !memberForm.nameNe || !memberForm.roleEn || !memberForm.roleNe) {
      dialogAlert({
        title: lang === "ne" ? "अपूर्ण विवरण" : "Missing Information",
        description:
          lang === "ne"
            ? "कृपया नाम र पद दुवै भाषामा अनिवार्य भर्नुहोस्।"
            : "Please fill all required bilingual name and role fields.",
        type: "warning",
      });
      return;
    }
    const newMember: Member = {
      id: `m-${Date.now()}`,
      ...memberForm,
    };
    setMembersList([newMember, ...membersList]);
    setShowAddMemberModal(false);
    setMemberForm({
      nameEn: "",
      nameNe: "",
      roleEn: "",
      roleNe: "",
      committeeType: "current",
      order: 10,
      phone: "",
      email: "",
      bioEn: "",
      bioNe: "",
      tenureEn: "",
      tenureNe: "",
      photoUrl: "",
    });
    dialogAlert({
      title: lang === "ne" ? "सदस्य थपियो" : "Member Added",
      description:
        lang === "ne"
          ? `${newMember.nameNe} कार्यसमिति रोस्टरमा थपिनुभएको छ।`
          : `${newMember.nameEn} has been added to the committee roster.`,
      type: "success",
    });
  };

  const deleteCloudinaryAsset = async (url?: string) => {
    if (!url || !url.includes("cloudinary.com")) return;
    try {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
    } catch (err) {
      console.error("Failed to delete Cloudinary asset:", err);
    }
  };

  const handleDeleteMember = async (id: string) => {
    const memberToDelete = membersList.find((m) => m.id === id);
    const confirmed = await dialogConfirm({
      title: t.removeMemberConfirmTitle,
      description: `${t.removeMemberConfirmDesc} (${memberToDelete ? (lang === "ne" ? memberToDelete.nameNe : memberToDelete.nameEn) : ""})`,
      type: "danger",
      confirmText: t.deleteBtn,
      cancelText: t.cancelBtn,
    });
    if (confirmed) {
      if (memberToDelete?.photoUrl) {
        deleteCloudinaryAsset(memberToDelete.photoUrl);
      }
      setMembersList(membersList.filter((m) => m.id !== id));
    }
  };

  const handleAddPub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubForm.titleEn || !pubForm.titleNe) {
      dialogAlert({
        title: lang === "ne" ? "शीर्षक आवश्यक" : "Title Required",
        description: lang === "ne" ? "कृपया प्रकाशनको शीर्षक प्रविष्ट गर्नुहोस्।" : "Please enter publication title.",
        type: "warning",
      });
      return;
    }
    const newPub: Publication = {
      id: `p-${Date.now()}`,
      ...pubForm,
    };
    setPubList([newPub, ...pubList]);
    setShowAddPubModal(false);
    dialogAlert({
      title: lang === "ne" ? "प्रकाशन थपियो" : "Publication Uploaded",
      description:
        lang === "ne"
          ? "नयाँ प्रकाशन डिजिटल सङ्ग्रहमा सफलतापूर्वक प्रकाशित भयो।"
          : "New document added to the public PDF archive.",
      type: "success",
    });
  };

  const handleDeletePub = async (id: string) => {
    const pubToDelete = pubList.find((p) => p.id === id);
    const confirmed = await dialogConfirm({
      title: t.removePubConfirmTitle,
      description: `${t.removePubConfirmDesc} (${pubToDelete ? (lang === "ne" ? pubToDelete.titleNe : pubToDelete.titleEn) : ""})`,
      type: "danger",
      confirmText: t.deleteBtn,
      cancelText: t.cancelBtn,
    });
    if (confirmed) {
      if (pubToDelete?.pdfUrl) {
        deleteCloudinaryAsset(pubToDelete.pdfUrl);
      }
      if (pubToDelete?.coverImageUrl) {
        deleteCloudinaryAsset(pubToDelete.coverImageUrl);
      }
      setPubList(pubList.filter((p) => p.id !== id));
    }
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.titleEn || !eventForm.titleNe) {
      dialogAlert({
        title: lang === "ne" ? "शीर्षक आवश्यक" : "Title Required",
        description: lang === "ne" ? "कृपया कार्यक्रमको शीर्षक भर्नुहोस्।" : "Please enter event title.",
        type: "warning",
      });
      return;
    }
    const newEv: EventItem = {
      id: `e-${Date.now()}`,
      ...eventForm,
    };
    setEventsList([newEv, ...eventsList]);
    setShowAddEventModal(false);
    dialogAlert({
      title: lang === "ne" ? "कार्यक्रम थपियो" : "Event Scheduled",
      description: lang === "ne" ? "कार्यक्रम क्यालेन्डरमा दर्ता भएको छ।" : "Event successfully added to schedule.",
      type: "success",
    });
  };

  const handleDeleteEvent = async (id: string) => {
    const eventToDelete = eventsList.find((e) => e.id === id);
    const confirmed = await dialogConfirm({
      title: t.removeEventConfirmTitle,
      description: `${t.removeEventConfirmDesc} (${eventToDelete ? (lang === "ne" ? eventToDelete.titleNe : eventToDelete.titleEn) : ""})`,
      type: "danger",
      confirmText: t.deleteBtn,
      cancelText: t.cancelBtn,
    });
    if (confirmed) {
      if (eventToDelete?.imageUrl) {
        deleteCloudinaryAsset(eventToDelete.imageUrl);
      }
      setEventsList(eventsList.filter((e) => e.id !== id));
    }
  };

  const handleAddGallery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryForm.titleEn || !galleryForm.titleNe) {
      dialogAlert({
        title: lang === "ne" ? "विवरण आवश्यक" : "Caption Required",
        description: lang === "ne" ? "कृपया तस्बिरको विवरण भर्नुहोस्।" : "Please enter photo caption.",
        type: "warning",
      });
      return;
    }
    const newG: GalleryItem = {
      id: `g-${Date.now()}`,
      ...galleryForm,
    };
    setGalleryList([newG, ...galleryList]);
    setShowAddGalleryModal(false);
    dialogAlert({
      title: lang === "ne" ? "तस्बिर थपियो" : "Photo Added",
      description: lang === "ne" ? "तस्बिर ग्यालरीमा सफलतापूर्वक थपियो।" : "Photo added to gallery.",
      type: "success",
    });
  };

  const handleDeleteGallery = async (id: string) => {
    const galleryToDelete = galleryList.find((g) => g.id === id);
    const confirmed = await dialogConfirm({
      title: t.removeGalleryConfirmTitle,
      description: t.removeGalleryConfirmDesc,
      type: "danger",
      confirmText: t.deleteBtn,
      cancelText: t.cancelBtn,
    });
    if (confirmed) {
      if (galleryToDelete?.imageUrl) {
        deleteCloudinaryAsset(galleryToDelete.imageUrl);
      }
      setGalleryList(galleryList.filter((g) => g.id !== id));
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    const confirmed = await dialogConfirm({
      title: t.removeInquiryConfirmTitle,
      description: t.removeInquiryConfirmDesc,
      type: "danger",
      confirmText: t.deleteBtn,
      cancelText: t.cancelBtn,
    });
    if (confirmed) {
      setInquiriesList(inquiriesList.filter((inq) => inq.id !== id));
    }
  };

  const filteredAdminMembers = membersList.filter((m) => {
    const matchesCategory = memberFilterCategory === "all" ? true : m.committeeType === memberFilterCategory;
    const term = memberSearchQuery.toLowerCase();
    const matchesSearch =
      m.nameEn.toLowerCase().includes(term) ||
      m.nameNe.includes(memberSearchQuery) ||
      m.roleEn.toLowerCase().includes(term) ||
      m.roleNe.includes(memberSearchQuery);
    return matchesCategory && matchesSearch;
  });

  const getPageTitle = () => {
    switch (activeTab) {
      case "overview":
        return t.overview;
      case "hero":
        return t.hero;
      case "members":
        return t.members;
      case "publications":
        return t.publications;
      case "events":
        return t.events;
      case "gallery":
        return t.gallery;
      case "inquiries":
        return t.inquiries;
      case "settings":
        return t.settings;
      default:
        return t.overview;
    }
  };

  // -------------------------------------------------------------
  // 1. AUTHENTICATION VIEW (When logged out)
  // -------------------------------------------------------------
  if (!session?.isAuthenticated) {
    return (
      <div className="min-h-screen bg-ground text-fg font-sans flex flex-col justify-between selection:bg-accent selection:text-on-accent">
        <header className="border-b border-line bg-surface px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-control bg-accent text-on-accent flex items-center justify-center font-bold">
              <Buildings size={18} />
            </div>
            <div className="text-xs font-bold text-fg">{t.brandTitle}</div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLang(lang === "ne" ? "en" : "ne")}
              className="px-2.5 py-1 rounded-control border border-line bg-surface hover:bg-tint text-fg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Translate size={14} className="text-accent" />
              <span>{lang === "ne" ? "English" : "नेपाली"}</span>
            </button>
            <Link
              href="/"
              className="text-xs text-muted hover:text-fg flex items-center gap-1.5 py-1 px-2.5 rounded-control hover:bg-tint transition-colors"
            >
              <span>{t.publicPortal}</span>
              <ArrowSquareOut size={14} />
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-card border border-line bg-surface p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="space-y-1.5 text-center">
              <div className="w-10 h-10 rounded-control bg-accent-soft text-accent mx-auto flex items-center justify-center mb-2">
                <LockKey size={20} />
              </div>
              <h1 className="text-lg font-bold text-fg">{t.signInTitle}</h1>
              <p className="text-xs text-muted leading-relaxed">{t.signInDesc}</p>
            </div>

            {loginError && (
              <div className="p-3 rounded-control border border-red-500/30 bg-red-500/10 text-red-500 text-xs text-center">
                {t.loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-fg">{t.username}</label>
                <input
                  required
                  type="text"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder="admin"
                  className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-fg">{t.password}</label>
                <input
                  required
                  type="password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-sm transition-colors"
              >
                {t.signInBtn}
              </button>
            </form>

            <div className="p-3 rounded-control border border-line bg-ground text-[11px] space-y-0.5 text-muted">
              <div>Default user: <span className="font-mono text-fg font-medium">{DEFAULT_ADMIN_CONFIG.username}</span></div>
              <div>Default pass: <span className="font-mono text-fg font-medium">{DEFAULT_ADMIN_CONFIG.password}</span></div>
            </div>
          </div>
        </main>

        <footer className="border-t border-line bg-surface py-3 text-center text-xs text-muted">
          {t.brandTitle} {t.brandSubtitle}
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. FULL-HEIGHT SIDEBAR + CENTERED WORKSPACE
  // -------------------------------------------------------------
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-ground text-fg font-sans selection:bg-accent selection:text-on-accent">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface border-r border-line flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } flex-shrink-0`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-control bg-accent text-on-accent flex items-center justify-center flex-shrink-0">
              <Buildings size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-fg truncate">{t.brandTitle}</div>
              <div className="text-[10px] text-muted">{t.brandSubtitle}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-control text-muted hover:text-fg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar Nav */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("overview");
              setSidebarOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-control text-xs font-medium flex items-center gap-2.5 transition-colors ${
              activeTab === "overview"
                ? "bg-accent text-on-accent"
                : "text-muted hover:text-fg hover:bg-tint"
            }`}
          >
            <SlidersHorizontal size={16} />
            <span>{t.overview}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("hero");
              setSidebarOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-control text-xs font-medium flex items-center justify-between transition-colors ${
              activeTab === "hero"
                ? "bg-accent text-on-accent"
                : "text-muted hover:text-fg hover:bg-tint"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Sparkle size={16} />
              <span>{t.hero}</span>
            </span>
            <span className="text-[10px] opacity-75">Live</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("members");
              setSidebarOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-control text-xs font-medium flex items-center justify-between transition-colors ${
              activeTab === "members"
                ? "bg-accent text-on-accent"
                : "text-muted hover:text-fg hover:bg-tint"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Users size={16} />
              <span>{t.members}</span>
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-chip ${
              activeTab === "members" ? "bg-black/20 text-white" : "bg-tint text-muted"
            }`}>
              {membersList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("publications");
              setSidebarOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-control text-xs font-medium flex items-center justify-between transition-colors ${
              activeTab === "publications"
                ? "bg-accent text-on-accent"
                : "text-muted hover:text-fg hover:bg-tint"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <BookOpen size={16} />
              <span>{t.publications}</span>
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-chip ${
              activeTab === "publications" ? "bg-black/20 text-white" : "bg-tint text-muted"
            }`}>
              {pubList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("events");
              setSidebarOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-control text-xs font-medium flex items-center justify-between transition-colors ${
              activeTab === "events"
                ? "bg-accent text-on-accent"
                : "text-muted hover:text-fg hover:bg-tint"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Calendar size={16} />
              <span>{t.events}</span>
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-chip ${
              activeTab === "events" ? "bg-black/20 text-white" : "bg-tint text-muted"
            }`}>
              {eventsList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("gallery");
              setSidebarOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-control text-xs font-medium flex items-center justify-between transition-colors ${
              activeTab === "gallery"
                ? "bg-accent text-on-accent"
                : "text-muted hover:text-fg hover:bg-tint"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <ImageIcon size={16} />
              <span>{t.gallery}</span>
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-chip ${
              activeTab === "gallery" ? "bg-black/20 text-white" : "bg-tint text-muted"
            }`}>
              {galleryList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("inquiries");
              setSidebarOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-control text-xs font-medium flex items-center justify-between transition-colors ${
              activeTab === "inquiries"
                ? "bg-accent text-on-accent"
                : "text-muted hover:text-fg hover:bg-tint"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <EnvelopeSimple size={16} />
              <span>{t.inquiries}</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-chip bg-red-700 text-white font-semibold">
              {inquiriesList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("settings");
              setSidebarOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-control text-xs font-medium flex items-center gap-2.5 transition-colors ${
              activeTab === "settings"
                ? "bg-accent text-on-accent"
                : "text-muted hover:text-fg hover:bg-tint"
            }`}
          >
            <Database size={16} />
            <span>{t.settings}</span>
          </button>
        </div>

        {/* Pinned User Bar */}
        <div className="p-3 border-t border-line bg-surface flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-accent-soft text-accent font-bold text-xs flex items-center justify-center flex-shrink-0">
              A
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-fg truncate">{session.username}</div>
              <div className="text-[10px] text-muted">Admin</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-control border border-line bg-surface text-fg hover:bg-tint transition-colors"
              aria-label={t.theme}
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-control text-red-500 hover:bg-red-500/10 transition-colors"
              aria-label={t.logout}
              title={t.logout}
            >
              <SignOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-line bg-surface px-6 flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-control border border-line bg-surface text-fg"
            >
              <List size={16} />
            </button>
            <h1 className="text-sm font-bold text-fg">{getPageTitle()}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setLang(lang === "ne" ? "en" : "ne")}
              className="px-3 py-1.5 rounded-control border border-line bg-surface hover:bg-tint text-fg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Translate size={14} className="text-accent" />
              <span>{lang === "ne" ? "English" : "नेपाली"}</span>
            </button>

            {/* Public Portal Link */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-medium border border-line bg-surface hover:bg-tint text-fg transition-colors"
            >
              <ArrowSquareOut size={14} />
              <span>{t.publicPortal}</span>
            </Link>
          </div>
        </header>

        {/* Middle Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* 1. OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stat Metrics Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-card border border-line bg-surface space-y-1">
                  <div className="text-xs text-muted flex items-center justify-between">
                    <span>{t.members}</span>
                    <Users size={16} className="text-accent" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-fg">{membersList.length}</div>
                </div>

                <div className="p-4 rounded-card border border-line bg-surface space-y-1">
                  <div className="text-xs text-muted flex items-center justify-between">
                    <span>{t.publications}</span>
                    <BookOpen size={16} className="text-accent" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-fg">{pubList.length}</div>
                </div>

                <div className="p-4 rounded-card border border-line bg-surface space-y-1">
                  <div className="text-xs text-muted flex items-center justify-between">
                    <span>{t.events}</span>
                    <Calendar size={16} className="text-accent" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-fg">{eventsList.length}</div>
                </div>

                <div className="p-4 rounded-card border border-line bg-surface space-y-1">
                  <div className="text-xs text-muted flex items-center justify-between">
                    <span>{t.inquiries}</span>
                    <EnvelopeSimple size={16} className="text-red-500" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-fg">{inquiriesList.length}</div>
                </div>
              </div>

              {/* Action Triggers */}
              <div className="p-6 rounded-card border border-line bg-surface space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted">{t.quickActions}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("hero")}
                    className="p-4 rounded-control border border-line bg-ground hover:border-accent text-left transition-colors space-y-1"
                  >
                    <div className="text-xs font-bold text-fg">{t.updateHero}</div>
                    <div className="text-[11px] text-muted">{t.updateHeroDesc}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("members");
                      setShowAddMemberModal(true);
                    }}
                    className="p-4 rounded-control border border-line bg-ground hover:border-accent text-left transition-colors space-y-1"
                  >
                    <div className="text-xs font-bold text-fg">{t.addMember}</div>
                    <div className="text-[11px] text-muted">{t.addMemberDesc}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("publications");
                      setShowAddPubModal(true);
                    }}
                    className="p-4 rounded-control border border-line bg-ground hover:border-accent text-left transition-colors space-y-1"
                  >
                    <div className="text-xs font-bold text-fg">{t.uploadPub}</div>
                    <div className="text-[11px] text-muted">{t.uploadPubDesc}</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. HERO BANNER MANAGER */}
          {activeTab === "hero" && (
            <form onSubmit={handleSaveHero} className="space-y-6">
              <div className="p-6 rounded-card border border-line bg-surface space-y-5">
                <div className="text-sm font-bold text-fg flex items-center gap-2">
                  <Globe size={18} className="text-accent" />
                  <span>Headlines and Descriptions</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">Top Ribbon Tag (Nepali)</label>
                    <input
                      required
                      type="text"
                      value={heroState.badgeNe}
                      onChange={(e) => setHeroState({ ...heroState, badgeNe: e.target.value })}
                      className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">Top Ribbon Tag (English)</label>
                    <input
                      required
                      type="text"
                      value={heroState.badgeEn}
                      onChange={(e) => setHeroState({ ...heroState, badgeEn: e.target.value })}
                      className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">Main Headline (Nepali)</label>
                    <textarea
                      required
                      rows={2}
                      value={heroState.titleNe}
                      onChange={(e) => setHeroState({ ...heroState, titleNe: e.target.value })}
                      className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">Main Headline (English)</label>
                    <textarea
                      required
                      rows={2}
                      value={heroState.titleEn}
                      onChange={(e) => setHeroState({ ...heroState, titleEn: e.target.value })}
                      className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">Subtitle Paragraph (Nepali)</label>
                    <textarea
                      required
                      rows={3}
                      value={heroState.descriptionNe}
                      onChange={(e) => setHeroState({ ...heroState, descriptionNe: e.target.value })}
                      className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">Subtitle Paragraph (English)</label>
                    <textarea
                      required
                      rows={3}
                      value={heroState.descriptionEn}
                      onChange={(e) => setHeroState({ ...heroState, descriptionEn: e.target.value })}
                      className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Image and Frame */}
              <div className="p-6 rounded-card border border-line bg-surface space-y-5">
                <div className="text-sm font-bold text-fg flex items-center gap-2">
                  <ImageIcon size={18} className="text-accent" />
                  <span>Landscape Visual Frame</span>
                </div>

                <CloudinaryUploader
                  label="Hero Landscape Visual Image (Max 2MB)"
                  description="High resolution photo for portal header"
                  folder="hero"
                  accept="image/*"
                  value={heroState.imageUrl}
                  onChange={(url) => setHeroState({ ...heroState, imageUrl: url })}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">Image Badge (Nepali)</label>
                    <input
                      type="text"
                      value={heroState.imageBadgeNe}
                      onChange={(e) => setHeroState({ ...heroState, imageBadgeNe: e.target.value })}
                      className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">Image Badge (English)</label>
                    <input
                      type="text"
                      value={heroState.imageBadgeEn}
                      onChange={(e) => setHeroState({ ...heroState, imageBadgeEn: e.target.value })}
                      className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">Caption Title (Nepali)</label>
                    <input
                      type="text"
                      value={heroState.imageCaptionNe}
                      onChange={(e) => setHeroState({ ...heroState, imageCaptionNe: e.target.value })}
                      className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">Caption Title (English)</label>
                    <input
                      type="text"
                      value={heroState.imageCaptionEn}
                      onChange={(e) => setHeroState({ ...heroState, imageCaptionEn: e.target.value })}
                      className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">Office Subtitle (Nepali)</label>
                    <input
                      type="text"
                      value={heroState.imageSubtitleNe}
                      onChange={(e) => setHeroState({ ...heroState, imageSubtitleNe: e.target.value })}
                      className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">Office Subtitle (English)</label>
                    <input
                      type="text"
                      value={heroState.imageSubtitleEn}
                      onChange={(e) => setHeroState({ ...heroState, imageSubtitleEn: e.target.value })}
                      className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-sm transition-colors"
                >
                  {t.saveChanges}
                </button>
              </div>
            </form>
          )}

          {/* 3. COMMITTEE ROSTER */}
          {activeTab === "members" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-fg">{t.members}</h2>
                  <p className="text-xs text-muted">{lang === "ne" ? "कार्यसमिति सदस्यहरू, सल्लाहकार तथा पूर्व नेतृत्व व्यवस्थापन" : "Manage executive members, advisors, and past officers."}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(!showAddMemberModal)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors"
                >
                  <Plus size={14} />
                  <span>{showAddMemberModal ? t.closeBtn : t.addMember}</span>
                </button>
              </div>

              {showAddMemberModal && (
                <form onSubmit={handleAddMember} className="p-6 rounded-card border border-accent/40 bg-surface space-y-4 shadow-sm">
                  <div className="text-xs font-bold uppercase tracking-wider text-accent">{t.addMember}</div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">Full Name (English) *</label>
                      <input
                        required
                        type="text"
                        value={memberForm.nameEn}
                        onChange={(e) => setMemberForm({ ...memberForm, nameEn: e.target.value })}
                        placeholder="Dr. Ram Chandra Gyawali"
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">पूरा नाम (नेपाली) *</label>
                      <input
                        required
                        type="text"
                        value={memberForm.nameNe}
                        onChange={(e) => setMemberForm({ ...memberForm, nameNe: e.target.value })}
                        placeholder="डा. रामचन्द्र ज्ञवाली"
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">Role (English) *</label>
                      <input
                        required
                        type="text"
                        value={memberForm.roleEn}
                        onChange={(e) => setMemberForm({ ...memberForm, roleEn: e.target.value })}
                        placeholder="President"
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">पद (नेपाली) *</label>
                      <input
                        required
                        type="text"
                        value={memberForm.roleNe}
                        onChange={(e) => setMemberForm({ ...memberForm, roleNe: e.target.value })}
                        placeholder="अध्यक्ष"
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">Category</label>
                      <select
                        value={memberForm.committeeType}
                        onChange={(e) =>
                          setMemberForm({
                            ...memberForm,
                            committeeType: e.target.value as "current" | "advisor" | "past",
                          })
                        }
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      >
                        <option value="current">Current Executive (२०८१-२०८४)</option>
                        <option value="advisor">Advisors (सल्लाहकार)</option>
                        <option value="past">Past Leaders (पूर्व नेतृत्व)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">Phone</label>
                      <input
                        type="text"
                        value={memberForm.phone}
                        onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                        placeholder="+977 98..."
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                  </div>

                  <CloudinaryUploader
                    label="Member Portrait Photo (Max 2MB)"
                    description="Clear portrait photo"
                    folder="members"
                    accept="image/*"
                    value={memberForm.photoUrl}
                    onChange={(url) => setMemberForm({ ...memberForm, photoUrl: url })}
                  />

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold"
                  >
                    {t.saveChanges}
                  </button>
                </form>
              )}

              {/* Filter and Search */}
              <div className="p-4 rounded-card border border-line bg-surface space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setMemberFilterCategory("all")}
                      className={`px-3 py-1.5 rounded-control text-xs font-medium transition-colors ${
                        memberFilterCategory === "all"
                          ? "bg-accent text-on-accent"
                          : "bg-ground border border-line text-fg hover:bg-tint"
                      }`}
                    >
                      {t.all} ({membersList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMemberFilterCategory("current")}
                      className={`px-3 py-1.5 rounded-control text-xs font-medium transition-colors ${
                        memberFilterCategory === "current"
                          ? "bg-accent text-on-accent"
                          : "bg-ground border border-line text-fg hover:bg-tint"
                      }`}
                    >
                      {t.current} ({membersList.filter((m) => m.committeeType === "current").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMemberFilterCategory("advisor")}
                      className={`px-3 py-1.5 rounded-control text-xs font-medium transition-colors ${
                        memberFilterCategory === "advisor"
                          ? "bg-accent text-on-accent"
                          : "bg-ground border border-line text-fg hover:bg-tint"
                      }`}
                    >
                      {t.advisor} ({membersList.filter((m) => m.committeeType === "advisor").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMemberFilterCategory("past")}
                      className={`px-3 py-1.5 rounded-control text-xs font-medium transition-colors ${
                        memberFilterCategory === "past"
                          ? "bg-accent text-on-accent"
                          : "bg-ground border border-line text-fg hover:bg-tint"
                      }`}
                    >
                      {t.past} ({membersList.filter((m) => m.committeeType === "past").length})
                    </button>
                  </div>

                  <div className="relative w-full sm:w-56">
                    <MagnifyingGlass size={14} className="absolute left-2.5 top-2.5 text-muted" />
                    <input
                      type="text"
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      placeholder={t.search}
                      className="w-full pl-8 pr-3 py-1.5 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                    />
                  </div>
                </div>

                {/* Table list */}
                <div className="divide-y divide-line">
                  {filteredAdminMembers.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted">
                      {t.noMembers}
                    </div>
                  ) : (
                    filteredAdminMembers.map((member) => (
                      <div key={member.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-control bg-accent-soft text-accent flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {member.nameEn.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-fg truncate">
                              {lang === "ne" ? member.nameNe : member.nameEn}{" "}
                              <span className="text-muted font-normal">
                                ({lang === "ne" ? member.nameEn : member.nameNe})
                              </span>
                            </div>
                            <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                              <span className="text-accent font-medium">{lang === "ne" ? member.roleNe : member.roleEn}</span>
                              {member.phone && <span className="font-mono text-muted">{member.phone}</span>}
                              <span className="capitalize text-muted text-[10px]">({member.committeeType})</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteMember(member.id)}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-control transition-colors"
                          title={t.deleteBtn}
                        >
                          <Trash size={15} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4. PUBLICATIONS */}
          {activeTab === "publications" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-fg">{t.publications}</h2>
                  <p className="text-xs text-muted">{lang === "ne" ? "वार्षिक स्मारिका, मुखपत्र तथा प्रतिवेदन सङ्ग्रह" : "Annual souvenirs, bulletins, and financial reports."}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddPubModal(!showAddPubModal)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors"
                >
                  <Plus size={14} />
                  <span>{showAddPubModal ? t.closeBtn : t.uploadPub}</span>
                </button>
              </div>

              {showAddPubModal && (
                <form onSubmit={handleAddPub} className="p-6 rounded-card border border-accent/40 bg-surface space-y-4 shadow-sm">
                  <div className="text-xs font-bold uppercase tracking-wider text-accent">{t.uploadPub}</div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">Title (English) *</label>
                      <input
                        required
                        type="text"
                        value={pubForm.titleEn}
                        onChange={(e) => setPubForm({ ...pubForm, titleEn: e.target.value })}
                        placeholder="Thorga Souvenir 2081"
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">शीर्षक (नेपाली) *</label>
                      <input
                        required
                        type="text"
                        value={pubForm.titleNe}
                        onChange={(e) => setPubForm({ ...pubForm, titleNe: e.target.value })}
                        placeholder="थोर्गा स्मारिका २०८१"
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">Category</label>
                      <input
                        type="text"
                        value={pubForm.categoryEn}
                        onChange={(e) => setPubForm({ ...pubForm, categoryEn: e.target.value })}
                        placeholder="Souvenir"
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">Page Count</label>
                      <input
                        type="number"
                        value={pubForm.pages}
                        onChange={(e) => setPubForm({ ...pubForm, pages: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CloudinaryUploader
                      label="PDF Document File (Max 2MB)"
                      description="Annual souvenir, bulletin or report PDF"
                      folder="publications"
                      accept="application/pdf"
                      value={pubForm.pdfUrl}
                      onChange={(url) => setPubForm({ ...pubForm, pdfUrl: url })}
                    />
                    <CloudinaryUploader
                      label="Cover Image (Max 2MB)"
                      description="Cover photo thumbnail"
                      folder="publications/covers"
                      accept="image/*"
                      value={pubForm.coverImageUrl}
                      onChange={(url) => setPubForm({ ...pubForm, coverImageUrl: url })}
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold"
                  >
                    {t.saveChanges}
                  </button>
                </form>
              )}

              <div className="p-4 rounded-card border border-line bg-surface space-y-3">
                <div className="divide-y divide-line">
                  {pubList.map((pub) => (
                    <div key={pub.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-control bg-accent-soft text-accent flex items-center justify-center flex-shrink-0">
                          <FileText size={18} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-fg">
                            {lang === "ne" ? pub.titleNe : pub.titleEn}{" "}
                            <span className="text-muted font-normal">
                              ({lang === "ne" ? pub.titleEn : pub.titleNe})
                            </span>
                          </div>
                          <div className="text-[11px] text-muted font-mono flex items-center gap-2 mt-0.5">
                            <span className="text-accent">{pub.categoryEn}</span>
                            <span>{pub.pages} Pgs</span>
                            <span>{pub.fileSize}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeletePub(pub.id)}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-control transition-colors"
                        title={t.deleteBtn}
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. EVENTS */}
          {activeTab === "events" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-fg">{t.events}</h2>
                  <p className="text-xs text-muted">{lang === "ne" ? "आगामी भेला, बैठक तथा सामाजिक कार्यक्रम तालिका" : "Upcoming meetings, gatherings, and community events."}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(!showAddEventModal)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors"
                >
                  <Plus size={14} />
                  <span>{showAddEventModal ? t.closeBtn : t.scheduleEvent}</span>
                </button>
              </div>

              {showAddEventModal && (
                <form onSubmit={handleAddEvent} className="p-6 rounded-card border border-accent/40 bg-surface space-y-4 shadow-sm">
                  <div className="text-xs font-bold uppercase tracking-wider text-accent">{t.scheduleEvent}</div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">Title (English) *</label>
                      <input
                        required
                        type="text"
                        value={eventForm.titleEn}
                        onChange={(e) => setEventForm({ ...eventForm, titleEn: e.target.value })}
                        placeholder="Annual General Assembly"
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">शीर्षक (नेपाली) *</label>
                      <input
                        required
                        type="text"
                        value={eventForm.titleNe}
                        onChange={(e) => setEventForm({ ...eventForm, titleNe: e.target.value })}
                        placeholder="वार्षिक साधारण सभा"
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">Date (BS)</label>
                      <input
                        type="text"
                        value={eventForm.dateNe}
                        onChange={(e) => setEventForm({ ...eventForm, dateNe: e.target.value })}
                        placeholder="२०८१ असोज १२"
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">Location</label>
                      <input
                        type="text"
                        value={eventForm.locationEn}
                        onChange={(e) => setEventForm({ ...eventForm, locationEn: e.target.value })}
                        placeholder="Kathmandu"
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">Status</label>
                      <select
                        value={eventForm.status}
                        onChange={(e) => setEventForm({ ...eventForm, status: e.target.value as "upcoming" | "completed" })}
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <CloudinaryUploader
                    label="Event Banner Image (Max 2MB)"
                    description="Event promotional photo"
                    folder="events"
                    accept="image/*"
                    value={eventForm.imageUrl}
                    onChange={(url) => setEventForm({ ...eventForm, imageUrl: url })}
                  />

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold"
                  >
                    {t.saveChanges}
                  </button>
                </form>
              )}

              <div className="p-4 rounded-card border border-line bg-surface space-y-3">
                <div className="divide-y divide-line">
                  {eventsList.map((ev) => (
                    <div key={ev.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-control bg-accent-soft text-accent flex items-center justify-center flex-shrink-0">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-fg">
                            {lang === "ne" ? ev.titleNe : ev.titleEn}{" "}
                            <span className="text-muted font-normal">
                              ({lang === "ne" ? ev.titleEn : ev.titleNe})
                            </span>
                          </div>
                          <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-accent">{lang === "ne" ? ev.dateNe : ev.dateEn}</span>
                            <span>{lang === "ne" ? ev.locationNe : ev.locationEn}</span>
                            <span className="capitalize text-[10px] font-semibold text-muted">({ev.status})</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-control transition-colors"
                        title={t.deleteBtn}
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 6. GALLERY */}
          {activeTab === "gallery" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-fg">{t.gallery}</h2>
                  <p className="text-xs text-muted">{lang === "ne" ? "सामाजिक अभियान, कार्यक्रम तथा बैठकका तस्बिरहरू" : "Community activities, education drives, and meetings."}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddGalleryModal(!showAddGalleryModal)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors"
                >
                  <Plus size={14} />
                  <span>{showAddGalleryModal ? t.closeBtn : t.addGallery}</span>
                </button>
              </div>

              {showAddGalleryModal && (
                <form onSubmit={handleAddGallery} className="p-6 rounded-card border border-accent/40 bg-surface space-y-4 shadow-sm">
                  <div className="text-xs font-bold uppercase tracking-wider text-accent">{t.addGallery}</div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">Caption (English) *</label>
                      <input
                        required
                        type="text"
                        value={galleryForm.titleEn}
                        onChange={(e) => setGalleryForm({ ...galleryForm, titleEn: e.target.value })}
                        placeholder="Scholarship Handover"
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">विवरण (नेपाली) *</label>
                      <input
                        required
                        type="text"
                        value={galleryForm.titleNe}
                        onChange={(e) => setGalleryForm({ ...galleryForm, titleNe: e.target.value })}
                        placeholder="छात्रवृत्ति वितरण"
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">Category</label>
                    <select
                      value={galleryForm.categoryEn}
                      onChange={(e) => setGalleryForm({ ...galleryForm, categoryEn: e.target.value })}
                      className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs"
                    >
                      <option value="Education">Education</option>
                      <option value="Culture">Culture</option>
                      <option value="Development">Development</option>
                    </select>
                  </div>

                  <CloudinaryUploader
                    label="Gallery Photo (Max 2MB)"
                    description="Community activity image"
                    folder="gallery"
                    accept="image/*"
                    value={galleryForm.imageUrl}
                    onChange={(url) => setGalleryForm({ ...galleryForm, imageUrl: url })}
                  />

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold"
                  >
                    {t.saveChanges}
                  </button>
                </form>
              )}

              <div className="p-4 rounded-card border border-line bg-surface space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {galleryList.map((g) => (
                    <div key={g.id} className="rounded-control overflow-hidden border border-line bg-ground">
                      <div className="relative h-36 w-full">
                        <Image src={g.imageUrl} alt={g.titleEn} fill sizes="300px" className="object-cover" />
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-bold text-fg truncate">
                            {lang === "ne" ? g.titleNe : g.titleEn}
                          </div>
                          <div className="text-[10px] text-muted font-mono">{g.categoryEn}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteGallery(g.id)}
                          className="p-1 text-red-500 hover:bg-red-500/10 rounded-control transition-colors"
                          title={t.deleteBtn}
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 7. INQUIRIES */}
          {activeTab === "inquiries" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-fg">{t.inquiries}</h2>
                <p className="text-xs text-muted">{lang === "ne" ? "सर्वसाधारणबाट प्राप्त सम्पर्क तथा सदस्यता सोधपुछ सन्देशहरू" : "Public contact submissions and inquiries."}</p>
              </div>

              <div className="space-y-3">
                {inquiriesList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted border border-line rounded-card bg-surface">
                    {t.noInquiries}
                  </div>
                ) : (
                  inquiriesList.map((inq) => (
                    <div
                      key={inq.id}
                      className="p-4 rounded-card border border-line bg-surface space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <div className="text-xs font-bold text-fg">{inq.name}</div>
                          <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                            <a href={`tel:${inq.phone}`} className="hover:text-accent font-mono">
                              {inq.phone}
                            </a>
                            <span>{inq.email}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted">{inq.date}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteInquiry(inq.id)}
                            className="p-1 text-red-500 hover:bg-red-500/10 rounded-control transition-colors"
                            title={t.deleteBtn}
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed text-fg bg-ground p-3 rounded-control border border-line">
                        {inq.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 8. SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-fg">{t.settings}</h2>
                <p className="text-xs text-muted">{lang === "ne" ? "सम्पर्क फोन, इमेल तथा कार्यालय ठेगाना व्यवस्थापन" : "Contact details and office physical addresses."}</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  dialogAlert({
                    title: lang === "ne" ? "सेटिङ्स सुरक्षित भयो" : "Settings Saved",
                    description: t.savedSuccess,
                    type: "success",
                  });
                }}
                className="p-6 rounded-card border border-line bg-surface space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">{lang === "ne" ? "सम्पर्क फोन" : "Phone"}</label>
                    <input
                      type="text"
                      value={settings.contactPhone}
                      onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                      className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">{lang === "ne" ? "इमेल" : "Email"}</label>
                    <input
                      type="email"
                      value={settings.contactEmail}
                      onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                      className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">{lang === "ne" ? "काठमाडौँ सम्पर्क सचिवालय ठेगाना" : "Kathmandu Secretariat Address"}</label>
                    <input
                      type="text"
                      value={settings.kathmanduAddress}
                      onChange={(e) => setSettings({ ...settings, kathmanduAddress: e.target.value })}
                      className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">{lang === "ne" ? "थोर्गा गाउँ सम्पर्क केन्द्र ठेगाना" : "Thorga Village Center Address"}</label>
                    <input
                      type="text"
                      value={settings.thorgaAddress}
                      onChange={(e) => setSettings({ ...settings, thorgaAddress: e.target.value })}
                      className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors"
                >
                  {t.saveChanges}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
