"use client";

import React, { useState } from "react";
import Image from "next/image";
import { BaseTabProps } from "../adminTypes";
import { ADMIN_I18N, revalidateCollection } from "../adminConstants";
import { GalleryItem, saveStoredGallery } from "@/data/mockData";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import { isValidImageSrc } from "@/lib/validation";
import {
  Image as ImageIcon,
  Plus,
  Trash,
  PencilSimple,
  CircleNotch,
} from "@phosphor-icons/react";

interface GalleryTabProps extends BaseTabProps {
  galleryList: GalleryItem[];
  setGalleryList: React.Dispatch<React.SetStateAction<GalleryItem[]>>;
  showAddModalInitial?: boolean;
}

export function GalleryTab({
  lang,
  adminFetch,
  dialogAlert,
  dialogConfirm,
  galleryList,
  setGalleryList,
  showAddModalInitial = false,
}: GalleryTabProps) {
  const t = ADMIN_I18N[lang];
  const [editingGallery, setEditingGallery] = useState<GalleryItem | null>(null);
  const [showAddGalleryModal, setShowAddGalleryModal] = useState(
    showAddModalInitial
  );
  const [isSavingGallery, setIsSavingGallery] = useState(false);
  const [deletingGalleryId, setDeletingGalleryId] = useState<string | null>(null);

  const [galleryForm, setGalleryForm] = useState({
    titleEn: "",
    titleNe: "",
    categoryEn: "Education",
    categoryNe: "शिक्षा",
    dateEn: "2081 Shrawan",
    dateNe: "२०८१ साउन",
    imageUrl: "",
  });

  const deleteCloudinaryAsset = async (url?: string) => {
    if (!url || !url.includes("cloudinary.com")) return;
    try {
      await adminFetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
    } catch (err) {
      console.error("Failed to delete Cloudinary asset:", err);
    }
  };

  const handleStartEditGallery = (g: GalleryItem) => {
    setEditingGallery(g);
    setGalleryForm({
      titleEn: g.titleEn || "",
      titleNe: g.titleNe || "",
      categoryEn: g.categoryEn || "Education",
      categoryNe: g.categoryNe || "शिक्षा",
      dateEn: g.dateEn || "",
      dateNe: g.dateNe || "",
      imageUrl: g.imageUrl || "",
    });
    setShowAddGalleryModal(true);
  };

  const handleAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryForm.titleNe.trim() || !galleryForm.titleEn.trim()) {
      dialogAlert({
        title: lang === "ne" ? "विवरण आवश्यक" : "Caption Required",
        description:
          lang === "ne"
            ? "कृपया तस्बिरको शीर्षक/क्याप्सन दुवै भाषामा भर्नुहोस्।"
            : "Please enter photo captions in both languages.",
        type: "warning",
      });
      return;
    }
    if (!galleryForm.imageUrl.trim()) {
      dialogAlert({
        title: lang === "ne" ? "तस्बिर आवश्यक" : "Image Required",
        description:
          lang === "ne"
            ? "कृपया क्लाउडिनरी मार्फत तस्बिर अपलोड गर्नुहोस्।"
            : "Please upload an image via Cloudinary uploader.",
        type: "warning",
      });
      return;
    }

    setIsSavingGallery(true);
    try {
      if (editingGallery) {
        const updatedG: GalleryItem = {
          ...editingGallery,
          ...galleryForm,
          titleNe: galleryForm.titleNe.trim(),
          titleEn: galleryForm.titleEn.trim(),
        };

        let finalG = updatedG;
        try {
          const res = await adminFetch("/api/gallery", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedG),
          });
          const data = await res.json();
          if (data && data.success && data.data) {
            finalG = data.data;
          }
        } catch (err) {
          console.error("Failed to update gallery in db:", err);
        }

        const updated = galleryList.map((g) =>
          g.id === editingGallery.id ? finalG : g
        );
        setGalleryList(updated);
        saveStoredGallery(updated);
        revalidateCollection("gallery");
        setShowAddGalleryModal(false);
        setEditingGallery(null);
        setGalleryForm({
          titleEn: "",
          titleNe: "",
          categoryEn: "Education",
          categoryNe: "शिक्षा",
          dateEn: "2081 Shrawan",
          dateNe: "२०८१ साउन",
          imageUrl: "",
        });
        dialogAlert({
          title: lang === "ne" ? "तस्बिर सम्पादन भयो" : "Photo Updated",
          description:
            lang === "ne"
              ? "तस्बिर विवरण सफलतापूर्वक अद्यावधिक गरिएको छ।"
              : "Gallery photo details updated successfully.",
          type: "success",
        });
        return;
      }

      const generatedId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `g-${Date.now()}`;

      const newG: GalleryItem = {
        id: generatedId,
        ...galleryForm,
        titleNe: galleryForm.titleNe.trim(),
        titleEn: galleryForm.titleEn.trim(),
      };

      let finalSavedG = newG;
      try {
        const res = await adminFetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newG),
        });
        const data = await res.json();
        if (data && data.success && data.data) {
          finalSavedG = data.data;
        }
      } catch (err) {
        console.error("Failed to sync gallery to db:", err);
      }

      const updated = [
        finalSavedG,
        ...galleryList.filter((g) => g.id !== finalSavedG.id),
      ];
      setGalleryList(updated);
      saveStoredGallery(updated);
      revalidateCollection("gallery");
      setShowAddGalleryModal(false);
      setGalleryForm({
        titleEn: "",
        titleNe: "",
        categoryEn: "Education",
        categoryNe: "शिक्षा",
        dateEn: "2081 Shrawan",
        dateNe: "२०८१ साउन",
        imageUrl: "",
      });
      dialogAlert({
        title: lang === "ne" ? "तस्बिर थपियो" : "Photo Added",
        description:
          lang === "ne"
            ? "तस्बिर ग्यालरीमा सफलतापूर्वक थपियो।"
            : "Photo added to gallery.",
        type: "success",
      });
    } finally {
      setIsSavingGallery(false);
    }
  };

  const handleDeleteGallery = async (id: string) => {
    const galleryToDelete = galleryList.find((g) => g.id === id);
    const confirmed = await dialogConfirm({
      title: t.removeGalleryConfirmTitle,
      description: t.removeGalleryConfirmDesc,
      type: "danger",
      confirmText: t.deleteBtn,
      cancelText: t.cancelBtn,
    });
    if (confirmed) {
      setDeletingGalleryId(id);
      try {
        if (galleryToDelete?.imageUrl) {
          deleteCloudinaryAsset(galleryToDelete.imageUrl);
        }

        const res = await adminFetch(
          `/api/gallery?id=${encodeURIComponent(id)}`,
          {
            method: "DELETE",
          }
        );
        const data = await res.json();
        if (!res.ok) {
          dialogAlert({
            title: lang === "ne" ? "हटाउन सकिएन" : "Delete Failed",
            description:
              data?.error ||
              (lang === "ne"
                ? "सर्भरबाट तस्बिर हटाउन सकिएन।"
                : "Failed to remove photo from server."),
            type: "danger",
          });
          return;
        }

        const updated = galleryList.filter((g) => g.id !== id);
        setGalleryList(updated);
        saveStoredGallery(updated);
        revalidateCollection("gallery");
        dialogAlert({
          title: lang === "ne" ? "तस्बिर हटाइयो" : "Photo Removed",
          description:
            lang === "ne"
              ? "तस्बिर सफलतापूर्वक हटाइएको छ।"
              : "Photo removed successfully.",
          type: "success",
        });
      } catch (err) {
        if (err instanceof Error && err.message === "Session expired") return;
        console.error("Failed to delete gallery from db:", err);
      } finally {
        setDeletingGalleryId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-fg">{t.gallery}</h2>
          <p className="text-xs text-muted">
            {lang === "ne"
              ? "सामाजिक अभियान, कार्यक्रम तथा बैठकका तस्बिरहरू"
              : "Community activities, education drives, and meetings."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (showAddGalleryModal) {
              setShowAddGalleryModal(false);
              setEditingGallery(null);
            } else {
              setEditingGallery(null);
              setGalleryForm({
                titleEn: "",
                titleNe: "",
                categoryEn: "Education",
                categoryNe: "शिक्षा",
                dateEn: "2081 Shrawan",
                dateNe: "२०८१ साउन",
                imageUrl: "",
              });
              setShowAddGalleryModal(true);
            }
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus size={14} />
          <span>{showAddGalleryModal ? t.closeBtn : t.addGallery}</span>
        </button>
      </div>

      {showAddGalleryModal && (
        <form
          onSubmit={handleAddGallery}
          className="p-6 rounded-card border border-accent/40 bg-surface space-y-4 shadow-e1"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-accent">
              {editingGallery ? t.editGallery : t.addGallery}
            </div>
            {editingGallery && (
              <button
                type="button"
                onClick={() => {
                  setEditingGallery(null);
                  setShowAddGalleryModal(false);
                }}
                className="text-xs text-muted hover:text-fg cursor-pointer"
              >
                {t.cancelBtn}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                Caption (English) *
              </label>
              <input
                required
                type="text"
                value={galleryForm.titleEn}
                onChange={(e) =>
                  setGalleryForm({ ...galleryForm, titleEn: e.target.value })
                }
                placeholder="Scholarship Handover"
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                विवरण (नेपाली) *
              </label>
              <input
                required
                type="text"
                value={galleryForm.titleNe}
                onChange={(e) =>
                  setGalleryForm({ ...galleryForm, titleNe: e.target.value })
                }
                placeholder="छात्रवृत्ति वितरण"
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-fg">Category</label>
            <select
              value={galleryForm.categoryEn}
              onChange={(e) =>
                setGalleryForm({
                  ...galleryForm,
                  categoryEn: e.target.value,
                })
              }
              className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
            >
              <option value="Education">Education</option>
              <option value="Culture">Culture</option>
              <option value="Development">Development</option>
            </select>
          </div>

          <CloudinaryUploader
            label="Gallery Photo (Max 2MB)"
            description="Community activity image"
            folder="gallery"
            accept="image/*"
            value={galleryForm.imageUrl}
            onChange={(url) =>
              setGalleryForm({ ...galleryForm, imageUrl: url })
            }
          />

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isSavingGallery}
              className="px-5 py-2 rounded-control btn-fill bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              {isSavingGallery && (
                <CircleNotch size={14} className="animate-spin" />
              )}
              <span>
                {isSavingGallery
                  ? lang === "ne"
                    ? "अपलोड गर्दै..."
                    : "Saving..."
                  : editingGallery
                  ? lang === "ne"
                    ? "परिवर्तन सुरक्षित गर्नुहोस्"
                    : "Save Changes"
                  : t.saveChanges}
              </span>
            </button>
            {editingGallery && (
              <button
                type="button"
                onClick={() => {
                  setEditingGallery(null);
                  setShowAddGalleryModal(false);
                }}
                className="px-4 py-2 rounded-control border border-line text-xs font-medium text-muted hover:text-fg cursor-pointer"
              >
                {t.cancelBtn}
              </button>
            )}
          </div>
        </form>
      )}

      <div className="p-4 rounded-card border border-line bg-surface space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {galleryList.map((g) => (
            <div
              key={g.id}
              className="rounded-control overflow-hidden border border-line bg-ground"
            >
              <div className="relative h-36 w-full bg-tint flex items-center justify-center">
                {isValidImageSrc(g.imageUrl) ? (
                  <Image
                    src={g.imageUrl}
                    alt={g.titleEn}
                    fill
                    sizes="300px"
                    className="object-cover"
                  />
                ) : (
                  <ImageIcon
                    size={28}
                    className="text-muted"
                    weight="duotone"
                  />
                )}
              </div>
              <div className="p-3 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-bold text-fg truncate">
                    {lang === "ne" ? g.titleNe : g.titleEn}
                  </div>
                  <div className="text-[10px] text-muted font-mono">
                    {g.categoryEn}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartEditGallery(g)}
                    className="p-1 text-accent hover:bg-accent/10 rounded-control transition-colors cursor-pointer"
                    title={t.editBtn}
                  >
                    <PencilSimple size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={deletingGalleryId === g.id}
                    onClick={() => handleDeleteGallery(g.id)}
                    className="p-1 text-danger hover:bg-danger/10 disabled:opacity-60 rounded-control transition-colors cursor-pointer"
                    title={t.deleteBtn}
                  >
                    {deletingGalleryId === g.id ? (
                      <CircleNotch size={14} className="animate-spin" />
                    ) : (
                      <Trash size={14} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
