"use client";

import React, { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Member,
  EventItem,
  Publication,
  GalleryItem,
  HeroContent,
  ContactSettings,
  Inquiry,
  Language,
  BrandingSettings,
  getStoredLanguage,
  saveStoredLanguage,
  getStoredHeroSnapshot,
  saveStoredHeroContent,
  getStoredContactSettingsSnapshot,
  saveStoredContactSettings,
  getStoredMembersSnapshot,
  saveStoredMembers,
  getStoredEventsSnapshot,
  saveStoredEvents,
  getStoredPublicationsSnapshot,
  saveStoredPublications,
  getStoredGallerySnapshot,
  saveStoredGallery,
  getStoredBrandingSnapshot,
  saveStoredBranding,
} from "@/data/mockData";
import {
  AdminUser,
  AdminSession,
  AdminRole,
  SUPERADMIN_EMAIL,
  getAdminSession,
  setAdminSession,
  clearAdminSession,
  subscribeAdminSession,
  getAdminUsers,
  saveAdminUsers,
} from "@/lib/adminAuth";
import { isJWTExpired } from "@/lib/jwt";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import { useDialog } from "@/components/Dialog";
import { AboutManager } from "@/components/admin/AboutManager";

type CommitteeSection = "current" | "advisor" | "former-officials" | "former-advisors";

const COMMITTEE_SECTIONS: { key: CommitteeSection; ne: string; en: string }[] = [
  { key: "current", ne: "वर्तमान समिति", en: "Current Committee" },
  { key: "advisor", ne: "वर्तमान सल्लाहाकार", en: "Current Advisors" },
  { key: "former-officials", ne: "हालसम्मका पदाधिकारी", en: "Former Office Bearers" },
  { key: "former-advisors", ne: "हालसम्मका सल्लाहाकार", en: "Former Advisors" },
];
import {
  DocumentSectionEditor,
  PUBLICATION_DOC_SLUGS,
  FORMER_COMMITTEE_DOC_SLUGS,
} from "@/components/admin/DocumentSectionEditor";
import { useToast } from "@/components/Toast";
import {
  isValidName,
  isValidPhone,
  isValidEmail,
  isValidPassword,
  isValidImageSrc,
} from "@/lib/validation";
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
  ShieldCheck,
  UserGear,
  CheckCircle,
  XCircle,
  PaintBucket,
  PencilSimple,
  CircleNotch,
} from "@phosphor-icons/react";

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
    adminAccess: "प्रशासक व्यवस्थापन",
    branding: "ब्रान्डिङ",
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
    manageAccessDesc: "प्रशासक खाता तथा पहुँच नियन्त्रण",
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
    username: "प्रयोगकर्ता नाम वा इमेल",
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
    editMember: "सदस्य सम्पादन",
    editPub: "प्रकाशन सम्पादन",
    editEvent: "कार्यक्रम सम्पादन",
    editGallery: "तस्बिर सम्पादन",
    editUser: "प्रशासक सम्पादन",
    editBtn: "सम्पादन",
    deleteBtn: "मेटाउनुहोस्",
    cancelBtn: "रद्द गर्नुहोस्",
    closeBtn: "बन्द गर्नुहोस्",
    // Admin User Access specific
    superadminOnlyNotice: "केवल सुपर एडमिनले मात्र प्रशासक प्रयोगकर्ताहरू थप्न, सक्रिय/निष्क्रिय गर्न वा मेटाउन सक्छ।",
    addAdminUser: "प्रशासक थप्नुहोस्",
    addUserModalTitle: "नयाँ प्रशासक खाता दर्ता",
    editUserModalTitle: "प्रशासक खाता सम्पादन / पासवर्ड परिवर्तन",
    userName: "पूरा नाम",
    userEmail: "आधिकारिक इमेल",
    userRole: "भूमिका",
    userPassword: "पासवर्ड",
    roleSuperadmin: "सुपर एडमिन",
    roleAdmin: "प्रशासक (Admin)",
    roleEditor: "सम्पादक (Editor)",
    activeStatus: "सक्रिय",
    inactiveStatus: "निष्क्रिय",
    deactivate: "निष्क्रिय गर्नुहोस्",
    activate: "सक्रिय गर्नुहोस्",
    removeUserConfirmTitle: "प्रशासक खाता हटाउने पुष्टि",
    removeUserConfirmDesc: "के तपाईं यस प्रयोगकर्ताको प्रशासनिक पहुँच स्थायी रूपमा हटाउन निश्चित हुनुहुन्छ?",
    userAddedSuccess: "नयाँ प्रशासक खाता सफलतापूर्वक सिर्जना गरियो।",
    userRemovedSuccess: "प्रशासक खाता हटाइयो।",
    userStatusChanged: "प्रशासकको पहुँच स्थिति परिवर्तन गरियो।",
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
    adminAccess: "Admin Access",
    branding: "Branding",
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
    manageAccessDesc: "Manage administrator accounts and permissions",
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
    username: "Username or Email",
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
    editMember: "Edit Member",
    editPub: "Edit Publication",
    editEvent: "Edit Event",
    editGallery: "Edit Photo",
    editUser: "Edit Administrator",
    editBtn: "Edit",
    deleteBtn: "Delete",
    cancelBtn: "Cancel",
    closeBtn: "Close",
    // Admin User Access specific
    superadminOnlyNotice: "Only the superadmin configured in the environment file can add, deactivate, or remove administrator accounts.",
    addAdminUser: "Add Administrator",
    addUserModalTitle: "Register New Administrator",
    editUserModalTitle: "Edit Administrator / Change Password",
    userName: "Full Name",
    userEmail: "Official Email",
    userRole: "Role",
    userPassword: "Password",
    roleSuperadmin: "Superadmin",
    roleAdmin: "Administrator",
    roleEditor: "Editor",
    activeStatus: "Active",
    inactiveStatus: "Inactive",
    deactivate: "Deactivate",
    activate: "Activate",
    removeUserConfirmTitle: "Remove Administrator",
    removeUserConfirmDesc: "Are you sure you want to revoke administrative access for this user?",
    userAddedSuccess: "Administrator account created successfully.",
    userRemovedSuccess: "Administrator account removed successfully.",
    userStatusChanged: "User access status updated.",
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

const emptySubscribe = () => () => {};

