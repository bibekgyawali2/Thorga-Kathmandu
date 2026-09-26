"use client";

import React, { useState } from "react";
import Image from "next/image";
import { BaseTabProps } from "../adminTypes";
import { ADMIN_I18N, revalidateCollection } from "../adminConstants";
import {
  EventItem,
  GalleryItem,
  GalleryAlbum,
  saveStoredEvents,
  getStoredGallerySnapshot,
  getStoredGalleryAlbumsSnapshot,
} from "@/data/mockData";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import {
  Calendar,
  Plus,
  Trash,
  PencilSimple,
  CircleNotch,
  FileText,
  Clock,
  MapPin,
  X,
  Images,
  Image as ImageIcon,
} from "@phosphor-icons/react";

interface EventsTabProps extends BaseTabProps {
  eventsList: EventItem[];
  setEventsList: React.Dispatch<React.SetStateAction<EventItem[]>>;
  galleryList?: GalleryItem[];
  albumsList?: GalleryAlbum[];
  showAddModalInitial?: boolean;
}

const initialEventForm = {
  titleEn: "",
  titleNe: "",
  categoryEn: "",
  categoryNe: "",
  dateEn: "2081 Ashoj 12",
  dateNe: "२०८१ असोज १२",
  timeEn: "11:00 AM",
  timeNe: "बिहान ११:०० बजे",
  locationEn: "Kathmandu",
  locationNe: "काठमाडौँ",
  descriptionEn: "",
  descriptionNe: "",
  imageUrl: "",
  status: "upcoming" as "upcoming" | "completed",
  galleryId: "",
};

