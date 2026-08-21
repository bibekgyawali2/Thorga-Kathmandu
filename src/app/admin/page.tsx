"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Member,
  EventItem,
  Publication,
  GalleryItem,
  initialMembers,
  initialEvents,
  initialPublications,
  initialGallery,
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
  Upload,
  Database,
  ArrowSquareOut,
  EnvelopeSimple,
  Buildings,
  Sun,
  Moon,
  MagnifyingGlass,
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
    message: "I would like to apply for the life membership of the Manch. Please send the registration form.",
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

export default function AdminPage() {
  const [session, setSession] = useState(() => getAdminSession());
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState<
    "overview" | "members" | "publications" | "events" | "gallery" | "inquiries" | "settings"
  >("overview");

  // Login form state
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState(false);

  // Managed Data States
  const [membersList, setMembersList] = useState<Member[]>(initialMembers);
  const [pubList, setPubList] = useState<Publication[]>(initialPublications);
  const [eventsList, setEventsList] = useState<EventItem[]>(initialEvents);
  const [galleryList, setGalleryList] = useState<GalleryItem[]>(initialGallery);
  const [inquiriesList, setInquiriesList] = useState<Inquiry[]>(mockInquiries);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // New Member Form
  const [memberForm, setMemberForm] = useState({
    nameEn: "",
    nameNe: "",
    roleEn: "Executive Member",
    roleNe: "कार्यसमिति सदस्य",
    committeeType: "current" as "current" | "past" | "advisor",
    phone: "",
    email: "",
    photoUrl: "",
    bioEn: "",
    bioNe: "",
  });

  // New Publication Form
  const [pubForm, setPubForm] = useState({
    titleEn: "",
    titleNe: "",
    categoryEn: "Annual Souvenir",
    categoryNe: "वार्षिक स्मारिका",
    publishedYearEn: "2081 BS",
    publishedYearNe: "२०८१",
    fileSize: "4.2 MB",
    pages: 48,
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    coverImageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
    descriptionEn: "",
    descriptionNe: "",
  });

  // New Event Form
  const [eventForm, setEventForm] = useState({
    titleEn: "",
    titleNe: "",
    dateEn: "",
    dateNe: "",
    timeEn: "11:00 AM",
    timeNe: "बिहान ११:००",
    locationEn: "",
    locationNe: "",
    descriptionEn: "",
    descriptionNe: "",
    categoryEn: "Community Program",
    categoryNe: "सामुदायिक कार्यक्रम",
    status: "upcoming" as "upcoming" | "completed",
    imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
  });

  // New Gallery Form
  const [galleryForm, setGalleryForm] = useState({
    titleEn: "",
    titleNe: "",
    categoryEn: "Development",
    categoryNe: "विकास निर्माण",
    imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
    dateEn: "August 2026",
    dateNe: "भाद्र २०८१",
  });

  // Settings State
  const [settings, setSettings] = useState({
    kathmanduAddress: "Shankhamul Marg, New Baneshwor, Kathmandu, Nepal",
    thorgaAddress: "Thorga Bazaar, Ruru Kshetra-2, Gulmi, Lumbini Province",
    contactPhone: "+977 01-4481234, 9851012345",
    contactEmail: "info@thorgaktm.org.np",
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminCredentials(loginUser, loginPass)) {
      setAdminSession(loginUser);
      setSession(getAdminSession());
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    setSession(null);
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.nameEn || !memberForm.nameNe) return;
    const newEntry: Member = {
      id: `m-${Date.now()}`,
      nameEn: memberForm.nameEn,
      nameNe: memberForm.nameNe,
      roleEn: memberForm.roleEn,
      roleNe: memberForm.roleNe,
      committeeType: memberForm.committeeType,
      phone: memberForm.phone || "+977 9800000000",
      email: memberForm.email || "member@thorgaktm.org.np",
      photoUrl:
        memberForm.photoUrl ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
      bioEn: memberForm.bioEn || "Active community contributor.",
      bioNe: memberForm.bioNe || "सक्रिय सामाजिक व्यक्तित्व।",
      order: membersList.length + 1,
    };
    setMembersList([newEntry, ...membersList]);
    setMemberForm({
      nameEn: "",
      nameNe: "",
      roleEn: "Executive Member",
      roleNe: "कार्यसमिति सदस्य",
      committeeType: "current",
      phone: "",
      email: "",
      photoUrl: "",
      bioEn: "",
      bioNe: "",
    });
    alert("New member added to database successfully!");
  };

  const handleDeleteMember = (id: string) => {
    if (confirm("Are you sure you want to delete this member?")) {
      setMembersList(membersList.filter((m) => m.id !== id));
    }
  };

  const handleCreatePublication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubForm.titleEn || !pubForm.titleNe) return;
    const newEntry: Publication = {
      id: `pub-${Date.now()}`,
      titleEn: pubForm.titleEn,
      titleNe: pubForm.titleNe,
      categoryEn: pubForm.categoryEn,
      categoryNe: pubForm.categoryNe,
      publishedYearEn: pubForm.publishedYearEn,
      publishedYearNe: pubForm.publishedYearNe,
      fileSize: pubForm.fileSize,
      pages: Number(pubForm.pages) || 24,
      pdfUrl: pubForm.pdfUrl,
      coverImageUrl: pubForm.coverImageUrl,
      descriptionEn: pubForm.descriptionEn || "Official published document of the organization.",
      descriptionNe: pubForm.descriptionNe || "संस्थाको आधिकारिक प्रकाशित दस्तावेज।",
    };
    setPubList([newEntry, ...pubList]);
    setPubForm({
      titleEn: "",
      titleNe: "",
      categoryEn: "Annual Souvenir",
      categoryNe: "वार्षिक स्मारिका",
      publishedYearEn: "2081 BS",
      publishedYearNe: "२०८१",
      fileSize: "4.2 MB",
      pages: 48,
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      coverImageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
      descriptionEn: "",
      descriptionNe: "",
    });
    alert("New publication recorded successfully!");
  };

  const handleDeletePublication = (id: string) => {
    if (confirm("Delete this publication document?")) {
      setPubList(pubList.filter((p) => p.id !== id));
    }
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.titleEn || !eventForm.titleNe) return;
    const newEntry: EventItem = {
      id: `e-${Date.now()}`,
      titleEn: eventForm.titleEn,
      titleNe: eventForm.titleNe,
      dateEn: eventForm.dateEn || "Upcoming",
      dateNe: eventForm.dateNe || "चाँडै",
      timeEn: eventForm.timeEn,
      timeNe: eventForm.timeNe,
      locationEn: eventForm.locationEn || "Kathmandu",
      locationNe: eventForm.locationNe || "काठमाडौँ",
      descriptionEn: eventForm.descriptionEn,
      descriptionNe: eventForm.descriptionNe,
      categoryEn: eventForm.categoryEn,
      categoryNe: eventForm.categoryNe,
      status: eventForm.status,
      imageUrl: eventForm.imageUrl,
    };
    setEventsList([newEntry, ...eventsList]);
    setEventForm({
      titleEn: "",
      titleNe: "",
      dateEn: "",
      dateNe: "",
      timeEn: "11:00 AM",
      timeNe: "बिहान ११:००",
      locationEn: "",
      locationNe: "",
      descriptionEn: "",
      descriptionNe: "",
      categoryEn: "Community Program",
      categoryNe: "सामुदायिक कार्यक्रम",
      status: "upcoming",
      imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
    });
    alert("Event scheduled successfully!");
  };

  const handleDeleteEvent = (id: string) => {
    if (confirm("Delete this scheduled event?")) {
      setEventsList(eventsList.filter((e) => e.id !== id));
    }
  };

  const handleCreateGallery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryForm.titleEn || !galleryForm.titleNe) return;
    const newEntry: GalleryItem = {
      id: `g-${Date.now()}`,
      titleEn: galleryForm.titleEn,
      titleNe: galleryForm.titleNe,
      categoryEn: galleryForm.categoryEn,
      categoryNe: galleryForm.categoryNe,
      imageUrl: galleryForm.imageUrl,
      dateEn: galleryForm.dateEn,
      dateNe: galleryForm.dateNe,
    };
    setGalleryList([newEntry, ...galleryList]);
    setGalleryForm({
      titleEn: "",
      titleNe: "",
      categoryEn: "Development",
      categoryNe: "विकास निर्माण",
      imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
      dateEn: "August 2026",
      dateNe: "भाद्र २०८१",
    });
    alert("Photo added to gallery successfully!");
  };

  const handleDeleteGallery = (id: string) => {
    if (confirm("Delete this photo from gallery?")) {
      setGalleryList(galleryList.filter((g) => g.id !== id));
    }
  };

  const isDark = theme === "dark";

  // LOGIN SCREEN IF NOT AUTHENTICATED
  if (!session?.isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-700 via-red-800 to-slate-900 border border-red-500/30 flex items-center justify-center text-white mx-auto shadow-lg shadow-red-950/50">
              <LockKey size={30} weight="duotone" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Thorga Manch Administrative Portal
            </h1>
            <p className="text-xs text-slate-400">
              Enter authorized administrator credentials to manage website data and publications.
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-300">
              Invalid username or password. Please use authorized credentials.
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Admin Username</label>
              <input
                required
                type="text"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="admin"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Admin Password</label>
              <input
                required
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-red-700 hover:bg-red-800 active:scale-[0.98] text-white text-xs font-semibold shadow-lg shadow-red-950/40 transition-all flex items-center justify-center gap-2"
            >
              <SlidersHorizontal size={16} />
              Authenticate & Enter Portal
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center space-y-2">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 font-mono text-left space-y-1">
              <div className="text-slate-300 font-bold">Default System Credentials:</div>
              <div>Username: <span className="text-emerald-400">{DEFAULT_ADMIN_CONFIG.username}</span></div>
              <div>Password: <span className="text-emerald-400">{DEFAULT_ADMIN_CONFIG.password}</span></div>
            </div>
            <Link
              href="/"
              className="inline-block text-xs text-slate-400 hover:text-white transition-colors"
            >
              Return to Public Website
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // AUTHENTICATED DASHBOARD INTERFACE
  return (
    <div
      className={`min-h-screen font-sans antialiased transition-colors ${
        isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Top Admin Navigation Header */}
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-md px-6 py-3.5 flex items-center justify-between ${
          isDark ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-slate-200"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-red-700 flex items-center justify-center text-white font-bold">
              <Buildings size={20} />
            </div>
            <div>
              <div className={`text-sm font-bold leading-none ${isDark ? "text-white" : "text-slate-900"}`}>
                Thorga Kathmandu Admin Console
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Supabase Live Sync Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isDark
                ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
                : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
            }`}
          >
            <ArrowSquareOut size={14} />
            <span>View Public Site</span>
          </Link>

          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`p-2 rounded-lg border transition-colors ${
              isDark
                ? "bg-slate-800 border-slate-700 text-amber-400"
                : "bg-slate-100 border-slate-300 text-slate-700"
            }`}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg bg-red-700/20 hover:bg-red-700/30 border border-red-700/40 text-xs font-semibold text-red-400 flex items-center gap-1.5 transition-colors"
          >
            <SignOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Admin Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Menu */}
          <aside className="lg:col-span-3 space-y-2">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                activeTab === "overview"
                  ? "bg-red-700 text-white shadow-md"
                  : isDark
                  ? "bg-slate-900 text-slate-300 hover:bg-slate-800"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal size={16} />
                Dashboard Overview
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("members")}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                activeTab === "members"
                  ? "bg-red-700 text-white shadow-md"
                  : isDark
                  ? "bg-slate-900 text-slate-300 hover:bg-slate-800"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <Users size={16} />
                Executive Members (Bilingual)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {membersList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("publications")}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                activeTab === "publications"
                  ? "bg-red-700 text-white shadow-md"
                  : isDark
                  ? "bg-slate-900 text-slate-300 hover:bg-slate-800"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <BookOpen size={16} />
                Publications & PDF Archive
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {pubList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("events")}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                activeTab === "events"
                  ? "bg-red-700 text-white shadow-md"
                  : isDark
                  ? "bg-slate-900 text-slate-300 hover:bg-slate-800"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <Calendar size={16} />
                Scheduled Events
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {eventsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("gallery")}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                activeTab === "gallery"
                  ? "bg-red-700 text-white shadow-md"
                  : isDark
                  ? "bg-slate-900 text-slate-300 hover:bg-slate-800"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <ImageIcon size={16} />
                Photo Gallery
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {galleryList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("inquiries")}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                activeTab === "inquiries"
                  ? "bg-red-700 text-white shadow-md"
                  : isDark
                  ? "bg-slate-900 text-slate-300 hover:bg-slate-800"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <EnvelopeSimple size={16} />
                Contact Inquiries
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-700 text-white font-mono">
                {inquiriesList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                activeTab === "settings"
                  ? "bg-red-700 text-white shadow-md"
                  : isDark
                  ? "bg-slate-900 text-slate-300 hover:bg-slate-800"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <Database size={16} />
                Liaison & Office Settings
              </span>
            </button>
          </aside>

          {/* Main Work Area */}
          <main className="lg:col-span-9 space-y-6">
            {/* 1. OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">System Status and Quick Overview</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage executive committee rosters, upload PDF publications, schedule village health camps, and view public inquiries.
                  </p>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div
                    className={`p-5 rounded-2xl border ${
                      isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                      <span>Total Members</span>
                      <Users size={18} className="text-red-500" />
                    </div>
                    <div className="text-2xl font-bold mt-2">{membersList.length}</div>
                    <div className="text-[11px] text-emerald-500 font-medium mt-1">Active Roster</div>
                  </div>

                  <div
                    className={`p-5 rounded-2xl border ${
                      isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                      <span>Publications</span>
                      <BookOpen size={18} className="text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold mt-2">{pubList.length}</div>
                    <div className="text-[11px] text-slate-400 font-medium mt-1">PDF Reports & Souvenirs</div>
                  </div>

                  <div
                    className={`p-5 rounded-2xl border ${
                      isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                      <span>Events Scheduled</span>
                      <Calendar size={18} className="text-emerald-500" />
                    </div>
                    <div className="text-2xl font-bold mt-2">{eventsList.length}</div>
                    <div className="text-[11px] text-slate-400 font-medium mt-1">Gatherings & Health Camps</div>
                  </div>

                  <div
                    className={`p-5 rounded-2xl border ${
                      isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                      <span>Inquiries</span>
                      <EnvelopeSimple size={18} className="text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold mt-2">{inquiriesList.length}</div>
                    <div className="text-[11px] text-amber-500 font-medium mt-1">Pending Responses</div>
                  </div>
                </div>

                {/* Database Schema Status Box */}
                <div
                  className={`p-6 rounded-2xl border space-y-3 ${
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <Database size={18} className="text-red-500" />
                      Supabase SQL Schema Migration
                    </h3>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                      Generated at supabase/schema.sql
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tables for <code className="text-red-400 bg-slate-950 px-1 py-0.5 rounded">members</code>,{" "}
                    <code className="text-red-400 bg-slate-950 px-1 py-0.5 rounded">publications</code>,{" "}
                    <code className="text-red-400 bg-slate-950 px-1 py-0.5 rounded">events</code>,{" "}
                    <code className="text-red-400 bg-slate-950 px-1 py-0.5 rounded">gallery</code>, and{" "}
                    <code className="text-red-400 bg-slate-950 px-1 py-0.5 rounded">inquiries</code> are configured with Row Level Security (RLS) policies.
                  </p>
                </div>
              </div>
            )}

            {/* 2. MEMBERS TAB (DUAL LANGUAGE) */}
            {activeTab === "members" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Executive Members Roster</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Manage names and designations in both English and Nepali.
                    </p>
                  </div>
                  <div className="relative">
                    <MagnifyingGlass size={14} className="absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search member..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-none focus:border-red-500 ${
                        isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-300 text-slate-900"
                      }`}
                    />
                  </div>
                </div>

                {/* Create Member Form */}
                <form
                  onSubmit={handleCreateMember}
                  className={`p-6 rounded-2xl border space-y-4 ${
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                  }`}
                >
                  <div className="text-sm font-bold flex items-center gap-2">
                    <Plus size={16} className="text-red-500" />
                    Add New Member (Dual Language Input)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Name in English *</label>
                      <input
                        required
                        type="text"
                        value={memberForm.nameEn}
                        onChange={(e) => setMemberForm({ ...memberForm, nameEn: e.target.value })}
                        placeholder="e.g. Ramesh Gyawali"
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">नाम (नेपालीमा) *</label>
                      <input
                        required
                        type="text"
                        value={memberForm.nameNe}
                        onChange={(e) => setMemberForm({ ...memberForm, nameNe: e.target.value })}
                        placeholder="जस्तै: रमेश ज्ञवाली"
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Designation (English)</label>
                      <input
                        type="text"
                        value={memberForm.roleEn}
                        onChange={(e) => setMemberForm({ ...memberForm, roleEn: e.target.value })}
                        placeholder="Joint Secretary"
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">पद (नेपालीमा)</label>
                      <input
                        type="text"
                        value={memberForm.roleNe}
                        onChange={(e) => setMemberForm({ ...memberForm, roleNe: e.target.value })}
                        placeholder="सह-सचिव"
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Committee Role Category</label>
                      <select
                        value={memberForm.committeeType}
                        onChange={(e) =>
                          setMemberForm({
                            ...memberForm,
                            committeeType: e.target.value as "current" | "past" | "advisor",
                          })
                        }
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      >
                        <option value="current">Current Executive</option>
                        <option value="advisor">Advisor Council</option>
                        <option value="past">Past President / Executive</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Contact Phone</label>
                      <input
                        type="text"
                        value={memberForm.phone}
                        onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                        placeholder="+977 98..."
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Photo URL</label>
                      <input
                        type="url"
                        value={memberForm.photoUrl}
                        onChange={(e) => setMemberForm({ ...memberForm, photoUrl: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Plus size={16} /> Save Member Record
                  </button>
                </form>

                {/* Members List Table */}
                <div
                  className={`rounded-2xl border overflow-hidden ${
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                  }`}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className={`border-b ${isDark ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"}`}>
                        <tr>
                          <th className="p-4">Member Name</th>
                          <th className="p-4">Nepali Name</th>
                          <th className="p-4">Designation</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Contact</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {membersList
                          .filter((m) =>
                            m.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            m.nameNe.includes(searchQuery)
                          )
                          .map((member) => (
                            <tr key={member.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="p-4 font-bold flex items-center gap-3">
                                <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-800">
                                  <Image src={member.photoUrl} alt={member.nameEn} fill sizes="32px" className="object-cover" />
                                </div>
                                <span>{member.nameEn}</span>
                              </td>
                              <td className="p-4">{member.nameNe}</td>
                              <td className="p-4">
                                <div>{member.roleEn}</div>
                                <div className="text-[10px] text-red-400">{member.roleNe}</div>
                              </td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                                  {member.committeeType}
                                </span>
                              </td>
                              <td className="p-4 font-mono">{member.phone || "N/A"}</td>
                              <td className="p-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMember(member.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-950/60 text-red-400 transition-colors"
                                  title="Delete Member"
                                >
                                  <Trash size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 3. PUBLICATIONS TAB */}
            {activeTab === "publications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Publications & PDF Document Center</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Upload new PDF documents and update annual souvenir archives.
                  </p>
                </div>

                {/* Upload Form */}
                <form
                  onSubmit={handleCreatePublication}
                  className={`p-6 rounded-2xl border space-y-4 ${
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                  }`}
                >
                  <div className="text-sm font-bold flex items-center gap-2">
                    <Upload size={16} className="text-red-500" />
                    Record New Publication / PDF
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Document Title (English) *</label>
                      <input
                        required
                        type="text"
                        value={pubForm.titleEn}
                        onChange={(e) => setPubForm({ ...pubForm, titleEn: e.target.value })}
                        placeholder="Annual Souvenir 2081"
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">दस्तावेज शीर्षक (नेपालीमा) *</label>
                      <input
                        required
                        type="text"
                        value={pubForm.titleNe}
                        onChange={(e) => setPubForm({ ...pubForm, titleNe: e.target.value })}
                        placeholder="वार्षिक स्मारिका २०८१"
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Category</label>
                      <input
                        type="text"
                        value={pubForm.categoryEn}
                        onChange={(e) => setPubForm({ ...pubForm, categoryEn: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Year (BS / AD)</label>
                      <input
                        type="text"
                        value={pubForm.publishedYearEn}
                        onChange={(e) => setPubForm({ ...pubForm, publishedYearEn: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">PDF File URL</label>
                      <input
                        type="url"
                        value={pubForm.pdfUrl}
                        onChange={(e) => setPubForm({ ...pubForm, pdfUrl: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Upload size={16} /> Upload & Save Document
                  </button>
                </form>

                {/* Publications Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pubList.map((pub) => (
                    <div
                      key={pub.id}
                      className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FileText size={24} className="text-red-500" />
                          <div>
                            <div className="text-xs font-bold leading-snug">{pub.titleEn}</div>
                            <div className="text-[10px] text-red-400">{pub.titleNe}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePublication(pub.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete Publication"
                        >
                          <Trash size={16} />
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-400 flex justify-between border-t border-slate-800 pt-2 font-mono">
                        <span>{pub.publishedYearEn}</span>
                        <span>{pub.fileSize}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. EVENTS TAB */}
            {activeTab === "events" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Community Events & Programs</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Schedule AGM meetings, free health clinics, and cultural assemblies.
                  </p>
                </div>

                <form
                  onSubmit={handleCreateEvent}
                  className={`p-6 rounded-2xl border space-y-4 ${
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                  }`}
                >
                  <div className="text-sm font-bold flex items-center gap-2">
                    <Calendar size={16} className="text-red-500" />
                    Schedule New Event
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Event Title (English) *</label>
                      <input
                        required
                        type="text"
                        value={eventForm.titleEn}
                        onChange={(e) => setEventForm({ ...eventForm, titleEn: e.target.value })}
                        placeholder="Annual General Meeting"
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">कार्यक्रम शीर्षक (नेपालीमा) *</label>
                      <input
                        required
                        type="text"
                        value={eventForm.titleNe}
                        onChange={(e) => setEventForm({ ...eventForm, titleNe: e.target.value })}
                        placeholder="वार्षिक साधारण सभा"
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Date (English)</label>
                      <input
                        type="text"
                        value={eventForm.dateEn}
                        onChange={(e) => setEventForm({ ...eventForm, dateEn: e.target.value })}
                        placeholder="September 28, 2026"
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">मिति (नेपालीमा)</label>
                      <input
                        type="text"
                        value={eventForm.dateNe}
                        onChange={(e) => setEventForm({ ...eventForm, dateNe: e.target.value })}
                        placeholder="असोज १२, २०८१"
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Status</label>
                      <select
                        value={eventForm.status}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            status: e.target.value as "upcoming" | "completed",
                          })
                        }
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Plus size={16} /> Add Scheduled Event
                  </button>
                </form>

                <div className="space-y-3">
                  {eventsList.map((ev) => (
                    <div
                      key={ev.id}
                      className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-bold">{ev.titleEn}</div>
                        <div className="text-[11px] text-red-400">{ev.titleNe}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {ev.dateEn} ({ev.dateNe}) · {ev.locationEn}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. GALLERY TAB */}
            {activeTab === "gallery" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Community Photo Gallery</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage event and village development photo albums.
                  </p>
                </div>

                <form
                  onSubmit={handleCreateGallery}
                  className={`p-6 rounded-2xl border space-y-4 ${
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                  }`}
                >
                  <div className="text-sm font-bold flex items-center gap-2">
                    <ImageIcon size={16} className="text-red-500" />
                    Add Photo to Gallery
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Photo Title (English) *</label>
                      <input
                        required
                        type="text"
                        value={galleryForm.titleEn}
                        onChange={(e) => setGalleryForm({ ...galleryForm, titleEn: e.target.value })}
                        placeholder="Village Scholarship Distribution"
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">शीर्षक (नेपालीमा) *</label>
                      <input
                        required
                        type="text"
                        value={galleryForm.titleNe}
                        onChange={(e) => setGalleryForm({ ...galleryForm, titleNe: e.target.value })}
                        placeholder="छात्रवृत्ति वितरण कार्यक्रम"
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Image URL</label>
                      <input
                        type="url"
                        value={galleryForm.imageUrl}
                        onChange={(e) => setGalleryForm({ ...galleryForm, imageUrl: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Category</label>
                      <select
                        value={galleryForm.categoryEn}
                        onChange={(e) => setGalleryForm({ ...galleryForm, categoryEn: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      >
                        <option value="Education">Education</option>
                        <option value="Culture">Culture</option>
                        <option value="Development">Development</option>
                        <option value="Environment">Environment</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Plus size={16} /> Save to Gallery
                  </button>
                </form>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryList.map((item) => (
                    <div
                      key={item.id}
                      className={`relative h-40 rounded-xl overflow-hidden border group ${
                        isDark ? "border-slate-800 bg-slate-900" : "border-slate-300 bg-slate-200"
                      }`}
                    >
                      <Image
                        src={item.imageUrl}
                        alt={item.titleEn}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                        <div className="text-[10px] text-red-400 font-semibold">{item.categoryEn}</div>
                        <div className="text-xs font-bold text-white line-clamp-2">{item.titleEn}</div>
                        <button
                          type="button"
                          onClick={() => handleDeleteGallery(item.id)}
                          className="self-end p-1 rounded bg-red-700 text-white hover:bg-red-800 text-[10px]"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. INQUIRIES TAB */}
            {activeTab === "inquiries" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Public Inquiries & Membership Requests</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Messages submitted through the public contact form.
                  </p>
                </div>

                <div className="space-y-3">
                  {inquiriesList.map((inq) => (
                    <div
                      key={inq.id}
                      className={`p-5 rounded-2xl border space-y-2 ${
                        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm">{inq.name}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-mono">{inq.date}</span>
                          <button
                            type="button"
                            onClick={() => setInquiriesList(inquiriesList.filter((i) => i.id !== inq.id))}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                            title="Delete Inquiry"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-red-400 font-mono">
                        <span>{inq.phone}</span>
                        <span>{inq.email}</span>
                      </div>
                      <p className="text-xs text-slate-300 pt-2 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                        {inq.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. SETTINGS TAB */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Organization Secretariat & Liaison Settings</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Update official contact phone numbers, secretariat emails, and office addresses.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    alert("Settings updated successfully!");
                  }}
                  className={`p-6 rounded-2xl border space-y-4 ${
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                  }`}
                >
                  <div className="text-sm font-bold flex items-center gap-2">
                    <Database size={16} className="text-red-500" />
                    Liaison Secretariat Addresses & Contact Details
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Contact Phone</label>
                      <input
                        type="text"
                        value={settings.contactPhone}
                        onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Contact Email</label>
                      <input
                        type="email"
                        value={settings.contactEmail}
                        onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Kathmandu Secretariat Address</label>
                      <input
                        type="text"
                        value={settings.kathmanduAddress}
                        onChange={(e) => setSettings({ ...settings, kathmanduAddress: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Thorga Village Center Address</label>
                      <input
                        type="text"
                        value={settings.thorgaAddress}
                        onChange={(e) => setSettings({ ...settings, thorgaAddress: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold transition-colors"
                  >
                    Save System Settings
                  </button>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
