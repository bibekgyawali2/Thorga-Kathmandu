"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import { useToast } from "@/components/Toast";
import { useDialog } from "@/components/Dialog";
import {
  FloppyDisk,
  Trash,
  FileText,
  PencilSimple,
  CaretUp,
  CaretDown,
  Eye,
  ArrowSquareOut,
  Download,
  X,
} from "@phosphor-icons/react";
import type { Language, PageDocument } from "@/data/mockData";
import { documentUrl } from "@/lib/documentUrl";
import { PdfModalViewer } from "@/components/PdfModalViewer";
import {
  isGoogleDriveUrl,
  getGoogleDrivePreviewUrl,
  getGoogleDriveViewUrl,
  getGoogleDriveDownloadUrl,
} from "@/lib/googleDrive";

export interface DocumentSlugConfig {
  slug: PageDocument["slug"];
  ne: string;
  en: string;
  /** True when the page holds exactly one file and a new upload replaces it. */
  single: boolean;
}

const inputCls =
  "w-full px-3.5 py-2.5 rounded-control border border-line bg-ground text-fg text-xs placeholder:text-muted focus:border-accent";
const labelCls = "text-xs font-semibold text-fg block mb-1.5";

const emptyForm = { id: "", captionEn: "", captionNe: "", fileUrl: "", pageCount: "" };

/**
 * Shared editor for every page whose content is a single uploaded file plus a
 * caption. Used by both the About Us document pages and the Publications
 * pages, so the two stay behaviourally identical.
 */
