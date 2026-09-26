"use client";

import React, { useState } from "react";
import Image from "next/image";
import { BaseTabProps } from "../adminTypes";
import { ADMIN_I18N, revalidateCollection } from "../adminConstants";
import {
  BusinessItem,
  BUSINESS_CATEGORIES,
  saveStoredBusinesses,
} from "@/data/mockData";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import { PdfModalViewer } from "@/components/PdfModalViewer";
import {
  Storefront,
  Plus,
  Trash,
  PencilSimple,
  CircleNotch,
  Eye,
  ArrowSquareOut,
  X,
  FilePdf,
  Image as ImageIcon,
  MagnifyingGlass,
  GoogleLogo,
  Phone,
  EnvelopeSimple,
  MapPin,
  ArrowsOut,
} from "@phosphor-icons/react";
import {
  isGoogleDriveUrl,
  getGoogleDrivePreviewUrl,
  getGoogleDriveViewUrl,
  getGoogleDriveImageUrl,
  getGoogleDriveDownloadUrl,
} from "@/lib/googleDrive";
import { isValidImageSrc } from "@/lib/validation";

interface BusinessesTabProps extends BaseTabProps {
  businessesList: BusinessItem[];
  setBusinessesList: React.Dispatch<React.SetStateAction<BusinessItem[]>>;
  showAddModalInitial?: boolean;
}

