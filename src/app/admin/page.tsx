"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
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
  getStoredInquiriesSnapshot,
  saveStoredInquiries,
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
  verifyAdminCredentials,
  getAdminUsers,
  addAdminUser,
  removeAdminUser,
  toggleAdminUserStatus,
  DEFAULT_ADMIN_CONFIG,
} from "@/lib/adminAuth";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import { useDialog } from "@/components/Dialog";
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
    editBtn: "सम्पादन",
    deleteBtn: "मेटाउनुहोस्",
    cancelBtn: "रद्द गर्नुहोस्",
    closeBtn: "बन्द गर्नुहोस्",
    // Admin User Access specific
    superadminOnlyNotice: "केवल सुपर एडमिनले मात्र प्रशासक प्रयोगकर्ताहरू थप्न, सक्रिय/निष्क्रिय गर्न वा मेटाउन सक्छ।",
    addAdminUser: "प्रशासक थप्नुहोस्",
    addUserModalTitle: "नयाँ प्रशासक खाता दर्ता",
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
    editBtn: "Edit",
    deleteBtn: "Delete",
    cancelBtn: "Cancel",
    closeBtn: "Close",
    // Admin User Access specific
    superadminOnlyNotice: "Only the superadmin configured in the environment file can add, deactivate, or remove administrator accounts.",
    addAdminUser: "Add Administrator",
    addUserModalTitle: "Register New Administrator",
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
    const secret = process.env.NEXT_PUBLIC_REVALIDATE_SECRET ?? "";
    await fetch(`/api/revalidate?tag=${tag}`, {
      method: "POST",
      headers: secret ? { "x-revalidate-secret": secret } : {},
    });
  } catch {
    // Non-critical: localStorage is the source of truth; revalidation is best-effort
  }
}


