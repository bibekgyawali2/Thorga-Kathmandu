"use client";

import React, { useState, useEffect, useCallback, useSyncExternalStore } from "react";
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
  getAdminSession,
  clearAdminSession,
  subscribeAdminSession,
  getAdminUsers,
  saveAdminUsers,
} from "@/lib/adminAuth";
import { isJWTExpired } from "@/lib/jwt";
import { useDialog } from "@/components/Dialog";
import { useToast } from "@/components/Toast";
import { AboutManager } from "@/components/admin/AboutManager";
import {
  DocumentSectionEditor,
  PUBLICATION_DOC_SLUGS,
} from "@/components/admin/DocumentSectionEditor";
import { AdminTab } from "@/components/admin/adminTypes";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { OverviewTab } from "@/components/admin/tabs/OverviewTab";
import { HeroTab } from "@/components/admin/tabs/HeroTab";
import { MembersTab } from "@/components/admin/tabs/MembersTab";
import { EventsTab } from "@/components/admin/tabs/EventsTab";
import { PublicationsTab } from "@/components/admin/tabs/PublicationsTab";
import { GalleryTab } from "@/components/admin/tabs/GalleryTab";
import { InquiriesTab } from "@/components/admin/tabs/InquiriesTab";
import { SettingsTab } from "@/components/admin/tabs/SettingsTab";
import { BrandingTab } from "@/components/admin/tabs/BrandingTab";
import { AccessTab } from "@/components/admin/tabs/AccessTab";

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

