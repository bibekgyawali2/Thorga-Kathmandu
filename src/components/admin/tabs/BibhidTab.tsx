"use client";

import React, { useState, useMemo } from "react";
import { BaseTabProps } from "../adminTypes";
import { revalidateCollection } from "../adminConstants";
import { BibhidItem, saveStoredBibhid } from "@/data/mockData";
import { PdfModalViewer } from "@/components/PdfModalViewer";
import {
  Files,
  Plus,
  Trash,
  PencilSimple,
  CircleNotch,
  Eye,
  ArrowSquareOut,
  X,
  FilePdf,
  MagnifyingGlass,
  CheckCircle,
  WarningCircle,
  ArrowsDownUp,
} from "@phosphor-icons/react";
import {
  isGoogleDriveUrl,
  getGoogleDriveViewUrl,
} from "@/lib/googleDrive";

interface BibhidTabProps extends BaseTabProps {
  bibhidList: BibhidItem[];
  setBibhidList: React.Dispatch<React.SetStateAction<BibhidItem[]>>;
  showAddModalInitial?: boolean;
}

const COMMON_CATEGORIES = [
  { ne: "सूचना", en: "Notice" },
  { ne: "निर्देशिका", en: "Guidelines" },
  { ne: "फारम तथा ढाँचा", en: "Forms" },
  { ne: "प्रतिवेदन", en: "Reports" },
  { ne: "विविध", en: "General" },
];

