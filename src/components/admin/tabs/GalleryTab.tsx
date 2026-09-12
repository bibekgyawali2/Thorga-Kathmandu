"use client";

import React, { useState } from "react";
import Image from "next/image";
import { BaseTabProps } from "../adminTypes";
import { ADMIN_I18N, revalidateCollection } from "../adminConstants";
import {
  GalleryItem,
  GalleryAlbum,
  GalleryAlbumImage,
  saveStoredGallery,
  saveStoredGalleryAlbums,
} from "@/data/mockData";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import { isValidImageSrc } from "@/lib/validation";
import {
  Image as ImageIcon,
  Images as ImagesIcon,
  Plus,
  Trash,
  PencilSimple,
  CircleNotch,
  ArrowUp,
  ArrowDown,
  Star,
  CheckCircle,
  X,
} from "@phosphor-icons/react";

interface GalleryTabProps extends BaseTabProps {
  galleryList: GalleryItem[];
  setGalleryList: React.Dispatch<React.SetStateAction<GalleryItem[]>>;
  albumsList?: GalleryAlbum[];
  setAlbumsList?: React.Dispatch<React.SetStateAction<GalleryAlbum[]>>;
  showAddModalInitial?: boolean;
}

export function GalleryTab({
  lang,
  adminFetch,
  dialogAlert,
  dialogConfirm,
  galleryList,
  setGalleryList,
  albumsList = [],
  setAlbumsList,
  showAddModalInitial = false,
}: GalleryTabProps) {
  const t = ADMIN_I18N[lang];
  const [activeSubTab, setActiveSubTab] = useState<"albums" | "photos">("photos");

  // Single Photo States
  const [editingGallery, setEditingGallery] = useState<GalleryItem | null>(null);
  const [showAddGalleryModal, setShowAddGalleryModal] = useState(showAddModalInitial);
  const [isSavingGallery, setIsSavingGallery] = useState(false);
  const [deletingGalleryId, setDeletingGalleryId] = useState<string | null>(null);

  const [galleryForm, setGalleryForm] = useState({
    titleEn: "",
    titleNe: "",
    categoryEn: "",
    categoryNe: "",
    dateEn: "",
    dateNe: "",
    imageUrl: "",
  });

  // Album States
  const [editingAlbum, setEditingAlbum] = useState<GalleryAlbum | null>(null);
  const [showAddAlbumModal, setShowAddAlbumModal] = useState(false);
  const [isSavingAlbum, setIsSavingAlbum] = useState(false);
  const [deletingAlbumId, setDeletingAlbumId] = useState<string | null>(null);

  const [albumForm, setAlbumForm] = useState<{
    titleEn: string;
    titleNe: string;
    descriptionEn: string;
    descriptionNe: string;
    dateEn: string;
    dateNe: string;
    coverImageUrl: string;
    images: GalleryAlbumImage[];
  }>({
    titleEn: "",
    titleNe: "",
    descriptionEn: "",
    descriptionNe: "",
    dateEn: "",
    dateNe: "",
    coverImageUrl: "",
    images: [],
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

  // -------------------------------------------------------------------------
  // Single Photos Handlers
  // -------------------------------------------------------------------------
  const handleStartEditGallery = (g: GalleryItem) => {
    setEditingGallery(g);
    setGalleryForm({
      titleEn: g.titleEn || "",
      titleNe: g.titleNe || "",
      categoryEn: g.categoryEn || "",
      categoryNe: g.categoryNe || "",
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
          categoryEn: "",
          categoryNe: "",
          dateEn: "",
          dateNe: "",
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
        categoryEn: "",
        categoryNe: "",
        dateEn: "",
        dateNe: "",
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

  // -------------------------------------------------------------------------
  // Albums Handlers
  // -------------------------------------------------------------------------
  const handleStartCreateAlbum = () => {
    setEditingAlbum(null);
    setAlbumForm({
      titleEn: "",
      titleNe: "",
      descriptionEn: "",
      descriptionNe: "",
      dateEn: "",
      dateNe: "",
      coverImageUrl: "",
      images: [],
    });
    setShowAddAlbumModal(true);
  };

  const handleStartEditAlbum = (album: GalleryAlbum) => {
    setEditingAlbum(album);
    setAlbumForm({
      titleEn: album.titleEn || "",
      titleNe: album.titleNe || "",
      descriptionEn: album.descriptionEn || "",
      descriptionNe: album.descriptionNe || "",
      dateEn: album.dateEn || "",
      dateNe: album.dateNe || "",
      coverImageUrl: album.coverImageUrl || "",
      images: album.images || [],
    });
    setShowAddAlbumModal(true);
  };

  const handleMoveImage = (index: number, direction: "up" | "down") => {
    const newImages = [...albumForm.images];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    setAlbumForm({ ...albumForm, images: newImages });
  };

  const handleRemoveImageFromAlbum = (id: string) => {
    const newImages = albumForm.images.filter((img) => img.id !== id);
    let newCover = albumForm.coverImageUrl;
    if (albumForm.images.find((img) => img.id === id)?.imageUrl === albumForm.coverImageUrl) {
      newCover = newImages[0]?.imageUrl || "";
    }
    setAlbumForm({ ...albumForm, images: newImages, coverImageUrl: newCover });
  };

  const handleUpdateImageCaption = (id: string, field: "captionNe" | "captionEn", value: string) => {
    setAlbumForm({
      ...albumForm,
      images: albumForm.images.map((img) =>
        img.id === id ? { ...img, [field]: value } : img
      ),
    });
  };

  const handleSaveAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumForm.titleNe.trim() || !albumForm.titleEn.trim()) {
      dialogAlert({
        title: lang === "ne" ? "एल्बम शीर्षक आवश्यक" : "Album Title Required",
        description:
          lang === "ne"
            ? "कृपया एल्बमको शीर्षक दुवै भाषामा प्रविष्ट गर्नुहोस्।"
            : "Please enter the album title in both Nepali and English.",
        type: "warning",
      });
      return;
    }

    if (albumForm.images.length === 0) {
      dialogAlert({
        title: lang === "ne" ? "तस्बिरहरू आवश्यक" : "Images Required",
        description:
          lang === "ne"
            ? "कृपया यस एल्बममा कम्तीमा एउटा तस्बिर थप्नुहोस्।"
            : "Please add at least one photo to this album.",
        type: "warning",
      });
      return;
    }

    setIsSavingAlbum(true);
    try {
      const generatedId =
        editingAlbum?.id ||
        (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `album-${Date.now()}`);

      const coverImg =
        albumForm.coverImageUrl || albumForm.images[0]?.imageUrl || "";

      const payload: GalleryAlbum = {
        id: generatedId,
        titleNe: albumForm.titleNe.trim(),
        titleEn: albumForm.titleEn.trim(),
        descriptionNe: albumForm.descriptionNe.trim(),
        descriptionEn: albumForm.descriptionEn.trim(),
        dateNe: albumForm.dateNe.trim(),
        dateEn: albumForm.dateEn.trim(),
        coverImageUrl: coverImg,
        images: albumForm.images,
      };

      let finalSavedAlbum = payload;
      try {
        const res = await adminFetch("/api/gallery/albums", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data && data.success && data.data) {
          finalSavedAlbum = data.data;
        }
      } catch (err) {
        console.error("Failed to save album to server:", err);
      }

      const updated = editingAlbum
        ? albumsList.map((a) => (a.id === editingAlbum.id ? finalSavedAlbum : a))
        : [finalSavedAlbum, ...albumsList.filter((a) => a.id !== finalSavedAlbum.id)];

      if (setAlbumsList) {
        setAlbumsList(updated);
      }
      saveStoredGalleryAlbums(updated);
      revalidateCollection("gallery");

      setShowAddAlbumModal(false);
      setEditingAlbum(null);
      setAlbumForm({
        titleEn: "",
        titleNe: "",
        descriptionEn: "",
        descriptionNe: "",
        dateEn: "",
        dateNe: "",
        coverImageUrl: "",
        images: [],
      });

      dialogAlert({
        title:
          lang === "ne"
            ? editingAlbum
              ? "एल्बम अद्यावधिक भयो"
              : "एल्बम सिर्जना भयो"
            : editingAlbum
            ? "Album Updated"
            : "Album Created",
        description:
          lang === "ne"
            ? "फोटो एल्बम सफलतापूर्वक सुरक्षित गरिएको छ।"
            : "Photo album saved successfully.",
        type: "success",
      });
    } finally {
      setIsSavingAlbum(false);
    }
  };

  const handleDeleteAlbum = async (id: string) => {
    const albumToDelete = albumsList.find((a) => a.id === id);
    const confirmed = await dialogConfirm({
      title: lang === "ne" ? "एल्बम मेटाउने पुष्टि" : "Delete Album Confirmation",
      description:
        lang === "ne"
          ? `के तपाईं "${albumToDelete?.titleNe || "यो एल्बम"}" लाई मेटाउन निश्चित हुनुहुन्छ? यस एल्बमका सबै तस्बिरहरू हट्नेछन्।`
          : `Are you sure you want to delete "${albumToDelete?.titleEn || "this album"}"? All photos in this album will be removed.`,
      type: "danger",
      confirmText: t.deleteBtn,
      cancelText: t.cancelBtn,
    });

    if (confirmed) {
      setDeletingAlbumId(id);
      try {
        const res = await adminFetch(
          `/api/gallery/albums?id=${encodeURIComponent(id)}`,
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
                ? "सर्भरबाट एल्बम हटाउन सकिएन।"
                : "Failed to delete album from server."),
            type: "danger",
          });
          return;
        }

        const updated = albumsList.filter((a) => a.id !== id);
        if (setAlbumsList) {
          setAlbumsList(updated);
        }
        saveStoredGalleryAlbums(updated);
        revalidateCollection("gallery");
        dialogAlert({
          title: lang === "ne" ? "एल्बम हटाइयो" : "Album Removed",
          description:
            lang === "ne"
              ? "एल्बम सफलतापूर्वक हटाइएको छ।"
              : "Album removed successfully.",
          type: "success",
        });
      } catch (err) {
        if (err instanceof Error && err.message === "Session expired") return;
        console.error("Failed to delete album:", err);
      } finally {
        setDeletingAlbumId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h2 className="text-base font-bold text-fg">{t.gallery}</h2>
          <p className="text-xs text-muted">
            {lang === "ne"
              ? "सामाजिक अभियान, कार्यक्रम तथा बैठकका तस्बिर तथा एल्बमहरू व्यवस्थापन गर्नुहोस्।"
              : "Manage community activities, photo albums, and single gallery images."}
          </p>
        </div>

        {/* Subtab Switcher */}
        <div className="inline-flex rounded-control border border-line bg-surface p-1">
          <button
            type="button"
            onClick={() => setActiveSubTab("photos")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-chip text-xs font-semibold transition-colors cursor-pointer ${
              activeSubTab === "photos"
                ? "bg-accent text-on-accent shadow-e1"
                : "text-muted hover:text-fg hover:bg-tint"
            }`}
          >
            <ImageIcon size={14} weight={activeSubTab === "photos" ? "fill" : "regular"} />
            <span>{lang === "ne" ? "एकल तस्बिरहरू" : "Single Photos"}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
              {galleryList.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("albums")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-chip text-xs font-semibold transition-colors cursor-pointer ${
              activeSubTab === "albums"
                ? "bg-accent text-on-accent shadow-e1"
                : "text-muted hover:text-fg hover:bg-tint"
            }`}
          >
            <ImagesIcon size={14} weight={activeSubTab === "albums" ? "fill" : "regular"} />
            <span>{lang === "ne" ? "तस्बिर एल्बमहरू" : "Photo Albums"}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
              {albumsList.length}
            </span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* SECTION: PHOTO ALBUMS MANAGEMENT */}
      {/* ================================================================= */}
      {activeSubTab === "albums" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-muted">
              {lang === "ne"
                ? "एल्बमभित्र शीर्षक र प्रत्येक तस्बिरमा नेपाली र अङ्ग्रेजी क्याप्सन राख्न सकिन्छ।"
                : "Create photo albums with titles and individual captions per photo."}
            </div>
            <button
              type="button"
              onClick={() => {
                if (showAddAlbumModal) {
                  setShowAddAlbumModal(false);
                  setEditingAlbum(null);
                } else {
                  handleStartCreateAlbum();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors cursor-pointer shadow-e1"
            >
              {showAddAlbumModal ? <X size={14} /> : <Plus size={14} />}
              <span>
                {showAddAlbumModal
                  ? t.closeBtn
                  : lang === "ne"
                  ? "नयाँ एल्बम बनाउनुहोस्"
                  : "Create New Album"}
              </span>
            </button>
          </div>

          {/* Add / Edit Album Form */}
          {showAddAlbumModal && (
            <form
              onSubmit={handleSaveAlbum}
              className="p-6 rounded-card border-2 border-accent/60 bg-surface space-y-6 shadow-e2"
            >
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                  <div className="text-sm font-bold text-accent">
                    {editingAlbum
                      ? lang === "ne"
                        ? "एल्बम सम्पादन गर्नुहोस्"
                        : "Edit Album"
                      : lang === "ne"
                      ? "नयाँ फोटो एल्बम सिर्जना"
                      : "Create New Album"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAlbum(null);
                    setShowAddAlbumModal(false);
                  }}
                  className="text-xs text-muted hover:text-fg p-1.5 rounded-control hover:bg-tint transition-colors cursor-pointer flex items-center gap-1"
                >
                  <X size={14} />
                  <span>{t.closeBtn}</span>
                </button>
              </div>

              {/* Album Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">
                    {lang === "ne" ? "एल्बम शीर्षक (नेपाली) *" : "Album Title (Nepali) *"}
                  </label>
                  <input
                    required
                    type="text"
                    value={albumForm.titleNe}
                    onChange={(e) =>
                      setAlbumForm({ ...albumForm, titleNe: e.target.value })
                    }
                    placeholder="उदा: २४औँ साधारण सभा तथा सांस्कृतिक कार्यक्रम"
                    className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">
                    {lang === "ne" ? "Album Title (English) *" : "Album Title (English) *"}
                  </label>
                  <input
                    required
                    type="text"
                    value={albumForm.titleEn}
                    onChange={(e) =>
                      setAlbumForm({ ...albumForm, titleEn: e.target.value })
                    }
                    placeholder="e.g. 24th General Assembly & Cultural Event"
                    className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">
                    {lang === "ne" ? "मिति (वि.सं.)" : "Date (BS)"}
                  </label>
                  <input
                    type="text"
                    value={albumForm.dateNe}
                    onChange={(e) =>
                      setAlbumForm({ ...albumForm, dateNe: e.target.value })
                    }
                    placeholder="२०८१ असोज १२"
                    className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">
                    {lang === "ne" ? "मिति (ई.सं.)" : "Date (AD)"}
                  </label>
                  <input
                    type="text"
                    value={albumForm.dateEn}
                    onChange={(e) =>
                      setAlbumForm({ ...albumForm, dateEn: e.target.value })
                    }
                    placeholder="September 2024"
                    className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent font-mono"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">
                    {lang === "ne" ? "एल्बम विवरण (नेपाली)" : "Album Description (Nepali)"}
                  </label>
                  <textarea
                    rows={2}
                    value={albumForm.descriptionNe}
                    onChange={(e) =>
                      setAlbumForm({ ...albumForm, descriptionNe: e.target.value })
                    }
                    placeholder="कार्यक्रम वा गतिविधिका मुख्य क्षणहरूको संक्षिप्त विवरण..."
                    className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">
                    {lang === "ne" ? "Album Description (English)" : "Album Description (English)"}
                  </label>
                  <textarea
                    rows={2}
                    value={albumForm.descriptionEn}
                    onChange={(e) =>
                      setAlbumForm({ ...albumForm, descriptionEn: e.target.value })
                    }
                    placeholder="Brief description of the event, venue, and highlights..."
                    className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                  />
                </div>
              </div>

              {/* Photos Management Section */}
              <div className="pt-2 border-t border-line space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-fg flex items-center gap-1.5">
                      <ImageIcon size={15} className="text-accent" />
                      <span>
                        {lang === "ne"
                          ? `एल्बमका तस्बिरहरू (${albumForm.images.length})`
                          : `Album Photos (${albumForm.images.length})`}
                      </span>
                    </h3>
                    <p className="text-[11px] text-muted">
                      {lang === "ne"
                        ? "तस्बिर अपलोड गर्नुहोस् र प्रत्येक तस्बिरको क्याप्सन लेख्नुहोस्।"
                        : "Upload photos and provide individual bilingual captions."}
                    </p>
                  </div>
                </div>

                <CloudinaryUploader
                  label={
                    lang === "ne"
                      ? "एल्बममा तस्बिर थप्नुहोस् (अधिकतम २MB)"
                      : "Add Photo to Album (Max 2MB)"
                  }
                  description={
                    lang === "ne"
                      ? "क्लाउडिनरीमा तस्बिर अपलोड गरी एल्बममा थपिनेछ"
                      : "Image will be uploaded to Cloudinary and appended to this album"
                  }
                  folder="gallery/albums"
                  accept="image/*"
                  onChange={(url) => {
                    if (url) {
                      const newId =
                        typeof crypto !== "undefined" &&
                        typeof crypto.randomUUID === "function"
                          ? crypto.randomUUID()
                          : `img-${Date.now()}-${Math.random()}`;

                      const newImg: GalleryAlbumImage = {
                        id: newId,
                        imageUrl: url,
                        captionNe: "",
                        captionEn: "",
                      };

                      setAlbumForm((prev) => ({
                        ...prev,
                        images: [...prev.images, newImg],
                        coverImageUrl: prev.coverImageUrl || url,
                      }));
                    }
                  }}
                />

                {/* List of Photos in Album */}
                {albumForm.images.length === 0 ? (
                  <div className="p-8 text-center rounded-control border border-dashed border-line bg-ground text-muted text-xs">
                    {lang === "ne"
                      ? "हाल यस एल्बममा कुनै तस्बिर थपिएको छैन। माथिको बटनबाट तस्बिर अपलोड गर्नुहोस्।"
                      : "No photos in this album yet. Upload a photo above to start building the album."}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {albumForm.images.map((img, idx) => {
                      const isCover =
                        albumForm.coverImageUrl === img.imageUrl ||
                        (!albumForm.coverImageUrl && idx === 0);

                      return (
                        <div
                          key={img.id}
                          className={`p-3.5 rounded-control border transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-ground ${
                            isCover
                              ? "border-accent ring-1 ring-accent/30"
                              : "border-line"
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="relative w-24 h-20 rounded-control overflow-hidden border border-line bg-tint flex-shrink-0 flex items-center justify-center">
                            {isValidImageSrc(img.imageUrl) ? (
                              <Image
                                src={img.imageUrl}
                                alt={`Album photo ${idx + 1}`}
                                fill
                                sizes="96px"
                                className="object-cover"
                              />
                            ) : (
                              <ImageIcon size={24} className="text-muted" />
                            )}
                            {isCover && (
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-chip bg-accent text-[9px] font-bold text-on-accent flex items-center gap-0.5 shadow-e1">
                                <Star size={10} weight="fill" />
                                <span>{lang === "ne" ? "कभर" : "Cover"}</span>
                              </div>
                            )}
                          </div>

                          {/* Captions Inputs */}
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                            <div>
                              <label className="text-[10px] font-semibold text-muted block mb-1">
                                {lang === "ne"
                                  ? `तस्बिर ${idx + 1} क्याप्सन (नेपाली)`
                                  : `Photo ${idx + 1} Caption (Nepali)`}
                              </label>
                              <input
                                type="text"
                                value={img.captionNe}
                                onChange={(e) =>
                                  handleUpdateImageCaption(
                                    img.id,
                                    "captionNe",
                                    e.target.value
                                  )
                                }
                                placeholder="तस्बिरको वर्णन वा परिचय..."
                                className="w-full px-2.5 py-1.5 rounded-control border border-line bg-surface text-fg text-xs focus:border-accent"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-muted block mb-1">
                                {lang === "ne"
                                  ? `Photo ${idx + 1} Caption (English)`
                                  : `Photo ${idx + 1} Caption (English)`}
                              </label>
                              <input
                                type="text"
                                value={img.captionEn}
                                onChange={(e) =>
                                  handleUpdateImageCaption(
                                    img.id,
                                    "captionEn",
                                    e.target.value
                                  )
                                }
                                placeholder="Photo description or title..."
                                className="w-full px-2.5 py-1.5 rounded-control border border-line bg-surface text-fg text-xs focus:border-accent"
                              />
                            </div>
                          </div>

                          {/* Image Actions */}
                          <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                            {!isCover ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setAlbumForm({
                                    ...albumForm,
                                    coverImageUrl: img.imageUrl,
                                  })
                                }
                                className="p-1.5 text-xs text-muted hover:text-accent border border-line rounded-control hover:bg-tint transition-colors cursor-pointer"
                                title={
                                  lang === "ne"
                                    ? "यस तस्बिरलाई कभर बनाउनुहोस्"
                                    : "Set as album cover"
                                }
                              >
                                <Star size={14} />
                              </button>
                            ) : (
                              <span className="p-1.5 text-accent">
                                <CheckCircle size={16} weight="fill" />
                              </span>
                            )}

                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveImage(idx, "up")}
                              className="p-1.5 text-muted hover:text-fg disabled:opacity-30 border border-line rounded-control hover:bg-tint transition-colors cursor-pointer"
                              title={lang === "ne" ? "अगाडि सार्नुहोस्" : "Move up"}
                            >
                              <ArrowUp size={14} />
                            </button>

                            <button
                              type="button"
                              disabled={idx === albumForm.images.length - 1}
                              onClick={() => handleMoveImage(idx, "down")}
                              className="p-1.5 text-muted hover:text-fg disabled:opacity-30 border border-line rounded-control hover:bg-tint transition-colors cursor-pointer"
                              title={lang === "ne" ? "पछाडि सार्नुहोस्" : "Move down"}
                            >
                              <ArrowDown size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveImageFromAlbum(img.id)}
                              className="p-1.5 text-danger hover:bg-danger/10 border border-danger/30 rounded-control transition-colors cursor-pointer"
                              title={lang === "ne" ? "हटाउनुहोस्" : "Remove"}
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-line">
                <button
                  type="submit"
                  disabled={isSavingAlbum}
                  className="px-6 py-2.5 rounded-control btn-fill bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-e1"
                >
                  {isSavingAlbum && (
                    <CircleNotch size={14} className="animate-spin" />
                  )}
                  <span>
                    {isSavingAlbum
                      ? lang === "ne"
                        ? "सुरक्षित गर्दै..."
                        : "Saving Album..."
                      : editingAlbum
                      ? lang === "ne"
                        ? "एल्बम परिवर्तन सुरक्षित गर्नुहोस्"
                        : "Save Album Changes"
                      : lang === "ne"
                      ? "एल्बम दर्ता गर्नुहोस्"
                      : "Save Album"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAlbum(null);
                    setShowAddAlbumModal(false);
                  }}
                  className="px-4 py-2.5 rounded-control border border-line text-xs font-medium text-muted hover:text-fg cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
              </div>
            </form>
          )}

          {/* Albums List Grid */}
          {albumsList.length === 0 ? (
            <div className="p-16 text-center space-y-3 rounded-card border border-dashed border-line bg-surface">
              <ImagesIcon size={40} className="text-accent mx-auto" weight="duotone" />
              <div className="text-base font-bold text-fg">
                {lang === "ne" ? "कुनै एल्बम सिर्जना गरिएको छैन" : "No albums created yet"}
              </div>
              <p className="text-xs text-muted max-w-sm mx-auto">
                {lang === "ne"
                  ? "माथिको बटन क्लिक गरी कार्यक्रम, भेला वा सामाजिक गतिविधिका तस्बिरहरूलाई एल्बम बनाएर सुरक्षित गर्नुहोस्।"
                  : "Click the button above to organize photos of assemblies, health camps, or cultural events into albums."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {albumsList.map((album) => {
                const cover =
                  album.coverImageUrl ||
                  album.images[0]?.imageUrl ||
                  "";
                const count = album.images?.length || 0;

                return (
                  <div
                    key={album.id}
                    className="rounded-card border border-line bg-surface overflow-hidden hover:border-accent transition-all shadow-e1 group flex flex-col justify-between"
                  >
                    <div>
                      {/* Album Cover Frame */}
                      <div className="relative h-44 w-full bg-tint flex items-center justify-center overflow-hidden">
                        {isValidImageSrc(cover) ? (
                          <Image
                            src={cover}
                            alt={album.titleEn}
                            fill
                            sizes="350px"
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <ImagesIcon size={36} className="text-muted" weight="duotone" />
                        )}

                        {/* Count Badge */}
                        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-chip bg-surface/90 text-accent font-bold text-[10px] shadow-e1 flex items-center gap-1 backdrop-blur-sm">
                          <ImageIcon size={12} weight="fill" />
                          <span>
                            {lang === "ne" ? `${count} तस्बिरहरू` : `${count} Photos`}
                          </span>
                        </div>

                        {Boolean(album.dateNe || album.dateEn) && (
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-chip bg-black/70 text-white font-mono text-[10px] backdrop-blur-sm">
                            {lang === "ne" ? album.dateNe : album.dateEn}
                          </div>
                        )}
                      </div>

                      {/* Album Details */}
                      <div className="p-4 space-y-1.5">
                        <h3 className="text-sm font-bold text-fg leading-snug group-hover:text-accent transition-colors truncate">
                          {lang === "ne" ? album.titleNe : album.titleEn}
                        </h3>
                        <div className="text-xs text-muted truncate">
                          {lang === "ne" ? album.titleEn : album.titleNe}
                        </div>
                        {(album.descriptionNe || album.descriptionEn) && (
                          <p className="text-xs text-muted line-clamp-2 pt-1">
                            {lang === "ne"
                              ? album.descriptionNe || album.descriptionEn
                              : album.descriptionEn || album.descriptionNe}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-3 border-t border-line bg-ground/50 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-muted font-mono">
                        ID: {album.id.slice(0, 8)}...
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEditAlbum(album)}
                          className="p-1.5 text-accent hover:bg-accent/10 rounded-control transition-colors cursor-pointer"
                          title={t.editBtn}
                        >
                          <PencilSimple size={15} />
                        </button>
                        <button
                          type="button"
                          disabled={deletingAlbumId === album.id}
                          onClick={() => handleDeleteAlbum(album.id)}
                          className="p-1.5 text-danger hover:bg-danger/10 disabled:opacity-60 rounded-control transition-colors cursor-pointer"
                          title={t.deleteBtn}
                        >
                          {deletingAlbumId === album.id ? (
                            <CircleNotch size={15} className="animate-spin" />
                          ) : (
                            <Trash size={15} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* SECTION: SINGLE PHOTOS MANAGEMENT (Existing functionality) */}
      {/* ================================================================= */}
      {activeSubTab === "photos" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-muted">
              {lang === "ne"
                ? "एकल तस्बिर तथा क्याप्सनहरू व्यवस्थापन गर्नुहोस्।"
                : "Manage individual stand-alone photo uploads."}
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
                    categoryEn: "",
                    categoryNe: "",
                    dateEn: "",
                    dateNe: "",
                    imageUrl: "",
                  });
                  setShowAddGalleryModal(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors cursor-pointer shadow-e1"
            >
              {showAddGalleryModal ? <X size={14} /> : <Plus size={14} />}
              <span>{showAddGalleryModal ? t.closeBtn : t.addGallery}</span>
            </button>
          </div>

          {showAddGalleryModal && (
            <form
              onSubmit={handleAddGallery}
              className="p-6 rounded-card border border-accent/40 bg-surface space-y-4 shadow-e1"
            >
              <div className="flex items-center justify-between pb-2 border-b border-line">
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">
                    {lang === "ne" ? "वर्ग / विधा (नेपाली)" : "Category (Nepali)"}
                  </label>
                  <input
                    type="text"
                    list="gallery-category-ne-list"
                    value={galleryForm.categoryNe}
                    onChange={(e) =>
                      setGalleryForm({ ...galleryForm, categoryNe: e.target.value })
                    }
                    placeholder={lang === "ne" ? "उदा: शिक्षा, संस्कृति, कार्यक्रम..." : "e.g. Education, Culture, Program..."}
                    className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                  />
                  <datalist id="gallery-category-ne-list">
                    {Array.from(new Set(galleryList.map((g) => g.categoryNe).filter(Boolean))).map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">
                    {lang === "ne" ? "वर्ग / विधा (अंग्रेजी)" : "Category (English)"}
                  </label>
                  <input
                    type="text"
                    list="gallery-category-en-list"
                    value={galleryForm.categoryEn}
                    onChange={(e) =>
                      setGalleryForm({ ...galleryForm, categoryEn: e.target.value })
                    }
                    placeholder="e.g. Education, Culture, Development, Event..."
                    className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                  />
                  <datalist id="gallery-category-en-list">
                    {Array.from(new Set(galleryList.map((g) => g.categoryEn).filter(Boolean))).map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">
                    {lang === "ne" ? "मिति (वि.सं.)" : "Date (BS)"}
                  </label>
                  <input
                    type="text"
                    value={galleryForm.dateNe}
                    onChange={(e) =>
                      setGalleryForm({ ...galleryForm, dateNe: e.target.value })
                    }
                    placeholder="२०८१ साउन"
                    className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">
                    {lang === "ne" ? "मिति (ई.सं.)" : "Date (AD)"}
                  </label>
                  <input
                    type="text"
                    value={galleryForm.dateEn}
                    onChange={(e) =>
                      setGalleryForm({ ...galleryForm, dateEn: e.target.value })
                    }
                    placeholder="July 2024"
                    className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent font-mono"
                  />
                </div>
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
                  className="px-5 py-2 rounded-control btn-fill bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-e1"
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
            {galleryList.length === 0 ? (
              <div className="p-12 text-center text-muted text-xs">
                {lang === "ne" ? "कुनै एकल तस्बिर उपलब्ध छैन।" : "No single photos uploaded yet."}
              </div>
            ) : (
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
                          {lang === "ne" ? g.categoryNe || g.categoryEn : g.categoryEn || g.categoryNe}
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