export default function AdminPage() {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [session, setSession] = useState<AdminSession | null>(() => getAdminSession());
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
  const { alert: dialogAlert, confirm: dialogConfirm } = useDialog();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [memberModalInitialOpen, setMemberModalInitialOpen] = useState(false);
  const [pubModalInitialOpen, setPubModalInitialOpen] = useState(false);

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
  const [contactSettingsState, setContactSettingsState] = useState<ContactSettings>(() =>
    getStoredContactSettingsSnapshot()
  );

  const toggleAdminLang = () => {
    const next = lang === "ne" ? "en" : "ne";
    setLang(next);
    saveStoredLanguage(next);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = next;
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
      if (
        !currentSession ||
        !currentSession.isAuthenticated ||
        (currentSession.token && isJWTExpired(currentSession.token))
      ) {
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

  // Synchronize latest database state on mount
  const loadInquiries = useCallback(() => {
    setInquiriesError(false);
    setInquiriesLoading(true);
    const currentSession = getAdminSession();
    const headers: Record<string, string> = {};
    if (currentSession?.token) {
      headers["Authorization"] = `Bearer ${currentSession.token}`;
    }
    fetch("/api/inquiries", { cache: "no-store", credentials: "include", headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data)) setInquiriesList(data);
        else setInquiriesError(true);
      })
      .catch(() => setInquiriesError(true))
      .finally(() => setInquiriesLoading(false));
  }, []);

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

    loadInquiries();
  }, [loadInquiries]);

  // Session lifecycle & freshness
  useEffect(() => {
    const unsubscribe = subscribeAdminSession((newSession) => {
      setSession(newSession);
    });

    if (!session || !session.isAuthenticated) {
      return () => unsubscribe();
    }

    const checkSessionFreshness = () => {
      const activeSession = getAdminSession();
      if (
        !activeSession ||
        !activeSession.isAuthenticated ||
        (activeSession.token && isJWTExpired(activeSession.token))
      ) {
        handleAutoLogout(
          lang === "ne"
            ? "सत्र समाप्त भएको छ। कृपया पुन: लगइन गर्नुहोस्।"
            : "Your session has expired. Please log in again."
        );
      }
    };

    const expTime = session.expiresAt ? session.expiresAt * 1000 : Date.now() + 24 * 60 * 60 * 1000;
    const timeRemaining = Math.max(0, expTime - Date.now());

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

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    clearAdminSession();
    setSession(null);
  };

  const [eventModalInitialOpen, setEventModalInitialOpen] = useState(false);

  const handleQuickAction = (tab: AdminTab, openModal?: boolean) => {
    setActiveTab(tab);
    if (tab === "members" && openModal) {
      setMemberModalInitialOpen(true);
    }
    if (tab === "publications" && openModal) {
      setPubModalInitialOpen(true);
    }
    if (tab === "events" && openModal) {
      setEventModalInitialOpen(true);
    }
  };

  // SSR & hydration guard
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

  // Not Authenticated
  if (!session?.isAuthenticated) {
    return (
      <AdminLogin
        lang={lang}
        toggleAdminLang={toggleAdminLang}
        onLoginSuccess={(newSession) => setSession(newSession)}
      />
    );
  }

  const baseTabProps = {
    lang,
    adminFetch,
    dialogAlert,
    dialogConfirm,
    toast,
    session,
    onNavigateTab: setActiveTab,
  };

  const counts = {
    members: membersList.length,
    publications: pubList.length,
    events: eventsList.length,
    gallery: galleryList.length,
    inquiries: inquiriesList.length,
    adminUsers: adminUsersList.length,
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-ground text-fg font-sans selection:bg-accent selection:text-on-accent">
      <AdminSidebar
        lang={lang}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        session={session}
        counts={counts}
      />

      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden lg:pl-64">
        <AdminHeader
          lang={lang}
          activeTab={activeTab}
          toggleAdminLang={toggleAdminLang}
          setSidebarOpen={setSidebarOpen}
          session={session}
          theme={theme}
          toggleTheme={toggleTheme}
          handleLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          {activeTab === "overview" && (
            <OverviewTab
              {...baseTabProps}
              counts={counts}
              onQuickAction={handleQuickAction}
            />
          )}

          {activeTab === "hero" && (
            <HeroTab {...baseTabProps} initialHero={heroState} />
          )}

          {activeTab === "members" && (
            <MembersTab
              {...baseTabProps}
              membersList={membersList}
              setMembersList={setMembersList}
              showAddModalInitial={memberModalInitialOpen}
            />
          )}

          {activeTab === "publications" && (
            <PublicationsTab
              {...baseTabProps}
              pubList={pubList}
              setPubList={setPubList}
              showAddModalInitial={pubModalInitialOpen}
            />
          )}

          {activeTab === "events" && (
            <EventsTab
              {...baseTabProps}
              eventsList={eventsList}
              setEventsList={setEventsList}
              showAddModalInitial={eventModalInitialOpen}
            />
          )}

          {activeTab === "gallery" && (
            <GalleryTab
              {...baseTabProps}
              galleryList={galleryList}
              setGalleryList={setGalleryList}
            />
          )}

          {activeTab === "publication-pages" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-fg">
                  {lang === "ne" ? "संस्थाका प्रकाशनहरू" : "Sansthaka Prakashanharu"}
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

          {activeTab === "about" && (
            <AboutManager lang={lang} adminFetch={adminFetch} />
          )}

          {activeTab === "inquiries" && (
            <InquiriesTab
              {...baseTabProps}
              inquiriesList={inquiriesList}
              setInquiriesList={setInquiriesList}
              inquiriesLoading={inquiriesLoading}
              inquiriesError={inquiriesError}
              onRetry={loadInquiries}
            />
          )}

          {activeTab === "settings" && (
            <SettingsTab
              {...baseTabProps}
              initialSettings={contactSettingsState}
            />
          )}

          {activeTab === "branding" && (
            <BrandingTab
              {...baseTabProps}
              initialBranding={brandingState}
            />
          )}

          {activeTab === "access" && (
            <AccessTab
              {...baseTabProps}
              adminUsersList={adminUsersList}
              setAdminUsersList={setAdminUsersList}
            />
          )}
        </main>
      </div>
    </div>
  );
}