export function BibhidTab({
  lang,
  adminFetch,
  dialogAlert,
  dialogConfirm,
  toast,
  bibhidList,
  setBibhidList,
  showAddModalInitial = false,
}: BibhidTabProps) {
  const [editingItem, setEditingItem] = useState<BibhidItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(showAddModalInitial);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [previewPdf, setPreviewPdf] = useState<{ url: string; title: string } | null>(null);

  const [form, setForm] = useState<{
    titleEn: string;
    titleNe: string;
    driveUrl: string;
    descriptionEn: string;
    descriptionNe: string;
    categoryEn: string;
    categoryNe: string;
    displayOrder: number;
  }>({
    titleEn: "",
    titleNe: "",
    driveUrl: "",
    descriptionEn: "",
    descriptionNe: "",
    categoryEn: "General",
    categoryNe: "विविध",
    displayOrder: 0,
  });

  const resetForm = () => {
    setForm({
      titleEn: "",
      titleNe: "",
      driveUrl: "",
      descriptionEn: "",
      descriptionNe: "",
      categoryEn: "General",
      categoryNe: "विविध",
      displayOrder: 0,
    });
    setEditingItem(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: BibhidItem) => {
    setEditingItem(item);
    setForm({
      titleEn: item.titleEn || "",
      titleNe: item.titleNe || "",
      driveUrl: item.driveUrl || "",
      descriptionEn: item.descriptionEn || "",
      descriptionNe: item.descriptionNe || "",
      categoryEn: item.categoryEn || "General",
      categoryNe: item.categoryNe || "विविध",
      displayOrder: item.displayOrder ?? 0,
    });
    setShowAddModal(true);
  };

  // Derive unique categories for filter
  const categories = useMemo(() => {
    const set = new Set<string>();
    bibhidList.forEach((item) => {
      const cat = lang === "ne" ? (item.categoryNe || item.categoryEn) : (item.categoryEn || item.categoryNe);
      if (cat && cat.trim()) set.add(cat.trim());
    });
    return Array.from(set);
  }, [bibhidList, lang]);

  // Filter items
  const filteredList = useMemo(() => {
    return bibhidList.filter((item) => {
      const activeTitle = (lang === "ne" ? item.titleNe || item.titleEn : item.titleEn || item.titleNe).toLowerCase();
      const otherTitle = (lang === "ne" ? item.titleEn : item.titleNe)?.toLowerCase() || "";
      const desc = ((lang === "ne" ? item.descriptionNe : item.descriptionEn) || "").toLowerCase();
      const cat = (lang === "ne" ? item.categoryNe || item.categoryEn : item.categoryEn || item.categoryNe) || "";

      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        activeTitle.includes(q) ||
        otherTitle.includes(q) ||
        desc.includes(q) ||
        cat.toLowerCase().includes(q);

      const matchesCat =
        categoryFilter === "all" ||
        cat.toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [bibhidList, search, categoryFilter, lang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.titleNe.trim() && !form.titleEn.trim()) {
      await dialogAlert({
        title: lang === "ne" ? "शीर्षक आवश्यक छ" : "Title Required",
        description: lang === "ne" ? "कृपया कागजातको शीर्षक (नेपाली वा अंग्रेजी) प्रविष्ट गर्नुहोस्।" : "Please enter a document title.",
        type: "warning",
      });
      return;
    }

    if (!form.driveUrl.trim()) {
      await dialogAlert({
        title: lang === "ne" ? "Google Drive लिङ्क आवश्यक छ" : "Google Drive Link Required",
        description: lang === "ne" ? "कृपया मान्य Google Drive लिङ्क प्रविष्ट गर्नुहोस्।" : "Please enter a valid Google Drive link.",
        type: "warning",
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<BibhidItem> = {
        titleEn: form.titleEn.trim() || form.titleNe.trim(),
        titleNe: form.titleNe.trim() || form.titleEn.trim(),
        driveUrl: form.driveUrl.trim(),
        descriptionEn: form.descriptionEn.trim(),
        descriptionNe: form.descriptionNe.trim(),
        categoryEn: form.categoryEn.trim() || "General",
        categoryNe: form.categoryNe.trim() || "विविध",
        displayOrder: Number(form.displayOrder) || 0,
      };

      if (editingItem) {
        payload.id = editingItem.id;
      }

      const method = editingItem ? "PUT" : "POST";
      const res = await adminFetch("/api/bibhid", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save document");
      }

      const savedItem = data.data as BibhidItem;

      let updated: BibhidItem[];
      if (editingItem) {
        updated = bibhidList.map((item) => (item.id === savedItem.id ? savedItem : item));
        toast.success(
          lang === "ne" ? "कागजात सफलतापूर्वक अद्यावधिक भयो।" : "Document updated successfully."
        );
      } else {
        updated = [savedItem, ...bibhidList];
        toast.success(
          lang === "ne" ? "नयाँ कागजात सफलतापूर्वक थपियो।" : "New document added successfully."
        );
      }

      setBibhidList(updated);
      saveStoredBibhid(updated);
      revalidateCollection("bibhid");
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error("Save bibhid error:", err);
      await dialogAlert({
        title: lang === "ne" ? "त्रुटि" : "Error",
        description: err instanceof Error ? err.message : "Failed to save document",
        type: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: BibhidItem) => {
    const confirmed = await dialogConfirm({
      title: lang === "ne" ? "कागजात मेटाउने पुष्टि" : "Confirm Delete Document",
      description: (
        <div>
          <p className="font-semibold text-fg">
            {lang === "ne" ? item.titleNe || item.titleEn : item.titleEn || item.titleNe}
          </p>
          <p className="mt-1 text-xs text-muted">
            {lang === "ne"
              ? "के तपाईं यस कागजातलाई मेटाउन निश्चित हुनुहुन्छ? यो कार्य फिर्ता गर्न सकिँदैन।"
              : "Are you sure you want to permanently delete this document record?"}
          </p>
        </div>
      ),
      type: "danger",
      confirmText: lang === "ne" ? "मेटाउनुहोस्" : "Delete",
      cancelText: lang === "ne" ? "रद्द गर्नुहोस्" : "Cancel",
    });

    if (!confirmed) return;

    setDeletingId(item.id);
    try {
      const res = await adminFetch(`/api/bibhid?id=${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete");
      }

      const updated = bibhidList.filter((b) => b.id !== item.id);
      setBibhidList(updated);
      saveStoredBibhid(updated);
      revalidateCollection("bibhid");
      toast.success(
        lang === "ne" ? "कागजात सफलतापूर्वक हटाइयो।" : "Document removed successfully."
      );
    } catch (err) {
      console.error("Delete bibhid error:", err);
      await dialogAlert({
        title: lang === "ne" ? "त्रुटि" : "Error",
        description: err instanceof Error ? err.message : "Failed to delete",
        type: "danger",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const isDriveUrlValid = form.driveUrl ? isGoogleDriveUrl(form.driveUrl) : false;

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-card border border-line">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-card bg-tint text-accent flex items-center justify-center">
              <Files size={18} weight="duotone" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-fg">
              {lang === "ne" ? "विविध" : "Miscellaneous"}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-control bg-accent text-on-accent text-xs font-semibold hover:opacity-90 transition-opacity self-start sm:self-auto shadow-sm cursor-pointer"
        >
          <Plus size={16} weight="bold" />
          <span>{lang === "ne" ? "नयाँ कागजात थप्नुहोस्" : "Add Document"}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === "ne" ? "कागजात खोज्नुहोस्..." : "Search documents..."}
            className="w-full pl-9 pr-9 py-2 rounded-control border border-line bg-surface text-fg text-xs focus:outline-none focus:border-accent transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-fg p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-control text-xs font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === "all"
                  ? "bg-accent text-on-accent"
                  : "bg-surface border border-line text-muted hover:text-fg"
              }`}
            >
              {lang === "ne" ? "सबै" : "All"} ({bibhidList.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-control text-xs font-semibold whitespace-nowrap transition-colors ${
                  categoryFilter.toLowerCase() === cat.toLowerCase()
                    ? "bg-accent text-on-accent"
                    : "bg-surface border border-line text-muted hover:text-fg"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List / Table */}
      {filteredList.length === 0 ? (
        <div className="p-12 text-center rounded-card border border-dashed border-line bg-surface/50 space-y-3">
          <div className="w-12 h-12 rounded-full bg-tint text-accent mx-auto flex items-center justify-center">
            <Files size={24} weight="duotone" />
          </div>
          <h3 className="font-bold text-fg text-sm">
            {lang === "ne" ? "कुनै कागजात फेला परेन" : "No documents found"}
          </h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            {search || categoryFilter !== "all"
              ? lang === "ne"
                ? "खोजी वा फिल्टरसँग मिल्ने कुनै कागजात भेटिएन।"
                : "No documents matched your search filter."
              : lang === "ne"
              ? "हालसम्म कुनै विविध कागजात थपिएको छैन। नयाँ कागजात थप्न माथिको बटन प्रयोग गर्नुहोस्।"
              : "No miscellaneous documents have been added yet. Click 'Add Document' to create one."}
          </p>
          {!(search || categoryFilter !== "all") && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-accent text-on-accent text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus size={14} weight="bold" />
              <span>{lang === "ne" ? "कागजात थप्नुहोस्" : "Add First Document"}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-surface rounded-card border border-line overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ground/70 border-b border-line text-muted font-mono uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">{lang === "ne" ? "शीर्षक (नेपाली / अंग्रेजी)" : "Title (Ne / En)"}</th>
                  <th className="py-3 px-4">{lang === "ne" ? "वर्ग" : "Category"}</th>
                  <th className="py-3 px-4">{lang === "ne" ? "Google Drive लिङ्क" : "Drive Link"}</th>
                  <th className="py-3 px-4 w-28 text-right">{lang === "ne" ? "कार्यहरू" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-ground/40 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-muted text-xs">
                      {item.displayOrder !== undefined && item.displayOrder > 0 ? item.displayOrder : idx + 1}
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="font-bold text-fg text-sm">
                          {item.titleNe || item.titleEn}
                        </div>
                        {item.titleEn && item.titleEn !== item.titleNe && (
                          <div className="text-[11px] text-muted italic">
                            {item.titleEn}
                          </div>
                        )}
                        {(item.descriptionNe || item.descriptionEn) && (
                          <div className="text-[11px] text-muted line-clamp-1 max-w-md pt-0.5">
                            {item.descriptionNe || item.descriptionEn}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-tint text-accent">
                        <FilePdf size={12} weight="fill" />
                        <span>{item.categoryNe || item.categoryEn || "विविध"}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 max-w-xs">
                        <button
                          type="button"
                          onClick={() => setPreviewPdf({ url: item.driveUrl, title: item.titleNe || item.titleEn })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-ground border border-line text-xs font-medium text-fg hover:text-accent hover:border-accent transition-colors cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>{lang === "ne" ? "प्रिभ्यू" : "Preview"}</span>
                        </button>

                        <a
                          href={getGoogleDriveViewUrl(item.driveUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded text-muted hover:text-accent transition-colors"
                          title="Open in Drive"
                        >
                          <ArrowSquareOut size={16} />
                        </a>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-control hover:bg-tint text-muted hover:text-fg transition-colors"
                          title={lang === "ne" ? "सम्पादन गर्नुहोस्" : "Edit"}
                        >
                          <PencilSimple size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.id}
                          className="p-1.5 rounded-control hover:bg-danger/10 text-muted hover:text-danger transition-colors disabled:opacity-50"
                          title={lang === "ne" ? "मेटाउनुहोस्" : "Delete"}
                        >
                          {deletingId === item.id ? (
                            <CircleNotch size={15} className="animate-spin text-danger" />
                          ) : (
                            <Trash size={15} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-line rounded-card shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-card bg-tint text-accent flex items-center justify-center">
                  <Files size={18} weight="duotone" />
                </div>
                <div>
                  <h3 className="font-bold text-fg text-base">
                    {editingItem
                      ? lang === "ne"
                        ? "कागजात सम्पादन"
                        : "Edit Document"
                      : lang === "ne"
                      ? "कागजात थप्नुहोस्"
                      : "Add Document"}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-1.5 rounded-control text-muted hover:text-fg hover:bg-ground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Title (Nepali) */}
              <div className="space-y-1">
                <label className="font-semibold text-fg flex items-center justify-between">
                  <span>{lang === "ne" ? "कागजातको शीर्षक (नेपाली) *" : "Document Title (Nepali) *"}</span>
                  <span className="text-[10px] text-muted font-normal">{lang === "ne" ? "अनिवार्य" : "Required"}</span>
                </label>
                <input
                  type="text"
                  value={form.titleNe}
                  onChange={(e) => setForm({ ...form, titleNe: e.target.value })}
                  placeholder="उदा. सामुदायिक सञ्चालन निर्देशिका २०८१"
                  className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:outline-none focus:border-accent"
                  required
                />
              </div>

              {/* Title (English) */}
              <div className="space-y-1">
                <label className="font-semibold text-fg">
                  {lang === "ne" ? "कागजातको शीर्षक (अंग्रेजी)" : "Document Title (English)"}
                </label>
                <input
                  type="text"
                  value={form.titleEn}
                  onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                  placeholder="e.g. Community Operation Guidelines 2024"
                  className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:outline-none focus:border-accent"
                />
              </div>

              {/* Google Drive Link */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-fg">
                    {lang === "ne" ? "Google Drive PDF लिङ्क *" : "Google Drive PDF Link *"}
                  </label>
                  {form.driveUrl && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                      {isDriveUrlValid ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle size={13} weight="fill" />
                          <span>{lang === "ne" ? "मान्य Drive लिङ्क" : "Valid Drive URL"}</span>
                        </span>
                      ) : (
                        <span className="text-amber-500 flex items-center gap-0.5">
                          <WarningCircle size={13} weight="fill" />
                          <span>{lang === "ne" ? "Drive ढाँचा जाँच गर्नुहोस्" : "Check URL"}</span>
                        </span>
                      )}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.driveUrl}
                    onChange={(e) => setForm({ ...form, driveUrl: e.target.value })}
                    placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                    className="flex-1 px-3 py-2 rounded-control border border-line bg-ground text-fg font-mono text-xs focus:outline-none focus:border-accent"
                    required
                  />
                  {form.driveUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewPdf({ url: form.driveUrl, title: form.titleNe || form.titleEn || "Preview" })}
                      className="px-3 py-2 rounded-control border border-line bg-surface hover:bg-tint text-fg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Eye size={14} />
                      <span>{lang === "ne" ? "परीक्षण" : "Test"}</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-muted leading-relaxed">
                  {lang === "ne"
                    ? "💡 Google Drive मा फाइलको पहुँच (General access) लाई 'Anyone with the link can view' मा सेट गर्न नबिर्सनुहोस्।"
                    : "💡 Ensure the Google Drive file permission is set to 'Anyone with the link can view'."}
                </p>
              </div>

              {/* Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-fg">
                    {lang === "ne" ? "वर्ग (नेपाली)" : "Category (Nepali)"}
                  </label>
                  <input
                    type="text"
                    value={form.categoryNe}
                    onChange={(e) => setForm({ ...form, categoryNe: e.target.value })}
                    placeholder="उदा. सूचना, निर्देशिका, फारम"
                    className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-fg">
                    {lang === "ne" ? "वर्ग (अंग्रेजी)" : "Category (English)"}
                  </label>
                  <input
                    type="text"
                    value={form.categoryEn}
                    onChange={(e) => setForm({ ...form, categoryEn: e.target.value })}
                    placeholder="e.g. Notice, Guidelines, Forms"
                    className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Quick Category Chips */}
              <div className="space-y-1">
                <span className="text-[11px] text-muted">
                  {lang === "ne" ? "द्रुत वर्ग छनौट:" : "Quick select category:"}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_CATEGORIES.map((cat) => (
                    <button
                      key={cat.en}
                      type="button"
                      onClick={() => setForm({ ...form, categoryNe: cat.ne, categoryEn: cat.en })}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-ground border border-line text-muted hover:text-accent hover:border-accent transition-colors"
                    >
                      {cat.ne} / {cat.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description (Nepali) */}
              <div className="space-y-1">
                <label className="font-semibold text-fg">
                  {lang === "ne" ? "विवरण / सारांश (नेपाली)" : "Description / Summary (Nepali)"}
                </label>
                <textarea
                  rows={2}
                  value={form.descriptionNe}
                  onChange={(e) => setForm({ ...form, descriptionNe: e.target.value })}
                  placeholder="कागजातसम्बन्धी छोटो विवरण वा मुख्य बुँदाहरू..."
                  className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:outline-none focus:border-accent resize-none"
                />
              </div>

              {/* Description (English) */}
              <div className="space-y-1">
                <label className="font-semibold text-fg">
                  {lang === "ne" ? "विवरण / सारांश (अंग्रेजी)" : "Description / Summary (English)"}
                </label>
                <textarea
                  rows={2}
                  value={form.descriptionEn}
                  onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                  placeholder="Brief description or key highlights of the document..."
                  className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:outline-none focus:border-accent resize-none"
                />
              </div>

              {/* Display Order */}
              <div className="space-y-1 max-w-[150px]">
                <label className="font-semibold text-fg flex items-center gap-1">
                  <ArrowsDownUp size={13} />
                  <span>{lang === "ne" ? "क्रम (Display Order)" : "Display Order"}</span>
                </label>
                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg font-mono text-xs focus:outline-none focus:border-accent"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-line flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-control border border-line bg-ground hover:bg-tint text-fg font-medium transition-colors"
                >
                  {lang === "ne" ? "रद्द गर्नुहोस्" : "Cancel"}
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-control bg-accent text-on-accent font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                >
                  {isSaving && <CircleNotch size={14} className="animate-spin" />}
                  <span>
                    {isSaving
                      ? lang === "ne"
                        ? "सुरक्षित हुँदैछ..."
                        : "Saving..."
                      : editingItem
                      ? lang === "ne"
                        ? "अद्यावधिक गर्नुहोस्"
                        : "Update Document"
                      : lang === "ne"
                      ? "सुरक्षित गर्नुहोस्"
                      : "Save Document"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Modal Viewer for in-admin testing */}
      {previewPdf && (
        <PdfModalViewer
          url={previewPdf.url}
          title={previewPdf.title}
          lang={lang}
          onClose={() => setPreviewPdf(null)}
        />
      )}
    </div>
  );
}
