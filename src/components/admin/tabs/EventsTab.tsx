"use client";

import React, { useState } from "react";
import { BaseTabProps } from "../adminTypes";
import { ADMIN_I18N, revalidateCollection } from "../adminConstants";
import { EventItem, saveStoredEvents } from "@/data/mockData";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import {
  Calendar,
  Plus,
  Trash,
  PencilSimple,
  CircleNotch,
} from "@phosphor-icons/react";

interface EventsTabProps extends BaseTabProps {
  eventsList: EventItem[];
  setEventsList: React.Dispatch<React.SetStateAction<EventItem[]>>;
  showAddModalInitial?: boolean;
}

export function EventsTab({
  lang,
  adminFetch,
  dialogAlert,
  dialogConfirm,
  eventsList,
  setEventsList,
  showAddModalInitial = false,
}: EventsTabProps) {
  const t = ADMIN_I18N[lang];
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [showAddEventModal, setShowAddEventModal] = useState(
    showAddModalInitial
  );
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  const [eventForm, setEventForm] = useState({
    titleEn: "",
    titleNe: "",
    categoryEn: "General Assembly",
    categoryNe: "साधारण सभा",
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

  const handleStartEditEvent = (ev: EventItem) => {
    setEditingEvent(ev);
    setEventForm({
      titleEn: ev.titleEn || "",
      titleNe: ev.titleNe || "",
      categoryEn: ev.categoryEn || "Meeting",
      categoryNe: ev.categoryNe || "भेला",
      dateEn: ev.dateEn || "",
      dateNe: ev.dateNe || "",
      timeEn: ev.timeEn || "",
      timeNe: ev.timeNe || "",
      locationEn: ev.locationEn || "",
      locationNe: ev.locationNe || "",
      descriptionEn: ev.descriptionEn || "",
      descriptionNe: ev.descriptionNe || "",
      imageUrl: ev.imageUrl || "",
      status: ev.status || "upcoming",
    });
    setShowAddEventModal(true);
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
        setEventForm({
          titleEn: "",
          titleNe: "",
          categoryEn: "General Assembly",
          categoryNe: "साधारण सभा",
          dateEn: "2081 Ashoj 12",
          dateNe: "२०८१ असोज १२",
          timeEn: "11:00 AM",
          timeNe: "बिहान ११:०० बजे",
          locationEn: "Kathmandu",
          locationNe: "काठमाडौँ",
          descriptionEn: "",
          descriptionNe: "",
          imageUrl: "",
          status: "upcoming",
        });
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
      setEventForm({
        titleEn: "",
        titleNe: "",
        categoryEn: "General Assembly",
        categoryNe: "साधारण सभा",
        dateEn: "2081 Ashoj 12",
        dateNe: "२०८१ असोज १२",
        timeEn: "11:00 AM",
        timeNe: "बिहान ११:०० बजे",
        locationEn: "Kathmandu",
        locationNe: "काठमाडौँ",
        descriptionEn: "",
        descriptionNe: "",
        imageUrl: "",
        status: "upcoming",
      });
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-fg">{t.events}</h2>
          <p className="text-xs text-muted">
            {lang === "ne"
              ? "आगामी भेला, बैठक तथा सामाजिक कार्यक्रम तालिका"
              : "Upcoming meetings, gatherings, and community events."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (showAddEventModal) {
              setShowAddEventModal(false);
              setEditingEvent(null);
            } else {
              setEditingEvent(null);
              setEventForm({
                titleEn: "",
                titleNe: "",
                categoryEn: "General Assembly",
                categoryNe: "साधारण सभा",
                dateEn: "2081 Ashoj 12",
                dateNe: "२०८१ असोज १२",
                timeEn: "11:00 AM",
                timeNe: "बिहान ११:०० बजे",
                locationEn: "Kathmandu",
                locationNe: "काठमाडौँ",
                descriptionEn: "",
                descriptionNe: "",
                imageUrl: "",
                status: "upcoming",
              });
              setShowAddEventModal(true);
            }
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus size={14} />
          <span>{showAddEventModal ? t.closeBtn : t.scheduleEvent}</span>
        </button>
      </div>

      {showAddEventModal && (
        <form
          onSubmit={handleAddEvent}
          className="p-6 rounded-card border border-accent/40 bg-surface space-y-4 shadow-e1"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-accent">
              {editingEvent ? t.editEvent : t.scheduleEvent}
            </div>
            {editingEvent && (
              <button
                type="button"
                onClick={() => {
                  setEditingEvent(null);
                  setShowAddEventModal(false);
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
                value={eventForm.titleEn}
                onChange={(e) =>
                  setEventForm({ ...eventForm, titleEn: e.target.value })
                }
                placeholder="Annual General Assembly"
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
                value={eventForm.titleNe}
                onChange={(e) =>
                  setEventForm({ ...eventForm, titleNe: e.target.value })
                }
                placeholder="वार्षिक साधारण सभा"
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">Date (BS)</label>
              <input
                type="text"
                value={eventForm.dateNe}
                onChange={(e) =>
                  setEventForm({ ...eventForm, dateNe: e.target.value })
                }
                placeholder="२०८१ असोज १२"
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">Location</label>
              <input
                type="text"
                value={eventForm.locationEn}
                onChange={(e) =>
                  setEventForm({ ...eventForm, locationEn: e.target.value })
                }
                placeholder="Kathmandu"
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">Status</label>
              <select
                value={eventForm.status}
                onChange={(e) =>
                  setEventForm({
                    ...eventForm,
                    status: e.target.value as "upcoming" | "completed",
                  })
                }
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              >
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-fg">
              {lang === "ne"
                ? "गतिविधिको विस्तृत विवरण (Description)"
                : "Description / Details"}
            </label>
            <textarea
              rows={4}
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
                  ? "कार्यक्रमको विस्तृत विवरण, कार्यसूची, मुख्य अतिथि तथा अन्य जानकारी यहाँ लेख्नुहोस्..."
                  : "Enter activity description, schedule, chief guests, and full details..."
              }
              className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
            />
          </div>

          <CloudinaryUploader
            label="Event Banner Image (Max 2MB)"
            description="Event promotional photo"
            folder="events"
            accept="image/*"
            value={eventForm.imageUrl}
            onChange={(url) =>
              setEventForm({ ...eventForm, imageUrl: url })
            }
          />

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isSavingEvent}
              className="px-5 py-2 rounded-control btn-fill bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              {isSavingEvent && (
                <CircleNotch size={14} className="animate-spin" />
              )}
              <span>
                {isSavingEvent
                  ? lang === "ne"
                    ? "दर्ता गर्दै..."
                    : "Saving..."
                  : editingEvent
                  ? lang === "ne"
                    ? "परिवर्तन सुरक्षित गर्नुहोस्"
                    : "Save Changes"
                  : t.saveChanges}
              </span>
            </button>
            {editingEvent && (
              <button
                type="button"
                onClick={() => {
                  setEditingEvent(null);
                  setShowAddEventModal(false);
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
          {eventsList.map((ev) => (
            <div
              key={ev.id}
              className="py-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-control bg-accent-soft text-accent flex items-center justify-center flex-shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-fg">
                    {lang === "ne" ? ev.titleNe : ev.titleEn}{" "}
                    <span className="text-muted font-normal">
                      ({lang === "ne" ? ev.titleEn : ev.titleNe})
                    </span>
                  </div>
                  <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-accent">
                      {lang === "ne" ? ev.dateNe : ev.dateEn}
                    </span>
                    <span>{lang === "ne" ? ev.locationNe : ev.locationEn}</span>
                    <span className="capitalize text-[10px] font-semibold text-muted">
                      ({ev.status})
                    </span>
                  </div>
                  {(ev.descriptionNe || ev.descriptionEn) && (
                    <p className="text-[11px] text-muted line-clamp-1 mt-1">
                      {ev.descriptionNe || ev.descriptionEn}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleStartEditEvent(ev)}
                  className="p-1.5 text-accent hover:bg-accent/10 rounded-control transition-colors cursor-pointer"
                  title={t.editBtn}
                >
                  <PencilSimple size={15} />
                </button>
                <button
                  type="button"
                  disabled={deletingEventId === ev.id}
                  onClick={() => handleDeleteEvent(ev.id)}
                  className="p-1.5 text-danger hover:bg-danger/10 disabled:opacity-60 rounded-control transition-colors cursor-pointer"
                  title={t.deleteBtn}
                >
                  {deletingEventId === ev.id ? (
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
    </div>
  );
}
