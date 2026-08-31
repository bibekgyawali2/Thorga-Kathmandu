"use client";

import React, { useState } from "react";
import { BaseTabProps } from "../adminTypes";
import { ADMIN_I18N, revalidateCollection } from "../adminConstants";
import { ContactSettings, saveStoredContactSettings } from "@/data/mockData";
import { isValidPhone, isValidEmail } from "@/lib/validation";
import { CircleNotch } from "@phosphor-icons/react";

interface SettingsTabProps extends BaseTabProps {
  initialSettings: ContactSettings;
}

export function SettingsTab({
  lang,
  adminFetch,
  dialogAlert,
  initialSettings,
}: SettingsTabProps) {
  const t = ADMIN_I18N[lang];
  const [contactSettingsState, setContactSettingsState] =
    useState<ContactSettings>(initialSettings);
  const [isSavingContact, setIsSavingContact] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !contactSettingsState.contactHeadingNe.trim() ||
      !contactSettingsState.contactHeadingEn.trim() ||
      !contactSettingsState.contactDescriptionNe.trim() ||
      !contactSettingsState.contactDescriptionEn.trim()
    ) {
      dialogAlert({
        title:
          lang === "ne"
            ? "सम्पर्क खण्ड विवरण अपूर्ण"
            : "Section Details Incomplete",
        description:
          lang === "ne"
            ? "कृपया सम्पर्क खण्डको शीर्षक र उप-विवरण दुवै भाषामा अनिवार्य भर्नुहोस्।"
            : "Please fill section headings and descriptions in both languages.",
        type: "warning",
      });
      return;
    }
    if (
      !contactSettingsState.kathmanduTitleNe.trim() ||
      !contactSettingsState.kathmanduTitleEn.trim() ||
      !contactSettingsState.kathmanduAddressNe.trim() ||
      !contactSettingsState.kathmanduAddressEn.trim()
    ) {
      dialogAlert({
        title:
          lang === "ne"
            ? "सचिवालय विवरण अपूर्ण"
            : "Secretariat Details Incomplete",
        description:
          lang === "ne"
            ? "कृपया काठमाडौँ सचिवालयको शीर्षक र ठेगाना दुवै भाषामा अनिवार्य भर्नुहोस्।"
            : "Please enter secretariat title and physical address in both languages.",
        type: "warning",
      });
      return;
    }
    if (
      contactSettingsState.phone1.trim() &&
      !isValidPhone(contactSettingsState.phone1)
    ) {
      dialogAlert({
        title: lang === "ne" ? "अमान्य फोन १" : "Invalid Phone 1",
        description:
          lang === "ne"
            ? "कृपया प्राथमिक फोन नम्बरको मान्य ढाँचा प्रविष्ट गर्नुहोस्।"
            : "Please enter a valid primary phone number format.",
        type: "warning",
      });
      return;
    }
    if (
      contactSettingsState.phone2.trim() &&
      !isValidPhone(contactSettingsState.phone2)
    ) {
      dialogAlert({
        title: lang === "ne" ? "अमान्य फोन २" : "Invalid Phone 2",
        description:
          lang === "ne"
            ? "कृपया दोस्रो फोन नम्बरको मान्य ढाँचा प्रविष्ट गर्नुहोस्।"
            : "Please enter a valid secondary phone number format.",
        type: "warning",
      });
      return;
    }
    if (
      contactSettingsState.email.trim() &&
      !isValidEmail(contactSettingsState.email)
    ) {
      dialogAlert({
        title: lang === "ne" ? "अमान्य इमेल ठेगाना" : "Invalid Email Address",
        description:
          lang === "ne"
            ? "कृपया मान्य आधिकारिक इमेल ठेगाना प्रविष्ट गर्नुहोस्।"
            : "Please enter a valid official email address format.",
        type: "warning",
      });
      return;
    }

    setIsSavingContact(true);
    try {
      const newContactData = {
        ...contactSettingsState,
        contactHeadingNe: contactSettingsState.contactHeadingNe.trim(),
        contactHeadingEn: contactSettingsState.contactHeadingEn.trim(),
        contactDescriptionNe:
          contactSettingsState.contactDescriptionNe.trim(),
        contactDescriptionEn:
          contactSettingsState.contactDescriptionEn.trim(),
        kathmanduTitleNe: contactSettingsState.kathmanduTitleNe.trim(),
        kathmanduTitleEn: contactSettingsState.kathmanduTitleEn.trim(),
        kathmanduSubtitleNe:
          contactSettingsState.kathmanduSubtitleNe.trim(),
        kathmanduSubtitleEn:
          contactSettingsState.kathmanduSubtitleEn.trim(),
        kathmanduAddressNe: contactSettingsState.kathmanduAddressNe.trim(),
        kathmanduAddressEn: contactSettingsState.kathmanduAddressEn.trim(),
        phone1: contactSettingsState.phone1.trim(),
        phone2: contactSettingsState.phone2.trim(),
        email: contactSettingsState.email.trim(),
        mapEmbedUrl: (contactSettingsState.mapEmbedUrl || "").trim(),
        mapLabelNe: (contactSettingsState.mapLabelNe || "").trim(),
        mapLabelEn: (contactSettingsState.mapLabelEn || "").trim(),
      };

      const res = await adminFetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContactData),
      });
      const data = await res.json();
      if (data && data.success && data.data) {
        setContactSettingsState(data.data);
        saveStoredContactSettings(data.data);
      } else {
        saveStoredContactSettings(newContactData);
      }
      revalidateCollection("contact");

      dialogAlert({
        title:
          lang === "ne"
            ? "सम्पर्क विवरण सुरक्षित भयो"
            : "Contact Settings Saved",
        description:
          lang === "ne"
            ? "मुख्य पृष्ठको सम्पर्क खण्ड र सचिवालय विवरणहरू सफलतापूर्वक सुरक्षित गरियो।"
            : "Landing page contact section and liaison secretariat details updated live.",
        type: "success",
      });
    } catch (err) {
      console.error("Failed to sync contact settings:", err);
      dialogAlert({
        title: lang === "ne" ? "कार्य असफल" : "Save Failed",
        description:
          lang === "ne"
            ? "सर्भरसँग सम्पर्क हुन सकेन।"
            : "Network or server error occurred.",
        type: "danger",
      });
    } finally {
      setIsSavingContact(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-fg">{t.settings}</h2>
        <p className="text-xs text-muted">
          {lang === "ne"
            ? "मुख्य पृष्ठको सम्पर्क खण्ड, सचिवालय विवरण तथा फोन नम्बर सम्पादन गर्नुहोस्।"
            : "Edit landing page contact section text, secretariat liaison card details, and phone numbers."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Landing Page Section Header & Subtitle */}
        <div className="p-6 rounded-card border border-line bg-surface space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-accent">
            {lang === "ne"
              ? "१. सम्पर्क खण्ड शीर्षक र विवरण"
              : "1. Landing Page Section Title & Description"}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                {lang === "ne"
                  ? "खण्डको मुख्य शीर्षक (नेपाली) *"
                  : "Section Heading (Nepali) *"}
              </label>
              <input
                required
                type="text"
                value={contactSettingsState.contactHeadingNe}
                onChange={(e) =>
                  setContactSettingsState({
                    ...contactSettingsState,
                    contactHeadingNe: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                {lang === "ne"
                  ? "खण्डको मुख्य शीर्षक (English) *"
                  : "Section Heading (English) *"}
              </label>
              <input
                required
                type="text"
                value={contactSettingsState.contactHeadingEn}
                onChange={(e) =>
                  setContactSettingsState({
                    ...contactSettingsState,
                    contactHeadingEn: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                {lang === "ne"
                  ? "खण्डको उप-विवरण (नेपाली) *"
                  : "Section Description (Nepali) *"}
              </label>
              <textarea
                required
                rows={2}
                value={contactSettingsState.contactDescriptionNe}
                onChange={(e) =>
                  setContactSettingsState({
                    ...contactSettingsState,
                    contactDescriptionNe: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                {lang === "ne"
                  ? "खण्डको उप-विवरण (English) *"
                  : "Section Description (English) *"}
              </label>
              <textarea
                required
                rows={2}
                value={contactSettingsState.contactDescriptionEn}
                onChange={(e) =>
                  setContactSettingsState({
                    ...contactSettingsState,
                    contactDescriptionEn: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
          </div>
        </div>

        {/* 2. Kathmandu Secretariat Liaison Info */}
        <div className="p-6 rounded-card border border-line bg-surface space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-accent">
            {lang === "ne"
              ? "२. काठमाडौँ सम्पर्क सचिवालय विवरण"
              : "2. Kathmandu Liaison Secretariat Card"}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                {lang === "ne"
                  ? "सचिवालय शीर्षक (नेपाली)"
                  : "Card Title (Nepali)"}
              </label>
              <input
                required
                type="text"
                value={contactSettingsState.kathmanduTitleNe}
                onChange={(e) =>
                  setContactSettingsState({
                    ...contactSettingsState,
                    kathmanduTitleNe: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                {lang === "ne"
                  ? "सचिवालय शीर्षक (English)"
                  : "Card Title (English)"}
              </label>
              <input
                required
                type="text"
                value={contactSettingsState.kathmanduTitleEn}
                onChange={(e) =>
                  setContactSettingsState({
                    ...contactSettingsState,
                    kathmanduTitleEn: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                {lang === "ne"
                  ? "सचिवालय उपशीर्षक (नेपाली)"
                  : "Card Subtitle (Nepali)"}
              </label>
              <input
                type="text"
                value={contactSettingsState.kathmanduSubtitleNe}
                onChange={(e) =>
                  setContactSettingsState({
                    ...contactSettingsState,
                    kathmanduSubtitleNe: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                {lang === "ne"
                  ? "सचिवालय उपशीर्षक (English)"
                  : "Card Subtitle (English)"}
              </label>
              <input
                type="text"
                value={contactSettingsState.kathmanduSubtitleEn}
                onChange={(e) =>
                  setContactSettingsState({
                    ...contactSettingsState,
                    kathmanduSubtitleEn: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                {lang === "ne"
                  ? "सचिवालय ठेगाना (नेपाली)"
                  : "Physical Address (Nepali)"}
              </label>
              <input
                required
                type="text"
                value={contactSettingsState.kathmanduAddressNe}
                onChange={(e) =>
                  setContactSettingsState({
                    ...contactSettingsState,
                    kathmanduAddressNe: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                {lang === "ne"
                  ? "सचिवालय ठेगाना (English)"
                  : "Physical Address (English)"}
              </label>
              <input
                required
                type="text"
                value={contactSettingsState.kathmanduAddressEn}
                onChange={(e) =>
                  setContactSettingsState({
                    ...contactSettingsState,
                    kathmanduAddressEn: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
          </div>

          {/* Village location map */}
          <div className="space-y-4 pt-2 border-t border-line">
            <div>
              <p className="text-xs font-bold text-fg">
                {lang === "ne"
                  ? "थोर्गाको नक्सा (फुटरमा देखिने)"
                  : "Thorga location map (shown in the footer)"}
              </p>
              <p className="text-[11px] text-muted mt-1">
                {lang === "ne"
                  ? "Google Maps मा स्थान खोली Share > Embed a map बाट लिङ्क प्रतिलिपि गर्नुहोस्। Google Maps को लिङ्क मात्र स्वीकार गरिन्छ।"
                  : "Open the place in Google Maps, then Share > Embed a map, and paste the link here. Only Google Maps links are accepted."}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                {lang === "ne" ? "नक्सा लिङ्क" : "Map embed URL"}
              </label>
              <input
                type="url"
                value={contactSettingsState.mapEmbedUrl || ""}
                onChange={(e) =>
                  setContactSettingsState({
                    ...contactSettingsState,
                    mapEmbedUrl: e.target.value,
                  })
                }
                placeholder="https://www.google.com/maps?q=...&output=embed"
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-fg">
                  {lang === "ne"
                    ? "नक्सा विवरण (नेपाली)"
                    : "Map caption (Nepali)"}
                </label>
                <input
                  type="text"
                  value={contactSettingsState.mapLabelNe || ""}
                  onChange={(e) =>
                    setContactSettingsState({
                      ...contactSettingsState,
                      mapLabelNe: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-fg">
                  {lang === "ne"
                    ? "नक्सा विवरण (English)"
                    : "Map caption (English)"}
                </label>
                <input
                  type="text"
                  value={contactSettingsState.mapLabelEn || ""}
                  onChange={(e) =>
                    setContactSettingsState({
                      ...contactSettingsState,
                      mapLabelEn: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Direct Contact Channels */}
        <div className="p-6 rounded-card border border-line bg-surface space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-accent">
            {lang === "ne"
              ? "३. फोन तथा इमेल सम्पर्क"
              : "3. Direct Phone & Email Channels"}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                {lang === "ne" ? "सम्पर्क फोन १" : "Primary Phone"}
              </label>
              <input
                type="text"
                value={contactSettingsState.phone1}
                onChange={(e) =>
                  setContactSettingsState({
                    ...contactSettingsState,
                    phone1: e.target.value,
                  })
                }
                placeholder="+977 01-4481234"
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                {lang === "ne"
                  ? "सम्पर्क फोन २ (मोबाइल)"
                  : "Secondary Phone"}
              </label>
              <input
                type="text"
                value={contactSettingsState.phone2}
                onChange={(e) =>
                  setContactSettingsState({
                    ...contactSettingsState,
                    phone2: e.target.value,
                  })
                }
                placeholder="9851012345"
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                {lang === "ne" ? "आधिकारिक इमेल" : "Official Email"}
              </label>
              <input
                type="email"
                value={contactSettingsState.email}
                onChange={(e) =>
                  setContactSettingsState({
                    ...contactSettingsState,
                    email: e.target.value,
                  })
                }
                placeholder="info@thorgaktm.org.np"
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSavingContact}
            className="px-6 py-2.5 rounded-control btn-fill bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold shadow-e1 transition-colors flex items-center gap-2 cursor-pointer"
          >
            {isSavingContact && (
              <CircleNotch size={14} className="animate-spin" />
            )}
            <span>
              {isSavingContact
                ? lang === "ne"
                  ? "सुरक्षित गर्दै..."
                  : "Saving..."
                : t.saveChanges}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