/** Fire-and-forget: bust the server cache tag after an admin mutation */
async function revalidateCollection(
  tag:
    | "gallery"
    | "events"
    | "members"
    | "publications"
    | "hero"
    | "branding"
    | "contact"
    | "settings"
) {
  try {
    // Authenticated by the admin session cookie. The shared revalidate secret
    // is deliberately not read here: a NEXT_PUBLIC_ copy of it would be
    // published in the browser bundle for anyone to reuse.
    await fetch(`/api/revalidate?tag=${tag}`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Best effort. A failed purge only means content refreshes a little later.
  }
}


export default function AdminPage() {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [session, setSession] = useState<AdminSession | null>(() => getAdminSession());
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
  const { alert: dialogAlert, confirm: dialogConfirm } = useDialog();
  const toast = useToast();

  const toggleAdminLang = () => {
    const next = lang === "ne" ? "en" : "ne";
    setLang(next);
    saveStoredLanguage(next);
  };

  const t = ADMIN_I18N[lang];

  const [activeTab, setActiveTab] = useState<
    "overview" | "hero" | "members" | "publications" | "events" | "gallery" | "inquiries" | "settings" | "access" | "branding" | "about" | "publication-pages"
  >("overview");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Login form state
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Managed Data States
  const [heroState, setHeroState] = useState<HeroContent>(() => getStoredHeroSnapshot());
  const [membersList, setMembersList] = useState<Member[]>(() => getStoredMembersSnapshot());
  const [pubList, setPubList] = useState<Publication[]>(() => getStoredPublicationsSnapshot());
  const [eventsList, setEventsList] = useState<EventItem[]>(() => getStoredEventsSnapshot());
  const [galleryList, setGalleryList] = useState<GalleryItem[]>(() => getStoredGallerySnapshot());
  const [inquiriesList, setInquiriesList] = useState<Inquiry[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const [inquiriesError, setInquiriesError] = useState(false);
  const [adminUsersList, setAdminUsersList] = useState<AdminUser[]>(() => getAdminUsers());
  const [brandingState, setBrandingState] = useState<BrandingSettings>(() => getStoredBrandingSnapshot());

  // Loading States for Operations
  const [isSavingHero, setIsSavingHero] = useState(false);
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [isSavingPub, setIsSavingPub] = useState(false);
  const [deletingPubId, setDeletingPubId] = useState<string | null>(null);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [isSavingGallery, setIsSavingGallery] = useState(false);
  const [deletingGalleryId, setDeletingGalleryId] = useState<string | null>(null);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  // Filter & Form States
  const [memberFilterCategory, setMemberFilterCategory] = useState<"all" | "current" | "advisor" | "past">("all");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddPubModal, setShowAddPubModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showAddGalleryModal, setShowAddGalleryModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // New Admin User Form
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    role: "admin" as AdminRole,
    password: "",
  });

  // Settings State (Contact & Secretariat)
  const [contactSettingsState, setContactSettingsState] = useState<ContactSettings>(() =>
    getStoredContactSettingsSnapshot()
  );

  // Synchronize latest database state on mount
  useEffect(() => {
    fetch("/api/hero", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.titleEn) {
          setHeroState(data);
          saveStoredHeroContent(data);
        }
      })
      .catch(() => {});

    fetch("/api/branding", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setBrandingState(data);
          saveStoredBranding(data);
        }
      })
      .catch(() => {});

    fetch("/api/contact", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.kathmanduTitleEn) {
          setContactSettingsState(data);
          saveStoredContactSettings(data);
        }
      })
      .catch(() => {});

    fetch("/api/members", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data)) {
          setMembersList(data);
          saveStoredMembers(data);
        }
      })
      .catch(() => {});

    fetch("/api/events", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data)) {
          setEventsList(data);
          saveStoredEvents(data);
        }
      })
      .catch(() => {});

    fetch("/api/publications", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data)) {
          setPubList(data);
          saveStoredPublications(data);
        }
      })
      .catch(() => {});

    fetch("/api/gallery", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data)) {
          setGalleryList(data);
          saveStoredGallery(data);
        }
      })
      .catch(() => {});

    const currentSession = getAdminSession();
    const userHeaders: Record<string, string> = {};
    if (currentSession?.token) {
      userHeaders["Authorization"] = `Bearer ${currentSession.token}`;
    }
    fetch("/api/users", { cache: "no-store", credentials: "include", headers: userHeaders })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data)) {
          setAdminUsersList(data);
          saveAdminUsers(data);
        }
      })
      .catch(() => {});

    // Public contact messages, read from the database rather than from this
    // browser's storage.
    fetch("/api/inquiries", { cache: "no-store", credentials: "include", headers: userHeaders })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data)) setInquiriesList(data);
        else setInquiriesError(true);
      })
      .catch(() => setInquiriesError(true))
      .finally(() => setInquiriesLoading(false));
  }, []);

  // Member States
  const [committeeSection, setCommitteeSection] = useState<CommitteeSection>("current");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
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

  // Publication States
  const [editingPub, setEditingPub] = useState<Publication | null>(null);
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

  // Event States
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
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

  // Gallery States
  const [editingGallery, setEditingGallery] = useState<GalleryItem | null>(null);
  const [galleryForm, setGalleryForm] = useState({
    titleEn: "",
    titleNe: "",
    categoryEn: "Education",
    categoryNe: "शिक्षा",
    dateEn: "2081 Shrawan",
    dateNe: "२०८१ साउन",
    imageUrl: "",
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

  const handleAutoLogout = useCallback(
    async (reason?: string) => {
      try {
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      } catch {}
      clearAdminSession();
      setSession(null);
      if (reason) {
        dialogAlert({
          title: lang === "ne" ? "सत्र समाप्त भयो" : "Session Expired",
          description: reason,
          type: "warning",
        });
      }
    },
    [lang, dialogAlert]
  );

  const adminFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const currentSession = getAdminSession();
      if (!currentSession || !currentSession.isAuthenticated || (currentSession.token && isJWTExpired(currentSession.token))) {
        await handleAutoLogout(
          lang === "ne"
            ? "सत्र समाप्त भएको छ। कृपया पुन: लगइन गर्नुहोस्।"
            : "Your session has expired. Please log in again."
        );
        throw new Error("Session expired");
      }

      const headers = new Headers(options.headers || {});
      if (currentSession.token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${currentSession.token}`);
      }

      const response = await fetch(url, {
        ...options,
        credentials: "include",
        headers,
      });

      if (response.status === 401) {
        let errorMsg =
          lang === "ne"
            ? "सत्र समाप्त भएको छ। कृपया पुन: लगइन गर्नुहोस्।"
            : "Your session has expired. Please log in again.";
        try {
          const clone = response.clone();
          const json = await clone.json();
          if (json?.error) errorMsg = json.error;
        } catch {}

        await handleAutoLogout(errorMsg);
      }

      return response;
    },
    [lang, handleAutoLogout]
  );

  // Production-grade JWT session freshness lifecycle and expiration timers
  useEffect(() => {
    const unsubscribe = subscribeAdminSession((newSession) => {
      setSession(newSession);
    });

    if (!session || !session.isAuthenticated) {
      return () => unsubscribe();
    }

    const checkSessionFreshness = () => {
      const activeSession = getAdminSession();
      if (!activeSession || !activeSession.isAuthenticated || (activeSession.token && isJWTExpired(activeSession.token))) {
        handleAutoLogout(
          lang === "ne"
            ? "सत्र समाप्त भएको छ। कृपया पुन: लगइन गर्नुहोस्।"
            : "Your session has expired. Please log in again."
        );
        return;
      }

      if (activeSession.expiresAt && Date.now() >= activeSession.expiresAt) {
        handleAutoLogout(
          lang === "ne"
            ? "सत्रको समय समाप्त भयो। कृपया पुन: लगइन गर्नुहोस्।"
            : "Your session has expired. Please log in again."
        );
        return;
      }
    };

    checkSessionFreshness();

    const timeRemaining = Math.max(
      500,
      (session.expiresAt || session.loginTime + 24 * 60 * 60 * 1000) - Date.now()
    );

    const expiryTimer = setTimeout(() => {
      handleAutoLogout(
        lang === "ne"
          ? "सत्रको समय समाप्त भयो। कृपया पुन: लगइन गर्नुहोस्।"
          : "Your session has expired. Please log in again."
      );
    }, timeRemaining);

    const heartbeat = setInterval(() => {
      checkSessionFreshness();
    }, 15000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkSessionFreshness();
      }
    };

    const handleFocus = () => {
      checkSessionFreshness();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    return () => {
      unsubscribe();
      clearTimeout(expiryTimer);
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [session, lang, handleAutoLogout]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(false);
    setLoginErrorMessage("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        const newSession = setAdminSession(data.user, data.token, data.exp);
        setSession(newSession);
        setLoginError(false);
        setLoginErrorMessage("");
      } else {
        setLoginError(true);
        setLoginErrorMessage(data.error || t.loginError);
      }
    } catch {
      setLoginError(true);
      setLoginErrorMessage(t.loginError);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    clearAdminSession();
    setSession(null);
  };

  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !heroState.titleNe.trim() ||
      !heroState.titleEn.trim() ||
      !heroState.descriptionNe.trim() ||
      !heroState.descriptionEn.trim()
    ) {
      dialogAlert({
        title: lang === "ne" ? "विवरण अपूर्ण छ" : "Incomplete Details",
        description:
          lang === "ne"
            ? "कृपया ब्यानरको मुख्य शीर्षक र विवरण दुवै भाषामा अनिवार्य भर्नुहोस्।"
            : "Please fill both Nepali and English titles and descriptions for the Hero banner.",
        type: "warning",
      });
      return;
    }

    setIsSavingHero(true);
    try {
      const res = await adminFetch("/api/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(heroState),
      });
      const data = await res.json();
      if (data && data.success && data.data) {
        setHeroState(data.data);
        saveStoredHeroContent(data.data);
      } else {
        saveStoredHeroContent(heroState);
      }
      revalidateCollection("hero");

      dialogAlert({
        title: lang === "ne" ? "ब्यानर सम्पादन भयो" : "Hero Banner Updated",
        description:
          lang === "ne"
            ? "मुख्य पृष्ठको ब्यानर विवरणहरू सफलतापूर्वक डेटाबेसमा अद्यावधिक गरिएको छ।"
            : "Hero section headlines, text, and visual frame have been updated live across all devices.",
        type: "success",
      });
    } catch (err) {
      console.error("Failed to sync hero to db:", err);
      dialogAlert({
        title: lang === "ne" ? "कार्य असफल" : "Save Failed",
        description: lang === "ne" ? "सर्भरसँग सम्पर्क हुन सकेन।" : "Network or server error occurred.",
        type: "danger",
      });
    } finally {
      setIsSavingHero(false);
    }
  };

  const handleStartEditMember = (member: Member) => {
    setEditingMember(member);
    setMemberForm({
      nameEn: member.nameEn || "",
      nameNe: member.nameNe || "",
      roleEn: member.roleEn || "",
      roleNe: member.roleNe || "",
      committeeType: member.committeeType || "current",
      order: member.order || 10,
      phone: member.phone || "",
      email: member.email || "",
      bioEn: member.bioEn || "",
      bioNe: member.bioNe || "",
      tenureEn: member.tenureEn || "",
      tenureNe: member.tenureNe || "",
      photoUrl: member.photoUrl || "",
    });
    setShowAddMemberModal(true);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidName(memberForm.nameNe) || !isValidName(memberForm.nameEn)) {
      dialogAlert({
        title: lang === "ne" ? "नाम अमान्य वा अपूर्ण" : "Invalid Name",
        description:
          lang === "ne"
            ? "कृपया सदस्यको पूरा नाम दुवै भाषामा अनिवार्य भर्नुहोस्।"
            : "Please fill member names in both languages.",
        type: "warning",
      });
      return;
    }
    if (!memberForm.roleNe.trim() || !memberForm.roleEn.trim()) {
      dialogAlert({
        title: lang === "ne" ? "पद आवश्यक" : "Role Required",
        description:
          lang === "ne"
            ? "कृपया सदस्यको पद (भूमिका) दुवै भाषामा भर्नुहोस्।"
            : "Please enter member role in both languages.",
        type: "warning",
      });
      return;
    }
    if (memberForm.phone.trim() && !isValidPhone(memberForm.phone)) {
      dialogAlert({
        title: lang === "ne" ? "अमान्य फोन नम्बर" : "Invalid Phone Number",
        description:
          lang === "ne"
            ? "कृपया मान्य फोन नम्बर प्रविष्ट गर्नुहोस् (उदा. +977 9851012345)।"
            : "Please enter a valid phone number format.",
        type: "warning",
      });
      return;
    }
    if (memberForm.email.trim() && !isValidEmail(memberForm.email)) {
      dialogAlert({
        title: lang === "ne" ? "अमान्य इमेल ठेगाना" : "Invalid Email Address",
        description:
          lang === "ne"
            ? "कृपया मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस् (उदा. member@example.com)।"
            : "Please enter a valid email address.",
        type: "warning",
      });
      return;
    }

    setIsSavingMember(true);
    try {
      if (editingMember) {
        const updatedMember: Member = {
          ...editingMember,
          ...memberForm,
          nameNe: memberForm.nameNe.trim(),
          nameEn: memberForm.nameEn.trim(),
          roleNe: memberForm.roleNe.trim(),
          roleEn: memberForm.roleEn.trim(),
          phone: memberForm.phone.trim(),
          email: memberForm.email.trim(),
        };

        let finalMember = updatedMember;
        try {
          const res = await adminFetch("/api/members", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedMember),
          });
          const data = await res.json();
          if (data && data.success && data.data) {
            finalMember = data.data;
          }
        } catch (err) {
          console.error("Failed to update member in db:", err);
        }

        const updated = membersList.map((m) =>
          m.id === editingMember.id ? finalMember : m
        );
        setMembersList(updated);
        saveStoredMembers(updated);
        revalidateCollection("members");
        setShowAddMemberModal(false);
        setEditingMember(null);
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
          title: lang === "ne" ? "सदस्य सम्पादन भयो" : "Member Updated",
          description:
            lang === "ne"
              ? `${finalMember.nameNe} को विवरण सफलतापूर्वक अद्यावधिक गरिएको छ।`
              : `${finalMember.nameEn}'s profile has been successfully updated.`,
          type: "success",
        });
        return;
      }

      const generatedId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `m-${Date.now()}`;

      const newMember: Member = {
        id: generatedId,
        ...memberForm,
        nameNe: memberForm.nameNe.trim(),
        nameEn: memberForm.nameEn.trim(),
        roleNe: memberForm.roleNe.trim(),
        roleEn: memberForm.roleEn.trim(),
        phone: memberForm.phone.trim(),
        email: memberForm.email.trim(),
      };

      let finalSavedMember = newMember;
      try {
        const res = await adminFetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newMember),
        });
        const data = await res.json();
        if (data && data.success && data.data) {
          finalSavedMember = data.data;
        }
      } catch (err) {
        console.error("Failed to sync member to db:", err);
      }

      const updated = [
        finalSavedMember,
        ...membersList.filter((m) => m.id !== finalSavedMember.id),
      ];
      setMembersList(updated);
      saveStoredMembers(updated);
      revalidateCollection("members");
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
            ? `${finalSavedMember.nameNe} कार्यसमिति रोस्टरमा थपिनुभएको छ।`
            : `${finalSavedMember.nameEn} has been added to the committee roster.`,
        type: "success",
      });
    } finally {
      setIsSavingMember(false);
    }
  };

  const deleteCloudinaryAsset = async (url?: string) => {
    if (!url || !url.includes("cloudinary.com")) return;
    try {
      await adminFetch("/api/upload", {
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
      setDeletingMemberId(id);
      try {
        if (memberToDelete?.photoUrl) {
          deleteCloudinaryAsset(memberToDelete.photoUrl);
        }
        const res = await adminFetch(`/api/members?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) {
          dialogAlert({
            title: lang === "ne" ? "हटाउन सकिएन" : "Delete Failed",
            description:
              data?.error ||
              (lang === "ne"
                ? "सर्भरबाट सदस्य हटाउन सकिएन।"
                : "Failed to remove member from server."),
            type: "danger",
          });
          return;
        }

        const updated = membersList.filter((m) => m.id !== id);
        setMembersList(updated);
        saveStoredMembers(updated);
        revalidateCollection("members");
        dialogAlert({
          title: lang === "ne" ? "सदस्य हटाइयो" : "Member Removed",
          description:
            lang === "ne"
              ? "सदस्य सफलतापूर्वक हटाइएको छ।"
              : "Member removed successfully.",
          type: "success",
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.message === "Session expired") return;
        console.error("Failed to delete member from db:", err);
      } finally {
        setDeletingMemberId(null);
      }
    }
  };

  const handleStartEditPub = (pub: Publication) => {
    setEditingPub(pub);
    setPubForm({
      titleEn: pub.titleEn || "",
      titleNe: pub.titleNe || "",
      categoryEn: pub.categoryEn || "Souvenir",
      categoryNe: pub.categoryNe || "स्मारिका",
      publishedYearEn: pub.publishedYearEn || "",
      publishedYearNe: pub.publishedYearNe || "",
      descriptionEn: pub.descriptionEn || "",
      descriptionNe: pub.descriptionNe || "",
      pdfUrl: pub.pdfUrl || "",
      pages: pub.pages || 1,
      fileSize: pub.fileSize || "4.2 MB",
      coverImageUrl: pub.coverImageUrl || "",
    });
    setShowAddPubModal(true);
  };

  const handleAddPub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubForm.titleNe.trim() || !pubForm.titleEn.trim()) {
      dialogAlert({
        title: lang === "ne" ? "शीर्षक आवश्यक" : "Title Required",
        description:
          lang === "ne"
            ? "कृपया प्रकाशनको शीर्षक दुवै भाषामा अनिवार्य भर्नुहोस्।"
            : "Please enter publication titles in both languages.",
        type: "warning",
      });
      return;
    }
    if (!pubForm.pdfUrl.trim()) {
      dialogAlert({
        title: lang === "ne" ? "PDF दस्तावेज आवश्यक" : "PDF Document Required",
        description:
          lang === "ne"
            ? "कृपया क्लाउडिनरी मार्फत आधिकारिक PDF दस्तावेज अपलोड गर्नुहोस्।"
            : "Please upload an official PDF document via the Cloudinary uploader.",
        type: "warning",
      });
      return;
    }

    setIsSavingPub(true);
    try {
      if (editingPub) {
        const updatedPub: Publication = {
          ...editingPub,
          ...pubForm,
          titleNe: pubForm.titleNe.trim(),
          titleEn: pubForm.titleEn.trim(),
          categoryNe: pubForm.categoryNe.trim(),
          categoryEn: pubForm.categoryEn.trim(),
        };

        let finalPub = updatedPub;
        try {
          const res = await adminFetch("/api/publications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedPub),
          });
          const data = await res.json();
          if (data && data.success && data.data) {
            finalPub = data.data;
          }
        } catch (err) {
          console.error("Failed to update pub in db:", err);
        }

        const updated = pubList.map((p) =>
          p.id === editingPub.id ? finalPub : p
        );
        setPubList(updated);
        saveStoredPublications(updated);
        revalidateCollection("publications");
        setShowAddPubModal(false);
        setEditingPub(null);
        setPubForm({
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
        dialogAlert({
          title: lang === "ne" ? "प्रकाशन सम्पादन भयो" : "Publication Updated",
          description:
            lang === "ne"
              ? "प्रकाशन विवरण सफलतापूर्वक अद्यावधिक गरिएको छ।"
              : "Publication details updated successfully.",
          type: "success",
        });
        return;
      }

      const generatedId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `p-${Date.now()}`;

      const newPub: Publication = {
        id: generatedId,
        ...pubForm,
        titleNe: pubForm.titleNe.trim(),
        titleEn: pubForm.titleEn.trim(),
        categoryNe: pubForm.categoryNe.trim(),
        categoryEn: pubForm.categoryEn.trim(),
      };

      let finalSavedPub = newPub;
      try {
        const res = await adminFetch("/api/publications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPub),
        });
        const data = await res.json();
        if (data && data.success && data.data) {
          finalSavedPub = data.data;
        }
      } catch (err) {
        console.error("Failed to sync pub to db:", err);
      }

      const updated = [
        finalSavedPub,
        ...pubList.filter((p) => p.id !== finalSavedPub.id),
      ];
      setPubList(updated);
      saveStoredPublications(updated);
      revalidateCollection("publications");
      setShowAddPubModal(false);
      setPubForm({
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
      dialogAlert({
        title: lang === "ne" ? "प्रकाशन थपियो" : "Publication Uploaded",
        description:
          lang === "ne"
            ? "नयाँ प्रकाशन डिजिटल सङ्ग्रहमा सफलतापूर्वक प्रकाशित भयो।"
            : "New document added to the public PDF archive.",
        type: "success",
      });
    } finally {
      setIsSavingPub(false);
    }
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
      setDeletingPubId(id);
      try {
        if (pubToDelete?.pdfUrl) {
          deleteCloudinaryAsset(pubToDelete.pdfUrl);
        }
        if (pubToDelete?.coverImageUrl) {
          deleteCloudinaryAsset(pubToDelete.coverImageUrl);
        }

        const res = await adminFetch(`/api/publications?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) {
          dialogAlert({
            title: lang === "ne" ? "हटाउन सकिएन" : "Delete Failed",
            description:
              data?.error ||
              (lang === "ne"
                ? "सर्भरबाट प्रकाशन हटाउन सकिएन।"
                : "Failed to remove publication from server."),
            type: "danger",
          });
          return;
        }

        const updated = pubList.filter((p) => p.id !== id);
        setPubList(updated);
        saveStoredPublications(updated);
        revalidateCollection("publications");
        dialogAlert({
          title: lang === "ne" ? "प्रकाशन हटाइयो" : "Publication Removed",
          description:
            lang === "ne"
              ? "प्रकाशन सफलतापूर्वक हटाइएको छ।"
              : "Publication removed successfully.",
          type: "success",
        });
      } catch (err) {
        console.error("Failed to delete pub from db:", err);
      } finally {
        setDeletingPubId(null);
      }
    }
  };

  const handleStartEditEvent = (ev: EventItem) => {
    setEditingEvent(ev);
    setEventForm({
      titleEn: ev.titleEn || "",
      titleNe: ev.titleNe || "",
      categoryEn: ev.categoryEn || "Meeting",
      categoryNe: ev.categoryNe || "भेला",
      dateEn: ev.dateEn || "",
      dateNe: ev.dateNe || "",
      timeEn: ev.timeEn || "",
      timeNe: ev.timeNe || "",
      locationEn: ev.locationEn || "",
      locationNe: ev.locationNe || "",
      descriptionEn: ev.descriptionEn || "",
      descriptionNe: ev.descriptionNe || "",
      imageUrl: ev.imageUrl || "",
      status: ev.status || "upcoming",
    });
    setShowAddEventModal(true);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.titleNe.trim() || !eventForm.titleEn.trim()) {
      dialogAlert({
        title: lang === "ne" ? "शीर्षक आवश्यक" : "Title Required",
        description:
          lang === "ne"
            ? "कृपया कार्यक्रमको शीर्षक दुवै भाषामा भर्नुहोस्।"
            : "Please enter event titles in both languages.",
        type: "warning",
      });
      return;
    }
    if (!eventForm.dateNe.trim() || !eventForm.dateEn.trim()) {
      dialogAlert({
        title: lang === "ne" ? "मिति आवश्यक" : "Date Required",
        description:
          lang === "ne"
            ? "कृपया कार्यक्रमको मिति दुवै भाषामा भर्नुहोस्।"
            : "Please enter event dates in both languages.",
        type: "warning",
      });
      return;
    }
    if (!eventForm.locationNe.trim() || !eventForm.locationEn.trim()) {
      dialogAlert({
        title: lang === "ne" ? "स्थान आवश्यक" : "Location Required",
        description:
          lang === "ne"
            ? "कृपया कार्यक्रम हुने स्थान दुवै भाषामा भर्नुहोस्।"
            : "Please enter event locations in both languages.",
        type: "warning",
      });
      return;
    }

    setIsSavingEvent(true);
    try {
      if (editingEvent) {
        const updatedEv: EventItem = {
          ...editingEvent,
          ...eventForm,
          titleNe: eventForm.titleNe.trim(),
          titleEn: eventForm.titleEn.trim(),
          dateNe: eventForm.dateNe.trim(),
          dateEn: eventForm.dateEn.trim(),
          locationNe: eventForm.locationNe.trim(),
          locationEn: eventForm.locationEn.trim(),
        };

        let finalEv = updatedEv;
        try {
          const res = await adminFetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedEv),
          });
          const data = await res.json();
          if (data && data.success && data.data) {
            finalEv = data.data;
          }
        } catch (err) {
          console.error("Failed to update event in db:", err);
        }

        const updated = eventsList.map((e) =>
          e.id === editingEvent.id ? finalEv : e
        );
        setEventsList(updated);
        saveStoredEvents(updated);
        revalidateCollection("events");
        setShowAddEventModal(false);
        setEditingEvent(null);
        setEventForm({
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
          status: "upcoming",
        });
        dialogAlert({
          title: lang === "ne" ? "कार्यक्रम सम्पादन भयो" : "Event Updated",
          description:
            lang === "ne"
              ? "कार्यक्रम विवरण सफलतापूर्वक अद्यावधिक गरिएको छ।"
              : "Event details have been updated.",
          type: "success",
        });
        return;
      }

      const generatedId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `e-${Date.now()}`;

      const newEv: EventItem = {
        id: generatedId,
        ...eventForm,
        titleNe: eventForm.titleNe.trim(),
        titleEn: eventForm.titleEn.trim(),
        dateNe: eventForm.dateNe.trim(),
        dateEn: eventForm.dateEn.trim(),
        locationNe: eventForm.locationNe.trim(),
        locationEn: eventForm.locationEn.trim(),
      };

      let finalSavedEv = newEv;
      try {
        const res = await adminFetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newEv),
        });
        const data = await res.json();
        if (data && data.success && data.data) {
          finalSavedEv = data.data;
        }
      } catch (err) {
        console.error("Failed to sync event to db:", err);
      }

      const updated = [
        finalSavedEv,
        ...eventsList.filter((e) => e.id !== finalSavedEv.id),
      ];
      setEventsList(updated);
      saveStoredEvents(updated);
      revalidateCollection("events");
      setShowAddEventModal(false);
      setEventForm({
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
        status: "upcoming",
      });
      dialogAlert({
        title: lang === "ne" ? "कार्यक्रम थपियो" : "Event Scheduled",
        description:
          lang === "ne"
            ? "कार्यक्रम क्यालेन्डरमा दर्ता भएको छ।"
            : "Event successfully added to schedule.",
        type: "success",
      });
    } finally {
      setIsSavingEvent(false);
    }
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
      setDeletingEventId(id);
      try {
        if (eventToDelete?.imageUrl) {
          deleteCloudinaryAsset(eventToDelete.imageUrl);
        }

        const res = await adminFetch(`/api/events?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) {
          dialogAlert({
            title: lang === "ne" ? "हटाउन सकिएन" : "Delete Failed",
            description:
              data?.error ||
              (lang === "ne"
                ? "सर्भरबाट कार्यक्रम हटाउन सकिएन।"
                : "Failed to remove event from server."),
            type: "danger",
          });
          return;
        }

        const updated = eventsList.filter((e) => e.id !== id);
        setEventsList(updated);
        saveStoredEvents(updated);
        revalidateCollection("events");
        dialogAlert({
          title: lang === "ne" ? "कार्यक्रम हटाइयो" : "Event Removed",
          description:
            lang === "ne"
              ? "कार्यक्रम सफलतापूर्वक हटाइएको छ।"
              : "Event removed successfully.",
          type: "success",
        });
      } catch (err) {
        console.error("Failed to delete event from db:", err);
      } finally {
        setDeletingEventId(null);
      }
    }
  };

  const handleStartEditGallery = (g: GalleryItem) => {
    setEditingGallery(g);
    setGalleryForm({
      titleEn: g.titleEn || "",
      titleNe: g.titleNe || "",
      categoryEn: g.categoryEn || "Education",
      categoryNe: g.categoryNe || "शिक्षा",
      dateEn: g.dateEn || "",
      dateNe: g.dateNe || "",
      imageUrl: g.imageUrl || "",
    });
    setShowAddGalleryModal(true);
  };

  const handleAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryForm.titleNe.trim() || !galleryForm.titleEn.trim()) {
      dialogAlert({
        title: lang === "ne" ? "विवरण आवश्यक" : "Caption Required",
        description:
          lang === "ne"
            ? "कृपया तस्बिरको शीर्षक/क्याप्सन दुवै भाषामा भर्नुहोस्।"
            : "Please enter photo captions in both languages.",
        type: "warning",
      });
      return;
    }
    if (!galleryForm.imageUrl.trim()) {
      dialogAlert({
        title: lang === "ne" ? "तस्बिर आवश्यक" : "Image Required",
        description:
          lang === "ne"
            ? "कृपया क्लाउडिनरी मार्फत तस्बिर अपलोड गर्नुहोस्।"
            : "Please upload an image via Cloudinary uploader.",
        type: "warning",
      });
      return;
    }

    setIsSavingGallery(true);
    try {
      if (editingGallery) {
        const updatedG: GalleryItem = {
          ...editingGallery,
          ...galleryForm,
          titleNe: galleryForm.titleNe.trim(),
          titleEn: galleryForm.titleEn.trim(),
        };

        let finalG = updatedG;
        try {
          const res = await adminFetch("/api/gallery", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedG),
          });
          const data = await res.json();
          if (data && data.success && data.data) {
            finalG = data.data;
          }
        } catch (err) {
          console.error("Failed to update gallery in db:", err);
        }

        const updated = galleryList.map((g) =>
          g.id === editingGallery.id ? finalG : g
        );
        setGalleryList(updated);
        saveStoredGallery(updated);
        revalidateCollection("gallery");
        setShowAddGalleryModal(false);
        setEditingGallery(null);
        setGalleryForm({
          titleEn: "",
          titleNe: "",
          categoryEn: "Education",
          categoryNe: "शिक्षा",
          dateEn: "2081 Shrawan",
          dateNe: "२०८१ साउन",
          imageUrl: "",
        });
        dialogAlert({
          title: lang === "ne" ? "तस्बिर सम्पादन भयो" : "Photo Updated",
          description:
            lang === "ne"
              ? "तस्बिर विवरण सफलतापूर्वक अद्यावधिक गरिएको छ।"
              : "Gallery photo details updated successfully.",
          type: "success",
        });
        return;
      }

      const generatedId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `g-${Date.now()}`;

      const newG: GalleryItem = {
        id: generatedId,
        ...galleryForm,
        titleNe: galleryForm.titleNe.trim(),
        titleEn: galleryForm.titleEn.trim(),
      };

      let finalSavedG = newG;
      try {
        const res = await adminFetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newG),
        });
        const data = await res.json();
        if (data && data.success && data.data) {
          finalSavedG = data.data;
        }
      } catch (err) {
        console.error("Failed to sync gallery to db:", err);
      }

      const updated = [
        finalSavedG,
        ...galleryList.filter((g) => g.id !== finalSavedG.id),
      ];
      setGalleryList(updated);
      saveStoredGallery(updated);
      revalidateCollection("gallery");
      setShowAddGalleryModal(false);
      setGalleryForm({
        titleEn: "",
        titleNe: "",
        categoryEn: "Education",
        categoryNe: "शिक्षा",
        dateEn: "2081 Shrawan",
        dateNe: "२०८१ साउन",
        imageUrl: "",
      });
      dialogAlert({
        title: lang === "ne" ? "तस्बिर थपियो" : "Photo Added",
        description:
          lang === "ne"
            ? "तस्बिर ग्यालरीमा सफलतापूर्वक थपियो।"
            : "Photo added to gallery.",
        type: "success",
      });
    } finally {
      setIsSavingGallery(false);
    }
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
      setDeletingGalleryId(id);
      try {
        if (galleryToDelete?.imageUrl) {
          deleteCloudinaryAsset(galleryToDelete.imageUrl);
        }

        const res = await adminFetch(`/api/gallery?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) {
          dialogAlert({
            title: lang === "ne" ? "हटाउन सकिएन" : "Delete Failed",
            description:
              data?.error ||
              (lang === "ne"
                ? "सर्भरबाट तस्बिर हटाउन सकिएन।"
                : "Failed to remove photo from server."),
            type: "danger",
          });
          return;
        }

        const updated = galleryList.filter((g) => g.id !== id);
        setGalleryList(updated);
        saveStoredGallery(updated);
        revalidateCollection("gallery");
        dialogAlert({
          title: lang === "ne" ? "तस्बिर हटाइयो" : "Photo Removed",
          description:
            lang === "ne"
              ? "तस्बिर ग्यालरीबाट सफलतापूर्वक हटाइएको छ।"
              : "Photo removed from gallery successfully.",
          type: "success",
        });
      } catch (err) {
        console.error("Failed to delete gallery from db:", err);
      } finally {
        setDeletingGalleryId(null);
      }
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
    if (!confirmed) return;

    const previous = inquiriesList;
    // Optimistic removal, rolled back if the server rejects the delete.
    setInquiriesList((current) => current.filter((inq) => inq.id !== id));

    try {
      const res = await adminFetch(`/api/inquiries?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res || !res.ok) throw new Error("Delete failed");
    } catch {
      setInquiriesList(previous);
      toast.error(
        lang === "ne" ? "हटाउन सकिएन" : "Could not delete",
        lang === "ne" ? "कृपया पुनः प्रयास गर्नुहोस्।" : "Please try again."
      );
    }
  };

  // --- Admin User Access Management Handlers ---
  const handleStartEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      password: user.password || "",
    });
    setShowAddUserModal(true);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (!userForm.name.trim() || !isValidName(userForm.name)) {
      dialogAlert({
        title: lang === "ne" ? "नाम आवश्यक छ" : "Name Required",
        description:
          lang === "ne"
            ? "कृपया प्रशासकको पूरा नाम (कम्तिमा २ अक्षर) लेख्नुहोस्।"
            : "Please enter a valid administrator name (min 2 characters).",
        type: "warning",
      });
      return;
    }
    if (!isValidEmail(userForm.email)) {
      dialogAlert({
        title: lang === "ne" ? "अमान्य इमेल" : "Invalid Email",
        description:
          lang === "ne"
            ? "कृपया मान्य आधिकारिक इमेल ठेगाना लेख्नुहोस्।"
            : "Please enter a valid official email address.",
        type: "warning",
      });
      return;
    }
    if (!editingUser || userForm.password) {
      const passCheck = isValidPassword(userForm.password);
      if (!passCheck.isValid) {
        dialogAlert({
          title: lang === "ne" ? "कमजोर पासवर्ड" : "Weak Password",
          description: lang === "ne" ? passCheck.errorNe : passCheck.errorEn,
          type: "warning",
        });
        return;
      }
    }

    setIsSavingUser(true);
    try {
      if (editingUser) {
        const payload: Partial<AdminUser> & { id: string } = {
          id: editingUser.id,
          name: userForm.name.trim(),
          email: userForm.email.trim(),
          role: userForm.role,
          ...(userForm.password ? { password: userForm.password } : {}),
        };

        try {
          const res = await adminFetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            dialogAlert({
              title: lang === "ne" ? "कार्य असफल" : "Action Failed",
              description:
                data.error ||
                (lang === "ne"
                  ? "प्रशासक खाता अद्यावधिक गर्न सकिएन।"
                  : "Failed to update administrator."),
              type: "danger",
            });
            return;
          }

          if (data.users) {
            setAdminUsersList(data.users);
            saveAdminUsers(data.users);
          }
        } catch {
          dialogAlert({
            title: lang === "ne" ? "कार्य असफल" : "Action Failed",
            description:
              lang === "ne"
                ? "सर्भरसँग सम्पर्क हुन सकेन।"
                : "Network or server error occurred.",
            type: "danger",
          });
          return;
        }

        setShowAddUserModal(false);
        setEditingUser(null);
        setUserForm({ name: "", email: "", role: "admin", password: "" });
        dialogAlert({
          title: lang === "ne" ? "खाता अद्यावधिक भयो" : "Account Updated",
          description: `${userForm.name} (${userForm.email}) ${lang === "ne" ? "सफलतापूर्वक अद्यावधिक भयो।" : "updated successfully."}`,
          type: "success",
        });
      } else {
        const newUserPayload = {
          name: userForm.name.trim(),
          email: userForm.email.trim(),
          role: userForm.role,
          password: userForm.password,
          addedBy: session.email,
        };

        try {
          const res = await adminFetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newUserPayload),
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            dialogAlert({
              title: lang === "ne" ? "कार्य असफल" : "Action Failed",
              description:
                data.error ||
                (lang === "ne"
                  ? "नयाँ प्रशासक खाता सिर्जना गर्न सकिएन।"
                  : "Failed to create administrator."),
              type: "danger",
            });
            return;
          }

          if (data.users) {
            setAdminUsersList(data.users);
            saveAdminUsers(data.users);
          }
        } catch {
          dialogAlert({
            title: lang === "ne" ? "कार्य असफल" : "Action Failed",
            description:
              lang === "ne"
                ? "सर्भरसँग सम्पर्क हुन सकेन।"
                : "Network or server error occurred.",
            type: "danger",
          });
          return;
        }

        setShowAddUserModal(false);
        setUserForm({ name: "", email: "", role: "admin", password: "" });
        dialogAlert({
          title:
            lang === "ne"
              ? "प्रशासक खाता सिर्जना भयो"
              : "Administrator Created",
          description: `${userForm.name} (${userForm.email}) ${t.userAddedSuccess}`,
          type: "success",
        });
      }
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleToggleUser = async (user: AdminUser) => {
    if (!session?.isSuperadmin) {
      dialogAlert({
        title: lang === "ne" ? "अनुमति अस्वीकृत" : "Permission Denied",
        description: t.superadminOnlyNotice,
        type: "danger",
      });
      return;
    }

    setTogglingUserId(user.id);
    try {
      const res = await adminFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, isActive: !user.isActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        dialogAlert({
          title: lang === "ne" ? "कार्य असफल" : "Action Failed",
          description:
            data.error ||
            (lang === "ne"
              ? "स्थिति अद्यावधिक गर्न सकिएन।"
              : "Failed to update user status."),
          type: "danger",
        });
        return;
      }

      if (data.users) {
        setAdminUsersList(data.users);
        saveAdminUsers(data.users);
      }

      dialogAlert({
        title: lang === "ne" ? "स्थिति अद्यावधिक भयो" : "Status Updated",
        description: `${user.name}: ${t.userStatusChanged}`,
        type: "info",
      });
    } catch {
      dialogAlert({
        title: lang === "ne" ? "कार्य असफल" : "Action Failed",
        description:
          lang === "ne"
            ? "सर्भरसँग सम्पर्क हुन सकेन।"
            : "Network or server error occurred.",
        type: "danger",
      });
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    const isSuper =
      session?.isSuperadmin ||
      session?.role === "superadmin" ||
      session?.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ||
      session?.email?.toLowerCase() === "admin@thorgaktm.org.np";

    if (!isSuper) {
      dialogAlert({
        title: lang === "ne" ? "अनुमति अस्वीकृत" : "Permission Denied",
        description: t.superadminOnlyNotice,
        type: "danger",
      });
      return;
    }
    const confirmed = await dialogConfirm({
      title: t.removeUserConfirmTitle,
      description: `${t.removeUserConfirmDesc} (${user.name} - ${user.email})`,
      type: "danger",
      confirmText: t.deleteBtn,
      cancelText: t.cancelBtn,
    });
    if (confirmed) {
      setDeletingUserId(user.id);
      try {
        const res = await adminFetch(`/api/users?id=${encodeURIComponent(user.id)}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          dialogAlert({
            title: lang === "ne" ? "कार्य असफल" : "Action Failed",
            description:
              data.error ||
              (lang === "ne"
                ? "प्रशासक हटाउन सकिएन।"
                : "Failed to remove user."),
            type: "danger",
          });
          return;
        }

        if (data.users && Array.isArray(data.users)) {
          setAdminUsersList(data.users);
          saveAdminUsers(data.users);
        } else {
          const updated = adminUsersList.filter((u) => u.id !== user.id);
          setAdminUsersList(updated);
          saveAdminUsers(updated);
        }

        dialogAlert({
          title: lang === "ne" ? "प्रशासक हटाइयो" : "User Removed",
          description: t.userRemovedSuccess,
          type: "success",
        });
      } catch {
        dialogAlert({
          title: lang === "ne" ? "कार्य असफल" : "Action Failed",
          description:
            lang === "ne"
              ? "सर्भरसँग सम्पर्क हुन सकेन।"
              : "Network or server error occurred.",
          type: "danger",
        });
      } finally {
        setDeletingUserId(null);
      }
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
      case "about":
        return lang === "ne" ? "हाम्रो बारेमा" : "About Us";
      case "publication-pages":
        return lang === "ne" ? "प्रकाशन पृष्ठहरु" : "Publication Pages";
      case "inquiries":
        return t.inquiries;
      case "settings":
        return t.settings;
      case "access":
        return t.adminAccess;
      default:
        return t.overview;
    }
  };

  // -------------------------------------------------------------
  // 0. SSR & INITIAL HYDRATION GUARD
  // -------------------------------------------------------------
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-ground text-fg font-sans flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <div className="text-xs text-muted font-mono tracking-wider uppercase">Loading Portal...</div>
        </div>
      </div>
    );
  }

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
              onClick={toggleAdminLang}
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
              <div className="p-3 rounded-control border border-danger/30 bg-danger/10 text-danger text-xs text-center leading-relaxed">
                {loginErrorMessage || t.loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-fg">{t.username}</label>
                <input
                  required
                  disabled={isLoggingIn}
                  type="text"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder="admin or email"
                  className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent disabled:opacity-60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-fg">{t.password}</label>
                <input
                  required
                  disabled={isLoggingIn}
                  type="password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2.5 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? (
                  <>
                    <CircleNotch size={16} className="animate-spin" />
                    <span>{lang === "ne" ? "प्रमाणीकरण हुँदैछ..." : "Signing in..."}</span>
                  </>
                ) : (
                  <span>{t.signInBtn}</span>
                )}
              </button>
            </form>


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
              setActiveTab("publication-pages");
              setSidebarOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-control text-xs font-medium flex items-center gap-2 transition-colors ${
              activeTab === "publication-pages"
                ? "bg-accent text-on-accent"
                : "text-muted hover:text-fg hover:bg-tint"
            }`}
          >
            <FileText size={15} />
            <span>{lang === "ne" ? "प्रकाशन पृष्ठहरु" : "Publication Pages"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("about");
              setSidebarOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-control text-xs font-medium flex items-center gap-2 transition-colors ${
              activeTab === "about"
                ? "bg-accent text-on-accent"
                : "text-muted hover:text-fg hover:bg-tint"
            }`}
          >
            <Buildings size={15} />
            <span>{lang === "ne" ? "हाम्रो बारेमा" : "About Us"}</span>
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
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-chip bg-danger text-white font-semibold">
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

          <button
            type="button"
            onClick={() => {
              setActiveTab("branding");
              setSidebarOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-control text-xs font-medium flex items-center gap-2.5 transition-colors ${
              activeTab === "branding"
                ? "bg-accent text-on-accent"
                : "text-muted hover:text-fg hover:bg-tint"
            }`}
          >
            <PaintBucket size={16} />
            <span>{t.branding}</span>
          </button>

          {/* 9. ADMIN USER ACCESS (NEW) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("access");
              setSidebarOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-control text-xs font-medium flex items-center justify-between transition-colors ${
              activeTab === "access"
                ? "bg-accent text-on-accent"
                : "text-muted hover:text-fg hover:bg-tint"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <ShieldCheck size={16} />
              <span>{t.adminAccess}</span>
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-chip ${
              activeTab === "access" ? "bg-black/20 text-white" : "bg-tint text-muted"
            }`}>
              {adminUsersList.length}
            </span>
          </button>
        </div>

        {/* Pinned User Bar */}
        <div className="p-3 border-t border-line bg-surface flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
              session.isSuperadmin ? "bg-warning/20 text-warning" : "bg-accent-soft text-accent"
            }`}>
              {session.isSuperadmin ? "S" : "A"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-fg truncate">{session.username}</div>
              <div className="text-[10px] text-muted flex items-center gap-1">
                <span className="capitalize font-mono">{session.role}</span>
                {session.isSuperadmin && <span className="text-[9px] px-1 bg-warning/20 text-warning rounded">Super</span>}
              </div>
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
              className="p-1.5 rounded-control text-danger hover:bg-danger/10 transition-colors"
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
              onClick={toggleAdminLang}
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
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
                    <EnvelopeSimple size={16} className="text-danger" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-fg">{inquiriesList.length}</div>
                </div>

                <div className="p-4 rounded-card border border-line bg-surface space-y-1">
                  <div className="text-xs text-muted flex items-center justify-between">
                    <span>{t.adminAccess}</span>
                    <ShieldCheck size={16} className="text-warning" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-fg">{adminUsersList.length}</div>
                </div>
              </div>

              {/* Action Triggers */}
              <div className="p-6 rounded-card border border-line bg-surface space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted">{t.quickActions}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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

                  <button
                    type="button"
                    onClick={() => setActiveTab("access")}
                    className="p-4 rounded-control border border-line bg-ground hover:border-accent text-left transition-colors space-y-1"
                  >
                    <div className="text-xs font-bold text-fg">{t.adminAccess}</div>
                    <div className="text-[11px] text-muted">{t.manageAccessDesc}</div>
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
                  disabled={isSavingHero}
                  className="px-6 py-2.5 rounded-control bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
                >
                  {isSavingHero && <CircleNotch size={14} className="animate-spin" />}
                  <span>{isSavingHero ? (lang === "ne" ? "सुरक्षित गर्दै..." : "Saving...") : t.saveChanges}</span>
                </button>
              </div>
            </form>
          )}

          {/* 3. COMMITTEE ROSTER */}
          {activeTab === "members" && (
            <div className="space-y-6">
              {/* Committee is split into four subsections: the two current
                  bodies are edited person by person, while each former term is
                  published as a single sheet with the term as its caption. */}
              <div className="flex flex-wrap gap-2">
                {COMMITTEE_SECTIONS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      setCommitteeSection(s.key);
                      if (s.key === "current" || s.key === "advisor") {
                        setMemberFilterCategory(s.key);
                        setShowAddMemberModal(false);
                        setEditingMember(null);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors ${
                      committeeSection === s.key
                        ? "bg-accent text-on-accent"
                        : "bg-surface border border-line text-fg hover:bg-tint"
                    }`}
                  >
                    {lang === "ne" ? s.ne : s.en}
                  </button>
                ))}
              </div>

              {committeeSection === "former-officials" || committeeSection === "former-advisors" ? (
                <DocumentSectionEditor
                  lang={lang}
                  adminFetch={adminFetch}
                  slugs={FORMER_COMMITTEE_DOC_SLUGS.filter((s) => s.slug === committeeSection)}
                />
              ) : (
                <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-fg">{t.members}</h2>
                  <p className="text-xs text-muted">{lang === "ne" ? "वर्तमान समिति र सल्लाहाकार व्यक्तिगत रूपमा, पूर्व कार्यकाल कार्यकालअनुसार" : "Current committee and advisors person by person; former terms one sheet per term."}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (showAddMemberModal) {
                      setShowAddMemberModal(false);
                      setEditingMember(null);
                    } else {
                      setEditingMember(null);
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
                      setShowAddMemberModal(true);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors"
                >
                  <Plus size={14} />
                  <span>{showAddMemberModal ? t.closeBtn : t.addMember}</span>
                </button>
              </div>

              {showAddMemberModal && (
                <form onSubmit={handleAddMember} className="p-6 rounded-card border border-accent/40 bg-surface space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-accent">
                      {editingMember ? t.editMember : t.addMember}
                    </div>
                    {editingMember && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMember(null);
                          setShowAddMemberModal(false);
                        }}
                        className="text-xs text-muted hover:text-fg"
                      >
                        {t.cancelBtn}
                      </button>
                    )}
                  </div>

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
                            committeeType: e.target.value as "current" | "advisor",
                          })
                        }
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      >
                        <option value="current">Current Executive (२०८१-२०८४)</option>
                        <option value="advisor">Advisors (सल्लाहकार)</option>
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

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isSavingMember}
                      className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold flex items-center gap-2"
                    >
                      {isSavingMember && <CircleNotch size={14} className="animate-spin" />}
                      <span>
                        {isSavingMember
                          ? (lang === "ne" ? "सुरक्षित गर्दै..." : "Saving...")
                          : editingMember
                          ? (lang === "ne" ? "परिवर्तन सुरक्षित गर्नुहोस्" : "Save Changes")
                          : t.saveChanges}
                      </span>
                    </button>
                    {editingMember && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMember(null);
                          setShowAddMemberModal(false);
                        }}
                        className="px-4 py-2 rounded-control border border-line text-xs font-medium text-muted hover:text-fg"
                      >
                        {t.cancelBtn}
                      </button>
                    )}
                  </div>
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

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEditMember(member)}
                            className="p-1.5 text-accent hover:bg-accent/10 rounded-control transition-colors"
                            title={t.editBtn}
                          >
                            <PencilSimple size={15} />
                          </button>
                          <button
                            type="button"
                            disabled={deletingMemberId === member.id}
                            onClick={() => handleDeleteMember(member.id)}
                            className="p-1.5 text-danger hover:bg-danger/10 disabled:opacity-60 rounded-control transition-colors"
                            title={t.deleteBtn}
                          >
                            {deletingMemberId === member.id ? (
                              <CircleNotch size={15} className="animate-spin" />
                            ) : (
                              <Trash size={15} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
                </>
              )}
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
                  onClick={() => {
                    if (showAddPubModal) {
                      setShowAddPubModal(false);
                      setEditingPub(null);
                    } else {
                      setEditingPub(null);
                      setPubForm({
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
                      setShowAddPubModal(true);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors"
                >
                  <Plus size={14} />
                  <span>{showAddPubModal ? t.closeBtn : t.uploadPub}</span>
                </button>
              </div>

              {showAddPubModal && (
                <form onSubmit={handleAddPub} className="p-6 rounded-card border border-accent/40 bg-surface space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-accent">
                      {editingPub ? t.editPub : t.uploadPub}
                    </div>
                    {editingPub && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPub(null);
                          setShowAddPubModal(false);
                        }}
                        className="text-xs text-muted hover:text-fg"
                      >
                        {t.cancelBtn}
                      </button>
                    )}
                  </div>

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

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isSavingPub}
                      className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold flex items-center gap-2"
                    >
                      {isSavingPub && <CircleNotch size={14} className="animate-spin" />}
                      <span>
                        {isSavingPub
                          ? (lang === "ne" ? "प्रकाशित गर्दै..." : "Publishing...")
                          : editingPub
                          ? (lang === "ne" ? "परिवर्तन सुरक्षित गर्नुहोस्" : "Save Changes")
                          : t.saveChanges}
                      </span>
                    </button>
                    {editingPub && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPub(null);
                          setShowAddPubModal(false);
                        }}
                        className="px-4 py-2 rounded-control border border-line text-xs font-medium text-muted hover:text-fg"
                      >
                        {t.cancelBtn}
                      </button>
                    )}
                  </div>
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

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEditPub(pub)}
                          className="p-1.5 text-accent hover:bg-accent/10 rounded-control transition-colors"
                          title={t.editBtn}
                        >
                          <PencilSimple size={15} />
                        </button>
                        <button
                          type="button"
                          disabled={deletingPubId === pub.id}
                          onClick={() => handleDeletePub(pub.id)}
                          className="p-1.5 text-danger hover:bg-danger/10 disabled:opacity-60 rounded-control transition-colors"
                          title={t.deleteBtn}
                        >
                          {deletingPubId === pub.id ? (
                            <CircleNotch size={15} className="animate-spin" />
                          ) : (
                            <Trash size={15} />
                          )}
                        </button>
                      </div>
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
                  onClick={() => {
                    if (showAddEventModal) {
                      setShowAddEventModal(false);
                      setEditingEvent(null);
                    } else {
                      setEditingEvent(null);
                      setEventForm({
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
                        status: "upcoming",
                      });
                      setShowAddEventModal(true);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors"
                >
                  <Plus size={14} />
                  <span>{showAddEventModal ? t.closeBtn : t.scheduleEvent}</span>
                </button>
              </div>

              {showAddEventModal && (
                <form onSubmit={handleAddEvent} className="p-6 rounded-card border border-accent/40 bg-surface space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-accent">
                      {editingEvent ? t.editEvent : t.scheduleEvent}
                    </div>
                    {editingEvent && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEvent(null);
                          setShowAddEventModal(false);
                        }}
                        className="text-xs text-muted hover:text-fg"
                      >
                        {t.cancelBtn}
                      </button>
                    )}
                  </div>

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

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isSavingEvent}
                      className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold flex items-center gap-2"
                    >
                      {isSavingEvent && <CircleNotch size={14} className="animate-spin" />}
                      <span>
                        {isSavingEvent
                          ? (lang === "ne" ? "दर्ता गर्दै..." : "Saving...")
                          : editingEvent
                          ? (lang === "ne" ? "परिवर्तन सुरक्षित गर्नुहोस्" : "Save Changes")
                          : t.saveChanges}
                      </span>
                    </button>
                    {editingEvent && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEvent(null);
                          setShowAddEventModal(false);
                        }}
                        className="px-4 py-2 rounded-control border border-line text-xs font-medium text-muted hover:text-fg"
                      >
                        {t.cancelBtn}
                      </button>
                    )}
                  </div>
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

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEditEvent(ev)}
                          className="p-1.5 text-accent hover:bg-accent/10 rounded-control transition-colors"
                          title={t.editBtn}
                        >
                          <PencilSimple size={15} />
                        </button>
                        <button
                          type="button"
                          disabled={deletingEventId === ev.id}
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="p-1.5 text-danger hover:bg-danger/10 disabled:opacity-60 rounded-control transition-colors"
                          title={t.deleteBtn}
                        >
                          {deletingEventId === ev.id ? (
                            <CircleNotch size={15} className="animate-spin" />
                          ) : (
                            <Trash size={15} />
                          )}
                        </button>
                      </div>
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
                  onClick={() => {
                    if (showAddGalleryModal) {
                      setShowAddGalleryModal(false);
                      setEditingGallery(null);
                    } else {
                      setEditingGallery(null);
                      setGalleryForm({
                        titleEn: "",
                        titleNe: "",
                        categoryEn: "Education",
                        categoryNe: "शिक्षा",
                        dateEn: "2081 Shrawan",
                        dateNe: "२०८१ साउन",
                        imageUrl: "",
                      });
                      setShowAddGalleryModal(true);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors"
                >
                  <Plus size={14} />
                  <span>{showAddGalleryModal ? t.closeBtn : t.addGallery}</span>
                </button>
              </div>

              {showAddGalleryModal && (
                <form onSubmit={handleAddGallery} className="p-6 rounded-card border border-accent/40 bg-surface space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-accent">
                      {editingGallery ? t.editGallery : t.addGallery}
                    </div>
                    {editingGallery && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGallery(null);
                          setShowAddGalleryModal(false);
                        }}
                        className="text-xs text-muted hover:text-fg"
                      >
                        {t.cancelBtn}
                      </button>
                    )}
                  </div>

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

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isSavingGallery}
                      className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold flex items-center gap-2"
                    >
                      {isSavingGallery && <CircleNotch size={14} className="animate-spin" />}
                      <span>
                        {isSavingGallery
                          ? (lang === "ne" ? "अपलोड गर्दै..." : "Saving...")
                          : editingGallery
                          ? (lang === "ne" ? "परिवर्तन सुरक्षित गर्नुहोस्" : "Save Changes")
                          : t.saveChanges}
                      </span>
                    </button>
                    {editingGallery && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGallery(null);
                          setShowAddGalleryModal(false);
                        }}
                        className="px-4 py-2 rounded-control border border-line text-xs font-medium text-muted hover:text-fg"
                      >
                        {t.cancelBtn}
                      </button>
                    )}
                  </div>
                </form>
              )}

              <div className="p-4 rounded-card border border-line bg-surface space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {galleryList.map((g) => (
                    <div key={g.id} className="rounded-control overflow-hidden border border-line bg-ground">
                      <div className="relative h-36 w-full bg-tint flex items-center justify-center">
                        {isValidImageSrc(g.imageUrl) ? (
                          <Image src={g.imageUrl} alt={g.titleEn} fill sizes="300px" className="object-cover" />
                        ) : (
                          <ImageIcon size={28} className="text-muted" weight="duotone" />
                        )}
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-bold text-fg truncate">
                            {lang === "ne" ? g.titleNe : g.titleEn}
                          </div>
                          <div className="text-[10px] text-muted font-mono">{g.categoryEn}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditGallery(g)}
                            className="p-1 text-accent hover:bg-accent/10 rounded-control transition-colors"
                            title={t.editBtn}
                          >
                            <PencilSimple size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={deletingGalleryId === g.id}
                            onClick={() => handleDeleteGallery(g.id)}
                            className="p-1 text-danger hover:bg-danger/10 disabled:opacity-60 rounded-control transition-colors"
                            title={t.deleteBtn}
                          >
                            {deletingGalleryId === g.id ? (
                              <CircleNotch size={14} className="animate-spin" />
                            ) : (
                              <Trash size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PUBLICATION PAGES: the single-file pages under the Publications menu */}
          {activeTab === "publication-pages" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-fg">
                  {lang === "ne" ? "प्रकाशन पृष्ठहरु" : "Publication Pages"}
                </h2>
                <p className="text-xs text-muted">
                  {lang === "ne"
                    ? "प्रत्येक पृष्ठमा एउटा PDF वा तस्बिर र क्याप्सन राख्न सकिन्छ।"
                    : "Each page holds one PDF or image with a caption."}
                </p>
              </div>
              <DocumentSectionEditor
                lang={lang}
                adminFetch={adminFetch}
                slugs={PUBLICATION_DOC_SLUGS}
              />
            </div>
          )}

          {/* ABOUT US: the nine sub-pages under the About Us menu */}
          {activeTab === "about" && (
            <AboutManager lang={lang} adminFetch={adminFetch} />
          )}

          {/* 7. INQUIRIES */}
          {activeTab === "inquiries" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-fg">{t.inquiries}</h2>
                <p className="text-xs text-muted">{lang === "ne" ? "सर्वसाधारणबाट प्राप्त सम्पर्क तथा सदस्यता सोधपुछ सन्देशहरू" : "Public contact submissions and inquiries."}</p>
              </div>

              <div className="space-y-3">
                {inquiriesLoading ? (
                  // Skeletons match the shape of the rows they replace so the
                  // layout does not jump when the data lands.
                  <div className="space-y-3" aria-busy="true">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="p-4 border border-line rounded-card bg-surface space-y-2 animate-pulse"
                      >
                        <div className="h-3 w-40 rounded-chip bg-tint" />
                        <div className="h-3 w-full rounded-chip bg-tint" />
                        <div className="h-3 w-2/3 rounded-chip bg-tint" />
                      </div>
                    ))}
                  </div>
                ) : inquiriesError ? (
                  <div className="p-8 text-center border border-line rounded-card bg-surface space-y-3">
                    <p className="text-xs text-danger font-semibold">
                      {lang === "ne"
                        ? "सन्देशहरू लोड गर्न सकिएन।"
                        : "Could not load messages."}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setInquiriesError(false);
                        setInquiriesLoading(true);
                        adminFetch("/api/inquiries")
                          .then((res) => (res.ok ? res.json() : null))
                          .then((data) => {
                            if (data && Array.isArray(data)) setInquiriesList(data);
                            else setInquiriesError(true);
                          })
                          .catch(() => setInquiriesError(true))
                          .finally(() => setInquiriesLoading(false));
                      }}
                      className="px-4 py-2 rounded-control bg-accent text-on-accent text-xs font-semibold"
                    >
                      {lang === "ne" ? "पुनः प्रयास" : "Retry"}
                    </button>
                  </div>
                ) : inquiriesList.length === 0 ? (
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
                            className="p-1 text-danger hover:bg-danger/10 rounded-control transition-colors"
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

          {/* 8. SETTINGS & CONTACT CONFIGURATION */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-fg">{t.settings}</h2>
                <p className="text-xs text-muted">
                  {lang === "ne"
                    ? "मुख्य पृष्ठको सम्पर्क खण्ड, सचिवालय विवरण तथा फोन नम्बर सम्पादन गर्नुहोस्।"
                    : "Edit landing page contact section text, secretariat liaison card details, and phone numbers."}
                </p>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (
                    !contactSettingsState.contactHeadingNe.trim() ||
                    !contactSettingsState.contactHeadingEn.trim() ||
                    !contactSettingsState.contactDescriptionNe.trim() ||
                    !contactSettingsState.contactDescriptionEn.trim()
                  ) {
                    dialogAlert({
                      title: lang === "ne" ? "सम्पर्क खण्ड विवरण अपूर्ण" : "Section Details Incomplete",
                      description:
                        lang === "ne"
                          ? "कृपया सम्पर्क खण्डको शीर्षक र उप-विवरण दुवै भाषामा अनिवार्य भर्नुहोस्।"
                          : "Please fill section headings and descriptions in both languages.",
                      type: "warning",
                    });
                    return;
                  }
                  if (
                    !contactSettingsState.kathmanduTitleNe.trim() ||
                    !contactSettingsState.kathmanduTitleEn.trim() ||
                    !contactSettingsState.kathmanduAddressNe.trim() ||
                    !contactSettingsState.kathmanduAddressEn.trim()
                  ) {
                    dialogAlert({
                      title: lang === "ne" ? "सचिवालय विवरण अपूर्ण" : "Secretariat Details Incomplete",
                      description:
                        lang === "ne"
                          ? "कृपया काठमाडौँ सचिवालयको शीर्षक र ठेगाना दुवै भाषामा अनिवार्य भर्नुहोस्।"
                          : "Please enter secretariat title and physical address in both languages.",
                      type: "warning",
                    });
                    return;
                  }
                  if (contactSettingsState.phone1.trim() && !isValidPhone(contactSettingsState.phone1)) {
                    dialogAlert({
                      title: lang === "ne" ? "अमान्य फोन १" : "Invalid Phone 1",
                      description:
                        lang === "ne"
                          ? "कृपया प्राथमिक फोन नम्बरको मान्य ढाँचा प्रविष्ट गर्नुहोस्।"
                          : "Please enter a valid primary phone number format.",
                      type: "warning",
                    });
                    return;
                  }
                  if (contactSettingsState.phone2.trim() && !isValidPhone(contactSettingsState.phone2)) {
                    dialogAlert({
                      title: lang === "ne" ? "अमान्य फोन २" : "Invalid Phone 2",
                      description:
                        lang === "ne"
                          ? "कृपया दोस्रो फोन नम्बरको मान्य ढाँचा प्रविष्ट गर्नुहोस्।"
                          : "Please enter a valid secondary phone number format.",
                      type: "warning",
                    });
                    return;
                  }
                  if (contactSettingsState.email.trim() && !isValidEmail(contactSettingsState.email)) {
                    dialogAlert({
                      title: lang === "ne" ? "अमान्य इमेल ठेगाना" : "Invalid Email Address",
                      description:
                        lang === "ne"
                          ? "कृपया मान्य आधिकारिक इमेल ठेगाना प्रविष्ट गर्नुहोस्।"
                          : "Please enter a valid official email address format.",
                      type: "warning",
                    });
                    return;
                  }

                  setIsSavingContact(true);
                  try {
                    const newContactData = {
                      ...contactSettingsState,
                      contactHeadingNe: contactSettingsState.contactHeadingNe.trim(),
                      contactHeadingEn: contactSettingsState.contactHeadingEn.trim(),
                      contactDescriptionNe: contactSettingsState.contactDescriptionNe.trim(),
                      contactDescriptionEn: contactSettingsState.contactDescriptionEn.trim(),
                      kathmanduTitleNe: contactSettingsState.kathmanduTitleNe.trim(),
                      kathmanduTitleEn: contactSettingsState.kathmanduTitleEn.trim(),
                      kathmanduSubtitleNe: contactSettingsState.kathmanduSubtitleNe.trim(),
                      kathmanduSubtitleEn: contactSettingsState.kathmanduSubtitleEn.trim(),
                      kathmanduAddressNe: contactSettingsState.kathmanduAddressNe.trim(),
                      kathmanduAddressEn: contactSettingsState.kathmanduAddressEn.trim(),
                      phone1: contactSettingsState.phone1.trim(),
                      phone2: contactSettingsState.phone2.trim(),
                      email: contactSettingsState.email.trim(),
                    };

                    const res = await adminFetch("/api/contact", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(newContactData),
                    });
                    const data = await res.json();
                    if (data && data.success && data.data) {
                      setContactSettingsState(data.data);
                      saveStoredContactSettings(data.data);
                    } else {
                      saveStoredContactSettings(newContactData);
                    }
                    revalidateCollection("contact");

                    dialogAlert({
                      title: lang === "ne" ? "सम्पर्क विवरण सुरक्षित भयो" : "Contact Settings Saved",
                      description:
                        lang === "ne"
                          ? "मुख्य पृष्ठको सम्पर्क खण्ड र सचिवालय विवरणहरू सफलतापूर्वक सुरक्षित गरियो।"
                          : "Landing page contact section and liaison secretariat details updated live.",
                      type: "success",
                    });
                  } catch (err) {
                    console.error("Failed to sync contact settings:", err);
                    dialogAlert({
                      title: lang === "ne" ? "कार्य असफल" : "Save Failed",
                      description:
                        lang === "ne"
                          ? "सर्भरसँग सम्पर्क हुन सकेन।"
                          : "Network or server error occurred.",
                      type: "danger",
                    });
                  } finally {
                    setIsSavingContact(false);
                  }
                }}
                className="space-y-6"
              >
                {/* 1. Landing Page Section Header & Subtitle */}
                <div className="p-6 rounded-card border border-line bg-surface space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-accent">
                    {lang === "ne" ? "१. सम्पर्क खण्ड शीर्षक र विवरण" : "1. Landing Page Section Title & Description"}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">
                        {lang === "ne" ? "खण्डको मुख्य शीर्षक (नेपाली) *" : "Section Heading (Nepali) *"}
                      </label>
                      <input
                        required
                        type="text"
                        value={contactSettingsState.contactHeadingNe}
                        onChange={(e) =>
                          setContactSettingsState({ ...contactSettingsState, contactHeadingNe: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">
                        {lang === "ne" ? "खण्डको मुख्य शीर्षक (English) *" : "Section Heading (English) *"}
                      </label>
                      <input
                        required
                        type="text"
                        value={contactSettingsState.contactHeadingEn}
                        onChange={(e) =>
                          setContactSettingsState({ ...contactSettingsState, contactHeadingEn: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">
                        {lang === "ne" ? "खण्डको उप-विवरण (नेपाली) *" : "Section Description (Nepali) *"}
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={contactSettingsState.contactDescriptionNe}
                        onChange={(e) =>
                          setContactSettingsState({ ...contactSettingsState, contactDescriptionNe: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">
                        {lang === "ne" ? "खण्डको उप-विवरण (English) *" : "Section Description (English) *"}
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={contactSettingsState.contactDescriptionEn}
                        onChange={(e) =>
                          setContactSettingsState({ ...contactSettingsState, contactDescriptionEn: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Kathmandu Secretariat Liaison Info */}
                <div className="p-6 rounded-card border border-line bg-surface space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-accent">
                    {lang === "ne" ? "२. काठमाडौँ सम्पर्क सचिवालय विवरण" : "2. Kathmandu Liaison Secretariat Card"}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">
                        {lang === "ne" ? "सचिवालय शीर्षक (नेपाली)" : "Card Title (Nepali)"}
                      </label>
                      <input
                        required
                        type="text"
                        value={contactSettingsState.kathmanduTitleNe}
                        onChange={(e) =>
                          setContactSettingsState({ ...contactSettingsState, kathmanduTitleNe: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">
                        {lang === "ne" ? "सचिवालय शीर्षक (English)" : "Card Title (English)"}
                      </label>
                      <input
                        required
                        type="text"
                        value={contactSettingsState.kathmanduTitleEn}
                        onChange={(e) =>
                          setContactSettingsState({ ...contactSettingsState, kathmanduTitleEn: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">
                        {lang === "ne" ? "सचिवालय उपशीर्षक (नेपाली)" : "Card Subtitle (Nepali)"}
                      </label>
                      <input
                        type="text"
                        value={contactSettingsState.kathmanduSubtitleNe}
                        onChange={(e) =>
                          setContactSettingsState({ ...contactSettingsState, kathmanduSubtitleNe: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">
                        {lang === "ne" ? "सचिवालय उपशीर्षक (English)" : "Card Subtitle (English)"}
                      </label>
                      <input
                        type="text"
                        value={contactSettingsState.kathmanduSubtitleEn}
                        onChange={(e) =>
                          setContactSettingsState({ ...contactSettingsState, kathmanduSubtitleEn: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">
                        {lang === "ne" ? "सचिवालय ठेगाना (नेपाली)" : "Physical Address (Nepali)"}
                      </label>
                      <input
                        required
                        type="text"
                        value={contactSettingsState.kathmanduAddressNe}
                        onChange={(e) =>
                          setContactSettingsState({ ...contactSettingsState, kathmanduAddressNe: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">
                        {lang === "ne" ? "सचिवालय ठेगाना (English)" : "Physical Address (English)"}
                      </label>
                      <input
                        required
                        type="text"
                        value={contactSettingsState.kathmanduAddressEn}
                        onChange={(e) =>
                          setContactSettingsState({ ...contactSettingsState, kathmanduAddressEn: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Direct Contact Channels */}
                <div className="p-6 rounded-card border border-line bg-surface space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-accent">
                    {lang === "ne" ? "३. फोन तथा इमेल सम्पर्क" : "3. Direct Phone & Email Channels"}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">
                        {lang === "ne" ? "सम्पर्क फोन १" : "Primary Phone"}
                      </label>
                      <input
                        type="text"
                        value={contactSettingsState.phone1}
                        onChange={(e) =>
                          setContactSettingsState({ ...contactSettingsState, phone1: e.target.value })
                        }
                        placeholder="+977 01-4481234"
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">
                        {lang === "ne" ? "सम्पर्क फोन २ (मोबाइल)" : "Secondary Phone"}
                      </label>
                      <input
                        type="text"
                        value={contactSettingsState.phone2}
                        onChange={(e) =>
                          setContactSettingsState({ ...contactSettingsState, phone2: e.target.value })
                        }
                        placeholder="9851012345"
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">
                        {lang === "ne" ? "आधिकारिक इमेल" : "Official Email"}
                      </label>
                      <input
                        type="email"
                        value={contactSettingsState.email}
                        onChange={(e) =>
                          setContactSettingsState({ ...contactSettingsState, email: e.target.value })
                        }
                        placeholder="info@thorgaktm.org.np"
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSavingContact}
                    className="px-6 py-2.5 rounded-control bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
                  >
                    {isSavingContact && <CircleNotch size={14} className="animate-spin" />}
                    <span>{isSavingContact ? (lang === "ne" ? "सुरक्षित गर्दै..." : "Saving...") : t.saveChanges}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 9. ADMIN ACCESS & USER MANAGEMENT */}
          {activeTab === "access" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-fg flex items-center gap-2">
                    <ShieldCheck size={20} className="text-accent" />
                    <span>{t.adminAccess}</span>
                  </h2>
                  <p className="text-xs text-muted mt-0.5">
                    {lang === "ne"
                      ? "प्रशासन प्यानल प्रयोग गर्न सक्ने प्रयोगकर्ताहरूको सूची तथा भूमिका व्यवस्थापन।"
                      : "Control who can access the admin panel, create accounts, and manage permissions."}
                  </p>
                </div>

                {(session.isSuperadmin || session.role === "superadmin" || session.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() || session.email?.toLowerCase() === "admin@thorgaktm.org.np") && (
                  <button
                    type="button"
                    onClick={() => {
                      if (showAddUserModal && editingUser) {
                        setEditingUser(null);
                        setUserForm({ name: "", email: "", role: "admin", password: "" });
                      } else {
                        setEditingUser(null);
                        setUserForm({ name: "", email: "", role: "admin", password: "" });
                        setShowAddUserModal(!showAddUserModal);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors shadow-sm"
                  >
                    <Plus size={14} />
                    <span>{showAddUserModal ? t.closeBtn : t.addAdminUser}</span>
                  </button>
                )}
              </div>

              {/* Add/Edit User Modal / Form */}
              {showAddUserModal && (
                <form onSubmit={handleAddUser} className="p-6 rounded-card border border-accent/40 bg-surface space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-accent">
                      {editingUser ? t.editUserModalTitle : t.addUserModalTitle}
                    </div>
                    {editingUser && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUser(null);
                          setUserForm({ name: "", email: "", role: "admin", password: "" });
                          setShowAddUserModal(false);
                        }}
                        className="text-xs text-muted hover:text-fg font-medium"
                      >
                        {t.cancelBtn}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">{t.userName} *</label>
                      <input
                        required
                        type="text"
                        value={userForm.name}
                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                        placeholder="Executive Secretary"
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">{t.userEmail} *</label>
                      <input
                        required
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        placeholder="secretary@thorgaktm.org.np"
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">{t.userRole}</label>
                      <select
                        value={userForm.role}
                        onChange={(e) => setUserForm({ ...userForm, role: e.target.value as AdminRole })}
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      >
                        <option value="superadmin">{t.roleSuperadmin}</option>
                        <option value="admin">{t.roleAdmin}</option>
                        <option value="editor">{t.roleEditor}</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">
                        {t.userPassword} {editingUser ? (lang === "ne" ? "(नयाँ पासवर्ड राख्न मात्र लेख्नुहोस्)" : "(Optional: enter new password to change)") : "*"}
                      </label>
                      <input
                        required={!editingUser}
                        type="text"
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        placeholder={editingUser ? (lang === "ne" ? "यथावत राख्न खाली छोड्नुहोस्" : "Leave blank to keep unchanged") : "••••••••"}
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSavingUser}
                      className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold flex items-center gap-2"
                    >
                      {isSavingUser && <CircleNotch size={14} className="animate-spin" />}
                      <span>
                        {isSavingUser
                          ? (lang === "ne" ? "सुरक्षित गर्दै..." : "Saving...")
                          : editingUser
                          ? t.saveChanges
                          : t.addAdminUser}
                      </span>
                    </button>
                    {editingUser && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUser(null);
                          setUserForm({ name: "", email: "", role: "admin", password: "" });
                          setShowAddUserModal(false);
                        }}
                        className="px-4 py-2 rounded-control border border-line bg-ground text-fg text-xs font-semibold hover:bg-tint"
                      >
                        {t.cancelBtn}
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* Authorized Admin Users Table */}
              <div className="p-4 rounded-card border border-line bg-surface space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-muted px-2 py-1">
                  {lang === "ne" ? "अधिकृत प्रशासक सूची" : "Authorized Administrators List"}
                </div>

                <div className="divide-y divide-line">
                  {adminUsersList.map((user) => {
                    const isUserSuperadmin =
                      user.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ||
                      user.role === "superadmin";

                    const isCurrentUser = session.email?.toLowerCase() === user.email.toLowerCase();
                    const canEdit = session.isSuperadmin || session.role === "superadmin" || isCurrentUser;

                    return (
                      <div key={user.id} className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-control flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            isUserSuperadmin
                              ? "bg-warning/20 text-warning"
                              : "bg-accent-soft text-accent"
                          }`}>
                            {isUserSuperadmin ? <ShieldCheck size={18} /> : <UserGear size={18} />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-fg truncate">{user.name}</span>
                              {isCurrentUser && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-chip bg-accent/20 text-accent border border-accent/30">
                                  {lang === "ne" ? "तपाईंको खाता" : "You"}
                                </span>
                              )}
                              {isUserSuperadmin ? (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-chip bg-warning/20 text-warning border border-warning/30">
                                   {t.roleSuperadmin}
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-chip bg-tint text-muted border border-line capitalize">
                                  {user.role}
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-fg font-medium">{user.email}</span>
                              <span>•</span>
                              <span>Added {user.addedAt}</span>
                              <span>•</span>
                              <span className={`inline-flex items-center gap-1 font-medium ${
                                user.isActive ? "text-accent" : "text-danger"
                              }`}>
                                {user.isActive ? <CheckCircle size={12} weight="fill" /> : <XCircle size={12} weight="fill" />}
                                <span>{user.isActive ? t.activeStatus : t.inactiveStatus}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions (Superadmin or Current User) */}
                        {canEdit && (
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleStartEditUser(user)}
                              className="p-1.5 text-accent hover:bg-accent-soft rounded-control transition-colors flex items-center gap-1 text-xs"
                              title={t.editUser}
                            >
                              <PencilSimple size={15} />
                              <span className="text-[11px] font-medium">{lang === "ne" ? "पासवर्ड / सम्पादन" : "Edit / Password"}</span>
                            </button>

                            {(session.isSuperadmin || session.role === "superadmin") && !isUserSuperadmin && !isCurrentUser && (
                              <>
                                <button
                                  type="button"
                                  disabled={togglingUserId === user.id}
                                  onClick={() => handleToggleUser(user)}
                                  className={`px-2.5 py-1 rounded-control text-[11px] font-semibold transition-colors border disabled:opacity-60 flex items-center gap-1 ${
                                    user.isActive
                                      ? "border-warning/30 bg-warning/10 text-warning hover:bg-warning/20"
                                      : "border-accent/30 bg-accent/10 text-accent hover:bg-accent/20"
                                  }`}
                                >
                                  {togglingUserId === user.id && <CircleNotch size={12} className="animate-spin" />}
                                  <span>{user.isActive ? t.deactivate : t.activate}</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={deletingUserId === user.id}
                                  onClick={() => handleDeleteUser(user)}
                                  className="p-1.5 text-danger hover:bg-danger/10 disabled:opacity-60 rounded-control transition-colors"
                                  title={t.deleteBtn}
                                >
                                  {deletingUserId === user.id ? (
                                    <CircleNotch size={15} className="animate-spin" />
                                  ) : (
                                    <Trash size={15} />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* BRANDING TAB                                                   */}
          {/* ============================================================ */}
          {activeTab === "branding" && (
            <div className="space-y-8 max-w-2xl">
              {/* Header */}
              <div>
                <h2 className="text-base font-bold text-fg flex items-center gap-2">
                  <PaintBucket size={18} className="text-accent" />
                  {lang === "ne" ? "ब्रान्डिङ सेटिङ्स" : "Branding Settings"}
                </h2>
                <p className="text-xs text-muted mt-1">
                  {lang === "ne"
                    ? "वेबसाइटको लोगो र फेभिकन अपलोड गर्नुहोस्। यी परिवर्तनहरू तुरुन्त वेबसाइटमा देखिनेछन्।"
                    : "Upload your site logo and browser favicon. Changes appear instantly across the website."}
                </p>
              </div>

              {/* Logo Section */}
              <div className="p-5 rounded-card border border-line bg-surface space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <ImageIcon size={15} className="text-accent" />
                  <h3 className="text-sm font-semibold text-fg">
                    {lang === "ne" ? "कम्पनी लोगो" : "Company Logo"}
                  </h3>
                </div>
                <p className="text-[11px] text-muted">
                  {lang === "ne"
                    ? "साइट हेडरमा देखिने लोगो। वर्गाकार वा गोलो ढाँचा सिफारिस। (PNG, SVG, WebP)"
                    : "Shown in the site header. Square or circle format recommended. (PNG, SVG, WebP)"}
                </p>

                {/* Live Preview */}
                {brandingState.logoUrl && (
                  <div className="flex items-center gap-3 p-3 rounded-control border border-line bg-tint">
                    <div className="w-12 h-12 rounded-card bg-accent overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={brandingState.logoUrl}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-fg">{lang === "ne" ? "हालको लोगो" : "Current Logo"}</p>
                      <p className="text-[11px] text-muted break-all">{brandingState.logoUrl}</p>
                    </div>
                  </div>
                )}

                <CloudinaryUploader
                  value={brandingState.logoUrl}
                  onChange={(url) => setBrandingState((prev) => ({ ...prev, logoUrl: url }))}
                  folder="thorga_branding"
                  accept="image/*"
                  label={lang === "ne" ? "लोगो अपलोड गर्नुहोस्" : "Upload Logo"}
                />

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isSavingBranding}
                    onClick={async () => {
                      setIsSavingBranding(true);
                      try {
                        const next = { ...brandingState };
                        saveStoredBranding(next);
                        await adminFetch("/api/branding", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(next),
                        });
                        revalidateCollection("branding");

                        dialogAlert({
                          title: lang === "ne" ? "लोगो सुरक्षित भयो" : "Logo Saved",
                          description:
                            lang === "ne"
                              ? "साइट हेडरमा नयाँ लोगो लागू भएको छ।"
                              : "New logo is now live in the site header.",
                          type: "success",
                        });
                      } catch (err) {
                        console.error("Failed to sync branding:", err);
                      } finally {
                        setIsSavingBranding(false);
                      }
                    }}
                    className="px-4 py-1.5 rounded-control bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    {isSavingBranding && <CircleNotch size={13} className="animate-spin" />}
                    <span>{isSavingBranding ? (lang === "ne" ? "सुरक्षित गर्दै..." : "Saving...") : t.saveChanges}</span>
                  </button>
                  {brandingState.logoUrl && (
                    <button
                      type="button"
                      disabled={isSavingBranding}
                      onClick={async () => {
                        setIsSavingBranding(true);
                        try {
                          const next = { ...brandingState, logoUrl: "" };
                          setBrandingState(next);
                          saveStoredBranding(next);
                          await adminFetch("/api/branding", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(next),
                          });
                          revalidateCollection("branding");
                        } catch (err) {
                          console.error("Failed to sync branding:", err);
                        } finally {
                          setIsSavingBranding(false);
                        }
                      }}
                      className="px-4 py-1.5 rounded-control border border-line text-muted hover:text-fg disabled:opacity-60 text-xs font-medium transition-colors"
                    >
                      {lang === "ne" ? "लोगो हटाउनुहोस्" : "Remove Logo"}
                    </button>
                  )}
                </div>
              </div>

              {/* Favicon Section */}
              <div className="p-5 rounded-card border border-line bg-surface space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Globe size={15} className="text-accent" />
                  <h3 className="text-sm font-semibold text-fg">
                    {lang === "ne" ? "फेभिकन (Favicon)" : "Browser Favicon"}
                  </h3>
                </div>
                <p className="text-[11px] text-muted">
                  {lang === "ne"
                    ? "ब्राउजर ट्याबमा देखिने साना आइकन। वर्गाकार, न्यूनतम ३२×३२ px। (PNG, ICO, SVG)"
                    : "Small icon shown in browser tabs. Square image, minimum 32×32 px recommended. (PNG, ICO, SVG)"}
                </p>

                {/* Live Preview */}
                {brandingState.faviconUrl && (
                  <div className="flex items-center gap-3 p-3 rounded-control border border-line bg-tint">
                    <div className="w-8 h-8 rounded border border-line overflow-hidden flex-shrink-0 bg-white flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={brandingState.faviconUrl}
                        alt="Favicon preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-fg">{lang === "ne" ? "हालको फेभिकन" : "Current Favicon"}</p>
                      <p className="text-[11px] text-muted break-all">{brandingState.faviconUrl}</p>
                    </div>
                  </div>
                )}

                <CloudinaryUploader
                  value={brandingState.faviconUrl}
                  onChange={(url) => setBrandingState((prev) => ({ ...prev, faviconUrl: url }))}
                  folder="thorga_branding"
                  accept="image/*"
                  label={lang === "ne" ? "फेभिकन अपलोड गर्नुहोस्" : "Upload Favicon"}
                />

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isSavingBranding}
                    onClick={async () => {
                      setIsSavingBranding(true);
                      try {
                        const next = { ...brandingState };
                        saveStoredBranding(next);
                        await adminFetch("/api/branding", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(next),
                        });
                        revalidateCollection("branding");

                        dialogAlert({
                          title: lang === "ne" ? "फेभिकन सुरक्षित भयो" : "Favicon Saved",
                          description:
                            lang === "ne"
                              ? "ब्राउजर ट्याबमा नयाँ फेभिकन लागू भएको छ।"
                              : "New favicon is now active in browser tabs.",
                          type: "success",
                        });
                      } catch (err) {
                        console.error("Failed to sync branding:", err);
                      } finally {
                        setIsSavingBranding(false);
                      }
                    }}
                    className="px-4 py-1.5 rounded-control bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    {isSavingBranding && <CircleNotch size={13} className="animate-spin" />}
                    <span>{isSavingBranding ? (lang === "ne" ? "सुरक्षित गर्दै..." : "Saving...") : t.saveChanges}</span>
                  </button>
                  {brandingState.faviconUrl && (
                    <button
                      type="button"
                      disabled={isSavingBranding}
                      onClick={async () => {
                        setIsSavingBranding(true);
                        try {
                          const next = { ...brandingState, faviconUrl: "" };
                          setBrandingState(next);
                          saveStoredBranding(next);
                          await adminFetch("/api/branding", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(next),
                          });
                          revalidateCollection("branding");
                        } catch (err) {
                          console.error("Failed to sync branding:", err);
                        } finally {
                          setIsSavingBranding(false);
                        }
                      }}
                      className="px-4 py-1.5 rounded-control border border-line text-muted hover:text-fg disabled:opacity-60 text-xs font-medium transition-colors"
                    >
                      {lang === "ne" ? "फेभिकन हटाउनुहोस्" : "Remove Favicon"}
                    </button>
                  )}
                </div>
              </div>

              {/* Save All */}
              <button
                type="button"
                disabled={isSavingBranding}
                onClick={async () => {
                  setIsSavingBranding(true);
                  try {
                    saveStoredBranding(brandingState);
                    await adminFetch("/api/branding", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(brandingState),
                    });
                    revalidateCollection("branding");

                    dialogAlert({
                      title: lang === "ne" ? "ब्रान्डिङ सुरक्षित भयो" : "Branding Saved",
                      description:
                        lang === "ne"
                          ? "लोगो र फेभिकन दुवै सफलतापूर्वक अद्यावधिक गरिएको छ।"
                          : "Logo and favicon have been updated successfully across the site.",
                      type: "success",
                    });
                  } catch (err) {
                    console.error("Failed to sync branding:", err);
                  } finally {
                    setIsSavingBranding(false);
                  }
                }}
                className="w-full py-2.5 rounded-control bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                {isSavingBranding && <CircleNotch size={14} className="animate-spin" />}
                <span>
                  {isSavingBranding
                    ? (lang === "ne" ? "सबै सुरक्षित गर्दै..." : "Saving All Branding...")
                    : lang === "ne"
                    ? "सबै ब्रान्डिङ सुरक्षित गर्नुहोस्"
                    : "Save All Branding"}
                </span>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
