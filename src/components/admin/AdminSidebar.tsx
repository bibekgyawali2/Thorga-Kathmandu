"use client";

import React from "react";
import Link from "next/link";
import { AdminTab } from "./adminTypes";
import { ADMIN_I18N } from "./adminConstants";
import { Language } from "@/data/mockData";
import { AdminSession, AdminUser, SUPERADMIN_EMAIL } from "@/lib/adminAuth";
import {
  SlidersHorizontal,
  Sparkle,
  Users,
  BookOpen,
  Calendar,
  Image as ImageIcon,
  FileText,
  Buildings,
  EnvelopeSimple,
  Database,
  PaintBucket,
  UserGear,
  ArrowSquareOut,
  X,
} from "@phosphor-icons/react";

interface AdminSidebarProps {
  lang: Language;
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  session: AdminSession | null;
  counts: {
    members: number;
    publications: number;
    events: number;
    gallery: number;
    inquiries: number;
    adminUsers: number;
  };
}

export function AdminSidebar({
  lang,
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  session,
  counts,
}: AdminSidebarProps) {
  const t = ADMIN_I18N[lang];
  const isSuperadmin =
    session?.isSuperadmin ||
    session?.role === "superadmin" ||
    session?.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();

  const navItems: {
    tab: AdminTab;
    label: string;
    icon: React.ReactNode;
    badge?: React.ReactNode;
    superadminOnly?: boolean;
  }[] = [
    {
      tab: "overview",
      label: t.overview,
      icon: <SlidersHorizontal size={18} />,
    },
    {
      tab: "hero",
      label: t.hero,
      icon: <Sparkle size={18} />,
      badge: <span className="text-xs font-medium opacity-80">Live</span>,
    },
    {
      tab: "members",
      label: t.members,
      icon: <Users size={18} />,
      badge: (
        <span
          className={`text-xs font-mono px-2 py-0.5 rounded-chip ${
            activeTab === "members" ? "bg-black/20 text-white" : "bg-tint text-muted"
          }`}
        >
          {counts.members}
        </span>
      ),
    },
    {
      tab: "publications",
      label: t.publications,
      icon: <BookOpen size={18} />,
      badge: (
        <span
          className={`text-xs font-mono px-2 py-0.5 rounded-chip ${
            activeTab === "publications"
              ? "bg-black/20 text-white"
              : "bg-tint text-muted"
          }`}
        >
          {counts.publications}
        </span>
      ),
    },
    {
      tab: "events",
      label: t.events,
      icon: <Calendar size={18} />,
      badge: (
        <span
          className={`text-xs font-mono px-2 py-0.5 rounded-chip ${
            activeTab === "events" ? "bg-black/20 text-white" : "bg-tint text-muted"
          }`}
        >
          {counts.events}
        </span>
      ),
    },
    {
      tab: "gallery",
      label: t.gallery,
      icon: <ImageIcon size={18} />,
      badge: (
        <span
          className={`text-xs font-mono px-2 py-0.5 rounded-chip ${
            activeTab === "gallery" ? "bg-black/20 text-white" : "bg-tint text-muted"
          }`}
        >
          {counts.gallery}
        </span>
      ),
    },
    {
      tab: "publication-pages",
      label: lang === "ne" ? "संस्थाका प्रकाशनहरू" : "Sansthaka Prakashanharu",
      icon: <FileText size={18} />,
    },
    {
      tab: "about",
      label: lang === "ne" ? "हाम्रो बारेमा" : "About Us",
      icon: <Buildings size={18} />,
    },
    {
      tab: "inquiries",
      label: t.inquiries,
      icon: <EnvelopeSimple size={18} />,
      badge: (
        <span className="text-xs font-mono px-2 py-0.5 rounded-chip bg-danger text-white font-semibold">
          {counts.inquiries}
        </span>
      ),
    },
    {
      tab: "settings",
      label: t.settings,
      icon: <Database size={18} />,
    },
    {
      tab: "branding",
      label: t.branding,
      icon: <PaintBucket size={18} />,
    },
    {
      tab: "access",
      label: t.adminAccess,
      icon: <UserGear size={18} />,
      superadminOnly: true,
      badge: (
        <span
          className={`text-xs font-mono px-2 py-0.5 rounded-chip ${
            activeTab === "access" ? "bg-black/20 text-white" : "bg-tint text-muted"
          }`}
        >
          {counts.adminUsers}
        </span>
      ),
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-fg/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-surface border-r border-line flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0 shadow-e3" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-card bg-accent text-on-accent flex items-center justify-center font-bold text-sm flex-shrink-0">
              था
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-fg truncate">{t.brandTitle}</div>
              <div className="text-xs text-muted truncate">{t.brandSubtitle}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-control text-muted hover:text-fg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Nav */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {navItems.map((item) => {
            if (item.superadminOnly && !isSuperadmin) return null;
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => {
                  setActiveTab(item.tab);
                  setSidebarOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-control text-sm font-medium flex items-center justify-between transition-colors ${
                  isActive
                    ? "bg-accent text-on-accent shadow-e1"
                    : "text-muted hover:text-fg hover:bg-tint"
                }`}
              >
                <span className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                {item.badge}
              </button>
            );
          })}
        </div>

        {/* Portal Quick Link */}
        <div className="p-3 border-t border-line">
          <Link
            href="/"
            target="_blank"
            className="w-full px-3.5 py-2 rounded-control text-xs font-semibold text-muted hover:text-fg hover:bg-tint flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <ArrowSquareOut size={16} />
              <span>{t.publicPortal}</span>
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider opacity-60">
              Live
            </span>
          </Link>
        </div>
      </aside>
    </>
  );
}
