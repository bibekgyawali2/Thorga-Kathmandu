"use client";

import React, { useState } from "react";
import { BaseTabProps } from "../adminTypes";
import { ADMIN_I18N, revalidateCollection } from "../adminConstants";
import { Publication, saveStoredPublications } from "@/data/mockData";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import {
  FileText,
  Plus,
  Trash,
  PencilSimple,
  CircleNotch,
  Eye,
  Download,
  ArrowSquareOut,
  X,
} from "@phosphor-icons/react";
import {
  isGoogleDriveUrl,
  getGoogleDrivePreviewUrl,
  getGoogleDriveViewUrl,
  getGoogleDriveDownloadUrl,
} from "@/lib/googleDrive";
import { documentUrl } from "@/lib/documentUrl";
import { PdfModalViewer } from "@/components/PdfModalViewer";

interface PublicationsTabProps extends BaseTabProps {
  pubList: Publication[];
  setPubList: React.Dispatch<React.SetStateAction<Publication[]>>;
  showAddModalInitial?: boolean;
}

export function PublicationsTab({
  lang,
  adminFetch,
  dialogAlert,
  dialogConfirm,
  pubList,
  setPubList,
  showAddModalInitial = false,
}: PublicationsTabProps) {
  const t = ADMIN_I18N[lang];
  const [editingPub, setEditingPub] = useState<Publication | null>(null);
  const [showAddPubModal, setShowAddPubModal] = useState(showAddModalInitial);
  const [isSavingPub, setIsSavingPub] = useState(false);
  const [deletingPubId, setDeletingPubId] = useState<string | null>(null);
  const [viewingPdfPub, setViewingPdfPub] = useState<Publication | null>(null);

  const [pubForm, setPubForm] = useState({
    titleEn: "",
    titleNe: "",
    categoryEn: "",
    categoryNe: "",
    publishedYearEn: "2081 BS (2024)",
    publishedYearNe: "२०८१",
    descriptionEn: "",
    descriptionNe: "",
    pdfUrl: "",
    pages: 48,
    fileSize: "4.2 MB",
    coverImageUrl: "",
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

  const handleStartEditPub = (pub: Publication) => {
    setEditingPub(pub);
    setPubForm({
      titleEn: pub.titleEn || "",
      titleNe: pub.titleNe || "",
      categoryEn: pub.categoryEn || pub.categoryNe || "",
      categoryNe: pub.categoryNe || pub.categoryEn || "",
      publishedYearEn: pub.publishedYearEn || "",
      publishedYearNe: pub.publishedYearNe || "",
      descriptionEn: pub.descriptionEn || "",
      descriptionNe: pub.descriptionNe || "",
      pdfUrl: pub.pdfUrl || "",
      pages: pub.pages || 1,
      fileSize: pub.fileSize || "4.2 MB",
      coverImageUrl: pub.coverImageUrl || "",
    });
    setShowAddPubModal(true);
  };

  const handleAddPub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubForm.titleNe.trim() || !pubForm.titleEn.trim()) {
      dialogAlert({
        title: lang === "ne" ? "शीर्षक आवश्यक" : "Title Required",
        description:
          lang === "ne"
            ? "कृपया प्रकाशनको शीर्षक दुवै भाषामा अनिवार्य भर्नुहोस्।"
            : "Please enter publication titles in both languages.",
        type: "warning",
      });
      return;
    }
    if (!pubForm.pdfUrl.trim()) {
      dialogAlert({
        title: lang === "ne" ? "PDF दस्तावेज आवश्यक" : "PDF Document Required",
        description:
          lang === "ne"
            ? "कृपया क्लाउडिनरी मार्फत आधिकारिक PDF दस्तावेज अपलोड गर्नुहोस्।"
            : "Please upload an official PDF document via the Cloudinary uploader.",
        type: "warning",
      });
      return;
    }

    setIsSavingPub(true);
    try {
      if (editingPub) {
        const updatedPub: Publication = {
          ...editingPub,
          ...pubForm,
          titleNe: pubForm.titleNe.trim(),
          titleEn: pubForm.titleEn.trim(),
          categoryNe: pubForm.categoryNe.trim(),
          categoryEn: pubForm.categoryEn.trim(),
        };

        let finalPub = updatedPub;
        try {
          const res = await adminFetch("/api/publications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedPub),
          });
          const data = await res.json();
          if (data && data.success && data.data) {
            finalPub = data.data;
          }
        } catch (err) {
          console.error("Failed to update pub in db:", err);
        }

        const updated = pubList.map((p) =>
          p.id === editingPub.id ? finalPub : p
        );
        setPubList(updated);
        saveStoredPublications(updated);
        revalidateCollection("publications");
        setShowAddPubModal(false);
        setEditingPub(null);
        setPubForm({
          titleEn: "",
          titleNe: "",
          categoryEn: "",
          categoryNe: "",
          publishedYearEn: "2081 BS (2024)",
          publishedYearNe: "२०८१",
          descriptionEn: "",
          descriptionNe: "",
          pdfUrl: "",
          pages: 48,
          fileSize: "4.2 MB",
          coverImageUrl: "",
        });
        dialogAlert({
          title: lang === "ne" ? "प्रकाशन सम्पादन भयो" : "Publication Updated",
          description:
            lang === "ne"
              ? "प्रकाशन विवरण सफलतापूर्वक अद्यावधिक गरिएको छ।"
              : "Publication details updated successfully.",
          type: "success",
        });
        return;
      }

      const generatedId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `p-${Date.now()}`;

      const newPub: Publication = {
        id: generatedId,
        ...pubForm,
        titleNe: pubForm.titleNe.trim(),
        titleEn: pubForm.titleEn.trim(),
        categoryNe: pubForm.categoryNe.trim(),
        categoryEn: pubForm.categoryEn.trim(),
      };

      let finalSavedPub = newPub;
      try {
        const res = await adminFetch("/api/publications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPub),
        });
        const data = await res.json();
        if (data && data.success && data.data) {
          finalSavedPub = data.data;
        }
      } catch (err) {
        console.error("Failed to sync pub to db:", err);
      }

      const updated = [
        finalSavedPub,
        ...pubList.filter((p) => p.id !== finalSavedPub.id),
      ];
      setPubList(updated);
      saveStoredPublications(updated);
      revalidateCollection("publications");
      setShowAddPubModal(false);
      setPubForm({
        titleEn: "",
        titleNe: "",
        categoryEn: "",
        categoryNe: "",
        publishedYearEn: "2081 BS (2024)",
        publishedYearNe: "२०८१",
        descriptionEn: "",
        descriptionNe: "",
        pdfUrl: "",
        pages: 48,
        fileSize: "4.2 MB",
        coverImageUrl: "",
      });
      dialogAlert({
        title: lang === "ne" ? "प्रकाशन थपियो" : "Publication Uploaded",
        description:
          lang === "ne"
            ? "नयाँ प्रकाशन डिजिटल सङ्ग्रहमा सफलतापूर्वक प्रकाशित भयो।"
            : "New document added to the public PDF archive.",
        type: "success",
      });
    } finally {
      setIsSavingPub(false);
    }
  };

  const handleDeletePub = async (id: string) => {
    const pubToDelete = pubList.find((p) => p.id === id);
    const confirmed = await dialogConfirm({
      title: t.removePubConfirmTitle,
      description: `${t.removePubConfirmDesc} (${
        pubToDelete
          ? lang === "ne"
            ? pubToDelete.titleNe
            : pubToDelete.titleEn
          : ""
      })`,
      type: "danger",
      confirmText: t.deleteBtn,
      cancelText: t.cancelBtn,
    });
    if (confirmed) {
      setDeletingPubId(id);
      try {
        if (pubToDelete?.pdfUrl) {
          deleteCloudinaryAsset(pubToDelete.pdfUrl);
        }
        if (pubToDelete?.coverImageUrl) {
          deleteCloudinaryAsset(pubToDelete.coverImageUrl);
        }

        const res = await adminFetch(
          `/api/publications?id=${encodeURIComponent(id)}`,
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
                ? "सर्भरबाट प्रकाशन हटाउन सकिएन।"
                : "Failed to remove publication from server."),
            type: "danger",
          });
          return;
        }

        const updated = pubList.filter((p) => p.id !== id);
        setPubList(updated);
        saveStoredPublications(updated);
        revalidateCollection("publications");
        dialogAlert({
          title: lang === "ne" ? "प्रकाशन हटाइयो" : "Publication Removed",
          description:
            lang === "ne"
              ? "प्रकाशन सफलतापूर्वक हटाइएको छ।"
              : "Publication removed successfully.",
          type: "success",
        });
      } catch (err) {
        if (err instanceof Error && err.message === "Session expired") return;
        console.error("Failed to delete pub from db:", err);
      } finally {
        setDeletingPubId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-fg">{t.publications}</h2>
          <p className="text-xs text-muted">
            {lang === "ne"
              ? "वार्षिक स्मारिका, मुखपत्र तथा प्रतिवेदन सङ्ग्रह"
              : "Annual souvenirs, bulletins, and financial reports."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (showAddPubModal) {
              setShowAddPubModal(false);
              setEditingPub(null);
            } else {
              setEditingPub(null);
              setPubForm({
                titleEn: "",
                titleNe: "",
                categoryEn: "",
                categoryNe: "",
                publishedYearEn: "2081 BS (2024)",
                publishedYearNe: "२०८१",
                descriptionEn: "",
                descriptionNe: "",
                pdfUrl: "",
                pages: 48,
                fileSize: "4.2 MB",
                coverImageUrl: "",
              });
              setShowAddPubModal(true);
            }
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus size={14} />
          <span>{showAddPubModal ? t.closeBtn : t.uploadPub}</span>
        </button>
      </div>

      {showAddPubModal && (
        <form
          onSubmit={handleAddPub}
          className="p-6 rounded-card border border-accent/40 bg-surface space-y-4 shadow-e1"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-accent">
              {editingPub ? t.editPub : t.uploadPub}
            </div>
            {editingPub && (
              <button
                type="button"
                onClick={() => {
                  setEditingPub(null);
                  setShowAddPubModal(false);
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
                Title (English) *
              </label>
              <input
                required
                type="text"
                value={pubForm.titleEn}
                onChange={(e) =>
                  setPubForm({ ...pubForm, titleEn: e.target.value })
                }
                placeholder="Thorga Souvenir 2081"
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                शीर्षक (नेपाली) *
              </label>
              <input
                required
                type="text"
                value={pubForm.titleNe}
                onChange={(e) =>
                  setPubForm({ ...pubForm, titleNe: e.target.value })
                }
                placeholder="थोर्गा स्मारिका २०८१"
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">Category</label>
              <input
                type="text"
                value={pubForm.categoryEn || pubForm.categoryNe}
                onChange={(e) =>
                  setPubForm({
                    ...pubForm,
                    categoryEn: e.target.value,
                    categoryNe: e.target.value,
                  })
                }
                placeholder="e.g. क्यालेण्डर, Dairy, Souvenir"
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">Page Count</label>
              <input
                type="number"
                value={pubForm.pages}
                onChange={(e) =>
                  setPubForm({ ...pubForm, pages: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CloudinaryUploader
              label="PDF Document File (Max 2MB)"
              description="Annual souvenir, bulletin or report PDF"
              folder="publications"
              accept="application/pdf"
              value={pubForm.pdfUrl}
              onChange={(url) => setPubForm({ ...pubForm, pdfUrl: url })}
            />
            <CloudinaryUploader
              label="Cover Image (Max 2MB)"
              description="Cover photo thumbnail"
              folder="publications/covers"
              accept="image/*"
              value={pubForm.coverImageUrl}
              onChange={(url) =>
                setPubForm({ ...pubForm, coverImageUrl: url })
              }
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isSavingPub}
              className="px-5 py-2 rounded-control btn-fill bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              {isSavingPub && <CircleNotch size={14} className="animate-spin" />}
              <span>
                {isSavingPub
                  ? lang === "ne"
                    ? "प्रकाशित गर्दै..."
                    : "Publishing..."
                  : editingPub
                  ? lang === "ne"
                    ? "परिवर्तन सुरक्षित गर्नुहोस्"
                    : "Save Changes"
                  : t.saveChanges}
              </span>
            </button>
            {editingPub && (
              <button
                type="button"
                onClick={() => {
                  setEditingPub(null);
                  setShowAddPubModal(false);
                }}
                className="px-4 py-2 rounded-control border border-line text-xs font-medium text-muted hover:text-fg cursor-pointer"
              >
                {t.cancelBtn}
              </button>
            )}
          </div>
        </form>
      )}

      <div className="p-4 rounded-card border border-line bg-surface space-y-3">
        <div className="divide-y divide-line">
          {pubList.map((pub) => (
            <div
              key={pub.id}
              className="py-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-control bg-accent-soft text-accent flex items-center justify-center flex-shrink-0">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-fg">
                    {lang === "ne" ? pub.titleNe : pub.titleEn}{" "}
                    <span className="text-muted font-normal">
                      ({lang === "ne" ? pub.titleEn : pub.titleNe})
                    </span>
                  </div>
                  <div className="text-[11px] text-muted font-mono flex items-center gap-2 mt-0.5">
                    <span className="text-accent">{pub.categoryEn}</span>
                    <span>{pub.pages} Pgs</span>
                    <span>{pub.fileSize}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {pub.pdfUrl && (
                  isGoogleDriveUrl(pub.pdfUrl) ? (
                    <a
                      href={getGoogleDriveViewUrl(pub.pdfUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-control bg-accent/10 hover:bg-accent text-accent hover:text-on-accent text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title={lang === "ne" ? "Google Drive मा PDF खोल्नुहोस्" : "Open PDF in Google Drive"}
                    >
                      <ArrowSquareOut size={14} />
                      <span>{lang === "ne" ? "PDF हेर्नुहोस्" : "View PDF"}</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setViewingPdfPub(pub)}
                      className="px-2.5 py-1 rounded-control bg-accent/10 hover:bg-accent text-accent hover:text-on-accent text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={lang === "ne" ? "PDF हेर्नुहोस्" : "View PDF"}
                    >
                      <Eye size={14} />
                      <span>{lang === "ne" ? "PDF हेर्नुहोस्" : "View PDF"}</span>
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => handleStartEditPub(pub)}
                  className="p-1.5 text-accent hover:bg-accent/10 rounded-control transition-colors cursor-pointer"
                  title={t.editBtn}
                >
                  <PencilSimple size={15} />
                </button>
                <button
                  type="button"
                  disabled={deletingPubId === pub.id}
                  onClick={() => handleDeletePub(pub.id)}
                  className="p-1.5 text-danger hover:bg-danger/10 disabled:opacity-60 rounded-control transition-colors cursor-pointer"
                  title={t.deleteBtn}
                >
                  {deletingPubId === pub.id ? (
                    <CircleNotch size={15} className="animate-spin" />
                  ) : (
                    <Trash size={15} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive PDF Viewer Modal in Publications Admin */}
      {viewingPdfPub && (
        <PdfModalViewer
          url={viewingPdfPub.pdfUrl}
          title={lang === "ne" ? viewingPdfPub.titleNe : viewingPdfPub.titleEn}
          category={lang === "ne" ? viewingPdfPub.categoryNe : viewingPdfPub.categoryEn}
          pages={viewingPdfPub.pages}
          fileSize={viewingPdfPub.fileSize}
          lang={lang}
          onClose={() => setViewingPdfPub(null)}
        />
      )}
    </div>
  );
}
