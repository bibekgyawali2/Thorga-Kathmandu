"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import { useToast } from "@/components/Toast";
import { useDialog } from "@/components/Dialog";
import { isValidImageSrc } from "@/lib/validation";
import { Plus, Trash, FloppyDisk, Article, Users, FileText } from "@phosphor-icons/react";
import type { ContentPage, Language, PageDocument, RosterEntry } from "@/data/mockData";

/**
 * Admin editor for the nine pages under About Us.
 *
 * Current Executive Committee and Current Advisors are not here: they read
 * from the members table and are edited under the Members tab.
 */

type Section = "pages" | "rosters" | "documents";

const CONTENT_PAGES: { slug: string; ne: string; en: string }[] = [
  { slug: "organisation", ne: "संस्था परिचय", en: "Organisation Profile" },
  { slug: "thorga", ne: "थोर्गाको परिचय", en: "About Thorga" },
];

const ROSTER_KINDS: { kind: RosterEntry["kind"]; ne: string; en: string }[] = [
  { kind: "former_official", ne: "हालसम्मका पदाधिकारीहरु", en: "Former Office Bearers" },
  { kind: "former_advisor", ne: "हालसम्मका सल्लाहाकारहरु", en: "Former Advisors" },
];

const DOCUMENT_SLUGS: { slug: PageDocument["slug"]; ne: string; en: string; single: boolean }[] = [
  { slug: "statute", ne: "संस्थाको विधान", en: "Organisation Statute", single: true },
  { slug: "life-members", ne: "आजीवन सदस्यहरु", en: "Life Members", single: true },
  { slug: "certificates", ne: "दर्ता प्रमाणपत्रहरु", en: "Registration Certificates", single: false },
];

const inputCls =
  "w-full px-3.5 py-2.5 rounded-control border border-line bg-ground text-fg text-xs placeholder:text-muted focus:border-accent";
const labelCls = "text-xs font-semibold text-fg block mb-1.5";

const emptyRoster = { id: "", nameEn: "", nameNe: "", photoUrl: "", order: 0 };
const emptyDocument = { id: "", titleEn: "", titleNe: "", fileUrl: "", pageCount: "" };