export function BusinessesTab({
  lang,
  adminFetch,
  dialogAlert,
  dialogConfirm,
  businessesList,
  setBusinessesList,
  showAddModalInitial = false,
}: BusinessesTabProps) {
  const t = ADMIN_I18N[lang];
  const [editingBusiness, setEditingBusiness] = useState<BusinessItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(showAddModalInitial);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Media preview modals
  const [previewPdf, setPreviewPdf] = useState<{ url: string; title: string } | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const [form, setForm] = useState<{
    title: string;
    description: string;
    category: string;
    customCategory: string;
    fileType: "image" | "pdf";
    fileUrl: string;
    contactPhone: string;
    contactEmail: string;
    contactAddress: string;
  }>({
    title: "",
    description: "",
    category: BUSINESS_CATEGORIES[0],
    customCategory: "",
    fileType: "image",
    fileUrl: "",
    contactPhone: "",
    contactEmail: "",
    contactAddress: "",
  });

  const resetForm = () => {
    setEditingBusiness(null);
    setForm({
      title: "",
      description: "",
      category: BUSINESS_CATEGORIES[0],
      customCategory: "",
      fileType: "image",
      fileUrl: "",
      contactPhone: "",
      contactEmail: "",
      contactAddress: "",
    });
  };

  const handleStartEdit = (item: BusinessItem) => {
    setEditingBusiness(item);
    const isPredefined = (BUSINESS_CATEGORIES as readonly string[]).includes(item.category || "");
    setForm({
      title: item.title || "",
      description: item.description || "",
      category: isPredefined ? (item.category || BUSINESS_CATEGORIES[0]) : "other",
      customCategory: isPredefined ? "" : (item.category || ""),
      fileType: item.fileType || "image",
      fileUrl: item.fileUrl || "",
      contactPhone: item.contactPhone || "",
      contactEmail: item.contactEmail || "",
      contactAddress: item.contactAddress || "",
    });
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      dialogAlert({
        title: lang === "ne" ? "शीर्षक आवश्यक" : "Title Required",
        description:
          lang === "ne"
            ? "कृपया व्यवसाय वा पेशाको नाम अनिवार्य भर्नुहोस्।"
            : "Please enter a title for the business.",
        type: "warning",
      });
      return;
    }

    if (!form.fileUrl.trim()) {
      dialogAlert({
        title: lang === "ne" ? "फाइल / लिंक आवश्यक" : "File URL Required",
        description:
          lang === "ne"
            ? form.fileType === "image"
              ? "कृपया तस्बिर अपलोड गर्नुहोस् वा गुगल ड्राइभ लिंक राख्नुहोस्।"
              : "कृपया पिडिएफ अपलोड गर्नुहोस् वा गुगल ड्राइभ लिंक राख्नुहोस्।"
            : "Please upload an image/PDF or provide a Google Drive link.",
        type: "warning",
      });
      return;
    }

    const resolvedCategory =
      form.category === "other"
        ? form.customCategory.trim() || "अन्य"
        : form.category;

    setIsSaving(true);
    try {
      const payload: BusinessItem = {
        id: editingBusiness ? editingBusiness.id : `biz_${Date.now()}`,
        title: form.title.trim(),
        description: form.description.trim(),
        category: resolvedCategory,
        fileType: form.fileType,
        fileUrl: form.fileUrl.trim(),
        contactPhone: form.contactPhone.trim(),
        contactEmail: form.contactEmail.trim(),
        contactAddress: form.contactAddress.trim(),
        order: editingBusiness ? editingBusiness.order : businessesList.length,
      };

      const res = await adminFetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save business item");
      }

      const resData = await res.json();
      const savedItem = resData.data || payload;

      let updated: BusinessItem[];
      if (editingBusiness) {
        updated = businessesList.map((b) => (b.id === editingBusiness.id ? savedItem : b));
      } else {
        updated = [savedItem, ...businessesList];
      }

      setBusinessesList(updated);
      saveStoredBusinesses(updated);
      revalidateCollection("businesses");

      resetForm();
      setShowAddModal(false);

      dialogAlert({
        title: lang === "ne" ? "सफलता" : "Success",
        description:
          lang === "ne"
            ? "पेशा तथा व्यवसाय सामग्री सफलतापूर्वक सुरक्षित भयो।"
            : "Business showcase item saved successfully.",
        type: "success",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error saving";
      dialogAlert({
        title: lang === "ne" ? "त्रुटि" : "Error",
        description: message,
        type: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: BusinessItem) => {
    const confirmed = await dialogConfirm({
      title: lang === "ne" ? "हटाउने पुष्टि" : "Confirm Deletion",
      description:
        lang === "ne"
          ? `के तपाईं "${item.title}" लाई व्यवसाय सूचीबाट हटाउन निश्चित हुनुहुन्छ?`
          : `Are you sure you want to remove "${item.title}" from the directory?`,
      type: "danger",
      confirmText: lang === "ne" ? "हटाउनुहोस्" : "Delete",
      cancelText: lang === "ne" ? "रद्द गर्नुहोस्" : "Cancel",
    });

    if (!confirmed) return;

    setDeletingId(item.id);
    try {
      const res = await adminFetch(`/api/businesses?id=${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete business item");
      }

      const nextList = businessesList.filter((b) => b.id !== item.id);
      setBusinessesList(nextList);
      saveStoredBusinesses(nextList);
      revalidateCollection("businesses");

      dialogAlert({
        title: lang === "ne" ? "सफलता" : "Success",
        description:
          lang === "ne"
            ? "सामग्री सूचीबाट हटाइयो।"
            : "Item successfully removed.",
        type: "success",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error deleting";
      dialogAlert({
        title: lang === "ne" ? "त्रुटि" : "Error",
        description: message,
        type: "danger",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = businessesList.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.description && b.description.toLowerCase().includes(search.toLowerCase())) ||
      (b.category && b.category.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      categoryFilter === "all" || b.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h2 className="text-lg font-bold text-fg flex items-center gap-2">
            <Storefront size={22} className="text-accent" weight="duotone" />
            <span>{lang === "ne" ? "पेशा तथा व्यवसाय व्यवस्थापन" : "Community Business Showcase"}</span>
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {lang === "ne"
              ? "समुदायका व्यक्तिहरूको पेशा, व्यवसाय, पसल, सेवा तथा प्रतिष्ठानहरूको सूची"
              : "Showcase directory of businesses, services, and professions run by community members"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-e1 transition-colors cursor-pointer"
        >
          <Plus size={16} />
          <span>{lang === "ne" ? "नयाँ व्यवसाय थप्नुहोस्" : "Add Business"}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === "ne" ? "नाम वा वर्ग खोज्नुहोस्..." : "Search title or category..."}
            className="w-full pl-9 pr-3 py-2 rounded-control border border-line bg-surface text-fg text-xs focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-control border border-line bg-surface text-fg text-xs focus:border-accent"
          >
            <option value="all">{lang === "ne" ? "सबै वर्गहरू (All Categories)" : "All Categories"}</option>
            {BUSINESS_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <span className="text-xs font-mono text-muted whitespace-nowrap">
            {lang === "ne" ? `जम्मा: ${filtered.length}` : `Total: ${filtered.length}`}
          </span>
        </div>
      </div>

      {/* Grid of Businesses */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center space-y-3 rounded-card border border-dashed border-line bg-surface">
          <Storefront size={36} className="text-accent mx-auto" weight="duotone" />
          <div className="text-sm font-bold text-fg">
            {lang === "ne" ? "कुनै व्यवसाय भेटिएन" : "No business entries found"}
          </div>
          <p className="text-xs text-muted max-w-md mx-auto">
            {lang === "ne"
              ? "नयाँ व्यवसाय दर्ता गर्न माथिको 'नयाँ व्यवसाय थप्नुहोस्' बटन थिच्नुहोस्।"
              : "Click the 'Add Business' button above to register a new community business."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const isDrive = isGoogleDriveUrl(item.fileUrl);
            const isPdf = item.fileType === "pdf";

            return (
              <div
                key={item.id}
                className="rounded-card border border-line bg-surface overflow-hidden flex flex-col justify-between hover:border-accent transition-all shadow-e1 hover:shadow-e2 group"
              >
                {/* Visual Media Thumbnail Area */}
                <div
                  onClick={() => {
                    if (isPdf) {
                      setPreviewPdf({ url: item.fileUrl, title: item.title });
                    } else {
                      const imgUrl = isDrive ? getGoogleDriveImageUrl(item.fileUrl) : item.fileUrl;
                      setPreviewImage({ url: imgUrl, title: item.title });
                    }
                  }}
                  className="relative h-48 w-full bg-tint/60 border-b border-line overflow-hidden flex items-center justify-center p-2 cursor-pointer group/media"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (isPdf) {
                        setPreviewPdf({ url: item.fileUrl, title: item.title });
                      } else {
                        const imgUrl = isDrive ? getGoogleDriveImageUrl(item.fileUrl) : item.fileUrl;
                        setPreviewImage({ url: imgUrl, title: item.title });
                      }
                    }
                  }}
                  title={lang === "ne" ? "पूर्वावलोकन हेर्न थिच्नुहोस्" : "Click to preview"}
                >
                  {isPdf ? (
                    <div className="flex flex-col items-center justify-center space-y-2 text-center p-4">
                      <div className="w-12 h-12 rounded-control bg-danger/10 text-danger flex items-center justify-center">
                        <FilePdf size={30} weight="duotone" />
                      </div>
                      <span className="text-[11px] font-bold text-fg line-clamp-1">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-chip bg-surface border border-line text-muted">
                        PDF Document {isDrive && "• Google Drive"}
                      </span>
                    </div>
                  ) : isDrive ? (
                    /* Google Drive Image Preview */
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Image
                        src={getGoogleDriveImageUrl(item.fileUrl)}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-contain"
                        unoptimized
                      />
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-chip bg-black/75 text-white text-[10px] flex items-center gap-1 font-mono">
                        <GoogleLogo size={11} />
                        <span>Drive Image</span>
                      </div>
                    </div>
                  ) : isValidImageSrc(item.fileUrl) ? (
                    /* Cloudinary or Standard Image */
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Image
                        src={item.fileUrl}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-contain group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted">
                      <ImageIcon size={32} />
                      <span className="text-[10px] mt-1">Image</span>
                    </div>
                  )}

                  {/* Quick Expand Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isPdf) {
                        setPreviewPdf({ url: item.fileUrl, title: item.title });
                      } else {
                        const imgUrl = isDrive ? getGoogleDriveImageUrl(item.fileUrl) : item.fileUrl;
                        setPreviewImage({ url: imgUrl, title: item.title });
                      }
                    }}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-chip bg-surface/90 hover:bg-surface text-fg border border-line shadow-xs transition-colors cursor-pointer"
                    title={lang === "ne" ? "पूर्वावलोकन गर्नुहोस्" : "Quick Preview"}
                  >
                    <ArrowsOut size={14} />
                  </button>
                </div>

                {/* Details Content Area */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-fg leading-snug group-hover:text-accent transition-colors">
                        {item.title}
                      </h3>
                      {item.contactAddress && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted font-normal shrink-0">
                          <MapPin size={12} className="text-accent flex-shrink-0" />
                          <span>{item.contactAddress}</span>
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-xs leading-relaxed text-muted line-clamp-3">
                        {item.description}
                      </p>
                    )}

                    {(item.contactPhone || item.contactEmail) && (
                      <div className="pt-2 space-y-1 text-xs text-muted border-t border-line/60">
                        {item.contactPhone && (
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-fg">
                            <Phone size={13} className="text-accent flex-shrink-0" />
                            <span>{item.contactPhone}</span>
                          </div>
                        )}
                        {item.contactEmail && (
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-fg">
                            <EnvelopeSimple size={13} className="text-accent flex-shrink-0" />
                            <span>{item.contactEmail}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isPdf && (
                        <button
                          type="button"
                          onClick={() => setPreviewPdf({ url: item.fileUrl, title: item.title })}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline cursor-pointer"
                        >
                          <Eye size={14} />
                          <span>PDF हेर्नुहोस्</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 rounded-control border border-line bg-surface hover:bg-tint text-fg hover:text-accent transition-colors cursor-pointer"
                        title={lang === "ne" ? "सम्पादन" : "Edit"}
                      >
                        <PencilSimple size={15} />
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === item.id}
                        onClick={() => handleDelete(item)}
                        className="p-1.5 rounded-control border border-line bg-surface hover:bg-danger/10 text-danger transition-colors cursor-pointer disabled:opacity-50"
                        title={lang === "ne" ? "मेटाउनुहोस्" : "Delete"}
                      >
                        {deletingId === item.id ? (
                          <CircleNotch size={15} className="animate-spin" />
                        ) : (
                          <Trash size={15} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-surface rounded-card border border-line shadow-e3 overflow-hidden cursor-default my-auto animate-fade-in"
          >
            <div className="p-5 border-b border-line flex items-center justify-between bg-tint/50">
              <div className="flex items-center gap-2 font-bold text-fg text-sm sm:text-base">
                <Storefront size={20} className="text-accent" weight="duotone" />
                <span>
                  {editingBusiness
                    ? lang === "ne" ? "व्यवसाय विवरण सम्पादन" : "Edit Business Entry"
                    : lang === "ne" ? "नयाँ व्यवसाय दर्ता" : "Register New Business"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-control text-muted hover:text-fg hover:bg-tint transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-fg flex items-center justify-between">
                  <span>{lang === "ne" ? "व्यवसाय / पेशाको नाम *" : "Business or Profession Title *"}</span>
                  <span className="text-[10px] text-muted font-normal">अनिवार्य</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={lang === "ne" ? "उदा: थोर्गा अर्गानिक फलफूल तथा किराना पसल" : "e.g. Thorga Agro & Grocery Store"}
                  className="w-full px-3.5 py-2.5 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-fg">
                  {lang === "ne" ? "व्यवसायको वर्ग / क्षेत्र" : "Business Category"}
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                >
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="other">{lang === "ne" ? "अन्य (आफै लेख्नुहोस्)" : "Other (Specify Custom)"}</option>
                </select>

                {form.category === "other" && (
                  <input
                    type="text"
                    value={form.customCategory}
                    onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
                    placeholder={lang === "ne" ? "नयाँ वर्गको नाम..." : "Custom category name..."}
                    className="w-full mt-2 px-3.5 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                  />
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-fg flex items-center justify-between">
                  <span>{lang === "ne" ? "विवरण / सेवाहरू (ऐच्छिक)" : "Description & Services (Optional)"}</span>
                  <span className="text-[10px] text-muted font-normal">ऐच्छिक</span>
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={lang === "ne" ? "व्यवसायले प्रदान गर्ने सेवा वा सामानहरूको संक्षिप्त विवरण..." : "Brief description of services, goods, or establishment..."}
                  className="w-full px-3.5 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                />
              </div>

              {/* MEDIA TYPE RADIO BUTTONS (Image vs PDF) */}
              <div className="space-y-2 p-4 rounded-control border border-line bg-tint/40">
                <label className="text-xs font-bold text-fg block">
                  {lang === "ne" ? "सामग्रीको प्रकार छनोट गर्नुहोस्" : "Select Media Format:"}
                </label>
                <div className="flex items-center gap-6">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-fg cursor-pointer">
                    <input
                      type="radio"
                      name="mediaType"
                      value="image"
                      checked={form.fileType === "image"}
                      onChange={() => setForm({ ...form, fileType: "image" })}
                      className="accent-accent w-4 h-4 cursor-pointer"
                    />
                    <ImageIcon size={16} className="text-accent" />
                    <span>{lang === "ne" ? "तस्बिर (Image)" : "Image"}</span>
                  </label>

                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-fg cursor-pointer">
                    <input
                      type="radio"
                      name="mediaType"
                      value="pdf"
                      checked={form.fileType === "pdf"}
                      onChange={() => setForm({ ...form, fileType: "pdf" })}
                      className="accent-accent w-4 h-4 cursor-pointer"
                    />
                    <FilePdf size={16} className="text-danger" />
                    <span>{lang === "ne" ? "पिडिएफ दस्तावेज (PDF Document)" : "PDF Document"}</span>
                  </label>
                </div>
              </div>

              {/* File Uploader / Drive URL */}
              <div className="space-y-2">
                <CloudinaryUploader
                  label={
                    form.fileType === "image"
                      ? lang === "ne" ? "तस्बिर अपलोड वा गुगल ड्राइभ लिंक *" : "Upload Image or Drive Link *"
                      : lang === "ne" ? "PDF दस्तावेज अपलोड वा गुगल ड्राइभ लिंक *" : "Upload PDF or Drive Link *"
                  }
                  value={form.fileUrl}
                  onChange={(url) => setForm({ ...form, fileUrl: url })}
                  accept={form.fileType === "image" ? "image/*" : "application/pdf"}
                  maxSizeMb={5}
                  description={
                    lang === "ne"
                      ? "सिधै फाइल अपलोड गर्नुहोस् वा गुगल ड्राइभ शेयरिङ लिंक पेस्ट गर्नुहोस्।"
                      : "Upload directly or paste any public Google Drive sharing link."
                  }
                />
              </div>

              {/* Optional Contact Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-line">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted">
                    {lang === "ne" ? "सम्पर्क फोन नम्बर" : "Contact Phone"}
                  </label>
                  <input
                    type="text"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    placeholder="+977 98..."
                    className="w-full px-3 py-1.5 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted">
                    {lang === "ne" ? "ठेगाना / स्थान" : "Location / Address"}
                  </label>
                  <input
                    type="text"
                    value={form.contactAddress}
                    onChange={(e) => setForm({ ...form, contactAddress: e.target.value })}
                    placeholder={lang === "ne" ? "उदा: कोटेश्वर, काठमाडौं" : "e.g. Koteshwor, Kathmandu"}
                    className="w-full px-3 py-1.5 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-control border border-line bg-surface hover:bg-tint text-fg text-xs font-semibold transition-colors cursor-pointer"
                >
                  {lang === "ne" ? "रद्द गर्नुहोस्" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-e1 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isSaving && <CircleNotch size={14} className="animate-spin" />}
                  <span>
                    {editingBusiness
                      ? lang === "ne" ? "परिवर्तन सुरक्षित गर्नुहोस्" : "Update Business"
                      : lang === "ne" ? "सुरक्षित गर्नुहोस्" : "Save Business"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF VIEWER MODAL */}
      {previewPdf && (
        <PdfModalViewer
          url={previewPdf.url}
          title={previewPdf.title}
          category={lang === "ne" ? "पेशा तथा व्यवसाय" : "Business Document"}
          lang={lang}
          onClose={() => setPreviewPdf(null)}
        />
      )}

      {/* FULLSCREEN IMAGE LIGHTBOX */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between text-white p-2 border-b border-white/10"
          >
            <span className="font-bold text-sm sm:text-base text-white/90">
              {previewImage.title}
            </span>
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="p-2 rounded-chip bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>
          <div
            className="relative flex-1 w-full h-[82vh] flex items-center justify-center p-2"
            onClick={() => setPreviewImage(null)}
          >
            <Image
              src={previewImage.url}
              alt={previewImage.title}
              fill
              sizes="100vw"
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
}