export function EventsTab({
  lang,
  adminFetch,
  dialogAlert,
  dialogConfirm,
  eventsList,
  setEventsList,
  galleryList = [],
  albumsList = [],
  showAddModalInitial = false,
}: EventsTabProps) {
  const t = ADMIN_I18N[lang];
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [showAddEventModal, setShowAddEventModal] = useState(
    showAddModalInitial || eventsList.length === 0
  );
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  const allGalleries =
    galleryList.length > 0
      ? galleryList
      : typeof window !== "undefined"
      ? getStoredGallerySnapshot()
      : [];
  const allAlbums =
    albumsList.length > 0
      ? albumsList
      : typeof window !== "undefined"
      ? getStoredGalleryAlbumsSnapshot()
      : [];

  const [eventForm, setEventForm] = useState(initialEventForm);

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

  const handleStartEditEvent = (ev: EventItem, focusDescription = false) => {
    setEditingEvent(ev);
    setEventForm({
      titleEn: ev.titleEn || "",
      titleNe: ev.titleNe || "",
      categoryEn: (ev.categoryEn === "General Assembly" ? "" : ev.categoryEn) || "",
      categoryNe: (ev.categoryNe === "साधारण सभा" ? "" : ev.categoryNe) || "",
      dateEn: ev.dateEn || "",
      dateNe: ev.dateNe || "",
      timeEn: ev.timeEn || "",
      timeNe: ev.timeNe || "",
      locationEn: ev.locationEn || "",
      locationNe: ev.locationNe || "",
      descriptionEn: ev.descriptionEn || ev.descriptionNe || "",
      descriptionNe: ev.descriptionNe || ev.descriptionEn || "",
      imageUrl: ev.imageUrl || "",
      status: ev.status || "upcoming",
      galleryId: ev.galleryId || "",
    });
    setShowAddEventModal(true);

    if (focusDescription) {
      setTimeout(() => {
        const textarea = document.getElementById("event-description-field");
        if (textarea) {
          textarea.focus();
          textarea.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.titleNe.trim() || !eventForm.titleEn.trim()) {
      dialogAlert({
        title: lang === "ne" ? "शीर्षक आवश्यक" : "Title Required",
        description:
          lang === "ne"
            ? "कृपया कार्यक्रमको शीर्षक दुवै भाषामा भर्नुहोस्।"
            : "Please enter event titles in both languages.",
        type: "warning",
      });
      return;
    }
    if (!eventForm.dateNe.trim() || !eventForm.dateEn.trim()) {
      dialogAlert({
        title: lang === "ne" ? "मिति आवश्यक" : "Date Required",
        description:
          lang === "ne"
            ? "कृपया कार्यक्रमको मिति दुवै भाषामा भर्नुहोस्।"
            : "Please enter event dates in both languages.",
        type: "warning",
      });
      return;
    }
    if (!eventForm.locationNe.trim() || !eventForm.locationEn.trim()) {
      dialogAlert({
        title: lang === "ne" ? "स्थान आवश्यक" : "Location Required",
        description:
          lang === "ne"
            ? "कृपया कार्यक्रम हुने स्थान दुवै भाषामा भर्नुहोस्।"
            : "Please enter event locations in both languages.",
        type: "warning",
      });
      return;
    }

    setIsSavingEvent(true);
    try {
      const unifiedDescription =
        eventForm.descriptionNe || eventForm.descriptionEn || "";

      if (editingEvent) {
        const updatedEv: EventItem = {
          ...editingEvent,
          ...eventForm,
          titleNe: eventForm.titleNe.trim(),
          titleEn: eventForm.titleEn.trim(),
          dateNe: eventForm.dateNe.trim(),
          dateEn: eventForm.dateEn.trim(),
          locationNe: eventForm.locationNe.trim(),
          locationEn: eventForm.locationEn.trim(),
          descriptionNe: unifiedDescription.trim(),
          descriptionEn: unifiedDescription.trim(),
        };

        let finalEv = updatedEv;
        try {
          const res = await adminFetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedEv),
          });
          const data = await res.json();
          if (data && data.success && data.data) {
            finalEv = data.data;
          }
        } catch (err) {
          console.error("Failed to update event in db:", err);
        }

        const updated = eventsList.map((e) =>
          e.id === editingEvent.id ? finalEv : e
        );
        setEventsList(updated);
        saveStoredEvents(updated);
        revalidateCollection("events");
        setShowAddEventModal(false);
        setEditingEvent(null);
        setEventForm(initialEventForm);
        dialogAlert({
          title: lang === "ne" ? "गतिविधि सम्पादन भयो" : "Event Updated",
          description:
            lang === "ne"
              ? "गतिविधि विवरण सफलतापूर्वक अद्यावधिक गरिएको छ।"
              : "Event details have been updated.",
          type: "success",
        });
        return;
      }

      const generatedId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `e-${Date.now()}`;

      const newEv: EventItem = {
        id: generatedId,
        ...eventForm,
        titleNe: eventForm.titleNe.trim(),
        titleEn: eventForm.titleEn.trim(),
        dateNe: eventForm.dateNe.trim(),
        dateEn: eventForm.dateEn.trim(),
        locationNe: eventForm.locationNe.trim(),
        locationEn: eventForm.locationEn.trim(),
        descriptionNe: unifiedDescription.trim(),
        descriptionEn: unifiedDescription.trim(),
      };

      let finalSavedEv = newEv;
      try {
        const res = await adminFetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newEv),
        });
        const data = await res.json();
        if (data && data.success && data.data) {
          finalSavedEv = data.data;
        }
      } catch (err) {
        console.error("Failed to sync event to db:", err);
      }

      const updated = [
        finalSavedEv,
        ...eventsList.filter((e) => e.id !== finalSavedEv.id),
      ];
      setEventsList(updated);
      saveStoredEvents(updated);
      revalidateCollection("events");
      setShowAddEventModal(false);
      setEventForm(initialEventForm);
      dialogAlert({
        title: lang === "ne" ? "गतिविधि थपियो" : "Event Scheduled",
        description:
          lang === "ne"
            ? "गतिविधि तालिकामा दर्ता भएको छ।"
            : "Event successfully added to schedule.",
        type: "success",
      });
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    const eventToDelete = eventsList.find((e) => e.id === id);
    const confirmed = await dialogConfirm({
      title: t.removeEventConfirmTitle,
      description: `${t.removeEventConfirmDesc} (${
        eventToDelete
          ? lang === "ne"
            ? eventToDelete.titleNe
            : eventToDelete.titleEn
          : ""
      })`,
      type: "danger",
      confirmText: t.deleteBtn,
      cancelText: t.cancelBtn,
    });
    if (confirmed) {
      setDeletingEventId(id);
      try {
        if (eventToDelete?.imageUrl) {
          deleteCloudinaryAsset(eventToDelete.imageUrl);
        }

        const res = await adminFetch(
          `/api/events?id=${encodeURIComponent(id)}`,
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
                ? "सर्भरबाट गतिविधि हटाउन सकिएन।"
                : "Failed to remove event from server."),
            type: "danger",
          });
          return;
        }

        const updated = eventsList.filter((e) => e.id !== id);
        setEventsList(updated);
        saveStoredEvents(updated);
        revalidateCollection("events");
        dialogAlert({
          title: lang === "ne" ? "गतिविधि हटाइयो" : "Event Removed",
          description:
            lang === "ne"
              ? "गतिविधि सफलतापूर्वक हटाइएको छ।"
              : "Event removed successfully.",
          type: "success",
        });
      } catch (err) {
        if (err instanceof Error && err.message === "Session expired") return;
        console.error("Failed to delete event from db:", err);
      } finally {
        setDeletingEventId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-card border border-line bg-surface">
        <div>
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-accent" />
            <h2 className="text-base font-bold text-fg">{t.events}</h2>
          </div>
          <p className="text-xs text-muted mt-1">
            {lang === "ne"
              ? "आगामी भेला, बैठक तथा सामाजिक कार्यक्रम तालिका र विस्तृत विवरण व्यवस्थापन गर्नुहोस्।"
              : "Manage upcoming meetings, gatherings, activities, and detailed descriptions."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (showAddEventModal && !editingEvent) {
              setShowAddEventModal(false);
            } else {
              setEditingEvent(null);
              setEventForm(initialEventForm);
              setShowAddEventModal(true);
            }
          }}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors cursor-pointer shadow-e1 flex-shrink-0"
        >
          {showAddEventModal && !editingEvent ? <X size={15} /> : <Plus size={15} />}
          <span>{showAddEventModal && !editingEvent ? t.closeBtn : t.scheduleEvent}</span>
        </button>
      </div>

      {/* Add / Edit Form */}
      {showAddEventModal && (
        <form
          onSubmit={handleAddEvent}
          className="p-6 rounded-card border-2 border-accent/60 bg-surface space-y-5 shadow-e2"
        >
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
              <div className="text-sm font-bold text-accent">
                {editingEvent ? t.editEvent : t.scheduleEvent}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingEvent(null);
                setShowAddEventModal(false);
              }}
              className="text-xs text-muted hover:text-fg p-1.5 rounded-control hover:bg-tint transition-colors cursor-pointer flex items-center gap-1"
            >
              <X size={14} />
              <span>{t.closeBtn}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                शीर्षक (नेपाली) *
              </label>
              <input
                required
                type="text"
                value={eventForm.titleNe}
                onChange={(e) =>
                  setEventForm({ ...eventForm, titleNe: e.target.value })
                }
                placeholder="कार्यक्रमको शीर्षक"
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                Title (English) *
              </label>
              <input
                required
                type="text"
                value={eventForm.titleEn}
                onChange={(e) =>
                  setEventForm({ ...eventForm, titleEn: e.target.value })
                }
                placeholder="Event Title"
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                {lang === "ne" ? "मिति (वि.सं.) *" : "Date (BS) *"}
              </label>
              <input
                required
                type="text"
                value={eventForm.dateNe}
                onChange={(e) =>
                  setEventForm({
                    ...eventForm,
                    dateNe: e.target.value,
                    dateEn: eventForm.dateEn || e.target.value,
                  })
                }
                placeholder="२०८१ असोज १२"
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                {lang === "ne" ? "समय" : "Time"}
              </label>
              <input
                type="text"
                value={eventForm.timeNe}
                onChange={(e) =>
                  setEventForm({
                    ...eventForm,
                    timeNe: e.target.value,
                    timeEn: eventForm.timeEn || e.target.value,
                  })
                }
                placeholder="बिहान ११:०० बजे"
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                {lang === "ne" ? "स्थान *" : "Location *"}
              </label>
              <input
                required
                type="text"
                value={eventForm.locationNe}
                onChange={(e) =>
                  setEventForm({
                    ...eventForm,
                    locationNe: e.target.value,
                    locationEn: eventForm.locationEn || e.target.value,
                  })
                }
                placeholder="काठमाडौँ"
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                {lang === "ne" ? "स्थिति (Status)" : "Status"}
              </label>
              <select
                value={eventForm.status}
                onChange={(e) =>
                  setEventForm({
                    ...eventForm,
                    status: e.target.value as "upcoming" | "completed",
                  })
                }
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent capitalize"
              >
                <option value="completed">
                  {lang === "ne" ? "सम्पन्न (Completed)" : "Completed"}
                </option>
                <option value="upcoming">
                  {lang === "ne" ? "आगामी (Upcoming)" : "Upcoming"}
                </option>
              </select>
            </div>
          </div>

          {/* Description Textarea Box */}
          <div className="p-4 rounded-control border border-accent/30 bg-ground space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="event-description-field"
                className="text-xs font-bold text-fg flex items-center gap-1.5"
              >
                <FileText size={16} className="text-accent" />
                <span>
                  {lang === "ne"
                    ? "गतिविधिको विस्तृत विवरण (Description Box)"
                    : "Activity Full Description / Details Box"}
                </span>
              </label>
              <span className="text-[11px] text-accent font-medium">
                {lang === "ne"
                  ? "(कार्ड क्लिक गर्दा देखिने विवरण)"
                  : "(Shown on card click)"}
              </span>
            </div>

            <textarea
              id="event-description-field"
              rows={6}
              value={eventForm.descriptionNe || eventForm.descriptionEn}
              onChange={(e) =>
                setEventForm({
                  ...eventForm,
                  descriptionNe: e.target.value,
                  descriptionEn: e.target.value,
                })
              }
              placeholder={
                lang === "ne"
                  ? "कार्यक्रमको विस्तृत विवरण, कार्यसूची, उद्देश्य, मुख्य अतिथि, सहभागी हुने प्रक्रिया तथा अन्य सबै जानकारी यहाँ लेख्नुहोस्..."
                  : "Enter activity description, schedule, chief guests, objectives, and all details here..."
              }
              className="w-full px-3.5 py-2.5 rounded-control border border-line bg-surface text-fg text-xs leading-relaxed focus:border-accent focus:ring-1 focus:ring-accent"
            />
            <p className="text-[11px] text-muted">
              {lang === "ne"
                ? "यस विवरणलाई प्रयोगकर्ताले वेबसाइटमा कार्यक्रम कार्ड क्लिक गर्दा पपअप डाइलगमा हेर्न सक्नेछन्।"
                : "Users will view this formatted full description in a dialog modal popup when clicking the activity card."}
            </p>
          </div>

          <CloudinaryUploader
            label={
              lang === "ne"
                ? "गतिविधिको ब्यानर तस्बिर (ऐच्छिक)"
                : "Event Banner Photo (Optional)"
            }
            description="Event promotional banner or photo"
            folder="events"
            accept="image/*"
            value={eventForm.imageUrl}
            onChange={(url) =>
              setEventForm({ ...eventForm, imageUrl: url })
            }
          />

          {/* Link Gallery Selection (1 gallery per event) */}
          <div className="space-y-2.5 p-4 rounded-card border border-line bg-ground/50">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-fg flex items-center gap-1.5">
                <Images size={16} className="text-accent" />
                <span>
                  {lang === "ne"
                    ? "सम्बन्धित ग्यालरी जोड्नुहोस् (प्रति गतिविधि १ ग्यालरी)"
                    : "Link Related Gallery (1 gallery per event)"}
                </span>
              </label>
              {eventForm.galleryId && (
                <button
                  type="button"
                  onClick={() => setEventForm({ ...eventForm, galleryId: "" })}
                  className="text-[11px] text-danger hover:underline cursor-pointer flex items-center gap-1 font-medium"
                >
                  <X size={12} />
                  <span>{lang === "ne" ? "लिंक हटाउनुहोस्" : "Remove Link"}</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              {lang === "ne"
                ? "यस गतिविधिसँग सम्बन्धित ग्यालरी तस्बिर वा एल्बम छान्नुहोस्। प्रयोगकर्ताले गतिविधि हेर्दा यो तस्बिर/एल्बम पनि देख्न सक्नेछन्।"
                : "Select a gallery photo or album for this event. Visitors will see this related gallery when viewing the event."}
            </p>

            <select
              value={eventForm.galleryId}
              onChange={(e) => setEventForm({ ...eventForm, galleryId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-control border border-line bg-surface text-fg text-xs focus:border-accent"
            >
              <option value="">
                {lang === "ne"
                  ? "-- कुनै पनि ग्यालरी नजोड्ने (कुनै लिंक छैन) --"
                  : "-- Do not link any gallery (None) --"}
              </option>

              {allGalleries.length > 0 && (
                <optgroup label={lang === "ne" ? "📷 ग्यालरी तस्बिरहरू (Photos)" : "📷 Gallery Photos"}>
                  {allGalleries.map((g) => (
                    <option key={g.id} value={g.id}>
                      {lang === "ne" ? g.titleNe || g.titleEn : g.titleEn || g.titleNe}
                      {g.dateNe ? ` (${g.dateNe})` : ""}
                    </option>
                  ))}
                </optgroup>
              )}

              {allAlbums.length > 0 && (
                <optgroup label={lang === "ne" ? "📁 ग्यालरी एल्बमहरू (Albums)" : "📁 Gallery Albums"}>
                  {allAlbums.map((a) => (
                    <option key={a.id} value={a.id}>
                      {lang === "ne" ? a.titleNe || a.titleEn : a.titleEn || a.titleNe}
                      {` (${a.images?.length || 0} ${lang === "ne" ? "तस्बिरहरू" : "photos"})`}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            {/* Selected Gallery Preview Card */}
            {eventForm.galleryId && (() => {
              const selectedPhoto = allGalleries.find((g) => g.id === eventForm.galleryId);
              const selectedAlbum = allAlbums.find((a) => a.id === eventForm.galleryId);
              const previewImg = selectedPhoto?.imageUrl || selectedAlbum?.coverImageUrl || selectedAlbum?.images?.[0]?.imageUrl;
              const previewTitle = selectedPhoto
                ? (lang === "ne" ? selectedPhoto.titleNe : selectedPhoto.titleEn)
                : selectedAlbum
                ? (lang === "ne" ? selectedAlbum.titleNe : selectedAlbum.titleEn)
                : "";
              const previewType = selectedPhoto
                ? (lang === "ne" ? "ग्यालरी तस्बिर" : "Gallery Photo")
                : (lang === "ne" ? `एल्बम (${selectedAlbum?.images?.length || 0} तस्बिरहरू)` : `Album (${selectedAlbum?.images?.length || 0} photos)`);

              if (!previewImg && !previewTitle) return null;

              return (
                <div className="mt-2.5 p-3 rounded-control border border-accent/40 bg-accent-soft/30 flex items-center gap-3">
                  {previewImg ? (
                    <div className="relative w-16 h-12 rounded-control overflow-hidden bg-black flex-shrink-0 border border-line">
                      <Image
                        src={previewImg}
                        alt={previewTitle}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-12 rounded-control bg-tint flex items-center justify-center flex-shrink-0 text-muted">
                      <ImageIcon size={20} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">
                      {previewType}
                    </span>
                    <span className="text-xs font-semibold text-fg line-clamp-1 block">
                      {previewTitle}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-chip bg-accent text-on-accent text-[10px] font-bold shrink-0">
                    {lang === "ne" ? "जोडियो ✓" : "Linked ✓"}
                  </span>
                </div>
              );
            })()}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={isSavingEvent}
              className="px-6 py-2.5 rounded-control btn-fill bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-e1"
            >
              {isSavingEvent && (
                <CircleNotch size={14} className="animate-spin" />
              )}
              <span>
                {isSavingEvent
                  ? lang === "ne"
                    ? "सुरक्षित गर्दै..."
                    : "Saving..."
                  : editingEvent
                  ? lang === "ne"
                    ? "परिवर्तन सुरक्षित गर्नुहोस्"
                    : "Save Changes"
                  : lang === "ne"
                  ? "गतिविधि दर्ता गर्नुहोस्"
                  : "Save Activity"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingEvent(null);
                setShowAddEventModal(false);
              }}
              className="px-4 py-2.5 rounded-control border border-line text-xs font-medium text-muted hover:text-fg hover:bg-tint cursor-pointer transition-colors"
            >
              {t.cancelBtn}
            </button>
          </div>
        </form>
      )}

      {/* Events List */}
      <div className="p-4 rounded-card border border-line bg-surface space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-line">
          <div className="text-xs font-bold uppercase tracking-wider text-muted">
            {lang === "ne"
              ? `दर्ता भएका गतिविधिहरू (${eventsList.length})`
              : `Scheduled Activities (${eventsList.length})`}
          </div>
          {!showAddEventModal && (
            <button
              type="button"
              onClick={() => {
                setEditingEvent(null);
                setShowAddEventModal(true);
              }}
              className="text-xs text-accent hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} />
              <span>{t.scheduleEvent}</span>
            </button>
          )}
        </div>

        {eventsList.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted space-y-3">
            <Calendar size={32} className="mx-auto text-muted opacity-60" />
            <p>
              {lang === "ne"
                ? "हाल कुनै गतिविधि दर्ता गरिएको छैन।"
                : "No activities have been scheduled yet."}
            </p>
            <button
              type="button"
              onClick={() => setShowAddEventModal(true)}
              className="px-3.5 py-1.5 rounded-control bg-accent text-on-accent text-xs font-semibold"
            >
              + {t.scheduleEvent}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {eventsList.map((ev) => {
              const hasDescription = !!(ev.descriptionNe || ev.descriptionEn);
              const descriptionText =
                ev.descriptionNe || ev.descriptionEn || "";

              return (
                <div
                  key={ev.id}
                  className="p-4 rounded-control border border-line bg-ground hover:border-accent/40 transition-colors space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-control bg-accent-soft text-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Calendar size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-fg">
                          {lang === "ne" ? ev.titleNe : ev.titleEn}{" "}
                          <span className="text-xs text-muted font-normal">
                            ({lang === "ne" ? ev.titleEn : ev.titleNe})
                          </span>
                        </div>

                        <div className="text-xs text-muted flex flex-wrap items-center gap-3 mt-1.5">
                          <span className="inline-flex items-center gap-1 font-mono text-accent font-medium">
                            <Clock size={13} />
                            <span>{lang === "ne" ? ev.dateNe : ev.dateEn}</span>
                            {ev.timeNe && (
                              <span>• {lang === "ne" ? ev.timeNe : ev.timeEn}</span>
                            )}
                          </span>

                          <span className="inline-flex items-center gap-1 text-muted">
                            <MapPin size={13} />
                            <span>
                              {lang === "ne" ? ev.locationNe : ev.locationEn}
                            </span>
                          </span>

                          <span
                            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-chip ${
                              ev.status === "completed"
                                ? "bg-muted/20 text-muted"
                                : "bg-accent/20 text-accent"
                            }`}
                          >
                            {ev.status}
                          </span>

                          {ev.galleryId && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent bg-accent-soft px-2 py-0.5 rounded-chip border border-accent/20">
                              <Images size={12} weight="bold" />
                              <span>{lang === "ne" ? "तस्बिर" : "Photos"}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-start flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditEvent(ev)}
                        className="px-2.5 py-1 text-xs font-semibold text-accent hover:bg-accent-soft rounded-control transition-colors flex items-center gap-1 cursor-pointer border border-accent/30"
                        title={t.editBtn}
                      >
                        <PencilSimple size={14} />
                        <span>{t.editBtn}</span>
                      </button>
                      <button
                        type="button"
                        disabled={deletingEventId === ev.id}
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="p-1.5 text-danger hover:bg-danger/10 disabled:opacity-60 rounded-control transition-colors cursor-pointer border border-danger/20"
                        title={t.deleteBtn}
                      >
                        {deletingEventId === ev.id ? (
                          <CircleNotch size={14} className="animate-spin" />
                        ) : (
                          <Trash size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Description Callout in list */}
                  {hasDescription ? (
                    <div className="p-3 rounded-control border border-line bg-surface text-xs space-y-1">
                      <div className="text-[11px] font-bold text-accent flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <FileText size={13} />
                          <span>{lang === "ne" ? "विस्तृत विवरण:" : "Description:"}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStartEditEvent(ev, true)}
                          className="text-[10px] text-muted hover:text-accent underline cursor-pointer"
                        >
                          {lang === "ne" ? "सम्पादन" : "Edit"}
                        </button>
                      </div>
                      <p className="text-fg leading-relaxed whitespace-pre-line text-[11px] line-clamp-3">
                        {descriptionText}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 rounded-control bg-tint border border-dashed border-line text-xs text-muted">
                      <span>{lang === "ne" ? "यस गतिविधिमा कुनै विवरण लेखिएको छैन।" : "No description added yet."}</span>
                      <button
                        type="button"
                        onClick={() => handleStartEditEvent(ev, true)}
                        className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>{lang === "ne" ? "विवरण थप्नुहोस्" : "Add Description"}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