export default function AdminPage() {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [session, setSession] = useState<AdminSession | null>(() => getAdminSession());
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
  const { alert: dialogAlert, confirm: dialogConfirm } = useDialog();

  const toggleAdminLang = () => {
    const next = lang === "ne" ? "en" : "ne";
    setLang(next);
    saveStoredLanguage(next);
  };

  const t = ADMIN_I18N[lang];

  const [activeTab, setActiveTab] = useState<
    "overview" | "hero" | "members" | "publications" | "events" | "gallery" | "inquiries" | "settings" | "access" | "branding"
  >("overview");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Login form state
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState("");

  // Managed Data States
  const [heroState, setHeroState] = useState<HeroContent>(() => getStoredHeroSnapshot());
  const [membersList, setMembersList] = useState<Member[]>(() => getStoredMembersSnapshot());
  const [pubList, setPubList] = useState<Publication[]>(() => getStoredPublicationsSnapshot());
  const [eventsList, setEventsList] = useState<EventItem[]>(() => getStoredEventsSnapshot());
  const [galleryList, setGalleryList] = useState<GalleryItem[]>(() => getStoredGallerySnapshot());
  const [inquiriesList, setInquiriesList] = useState<Inquiry[]>(() => getStoredInquiriesSnapshot());
  const [adminUsersList, setAdminUsersList] = useState<AdminUser[]>(() => getAdminUsers());
  const [brandingState, setBrandingState] = useState<BrandingSettings>(() => getStoredBrandingSnapshot());

  // Filter & Form States
  const [memberFilterCategory, setMemberFilterCategory] = useState<"all" | "current" | "advisor" | "past">("all");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddPubModal, setShowAddPubModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showAddGalleryModal, setShowAddGalleryModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

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
        if (data && Array.isArray(data) && data.length > 0) {
          setMembersList(data);
          saveStoredMembers(data);
        }
      })
      .catch(() => {});

    fetch("/api/events", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setEventsList(data);
          saveStoredEvents(data);
        }
      })
      .catch(() => {});

    fetch("/api/publications", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setPubList(data);
          saveStoredPublications(data);
        }
      })
      .catch(() => {});

    fetch("/api/gallery", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setGalleryList(data);
          saveStoredGallery(data);
        }
      })
      .catch(() => {});
  }, []);

  // Member States
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setAdminSession(data.user);
        setSession(getAdminSession());
        setLoginError(false);
        setLoginErrorMessage("");
      } else {
        setLoginError(true);
        setLoginErrorMessage(data.error || t.loginError);
      }
    } catch {
      setLoginError(true);
      setLoginErrorMessage(t.loginError);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    setSession(null);
  };

  const handleSaveHero = (e: React.FormEvent) => {
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
    saveStoredHeroContent(heroState);
    fetch("/api/hero", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(heroState),
    }).catch((err) => console.error("Failed to sync hero to db:", err));
    revalidateCollection("hero");

    dialogAlert({
      title: lang === "ne" ? "ब्यानर सम्पादन भयो" : "Hero Banner Updated",
      description:
        lang === "ne"
          ? "मुख्य पृष्ठको ब्यानर विवरणहरू सफलतापूर्वक डेटाबेसमा अद्यावधिक गरिएको छ।"
          : "Hero section headlines, text, and visual frame have been updated live across all devices.",
      type: "success",
    });
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

  const handleAddMember = (e: React.FormEvent) => {
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
      const updated = membersList.map((m) =>
        m.id === editingMember.id ? updatedMember : m
      );
      setMembersList(updated);
      saveStoredMembers(updated);
      fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedMember),
      }).catch((err) => console.error("Failed to update member in db:", err));
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
            ? `${updatedMember.nameNe} को विवरण सफलतापूर्वक अद्यावधिक गरिएको छ।`
            : `${updatedMember.nameEn}'s profile has been successfully updated.`,
        type: "success",
      });
      return;
    }

    const newMember: Member = {
      id: `m-${Date.now()}`,
      ...memberForm,
      nameNe: memberForm.nameNe.trim(),
      nameEn: memberForm.nameEn.trim(),
      roleNe: memberForm.roleNe.trim(),
      roleEn: memberForm.roleEn.trim(),
      phone: memberForm.phone.trim(),
      email: memberForm.email.trim(),
    };
    const updated = [newMember, ...membersList];
    setMembersList(updated);
    saveStoredMembers(updated);
    fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMember),
    }).catch((err) => console.error("Failed to sync member to db:", err));
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
      const updated = membersList.filter((m) => m.id !== id);
      setMembersList(updated);
      saveStoredMembers(updated);
      fetch(`/api/members?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }).catch((err) => console.error("Failed to delete member from db:", err));
      revalidateCollection("members");
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

  const handleAddPub = (e: React.FormEvent) => {
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

    if (editingPub) {
      const updatedPub: Publication = {
        ...editingPub,
        ...pubForm,
        titleNe: pubForm.titleNe.trim(),
        titleEn: pubForm.titleEn.trim(),
        categoryNe: pubForm.categoryNe.trim(),
        categoryEn: pubForm.categoryEn.trim(),
      };
      const updated = pubList.map((p) =>
        p.id === editingPub.id ? updatedPub : p
      );
      setPubList(updated);
      saveStoredPublications(updated);
      fetch("/api/publications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPub),
      }).catch((err) => console.error("Failed to update pub in db:", err));
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

    const newPub: Publication = {
      id: `p-${Date.now()}`,
      ...pubForm,
      titleNe: pubForm.titleNe.trim(),
      titleEn: pubForm.titleEn.trim(),
      categoryNe: pubForm.categoryNe.trim(),
      categoryEn: pubForm.categoryEn.trim(),
    };
    const updated = [newPub, ...pubList];
    setPubList(updated);
    saveStoredPublications(updated);
    fetch("/api/publications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPub),
    }).catch((err) => console.error("Failed to sync pub to db:", err));
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
      const updated = pubList.filter((p) => p.id !== id);
      setPubList(updated);
      saveStoredPublications(updated);
      fetch(`/api/publications?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }).catch((err) => console.error("Failed to delete pub from db:", err));
      revalidateCollection("publications");
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

  const handleAddEvent = (e: React.FormEvent) => {
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
      const updated = eventsList.map((e) =>
        e.id === editingEvent.id ? updatedEv : e
      );
      setEventsList(updated);
      saveStoredEvents(updated);
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedEv),
      }).catch((err) => console.error("Failed to update event in db:", err));
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

    const newEv: EventItem = {
      id: `e-${Date.now()}`,
      ...eventForm,
      titleNe: eventForm.titleNe.trim(),
      titleEn: eventForm.titleEn.trim(),
      dateNe: eventForm.dateNe.trim(),
      dateEn: eventForm.dateEn.trim(),
      locationNe: eventForm.locationNe.trim(),
      locationEn: eventForm.locationEn.trim(),
    };
    const updated = [newEv, ...eventsList];
    setEventsList(updated);
    saveStoredEvents(updated);
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEv),
    }).catch((err) => console.error("Failed to sync event to db:", err));
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
      const updated = eventsList.filter((e) => e.id !== id);
      setEventsList(updated);
      saveStoredEvents(updated);
      fetch(`/api/events?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }).catch((err) => console.error("Failed to delete event from db:", err));
      revalidateCollection("events");
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

  const handleAddGallery = (e: React.FormEvent) => {
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

    if (editingGallery) {
      const updatedG: GalleryItem = {
        ...editingGallery,
        ...galleryForm,
        titleNe: galleryForm.titleNe.trim(),
        titleEn: galleryForm.titleEn.trim(),
      };
      const updated = galleryList.map((g) =>
        g.id === editingGallery.id ? updatedG : g
      );
      setGalleryList(updated);
      saveStoredGallery(updated);
      fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedG),
      }).catch((err) => console.error("Failed to update gallery in db:", err));
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

    const newG: GalleryItem = {
      id: `g-${Date.now()}`,
      ...galleryForm,
      titleNe: galleryForm.titleNe.trim(),
      titleEn: galleryForm.titleEn.trim(),
    };
    const updated = [newG, ...galleryList];
    setGalleryList(updated);
    saveStoredGallery(updated);
    fetch("/api/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newG),
    }).catch((err) => console.error("Failed to sync gallery to db:", err));
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
      const updated = galleryList.filter((g) => g.id !== id);
      setGalleryList(updated);
      saveStoredGallery(updated);
      fetch(`/api/gallery?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }).catch((err) => console.error("Failed to delete gallery from db:", err));
      revalidateCollection("gallery");
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
      const updated = inquiriesList.filter((inq) => inq.id !== id);
      setInquiriesList(updated);
      saveStoredInquiries(updated);
    }
  };

  // --- Admin User Access Management Handlers ---
  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.isSuperadmin) {
      dialogAlert({
        title: lang === "ne" ? "अनुमति अस्वीकृत" : "Permission Denied",
        description: t.superadminOnlyNotice,
        type: "danger",
      });
      return;
    }
    if (!isValidName(userForm.name)) {
      dialogAlert({
        title: lang === "ne" ? "अमान्य नाम" : "Invalid Name",
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
    const passCheck = isValidPassword(userForm.password);
    if (!passCheck.isValid) {
      dialogAlert({
        title: lang === "ne" ? "कमजोर पासवर्ड" : "Weak Password",
        description: lang === "ne" ? passCheck.errorNe : passCheck.errorEn,
        type: "warning",
      });
      return;
    }

    const created = addAdminUser({
      name: userForm.name.trim(),
      email: userForm.email.trim(),
      role: userForm.role,
      password: userForm.password,
      addedBy: session.email,
      isActive: true,
    });

    setAdminUsersList(getAdminUsers());
    setShowAddUserModal(false);
    setUserForm({ name: "", email: "", role: "admin", password: "" });
    dialogAlert({
      title: lang === "ne" ? "प्रशासक खाता सिर्जना भयो" : "Administrator Created",
      description: `${created.name} (${created.email}) ${t.userAddedSuccess}`,
      type: "success",
    });
  };

  const handleToggleUser = (user: AdminUser) => {
    if (!session?.isSuperadmin) {
      dialogAlert({
        title: lang === "ne" ? "अनुमति अस्वीकृत" : "Permission Denied",
        description: t.superadminOnlyNotice,
        type: "danger",
      });
      return;
    }
    const res = toggleAdminUserStatus(user.id, session.email);
    if (res.success) {
      setAdminUsersList(getAdminUsers());
      dialogAlert({
        title: lang === "ne" ? "स्थिति अद्यावधिक भयो" : "Status Updated",
        description: `${user.name}: ${t.userStatusChanged}`,
        type: "info",
      });
    } else {
      dialogAlert({
        title: lang === "ne" ? "कार्य असफल" : "Action Failed",
        description: res.message || "",
        type: "warning",
      });
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!session?.isSuperadmin) {
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
      const res = removeAdminUser(user.id, session.email);
      if (res.success) {
        setAdminUsersList(getAdminUsers());
        dialogAlert({
          title: lang === "ne" ? "प्रशासक हटाइयो" : "User Removed",
          description: t.userRemovedSuccess,
          type: "success",
        });
      } else {
        dialogAlert({
          title: lang === "ne" ? "कार्य असफल" : "Action Failed",
          description: res.message || "",
          type: "warning",
        });
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
              <div className="p-3 rounded-control border border-red-500/30 bg-red-500/10 text-red-500 text-xs text-center leading-relaxed">
                {loginErrorMessage || t.loginError}
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
                  placeholder="admin or email"
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
              session.isSuperadmin ? "bg-amber-500/20 text-amber-500" : "bg-accent-soft text-accent"
            }`}>
              {session.isSuperadmin ? "S" : "A"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-fg truncate">{session.username}</div>
              <div className="text-[10px] text-muted flex items-center gap-1">
                <span className="capitalize font-mono">{session.role}</span>
                {session.isSuperadmin && <span className="text-[9px] px-1 bg-amber-500/20 text-amber-600 rounded">Super</span>}
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
                    <EnvelopeSimple size={16} className="text-red-500" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-fg">{inquiriesList.length}</div>
                </div>

                <div className="p-4 rounded-card border border-line bg-surface space-y-1">
                  <div className="text-xs text-muted flex items-center justify-between">
                    <span>{t.adminAccess}</span>
                    <ShieldCheck size={16} className="text-amber-500" />
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

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold"
                    >
                      {editingMember ? (lang === "ne" ? "परिवर्तन सुरक्षित गर्नुहोस्" : "Save Changes") : t.saveChanges}
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
                            onClick={() => handleDeleteMember(member.id)}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-control transition-colors"
                            title={t.deleteBtn}
                          >
                            <Trash size={15} />
                          </button>
                        </div>
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
                      className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold"
                    >
                      {editingPub ? (lang === "ne" ? "परिवर्तन सुरक्षित गर्नुहोस्" : "Save Changes") : t.saveChanges}
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
                          onClick={() => handleDeletePub(pub.id)}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-control transition-colors"
                          title={t.deleteBtn}
                        >
                          <Trash size={15} />
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
                      className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold"
                    >
                      {editingEvent ? (lang === "ne" ? "परिवर्तन सुरक्षित गर्नुहोस्" : "Save Changes") : t.saveChanges}
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
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-control transition-colors"
                          title={t.deleteBtn}
                        >
                          <Trash size={15} />
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
                      className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold"
                    >
                      {editingGallery ? (lang === "ne" ? "परिवर्तन सुरक्षित गर्नुहोस्" : "Save Changes") : t.saveChanges}
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
                            onClick={() => handleDeleteGallery(g.id)}
                            className="p-1 text-red-500 hover:bg-red-500/10 rounded-control transition-colors"
                            title={t.deleteBtn}
                          >
                            <Trash size={14} />
                          </button>
                        </div>
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
                onSubmit={(e) => {
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
                  saveStoredContactSettings(newContactData);
                  fetch("/api/contact", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newContactData),
                  }).catch((err) => console.error("Failed to sync contact settings:", err));
                  revalidateCollection("contact");

                  dialogAlert({
                    title: lang === "ne" ? "सम्पर्क विवरण सुरक्षित भयो" : "Contact Settings Saved",
                    description:
                      lang === "ne"
                        ? "मुख्य पृष्ठको सम्पर्क खण्ड र सचिवालय विवरणहरू सफलतापूर्वक सुरक्षित गरियो।"
                        : "Landing page contact section and liaison secretariat details updated live.",
                    type: "success",
                  });
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
                    className="px-6 py-2.5 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-sm transition-colors"
                  >
                    {t.saveChanges}
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

                {session.isSuperadmin && (
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(!showAddUserModal)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors shadow-sm"
                  >
                    <Plus size={14} />
                    <span>{showAddUserModal ? t.closeBtn : t.addAdminUser}</span>
                  </button>
                )}
              </div>

              {/* Add User Modal / Form (Superadmin only) */}
              {showAddUserModal && session.isSuperadmin && (
                <form onSubmit={handleAddAdmin} className="p-6 rounded-card border border-accent/40 bg-surface space-y-4 shadow-sm">
                  <div className="text-xs font-bold uppercase tracking-wider text-accent">{t.addUserModalTitle}</div>

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
                      <label className="text-xs font-semibold text-fg">{t.userPassword} *</label>
                      <input
                        required
                        type="text"
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold"
                  >
                    {t.addAdminUser}
                  </button>
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

                    return (
                      <div key={user.id} className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-control flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            isUserSuperadmin
                              ? "bg-amber-500/20 text-amber-600"
                              : "bg-accent-soft text-accent"
                          }`}>
                            {isUserSuperadmin ? <ShieldCheck size={18} /> : <UserGear size={18} />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-fg truncate">{user.name}</span>
                              {isUserSuperadmin ? (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-chip bg-amber-500/20 text-amber-600 border border-amber-500/30">
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
                                user.isActive ? "text-emerald-500" : "text-red-500"
                              }`}>
                                {user.isActive ? <CheckCircle size={12} weight="fill" /> : <XCircle size={12} weight="fill" />}
                                <span>{user.isActive ? t.activeStatus : t.inactiveStatus}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions (Only Superadmin can toggle or delete non-superadmin accounts) */}
                        {session.isSuperadmin && !isUserSuperadmin && (
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleToggleUser(user)}
                              className={`px-2.5 py-1 rounded-control text-[11px] font-semibold transition-colors border ${
                                user.isActive
                                  ? "border-amber-500/30 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                              }`}
                            >
                              {user.isActive ? t.deactivate : t.activate}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-control transition-colors"
                              title={t.deleteBtn}
                            >
                              <Trash size={15} />
                            </button>
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
                    onClick={() => {
                      const next = { ...brandingState };
                      saveStoredBranding(next);
                      fetch("/api/branding", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(next),
                      }).catch((err) => console.error("Failed to sync branding:", err));
                      revalidateCollection("branding");

                      dialogAlert({
                        title: lang === "ne" ? "लोगो सुरक्षित भयो" : "Logo Saved",
                        description: lang === "ne" ? "साइट हेडरमा नयाँ लोगो लागू भएको छ।" : "New logo is now live in the site header.",
                        type: "success",
                      });
                    }}
                    className="px-4 py-1.5 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors"
                  >
                    {t.saveChanges}
                  </button>
                  {brandingState.logoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...brandingState, logoUrl: "" };
                        setBrandingState(next);
                        saveStoredBranding(next);
                        fetch("/api/branding", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(next),
                        }).catch((err) => console.error("Failed to sync branding:", err));
                        revalidateCollection("branding");
                      }}
                      className="px-4 py-1.5 rounded-control border border-line text-muted hover:text-fg text-xs font-medium transition-colors"
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
                    onClick={() => {
                      const next = { ...brandingState };
                      saveStoredBranding(next);
                      fetch("/api/branding", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(next),
                      }).catch((err) => console.error("Failed to sync branding:", err));
                      revalidateCollection("branding");

                      dialogAlert({
                        title: lang === "ne" ? "फेभिकन सुरक्षित भयो" : "Favicon Saved",
                        description: lang === "ne" ? "ब्राउजर ट्याबमा नयाँ फेभिकन लागू भएको छ।" : "New favicon is now active in browser tabs.",
                        type: "success",
                      });
                    }}
                    className="px-4 py-1.5 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors"
                  >
                    {t.saveChanges}
                  </button>
                  {brandingState.faviconUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...brandingState, faviconUrl: "" };
                        setBrandingState(next);
                        saveStoredBranding(next);
                        fetch("/api/branding", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(next),
                        }).catch((err) => console.error("Failed to sync branding:", err));
                        revalidateCollection("branding");
                      }}
                      className="px-4 py-1.5 rounded-control border border-line text-muted hover:text-fg text-xs font-medium transition-colors"
                    >
                      {lang === "ne" ? "फेभिकन हटाउनुहोस्" : "Remove Favicon"}
                    </button>
                  )}
                </div>
              </div>

              {/* Save All */}
              <button
                type="button"
                onClick={() => {
                  saveStoredBranding(brandingState);
                  fetch("/api/branding", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(brandingState),
                  }).catch((err) => console.error("Failed to sync branding:", err));
                  revalidateCollection("branding");

                  dialogAlert({
                    title: lang === "ne" ? "ब्रान्डिङ सुरक्षित भयो" : "Branding Saved",
                    description: lang === "ne"
                      ? "लोगो र फेभिकन दुवै सफलतापूर्वक अद्यावधिक गरिएको छ।"
                      : "Logo and favicon have been updated successfully across the site.",
                    type: "success",
                  });
                }}
                className="w-full py-2.5 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-sm transition-colors"
              >
                {lang === "ne" ? "सबै ब्रान्डिङ सुरक्षित गर्नुहोस्" : "Save All Branding"}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
