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
  House,
  Sparkle,
  List,
  X,
  Globe,
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
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);

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
    pdfUrl: "https://example.com/sample.pdf",
    pages: 48,
    fileSize: "4.2 MB",
    coverImageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
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
    imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
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
    imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
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
    alert("Hero section updated live on the homepage.");
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.nameEn || !memberForm.nameNe || !memberForm.roleEn || !memberForm.roleNe) {
      alert("Please fill all required bilingual name and role fields.");
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
  };

  const handleDeleteMember = (id: string) => {
    if (confirm("Remove this member from the roster?")) {
      setMembersList(membersList.filter((m) => m.id !== id));
    }
  };

  const handleAddPub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubForm.titleEn || !pubForm.titleNe) {
      alert("Please enter document title.");
      return;
    }
    const newPub: Publication = {
      id: `p-${Date.now()}`,
      ...pubForm,
    };
    setPubList([newPub, ...pubList]);
    setShowAddPubModal(false);
  };

  const handleDeletePub = (id: string) => {
    if (confirm("Delete this publication?")) {
      setPubList(pubList.filter((p) => p.id !== id));
    }
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.titleEn || !eventForm.titleNe) {
      alert("Please enter event title.");
      return;
    }
    const newEv: EventItem = {
      id: `e-${Date.now()}`,
      ...eventForm,
    };
    setEventsList([newEv, ...eventsList]);
    setShowAddEventModal(false);
  };

  const handleDeleteEvent = (id: string) => {
    if (confirm("Delete this scheduled event?")) {
      setEventsList(eventsList.filter((e) => e.id !== id));
    }
  };

  const handleAddGallery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryForm.titleEn || !galleryForm.titleNe) {
      alert("Please enter image title.");
      return;
    }
    const newG: GalleryItem = {
      id: `g-${Date.now()}`,
      ...galleryForm,
    };
    setGalleryList([newG, ...galleryList]);
    setShowAddGalleryModal(false);
  };

  const handleDeleteGallery = (id: string) => {
    if (confirm("Delete this image?")) {
      setGalleryList(galleryList.filter((g) => g.id !== id));
    }
  };

  const handleDeleteInquiry = (id: string) => {
    setInquiriesList(inquiriesList.filter((inq) => inq.id !== id));
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
        return "Overview";
      case "hero":
        return "Hero Banner";
      case "members":
        return "Committee Roster";
      case "publications":
        return "Publications Archive";
      case "events":
        return "Events Schedule";
      case "gallery":
        return "Photo Gallery";
      case "inquiries":
        return "Public Inquiries";
      case "settings":
        return "Liaison Settings";
      default:
        return "Dashboard";
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
            <div className="text-xs font-bold text-fg">थोर्गा काठमाडौं सम्पर्क मञ्च</div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-control border border-line bg-surface text-fg hover:bg-tint transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-medium border border-line bg-surface hover:bg-tint text-fg transition-colors"
            >
              <House size={14} />
              <span>Public Portal</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-sm w-full rounded-card border border-line bg-surface p-7 space-y-6 shadow-sm">
            <div className="space-y-1.5 text-center">
              <div className="w-10 h-10 rounded-control bg-accent-soft text-accent mx-auto flex items-center justify-center">
                <LockKey size={22} />
              </div>
              <h1 className="text-xl font-bold text-fg tracking-tight">Admin Console</h1>
              <p className="text-xs text-muted">
                Executive committee authentication
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-control border border-red-500/30 bg-red-500/10 text-red-500 text-xs text-center font-medium">
                Invalid credentials. Verify username and password.
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-fg">Username</label>
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
                <label className="text-xs font-semibold text-fg">Password</label>
                <input
                  required
                  type="password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-sm transition-all"
              >
                Sign In
              </button>
            </form>

            <div className="p-3 rounded-control border border-line bg-ground text-[11px] space-y-0.5 text-muted">
              <div>Default user: <span className="font-mono text-fg font-medium">{DEFAULT_ADMIN_CONFIG.username}</span></div>
              <div>Default pass: <span className="font-mono text-fg font-medium">{DEFAULT_ADMIN_CONFIG.password}</span></div>
            </div>
          </div>
        </main>

        <footer className="border-t border-line bg-surface py-3 text-center text-xs text-muted">
          Thorga Kathmandu Forum Admin Panel
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
              <div className="text-xs font-bold text-fg truncate">थोर्गा काठमाडौं मञ्च</div>
              <div className="text-[10px] text-muted">Admin Panel</div>
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
            <span>Overview</span>
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
              <span>Hero Banner</span>
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
              <span>Committee</span>
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
              <span>Publications</span>
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
              <span>Events</span>
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
              <span>Gallery</span>
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
              <span>Inquiries</span>
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
            <span>Liaison Settings</span>
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
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-control text-red-500 hover:bg-red-500/10 transition-colors"
              aria-label="Sign Out"
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

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-medium border border-line bg-surface hover:bg-tint text-fg transition-colors"
          >
            <ArrowSquareOut size={14} />
            <span>Public Portal</span>
          </Link>
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
                    <span>Members</span>
                    <Users size={16} className="text-accent" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-fg">{membersList.length}</div>
                </div>

                <div className="p-4 rounded-card border border-line bg-surface space-y-1">
                  <div className="text-xs text-muted flex items-center justify-between">
                    <span>Publications</span>
                    <BookOpen size={16} className="text-accent" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-fg">{pubList.length}</div>
                </div>

                <div className="p-4 rounded-card border border-line bg-surface space-y-1">
                  <div className="text-xs text-muted flex items-center justify-between">
                    <span>Events</span>
                    <Calendar size={16} className="text-accent" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-fg">{eventsList.length}</div>
                </div>

                <div className="p-4 rounded-card border border-line bg-surface space-y-1">
                  <div className="text-xs text-muted flex items-center justify-between">
                    <span>Inquiries</span>
                    <EnvelopeSimple size={16} className="text-red-500" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-fg">{inquiriesList.length}</div>
                </div>
              </div>

              {/* Action Triggers */}
              <div className="p-6 rounded-card border border-line bg-surface space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("hero")}
                    className="p-4 rounded-control border border-line bg-ground hover:border-accent text-left transition-colors space-y-1"
                  >
                    <div className="text-xs font-bold text-fg">Update Hero Banner</div>
                    <div className="text-[11px] text-muted">Headline, text, photo</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("members");
                      setShowAddMemberModal(true);
                    }}
                    className="p-4 rounded-control border border-line bg-ground hover:border-accent text-left transition-colors space-y-1"
                  >
                    <div className="text-xs font-bold text-fg">Add Committee Member</div>
                    <div className="text-[11px] text-muted">Bilingual profile setup</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("publications");
                      setShowAddPubModal(true);
                    }}
                    className="p-4 rounded-control border border-line bg-ground hover:border-accent text-left transition-colors space-y-1"
                  >
                    <div className="text-xs font-bold text-fg">Upload Publication</div>
                    <div className="text-[11px] text-muted">PDF souvenirs and reports</div>
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

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">Image URL</label>
                  <input
                    required
                    type="url"
                    value={heroState.imageUrl}
                    onChange={(e) => setHeroState({ ...heroState, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                  />
                </div>

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
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {/* 3. COMMITTEE ROSTER */}
          {activeTab === "members" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-fg">Committee Directory</h2>
                  <p className="text-xs text-muted">Manage executive members, advisors, and past officers.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(!showAddMemberModal)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors"
                >
                  <Plus size={14} />
                  <span>{showAddMemberModal ? "Close" : "Add Member"}</span>
                </button>
              </div>

              {showAddMemberModal && (
                <form onSubmit={handleAddMember} className="p-6 rounded-card border border-accent/40 bg-surface space-y-4 shadow-sm">
                  <div className="text-xs font-bold uppercase tracking-wider text-accent">New Member Form</div>

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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">Photo URL</label>
                      <input
                        type="url"
                        value={memberForm.photoUrl}
                        onChange={(e) => setMemberForm({ ...memberForm, photoUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold"
                  >
                    Save Member
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
                      All ({membersList.length})
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
                      Current ({membersList.filter((m) => m.committeeType === "current").length})
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
                      Advisors ({membersList.filter((m) => m.committeeType === "advisor").length})
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
                      Past ({membersList.filter((m) => m.committeeType === "past").length})
                    </button>
                  </div>

                  <div className="relative w-full sm:w-56">
                    <MagnifyingGlass size={14} className="absolute left-2.5 top-2.5 text-muted" />
                    <input
                      type="text"
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      placeholder="Search member..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                    />
                  </div>
                </div>

                {/* Table list */}
                <div className="divide-y divide-line">
                  {filteredAdminMembers.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted">
                      No members match the query.
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
                              {member.nameNe} <span className="text-muted font-normal">({member.nameEn})</span>
                            </div>
                            <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                              <span className="text-accent font-medium">{member.roleNe}</span>
                              {member.phone && <span className="font-mono text-muted">{member.phone}</span>}
                              <span className="capitalize text-muted text-[10px]">({member.committeeType})</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteMember(member.id)}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-control transition-colors"
                          title="Remove Member"
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
                  <h2 className="text-base font-bold text-fg">Publications Archive</h2>
                  <p className="text-xs text-muted">Annual souvenirs, bulletins, and financial reports.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddPubModal(!showAddPubModal)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors"
                >
                  <Plus size={14} />
                  <span>{showAddPubModal ? "Close" : "Upload Document"}</span>
                </button>
              </div>

              {showAddPubModal && (
                <form onSubmit={handleAddPub} className="p-6 rounded-card border border-accent/40 bg-surface space-y-4 shadow-sm">
                  <div className="text-xs font-bold uppercase tracking-wider text-accent">New Document Upload</div>

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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">PDF URL</label>
                      <input
                        type="url"
                        value={pubForm.pdfUrl}
                        onChange={(e) => setPubForm({ ...pubForm, pdfUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold"
                  >
                    Publish Document
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
                            {pub.titleNe} <span className="text-muted font-normal">({pub.titleEn})</span>
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
                        title="Delete"
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
                  <h2 className="text-base font-bold text-fg">Events Schedule</h2>
                  <p className="text-xs text-muted">Upcoming meetings, gatherings, and community events.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(!showAddEventModal)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors"
                >
                  <Plus size={14} />
                  <span>{showAddEventModal ? "Close" : "Schedule Event"}</span>
                </button>
              </div>

              {showAddEventModal && (
                <form onSubmit={handleAddEvent} className="p-6 rounded-card border border-accent/40 bg-surface space-y-4 shadow-sm">
                  <div className="text-xs font-bold uppercase tracking-wider text-accent">New Event Details</div>

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

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold"
                  >
                    Save Event
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
                            {ev.titleNe} <span className="text-muted font-normal">({ev.titleEn})</span>
                          </div>
                          <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-accent">{ev.dateNe}</span>
                            <span>{ev.locationNe}</span>
                            <span className="capitalize text-[10px] font-semibold text-muted">({ev.status})</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-control transition-colors"
                        title="Delete"
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
                  <h2 className="text-base font-bold text-fg">Photo Gallery</h2>
                  <p className="text-xs text-muted">Community activities, education drives, and meetings.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddGalleryModal(!showAddGalleryModal)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors"
                >
                  <Plus size={14} />
                  <span>{showAddGalleryModal ? "Close" : "Add Image"}</span>
                </button>
              </div>

              {showAddGalleryModal && (
                <form onSubmit={handleAddGallery} className="p-6 rounded-card border border-accent/40 bg-surface space-y-4 shadow-sm">
                  <div className="text-xs font-bold uppercase tracking-wider text-accent">New Gallery Photo</div>

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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-fg">Image URL *</label>
                      <input
                        required
                        type="url"
                        value={galleryForm.imageUrl}
                        onChange={(e) => setGalleryForm({ ...galleryForm, imageUrl: e.target.value })}
                        className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold"
                  >
                    Save Photo
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
                          <div className="text-xs font-bold text-fg truncate">{g.titleNe}</div>
                          <div className="text-[10px] text-muted font-mono">{g.categoryEn}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteGallery(g.id)}
                          className="p-1 text-red-500 hover:bg-red-500/10 rounded-control transition-colors"
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
                <h2 className="text-base font-bold text-fg">Inbox Messages</h2>
                <p className="text-xs text-muted">Public contact submissions and inquiries.</p>
              </div>

              <div className="space-y-3">
                {inquiriesList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted border border-line rounded-card bg-surface">
                    No messages in inbox.
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
                            title="Delete"
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
                <h2 className="text-base font-bold text-fg">Secretariat & Liaison Settings</h2>
                <p className="text-xs text-muted">Contact details and office physical addresses.</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Settings saved successfully.");
                }}
                className="p-6 rounded-card border border-line bg-surface space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">Phone</label>
                    <input
                      type="text"
                      value={settings.contactPhone}
                      onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                      className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">Email</label>
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
                    <label className="text-xs font-semibold text-fg">Kathmandu Secretariat Address</label>
                    <input
                      type="text"
                      value={settings.kathmanduAddress}
                      onChange={(e) => setSettings({ ...settings, kathmanduAddress: e.target.value })}
                      className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">Thorga Village Center Address</label>
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
                  Save Settings
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