export function DocumentSectionEditor({
  lang,
  adminFetch,
  slugs,
}: {
  lang: Language;
  adminFetch: (url: string, options?: RequestInit) => Promise<Response>;
  slugs: DocumentSlugConfig[];
}) {
  const toast = useToast();
  const { confirm: dialogConfirm } = useDialog();

  const [documents, setDocuments] = useState<PageDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [activeSlug, setActiveSlug] = useState<PageDocument["slug"]>(slugs[0].slug);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<PageDocument | null>(null);

  const t = (ne: string, en: string) => (lang === "ne" ? ne : en);
  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/documents", { cache: "no-store" });
        const data = res.ok ? await res.json() : null;
        if (cancelled) return;
        if (Array.isArray(data)) setDocuments(data);
        else setLoadError(true);
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

  const activeMeta = slugs.find((s) => s.slug === activeSlug);
  const visible = documents
    .filter((d) => d.slug === activeSlug)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const save = async () => {
    if (!form.fileUrl) {
      toast.error(
        t("फाइल आवश्यक", "File required"),
        t("PDF वा तस्बिर अपलोड गर्नुहोस्।", "Upload a PDF or an image first.")
      );
      return;
    }
    if (!form.captionEn.trim() || !form.captionNe.trim()) {
      toast.error(
        t("क्याप्सन आवश्यक", "Caption required"),
        t("दुवै भाषामा क्याप्सन लेख्नुहोस्।", "Enter the caption in both languages.")
      );
      return;
    }

    const isPdf = form.fileUrl.toLowerCase().includes(".pdf") || isGoogleDriveUrl(form.fileUrl);
    setSaving(true);
    try {
      const res = await adminFetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          slug: activeSlug,
          // The caption is stored in the title fields: these pages carry one
          // line of text, so a separate title would be a field with no job.
          titleEn: form.captionEn,
          titleNe: form.captionNe,
          fileUrl: form.fileUrl,
          fileType: isPdf ? "pdf" : "image",
          pageCount: form.pageCount ? Number(form.pageCount) : null,
          order: form.id
            ? (documents.find((d) => d.id === form.id)?.order ?? 0)
            : visible.reduce((max, d) => Math.max(max, d.order ?? 0), 0) + 1,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || "Save failed");
      reload();
      setForm(emptyForm);
      toast.success(t("सुरक्षित भयो", "Saved"));
    } catch (error) {
      toast.error(
        t("सुरक्षित गर्न सकिएन", "Could not save"),
        error instanceof Error ? error.message : undefined
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * Moves a document one place up or down.
   *
   * Existing rows all carry order 0, so a two-row swap would leave everything
   * else tied at 0 and sorting arbitrary. Instead the whole visible list is
   * renumbered 1..n from the new arrangement, and only the rows whose number
   * actually changed are written back.
   */
  const move = async (doc: PageDocument, direction: "up" | "down") => {
    const index = visible.findIndex((d) => d.id === doc.id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= visible.length) return;

    const arranged = [...visible];
    const [lifted] = arranged.splice(index, 1);
    arranged.splice(target, 0, lifted);

    const renumbered = arranged.map((d, i) => ({ ...d, order: i + 1 }));
    const changed = renumbered.filter(
      (d) => d.order !== (visible.find((v) => v.id === d.id)?.order ?? 0)
    );

    const previous = documents;
    setDocuments((list) =>
      list.map((d) => renumbered.find((r) => r.id === d.id) ?? d)
    );

    try {
      const results = await Promise.all(
        changed.map((payload) =>
          adminFetch("/api/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        )
      );
      if (results.some((r) => !r.ok)) throw new Error("Reorder failed");
    } catch {
      setDocuments(previous);
      toast.error(t("क्रम मिलाउन सकिएन", "Could not reorder"));
    }
  };

  const remove = async (doc: PageDocument) => {
    const ok = await dialogConfirm({
      title: t("हटाउने?", "Remove file?"),
      description: lang === "ne" ? `${doc.titleNe} हटाउने?` : `Remove ${doc.titleEn}?`,
      type: "danger",
    });
    if (!ok) return;

    const previous = documents;
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    try {
      const res = await adminFetch(`/api/documents?id=${encodeURIComponent(doc.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success(t("हटाइयो", "Removed"));
    } catch {
      setDocuments(previous);
      toast.error(t("हटाउन सकिएन", "Could not remove"));
    }
  };

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1].map((i) => (
          <div key={i} className="h-24 rounded-card bg-tint animate-pulse" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-card border border-line bg-surface p-8 text-center space-y-3">
        <p className="text-xs font-semibold text-danger">
          {t("कागजातहरु लोड गर्न सकिएन।", "Could not load documents.")}
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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {slugs.map((s) => (
          <button
            key={s.slug}
            type="button"
            onClick={() => {
              setActiveSlug(s.slug);
              setForm(emptyForm);
            }}
            className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors ${
              activeSlug === s.slug
                ? "bg-accent-soft text-accent"
                : "bg-surface border border-line text-fg hover:bg-tint"
            }`}
          >
            {t(s.ne, s.en)}
          </button>
        ))}
      </div>

      <div className="rounded-card border border-line bg-surface p-5 space-y-4">
        <p className="text-xs font-bold text-fg">
          {form.id
            ? t("प्रविष्टि सम्पादन", "Edit entry")
            : t("नयाँ प्रविष्टि थप्नुहोस्", "Add a new entry")}
        </p>
        <p className="text-[11px] text-muted">
          {activeMeta?.single
            ? t(
                "यस पृष्ठमा एउटा मात्र PDF वा तस्बिर राख्न सकिन्छ। नयाँ अपलोडले पुरानोलाई प्रतिस्थापन गर्नेछ।",
                "This page holds a single PDF or image. Uploading a new one replaces the existing file."
              )
            : t(
                "यस पृष्ठमा एकभन्दा बढी फाइल राख्न सकिन्छ।",
                "This page can hold more than one file."
              )}
        </p>

        <CloudinaryUploader
          value={form.fileUrl}
          onChange={(url) => setForm({ ...form, fileUrl: url })}
          folder="thorga_documents"
          accept="image/*,application/pdf"
          label={t("PDF वा तस्बिर अपलोड", "Upload PDF or image")}
          description={t("२ MB सम्मको PDF वा तस्बिर", "PDF or image up to 2MB")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="doc-cap-ne" className={labelCls}>
              {t("क्याप्सन (नेपाली)", "Caption (Nepali)")}
            </label>
            <input
              id="doc-cap-ne"
              className={inputCls}
              placeholder={t("जस्तै: वि.सं. २०८३ को क्यालेण्डर", "e.g. Calendar for 2083 BS")}
              value={form.captionNe}
              onChange={(e) => setForm({ ...form, captionNe: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="doc-cap-en" className={labelCls}>
              {t("क्याप्सन (अङ्ग्रेजी)", "Caption (English)")}
            </label>
            <input
              id="doc-cap-en"
              className={inputCls}
              placeholder="e.g. Calendar for 2083 BS"
              value={form.captionEn}
              onChange={(e) => setForm({ ...form, captionEn: e.target.value })}
            />
          </div>
        </div>

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
            value={form.pageCount}
            onChange={(e) => setForm({ ...form, pageCount: e.target.value })}
          />
          <p className="text-[11px] text-muted mt-1">
            {t(
              "PDF का लागि मात्र। खाली भए पनि पाठकले पृष्ठ पल्टाउन सक्नेछन्।",
              "PDFs only. Readers can page through the file even if this is blank."
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-5 py-2.5 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {saving ? <span className="spinner" aria-hidden="true" /> : <FloppyDisk size={15} />}
            {form.id ? t("अद्यावधिक गर्नुहोस्", "Update") : t("सुरक्षित गर्नुहोस्", "Save")}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              className="px-4 py-2.5 rounded-control border border-line text-fg text-xs font-semibold hover:bg-tint transition-colors"
            >
              {t("रद्द गर्नुहोस्", "Cancel")}
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-xs text-muted p-6 text-center border border-dashed border-line rounded-card">
          {t("यस पृष्ठमा कुनै फाइल छैन।", "No file on this page yet.")}
        </p>
      ) : (
        <div className="space-y-2">
          {visible.map((doc) => (
            <div
              key={doc.id}
              className={`rounded-card border p-3 flex items-center justify-between gap-3 transition-colors ${
                form.id === doc.id ? "border-accent bg-accent-soft" : "border-line bg-surface"
              }`}
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
                {!activeMeta?.single && visible.length > 1 && (
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => move(doc, "up")}
                      disabled={visible[0]?.id === doc.id}
                      aria-label={t("माथि सार्नुहोस्", "Move up")}
                      title={t("माथि सार्नुहोस्", "Move up")}
                      className="p-1.5 rounded-chip text-muted hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <CaretUp size={13} weight="bold" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(doc, "down")}
                      disabled={visible[visible.length - 1]?.id === doc.id}
                      aria-label={t("तल सार्नुहोस्", "Move down")}
                      title={t("तल सार्नुहोस्", "Move down")}
                      className="p-1.5 rounded-chip text-muted hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <CaretDown size={13} weight="bold" />
                    </button>
                  </div>
                )}
                {isGoogleDriveUrl(doc.fileUrl) ? (
                  <a
                    href={getGoogleDriveViewUrl(doc.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-chip border border-accent/40 bg-accent/10 hover:bg-accent text-accent hover:text-on-accent text-[11px] font-semibold transition-colors flex items-center gap-1"
                    title={t("Google Drive मा PDF खोल्नुहोस्", "Open PDF in Google Drive")}
                  >
                    <ArrowSquareOut size={13} />
                    <span>{t("PDF हेर्नुहोस्", "View PDF")}</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setViewingDoc(doc)}
                    className="px-2.5 py-1 rounded-chip border border-accent/40 bg-accent/10 hover:bg-accent text-accent hover:text-on-accent text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    title={t("PDF हेर्नुहोस्", "View PDF")}
                  >
                    <Eye size={13} />
                    <span>{t("PDF हेर्नुहोस्", "View PDF")}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      id: doc.id,
                      captionEn: doc.titleEn,
                      captionNe: doc.titleNe,
                      fileUrl: doc.fileUrl,
                      pageCount: doc.pageCount ? String(doc.pageCount) : "",
                    });
                    // Bring the form into view; the list can be long.
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="px-2.5 py-1 rounded-chip border border-line text-[11px] font-semibold text-fg hover:bg-tint transition-colors flex items-center gap-1"
                >
                  <PencilSimple size={12} />
                  {t("सम्पादन", "Edit")}
                </button>
                <button
                  type="button"
                  onClick={() => remove(doc)}
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

      {/* Interactive PDF Viewer Modal in Document Section Editor */}
      {viewingDoc && (
        <PdfModalViewer
          url={viewingDoc.fileUrl}
          title={lang === "ne" ? viewingDoc.titleNe : viewingDoc.titleEn}
          category={viewingDoc.slug}
          pages={viewingDoc.pageCount}
          lang={lang}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </div>
  );
}

/** The five single-file pages under the Publications menu. */
export const PUBLICATION_DOC_SLUGS: DocumentSlugConfig[] = [
  { slug: "calendar", ne: "क्यालेण्डर", en: "Calendar", single: true },
  { slug: "phone-directory", ne: "फोन डायरी", en: "Phone Directory", single: true },
  { slug: "bulletin", ne: "बुलेटिन", en: "Bulletin", single: true },
  { slug: "souvenir", ne: "स्मारिका", en: "Souvenir", single: true },
  { slug: "sansthan-prakashan", ne: "संस्थाका प्रकाशनहरू", en: "Sansthaka Prakashanharu", single: false },
  { slug: "thorga-sambandhi-anya-prakashan", ne: "थोर्गा सम्बन्धी अन्य प्रकाशन", en: "Thorga Sambandhi Anya Prakashan", single: false },
  { slug: "other", ne: "अन्य", en: "Other", single: true },
];

/** The document pages under About Us. */
export const ABOUT_DOC_SLUGS: DocumentSlugConfig[] = [
  { slug: "statute", ne: "संस्थाको विधान", en: "Organisation Statute", single: true },
  { slug: "life-members", ne: "आजीवन सदस्यहरू", en: "Life Members", single: true },
  { slug: "certificates", ne: "दर्ता प्रमाणपत्रहरू", en: "Registration Certificates", single: false },
];

/**
 * The two former-committee pages. Each entry is one term: a single sheet
 * listing that term's members, with the term as the caption, so a 2023 sheet
 * and a 2024 sheet sit side by side.
 */
export const FORMER_COMMITTEE_DOC_SLUGS: DocumentSlugConfig[] = [
  { slug: "former-officials", ne: "हालसम्मका पदाधिकारीहरू", en: "Former Office Bearers", single: false },
  { slug: "former-advisors", ne: "हालसम्मका सल्लाहाकारहरू", en: "Former Advisors", single: false },
];