export function AboutManager({
  lang,
  adminFetch,
}: {
  lang: Language;
  adminFetch: (url: string, options?: RequestInit) => Promise<Response>;
}) {
  const toast = useToast();
  const { confirm: dialogConfirm } = useDialog();

  const [section, setSection] = useState<Section>("pages");
  const [loading, setLoading] = useState(true);

  const [pages, setPages] = useState<ContentPage[]>([]);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [documents, setDocuments] = useState<PageDocument[]>([]);

  const [activePageSlug, setActivePageSlug] = useState("organisation");
  const [pageEdits, setPageEdits] = useState<
    Record<string, { titleEn: string; titleNe: string; bodyEn: string; bodyNe: string }>
  >({});
  const [loadError, setLoadError] = useState(false);
  const [savingPage, setSavingPage] = useState(false);

  const [activeKind, setActiveKind] = useState<RosterEntry["kind"]>("former_official");
  const [rosterForm, setRosterForm] = useState(emptyRoster);
  const [savingRoster, setSavingRoster] = useState(false);

  const [activeDocSlug, setActiveDocSlug] = useState<PageDocument["slug"]>("statute");
  const [docForm, setDocForm] = useState(emptyDocument);
  const [savingDoc, setSavingDoc] = useState(false);

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
        const [p, r, d] = await Promise.all([
          fetch("/api/content-pages", { cache: "no-store" }).then((res) => (res.ok ? res.json() : [])),
          fetch("/api/roster", { cache: "no-store" }).then((res) => (res.ok ? res.json() : [])),
          fetch("/api/documents", { cache: "no-store" }).then((res) => (res.ok ? res.json() : [])),
        ]);
        if (cancelled) return;
        if (Array.isArray(p)) setPages(p);
        if (Array.isArray(r)) setRoster(r);
        if (Array.isArray(d)) setDocuments(d);
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

  const saveRoster = async () => {
    if (!rosterForm.nameEn.trim() || !rosterForm.nameNe.trim()) {
      toast.error(t("नाम आवश्यक", "Name required"), t("दुवै भाषामा नाम लेख्नुहोस्।", "Enter the name in both languages."));
      return;
    }
    setSavingRoster(true);
    try {
      const res = await adminFetch("/api/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rosterForm, kind: activeKind }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || "Save failed");
      const saved = json.data as RosterEntry;
      setRoster((prev) => {
        const without = prev.filter((e) => e.id !== saved.id);
        return [...without, saved];
      });
      setRosterForm(emptyRoster);
      toast.success(t("सुरक्षित भयो", "Saved"));
    } catch (error) {
      toast.error(t("सुरक्षित गर्न सकिएन", "Could not save"), error instanceof Error ? error.message : undefined);
    } finally {
      setSavingRoster(false);
    }
  };

  const removeRoster = async (entry: RosterEntry) => {
    const ok = await dialogConfirm({
      title: t("नाम हटाउने?", "Remove entry?"),
      description: lang === "ne" ? `${entry.nameNe} लाई सूचीबाट हटाउने?` : `Remove ${entry.nameEn} from this list?`,
      type: "danger",
    });
    if (!ok) return;

    const previous = roster;
    setRoster((prev) => prev.filter((e) => e.id !== entry.id));
    try {
      const res = await adminFetch(`/api/roster?id=${encodeURIComponent(entry.id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success(t("हटाइयो", "Removed"));
    } catch {
      setRoster(previous);
      toast.error(t("हटाउन सकिएन", "Could not remove"));
    }
  };

  const saveDocument = async () => {
    if (!docForm.fileUrl) {
      toast.error(t("फाइल आवश्यक", "File required"), t("कागजात अपलोड गर्नुहोस्।", "Upload a document first."));
      return;
    }
    if (!docForm.titleEn.trim() || !docForm.titleNe.trim()) {
      toast.error(t("शीर्षक आवश्यक", "Title required"), t("दुवै भाषामा शीर्षक लेख्नुहोस्।", "Enter the title in both languages."));
      return;
    }
    const isPdf = docForm.fileUrl.toLowerCase().includes(".pdf");
    setSavingDoc(true);
    try {
      const res = await adminFetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: docForm.id,
          slug: activeDocSlug,
          titleEn: docForm.titleEn,
          titleNe: docForm.titleNe,
          fileUrl: docForm.fileUrl,
          fileType: isPdf ? "pdf" : "image",
          pageCount: docForm.pageCount ? Number(docForm.pageCount) : null,
          order: 0,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || "Save failed");
      const saved = json.data as PageDocument;
      // Single-document pages replace their file, so reload to reflect removals.
      reload();
      setDocForm(emptyDocument);
      toast.success(t("कागजात सुरक्षित भयो", "Document saved"), saved.titleEn);
    } catch (error) {
      toast.error(t("सुरक्षित गर्न सकिएन", "Could not save"), error instanceof Error ? error.message : undefined);
    } finally {
      setSavingDoc(false);
    }
  };

  const removeDocument = async (doc: PageDocument) => {
    const ok = await dialogConfirm({
      title: t("कागजात हटाउने?", "Remove document?"),
      description: lang === "ne" ? `${doc.titleNe} हटाउने?` : `Remove ${doc.titleEn}?`,
      type: "danger",
    });
    if (!ok) return;

    const previous = documents;
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    try {
      const res = await adminFetch(`/api/documents?id=${encodeURIComponent(doc.id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success(t("हटाइयो", "Removed"));
    } catch {
      setDocuments(previous);
      toast.error(t("हटाउन सकिएन", "Could not remove"));
    }
  };

  const visibleRoster = roster.filter((e) => e.kind === activeKind);
  const visibleDocs = documents.filter((d) => d.slug === activeDocSlug);
  const activeDocMeta = DOCUMENT_SLUGS.find((d) => d.slug === activeDocSlug);

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
        {sectionTab("rosters", <Users size={14} />, "नामावली", "Name Lists")}
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
              className="px-5 py-2.5 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {savingPage ? <span className="spinner" aria-hidden="true" /> : <FloppyDisk size={15} />}
              {t("पृष्ठ सुरक्षित गर्नुहोस्", "Save Page")}
            </button>
          </div>
        </div>
      )}

      {section === "rosters" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ROSTER_KINDS.map((r) => (
              <button
                key={r.kind}
                type="button"
                onClick={() => {
                  setActiveKind(r.kind);
                  setRosterForm(emptyRoster);
                }}
                className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors ${
                  activeKind === r.kind
                    ? "bg-accent-soft text-accent"
                    : "bg-surface border border-line text-fg hover:bg-tint"
                }`}
              >
                {t(r.ne, r.en)}
              </button>
            ))}
          </div>

          <div className="rounded-card border border-line bg-surface p-5 space-y-4">
            <p className="text-xs font-bold text-fg">
              {rosterForm.id ? t("नाम सम्पादन", "Edit entry") : t("नयाँ नाम थप्नुहोस्", "Add a name")}
            </p>
            <p className="text-[11px] text-muted">
              {t(
                "यस सूचीमा नाम र तस्बिर मात्र राखिन्छ।",
                "This list carries a name and a photograph only."
              )}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ros-ne" className={labelCls}>
                  {t("नाम (नेपाली)", "Name (Nepali)")}
                </label>
                <input
                  id="ros-ne"
                  className={inputCls}
                  placeholder="जस्तै: रमेश ज्ञवाली"
                  value={rosterForm.nameNe}
                  onChange={(e) => setRosterForm({ ...rosterForm, nameNe: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="ros-en" className={labelCls}>
                  {t("नाम (अङ्ग्रेजी)", "Name (English)")}
                </label>
                <input
                  id="ros-en"
                  className={inputCls}
                  placeholder="e.g. Ramesh Gyawali"
                  value={rosterForm.nameEn}
                  onChange={(e) => setRosterForm({ ...rosterForm, nameEn: e.target.value })}
                />
              </div>
            </div>

            <CloudinaryUploader
              value={rosterForm.photoUrl}
              onChange={(url) => setRosterForm({ ...rosterForm, photoUrl: url })}
              folder="thorga_roster"
              accept="image/*"
              label={t("तस्बिर अपलोड", "Upload photograph")}
              description={t("२ MB सम्मको तस्बिर", "Image up to 2MB")}
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveRoster}
                disabled={savingRoster}
                className="px-5 py-2.5 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-70"
              >
                {savingRoster ? <span className="spinner" aria-hidden="true" /> : <Plus size={15} />}
                {rosterForm.id ? t("अद्यावधिक", "Update") : t("थप्नुहोस्", "Add")}
              </button>
              {rosterForm.id && (
                <button
                  type="button"
                  onClick={() => setRosterForm(emptyRoster)}
                  className="px-4 py-2.5 rounded-control border border-line text-fg text-xs font-semibold hover:bg-tint transition-colors"
                >
                  {t("रद्द", "Cancel")}
                </button>
              )}
            </div>
          </div>

          {visibleRoster.length === 0 ? (
            <p className="text-xs text-muted p-6 text-center border border-dashed border-line rounded-card">
              {t("यस सूचीमा कुनै नाम छैन।", "No names in this list yet.")}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {visibleRoster.map((entry) => (
                <div key={entry.id} className="rounded-card border border-line bg-surface overflow-hidden">
                  <div className="relative aspect-[4/5] w-full bg-accent-soft">
                    {isValidImageSrc(entry.photoUrl) && (
                      <Image
                        src={entry.photoUrl}
                        alt={entry.nameEn}
                        fill
                        sizes="200px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="p-2.5 space-y-2">
                    <p className="text-xs font-bold text-fg leading-snug">
                      {lang === "ne" ? entry.nameNe : entry.nameEn}
                    </p>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRosterForm({ ...entry })}
                        className="flex-1 px-2 py-1 rounded-chip border border-line text-[11px] font-semibold text-fg hover:bg-tint transition-colors"
                      >
                        {t("सम्पादन", "Edit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRoster(entry)}
                        aria-label={t("हटाउनुहोस्", "Remove")}
                        className="px-2 py-1 rounded-chip border border-line text-danger hover:bg-tint transition-colors"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {section === "documents" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {DOCUMENT_SLUGS.map((d) => (
              <button
                key={d.slug}
                type="button"
                onClick={() => {
                  setActiveDocSlug(d.slug);
                  setDocForm(emptyDocument);
                }}
                className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors ${
                  activeDocSlug === d.slug
                    ? "bg-accent-soft text-accent"
                    : "bg-surface border border-line text-fg hover:bg-tint"
                }`}
              >
                {t(d.ne, d.en)}
              </button>
            ))}
          </div>

          <div className="rounded-card border border-line bg-surface p-5 space-y-4">
            <p className="text-[11px] text-muted">
              {activeDocMeta?.single
                ? t(
                    "यस पृष्ठमा एउटा मात्र फाइल राख्न सकिन्छ। नयाँ अपलोडले पुरानोलाई प्रतिस्थापन गर्नेछ।",
                    "This page holds a single file. Uploading a new one replaces the existing file."
                  )
                : t(
                    "यस पृष्ठमा एकभन्दा बढी फाइल राख्न सकिन्छ।",
                    "This page can hold more than one file."
                  )}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="doc-ne" className={labelCls}>
                  {t("शीर्षक (नेपाली)", "Title (Nepali)")}
                </label>
                <input
                  id="doc-ne"
                  className={inputCls}
                  value={docForm.titleNe}
                  onChange={(e) => setDocForm({ ...docForm, titleNe: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="doc-en" className={labelCls}>
                  {t("शीर्षक (अङ्ग्रेजी)", "Title (English)")}
                </label>
                <input
                  id="doc-en"
                  className={inputCls}
                  value={docForm.titleEn}
                  onChange={(e) => setDocForm({ ...docForm, titleEn: e.target.value })}
                />
              </div>
            </div>

            <CloudinaryUploader
              value={docForm.fileUrl}
              onChange={(url) => setDocForm({ ...docForm, fileUrl: url })}
              folder="thorga_documents"
              accept="image/*,application/pdf"
              label={t("PDF वा तस्बिर अपलोड", "Upload PDF or image")}
              description={t("२ MB सम्मको PDF वा तस्बिर", "PDF or image up to 2MB")}
            />

            <div className="max-w-[14rem]">
              <label htmlFor="doc-pages" className={labelCls}>
                {t("पृष्ठ सङ्ख्या (वैकल्पिक)", "Page count (optional)")}
              </label>
              <input
                id="doc-pages"
                type="number"
                min={1}
                className={inputCls}
                placeholder={t("खाली छाड्न सकिन्छ", "May be left blank")}
                value={docForm.pageCount}
                onChange={(e) => setDocForm({ ...docForm, pageCount: e.target.value })}
              />
              <p className="text-[11px] text-muted mt-1">
                {t(
                  "PDF का लागि मात्र। खाली भए पाठकले पृष्ठ पल्टाउँदै जान सक्नेछन्।",
                  "PDFs only. If blank, readers can still page through the document."
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={saveDocument}
              disabled={savingDoc}
              className="px-5 py-2.5 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {savingDoc ? <span className="spinner" aria-hidden="true" /> : <FloppyDisk size={15} />}
              {t("कागजात सुरक्षित गर्नुहोस्", "Save Document")}
            </button>
          </div>

          {visibleDocs.length === 0 ? (
            <p className="text-xs text-muted p-6 text-center border border-dashed border-line rounded-card">
              {t("यस पृष्ठमा कुनै कागजात छैन।", "No document on this page yet.")}
            </p>
          ) : (
            <div className="space-y-2">
              {visibleDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-card border border-line bg-surface p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText size={18} weight="duotone" className="text-accent flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-fg truncate">
                        {lang === "ne" ? doc.titleNe : doc.titleEn}
                      </p>
                      <p className="text-[11px] text-muted font-mono uppercase">
                        {doc.fileType}
                        {doc.pageCount ? ` · ${doc.pageCount} pages` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-chip border border-line text-[11px] font-semibold text-fg hover:bg-tint transition-colors"
                    >
                      {t("हेर्नुहोस्", "View")}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeDocument(doc)}
                      aria-label={t("हटाउनुहोस्", "Remove")}
                      className="p-1.5 rounded-chip border border-line text-danger hover:bg-tint transition-colors"
                    >
                      <Trash size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
