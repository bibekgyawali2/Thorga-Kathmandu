"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  DocumentSectionEditor,
  ABOUT_DOC_SLUGS,
} from "@/components/admin/DocumentSectionEditor";
import { useToast } from "@/components/Toast";
import { FloppyDisk, Article, FileText } from "@phosphor-icons/react";
import type { ContentPage, Language } from "@/data/mockData";

/**
 * Admin editor for the nine pages under About Us.
 *
 * Current Executive Committee and Current Advisors are not here: they read
 * from the members table and are edited under the Members tab.
 */

type Section = "pages" | "documents";

const CONTENT_PAGES: { slug: string; ne: string; en: string }[] = [
  { slug: "organisation", ne: "संस्था परिचय", en: "Organisation Profile" },
  { slug: "thorga", ne: "थोर्गाको परिचय", en: "About Thorga" },
];

const inputCls =
  "w-full px-3.5 py-2.5 rounded-control border border-line bg-ground text-fg text-xs placeholder:text-muted focus:border-accent";
const labelCls = "text-xs font-semibold text-fg block mb-1.5";


export function AboutManager({
  lang,
  adminFetch,
}: {
  lang: Language;
  adminFetch: (url: string, options?: RequestInit) => Promise<Response>;
}) {
  const toast = useToast();

  const [section, setSection] = useState<Section>("pages");
  const [loading, setLoading] = useState(true);

  const [pages, setPages] = useState<ContentPage[]>([]);

  const [activePageSlug, setActivePageSlug] = useState("organisation");
  const [pageEdits, setPageEdits] = useState<
    Record<string, { titleEn: string; titleNe: string; bodyEn: string; bodyNe: string }>
  >({});
  const [loadError, setLoadError] = useState(false);
  const [savingPage, setSavingPage] = useState(false);



  const t = (ne: string, en: string) => (lang === "ne" ? ne : en);

  // Derived rather than synchronised by an effect, so unsaved edits also
  // survive switching between the two profile pages.
  const storedPage = pages.find((p) => p.slug === activePageSlug);
  const pagePreset = CONTENT_PAGES.find((c) => c.slug === activePageSlug);
  const pageForm = pageEdits[activePageSlug] ?? {
    titleEn: storedPage?.titleEn ?? pagePreset?.en ?? "",
    titleNe: storedPage?.titleNe ?? pagePreset?.ne ?? "",
    bodyEn: storedPage?.bodyEn ?? "",
    bodyNe: storedPage?.bodyNe ?? "",
  };
  const setPageForm = (next: typeof pageForm) =>
    setPageEdits((prev) => ({ ...prev, [activePageSlug]: next }));

  // Bumping this token re-runs the loader. The fetching lives inside the
  // effect so nothing sets state synchronously from the effect body.
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [p] = await Promise.all([
          fetch("/api/content-pages", { cache: "no-store" }).then((res) => (res.ok ? res.json() : [])),
        ]);
        if (cancelled) return;
        if (Array.isArray(p)) setPages(p);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const savePage = async () => {
    if (!pageForm.titleEn.trim() || !pageForm.titleNe.trim()) {
      toast.error(t("शीर्षक आवश्यक", "Title required"), t("दुवै भाषामा शीर्षक लेख्नुहोस्।", "Enter the title in both languages."));
      return;
    }
    setSavingPage(true);
    try {
      const res = await adminFetch("/api/content-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: activePageSlug, ...pageForm }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || "Save failed");
      setPages((prev) => {
        const next = prev.filter((p) => p.slug !== activePageSlug);
        return [...next, json.data as ContentPage];
      });
      toast.success(t("पृष्ठ सुरक्षित भयो", "Page saved"));
    } catch (error) {
      toast.error(t("सुरक्षित गर्न सकिएन", "Could not save"), error instanceof Error ? error.message : undefined);
    } finally {
      setSavingPage(false);
    }
  };


  const sectionTab = (key: Section, icon: React.ReactNode, ne: string, en: string) => (
    <button
      key={key}
      type="button"
      onClick={() => setSection(key)}
      className={`px-3 py-2 rounded-control text-xs font-semibold transition-colors flex items-center gap-1.5 ${
        section === key ? "bg-accent text-on-accent" : "bg-tint text-fg hover:bg-accent-soft"
      }`}
    >
      {icon}
      {t(ne, en)}
    </button>
  );

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded-card bg-tint animate-pulse" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-card border border-line bg-surface p-8 text-center space-y-3">
        <p className="text-xs font-semibold text-danger">
          {t("सामग्री लोड गर्न सकिएन।", "Could not load this section.")}
        </p>
        <button
          type="button"
          onClick={() => {
            setLoadError(false);
            setLoading(true);
            reload();
          }}
          className="px-4 py-2 rounded-control bg-accent text-on-accent text-xs font-semibold"
        >
          {t("पुनः प्रयास", "Retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-fg">{t("हाम्रो बारेमा", "About Us")}</h2>
        <p className="text-xs text-muted">
          {t(
            "हाम्रो बारेमा अन्तर्गतका पृष्ठहरु यहाँबाट सम्पादन गर्न सकिन्छ।",
            "Edit the pages that appear under About Us."
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {sectionTab("pages", <Article size={14} />, "परिचय पृष्ठहरु", "Profile Pages")}
        {sectionTab("documents", <FileText size={14} />, "कागजातहरु", "Documents")}
      </div>

      {section === "pages" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {CONTENT_PAGES.map((page) => (
              <button
                key={page.slug}
                type="button"
                onClick={() => setActivePageSlug(page.slug)}
                className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors ${
                  activePageSlug === page.slug
                    ? "bg-accent-soft text-accent"
                    : "bg-surface border border-line text-fg hover:bg-tint"
                }`}
              >
                {t(page.ne, page.en)}
              </button>
            ))}
          </div>

          <div className="rounded-card border border-line bg-surface p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ab-title-ne" className={labelCls}>
                  {t("शीर्षक (नेपाली)", "Title (Nepali)")}
                </label>
                <input
                  id="ab-title-ne"
                  className={inputCls}
                  value={pageForm.titleNe}
                  onChange={(e) => setPageForm({ ...pageForm, titleNe: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="ab-title-en" className={labelCls}>
                  {t("शीर्षक (अङ्ग्रेजी)", "Title (English)")}
                </label>
                <input
                  id="ab-title-en"
                  className={inputCls}
                  value={pageForm.titleEn}
                  onChange={(e) => setPageForm({ ...pageForm, titleEn: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ab-body-ne" className={labelCls}>
                  {t("विवरण (नेपाली)", "Body (Nepali)")}
                </label>
                <textarea
                  id="ab-body-ne"
                  rows={12}
                  className={inputCls}
                  value={pageForm.bodyNe}
                  onChange={(e) => setPageForm({ ...pageForm, bodyNe: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="ab-body-en" className={labelCls}>
                  {t("विवरण (अङ्ग्रेजी)", "Body (English)")}
                </label>
                <textarea
                  id="ab-body-en"
                  rows={12}
                  className={inputCls}
                  value={pageForm.bodyEn}
                  onChange={(e) => setPageForm({ ...pageForm, bodyEn: e.target.value })}
                />
              </div>
            </div>

            <p className="text-[11px] text-muted">
              {t(
                "खाली लाइनले नयाँ अनुच्छेद बनाउँछ। HTML प्रयोग गरिँदैन।",
                "A blank line starts a new paragraph. HTML is not rendered."
              )}
            </p>

            <button
              type="button"
              onClick={savePage}
              disabled={savingPage}
              className="px-5 py-2.5 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {savingPage ? <span className="spinner" aria-hidden="true" /> : <FloppyDisk size={15} />}
              {t("पृष्ठ सुरक्षित गर्नुहोस्", "Save Page")}
            </button>
          </div>
        </div>
      )}

      {section === "documents" && (
        <DocumentSectionEditor lang={lang} adminFetch={adminFetch} slugs={ABOUT_DOC_SLUGS} />
      )}
    </div>
  );
}
