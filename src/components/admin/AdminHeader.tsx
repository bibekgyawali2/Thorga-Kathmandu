"use client";

import React from "react";
import Link from "next/link";
import { AdminTab } from "./adminTypes";
import { ADMIN_I18N } from "./adminConstants";
import { Language } from "@/data/mockData";
import { AdminSession } from "@/lib/adminAuth";
import {
  List,
  Translate,
  ArrowSquareOut,
  Sun,
  Moon,
  SignOut,
} from "@phosphor-icons/react";

interface AdminHeaderProps {
  lang: Language;
  activeTab: AdminTab;
  toggleAdminLang: () => void;
  setSidebarOpen: (open: boolean) => void;
  session: AdminSession | null;
  theme: "light" | "dark";
  toggleTheme: () => void;
  handleLogout: () => void;
}

export function AdminHeader({
  lang,
  activeTab,
  toggleAdminLang,
  setSidebarOpen,
  session,
  theme,
  toggleTheme,
  handleLogout,
}: AdminHeaderProps) {
  const t = ADMIN_I18N[lang];

  const getPageTitle = () => {
    switch (activeTab) {
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
        return lang === "ne" ? "संस्थाका प्रकाशनहरू" : "Sansthaka Prakashanharu";
      case "inquiries":
        return t.inquiries;
      case "settings":
        return t.settings;
      case "businesses":
        return t.businesses;
      case "member-special":
        return t.memberSpecial;
      case "access":
        return t.adminAccess;
      default:
        return t.overview;
    }
  };

  return (
    <header className="h-14 border-b border-line bg-surface px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-10">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-1.5 rounded-control border border-line bg-surface text-fg hover:bg-tint"
          aria-label="Open Navigation"
        >
          <List size={18} />
        </button>
        <h1 className="text-sm font-bold text-fg">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Switcher */}
        <button
          type="button"
          onClick={toggleAdminLang}
          className="px-2.5 sm:px-3 py-1.5 rounded-control border border-line bg-surface hover:bg-tint text-fg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
        >
          <Translate size={14} className="text-accent" />
          <span>{lang === "ne" ? "English" : "नेपाली"}</span>
        </button>

        {/* Theme Switcher */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-1.5 sm:p-2 rounded-control border border-line bg-surface text-fg hover:bg-tint transition-colors cursor-pointer"
          aria-label={t.theme}
          title={t.theme}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Public Portal Link */}
        <Link
          href="/"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-medium border border-line bg-surface hover:bg-tint text-fg transition-colors"
        >
          <ArrowSquareOut size={14} />
          <span>{t.publicPortal}</span>
        </Link>

        {/* Session / Logout */}
        {session && (
          <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-line">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                session.isSuperadmin
                  ? "bg-warning/20 text-warning"
                  : "bg-accent-soft text-accent"
              }`}
              title={`${session.username} (${session.role})`}
            >
              {session.isSuperadmin ? "S" : "A"}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-control text-danger hover:bg-danger/10 transition-colors cursor-pointer"
              aria-label={t.logout}
              title={t.logout}
            >
              <SignOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
