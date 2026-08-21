"use client";

import React, { useEffect, useState } from "react";
import {
  Member,
  EventItem,
  Publication,
  Language,
} from "@/data/mockData";
import { SlidersHorizontal, Upload, X, FileText } from "@phosphor-icons/react";

/*
  Admin surfaces live in their own module so the whole management UI is
  code-split out of the public page (Section 3.A). These are product UI,
  not marketing surfaces, so the taste skill's landing-page composition
  rules do not apply here (Section 13). The token system, the radius lock
  and the form contrast rules still do.
*/

type AdminView = "admin" | "upload" | null;

type Props = {
  lang: Language;
  view: AdminView;
  onClose: () => void;
  onAddMember: (member: Member) => void;
  onAddPublication: (publication: Publication) => void;
  onAddEvent: (event: EventItem) => void;
  memberCount: number;
};

const labelCls = "text-xs font-semibold text-fg";
const inputCls =
  "w-full px-3.5 py-2.5 rounded-control border border-line bg-ground text-fg text-xs placeholder:text-muted focus:border-accent";
const primaryBtnCls =
  "w-full py-3 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors flex items-center justify-center gap-2";

const emptyMember = {
  nameEn: "",
  nameNe: "",
  roleEn: "",
  roleNe: "",
  committeeType: "current" as "current" | "past" | "advisor",
  phone: "",
  email: "",
  photoUrl: "",
  bioEn: "",
  bioNe: "",
};

const emptyPub = {
  titleEn: "",
  titleNe: "",
  categoryEn: "Annual Souvenir",
  categoryNe: "वार्षिक स्मारिका",
  publishedYearEn: "2081 BS",
  publishedYearNe: "२०८१",
  fileSize: "3.2 MB",
  pages: 32,
  pdfUrl: "",
  coverImageUrl: "",
  descriptionEn: "",
  descriptionNe: "",
};

const emptyEvent = {
  titleEn: "",
  titleNe: "",
  dateEn: "",
  dateNe: "",
  timeEn: "",
  timeNe: "",
  locationEn: "",
  locationNe: "",
  descriptionEn: "",
  descriptionNe: "",
  categoryEn: "Community Program",
  categoryNe: "सामुदायिक कार्यक्रम",
  status: "upcoming" as "upcoming" | "completed",
  imageUrl: "",
};

export default function AdminPanel({
  lang,
  view,
  onClose,
  onAddMember,
  onAddPublication,
  onAddEvent,
  memberCount,
}: Props) {
  const [adminTab, setAdminTab] = useState<"members" | "publications" | "events">("members");
  const [newMember, setNewMember] = useState(emptyMember);
  const [newPub, setNewPub] = useState(emptyPub);
  const [newEvent, setNewEvent] = useState(emptyEvent);
  const [pickedFile, setPickedFile] = useState<string | null>(null);

  useEffect(() => {
    if (!view) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, onClose]);

  if (!view) return null;

  const submitMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.nameEn || !newMember.nameNe) return;
    onAddMember({
      id: `m-${Date.now()}`,
      nameEn: newMember.nameEn,
      nameNe: newMember.nameNe,
      roleEn: newMember.roleEn || "Executive Member",
      roleNe: newMember.roleNe || "कार्यसमिति सदस्य",
      committeeType: newMember.committeeType,
      phone: newMember.phone || "+977 9800000000",
      email: newMember.email || "info@thorgaktm.org.np",
      photoUrl: newMember.photoUrl,
      bioEn: newMember.bioEn || "Active community contributor.",
      bioNe: newMember.bioNe || "सक्रिय सामाजिक व्यक्तित्व।",
      order: memberCount + 1,
    });
    setNewMember(emptyMember);
  };

  const submitPublication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPub.titleEn || !newPub.titleNe) return;
    onAddPublication({
      id: `pub-${Date.now()}`,
      titleEn: newPub.titleEn,
      titleNe: newPub.titleNe,
      categoryEn: newPub.categoryEn,
      categoryNe: newPub.categoryNe,
      publishedYearEn: newPub.publishedYearEn,
      publishedYearNe: newPub.publishedYearNe,
      fileSize: newPub.fileSize || "4.5 MB",
      pages: Number(newPub.pages) || 24,
      pdfUrl: newPub.pdfUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      coverImageUrl: newPub.coverImageUrl || undefined,
      descriptionEn: newPub.descriptionEn || "Official published document of the organization.",
      descriptionNe: newPub.descriptionNe || "संस्थाको आधिकारिक प्रकाशित दस्तावेज।",
    });
    setNewPub(emptyPub);
    setPickedFile(null);
  };

  const submitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.titleEn || !newEvent.titleNe) return;
    onAddEvent({
      id: `e-${Date.now()}`,
      titleEn: newEvent.titleEn,
      titleNe: newEvent.titleNe,
      dateEn: newEvent.dateEn || "Upcoming",
      dateNe: newEvent.dateNe || "चाँडै",
      timeEn: newEvent.timeEn || "11:00 AM",
      timeNe: newEvent.timeNe || "बिहान ११:००",
      locationEn: newEvent.locationEn || "Kathmandu",
      locationNe: newEvent.locationNe || "काठमाडौँ",
      descriptionEn: newEvent.descriptionEn || "Community event for members and families.",
      descriptionNe: newEvent.descriptionNe || "सदस्य तथा शुभेच्छुकहरुका लागि सामुदायिक कार्यक्रम।",
      categoryEn: newEvent.categoryEn,
      categoryNe: newEvent.categoryNe,
      status: newEvent.status,
      imageUrl:
        newEvent.imageUrl ||
        "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
    });
    setNewEvent(emptyEvent);
  };

  const tabs: { key: "members" | "publications" | "events"; ne: string; en: string }[] = [
    { key: "members", ne: "सदस्य व्यवस्थापन (दुवै भाषा)", en: "Add Member (Dual Language)" },
    { key: "publications", ne: "प्रकाशन व्यवस्थापन", en: "Add Publication" },
    { key: "events", ne: "कार्यक्रम व्यवस्थापन", en: "Add Event" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-fg/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface border border-line rounded-card w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg p-6 space-y-6">
        {view === "admin" ? (
          <>
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={20} className="text-accent" />
                <h3 className="text-lg font-bold text-fg">
                  {lang === "ne" ? "प्रशासनिक व्यवस्थापन प्यानल" : "Admin Management Portal"}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={lang === "ne" ? "बन्द गर्नुहोस्" : "Close"}
                className="p-1.5 rounded-control text-muted hover:text-fg hover:bg-tint transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-line pb-3">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setAdminTab(tab.key)}
                  className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors ${
                    adminTab === tab.key
                      ? "bg-accent text-on-accent"
                      : "bg-tint text-fg hover:bg-accent-soft"
                  }`}
                >
                  {lang === "ne" ? tab.ne : tab.en}
                </button>
              ))}
            </div>

            {adminTab === "members" && (
              <form onSubmit={submitMember} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="adm-name-en" className={labelCls}>
                      {lang === "ne" ? "नाम (अङ्ग्रेजीमा)" : "Full Name (English)"}
                    </label>
                    <input
                      id="adm-name-en"
                      required
                      type="text"
                      value={newMember.nameEn}
                      onChange={(e) => setNewMember({ ...newMember, nameEn: e.target.value })}
                      placeholder="e.g. Ramesh Gyawali"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="adm-name-ne" className={labelCls}>
                      {lang === "ne" ? "नाम (नेपालीमा)" : "Full Name (Nepali)"}
                    </label>
                    <input
                      id="adm-name-ne"
                      required
                      type="text"
                      value={newMember.nameNe}
                      onChange={(e) => setNewMember({ ...newMember, nameNe: e.target.value })}
                      placeholder="जस्तै: रमेश ज्ञवाली"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="adm-role-en" className={labelCls}>
                      {lang === "ne" ? "पद (अङ्ग्रेजीमा)" : "Role (English)"}
                    </label>
                    <input
                      id="adm-role-en"
                      type="text"
                      value={newMember.roleEn}
                      onChange={(e) => setNewMember({ ...newMember, roleEn: e.target.value })}
                      placeholder="e.g. Joint Secretary"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="adm-role-ne" className={labelCls}>
                      {lang === "ne" ? "पद (नेपालीमा)" : "Role (Nepali)"}
                    </label>
                    <input
                      id="adm-role-ne"
                      type="text"
                      value={newMember.roleNe}
                      onChange={(e) => setNewMember({ ...newMember, roleNe: e.target.value })}
                      placeholder="जस्तै: सह-सचिव"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="adm-committee" className={labelCls}>
                      {lang === "ne" ? "समिति प्रकार" : "Committee"}
                    </label>
                    <select
                      id="adm-committee"
                      value={newMember.committeeType}
                      onChange={(e) =>
                        setNewMember({
                          ...newMember,
                          committeeType: e.target.value as "current" | "past" | "advisor",
                        })
                      }
                      className={inputCls}
                    >
                      <option value="current">Current Executive</option>
                      <option value="advisor">Advisor Council</option>
                      <option value="past">Past Executive</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="adm-phone" className={labelCls}>
                      {lang === "ne" ? "सम्पर्क नम्बर" : "Phone"}
                    </label>
                    <input
                      id="adm-phone"
                      type="text"
                      value={newMember.phone}
                      onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                      placeholder="+977 98..."
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="adm-email" className={labelCls}>
                      {lang === "ne" ? "इमेल" : "Email"}
                    </label>
                    <input
                      id="adm-email"
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      placeholder="user@thorgaktm.org.np"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="adm-photo" className={labelCls}>
                    {lang === "ne" ? "तस्बिर लिङ्क" : "Photo URL"}
                  </label>
                  <input
                    id="adm-photo"
                    type="url"
                    value={newMember.photoUrl}
                    onChange={(e) => setNewMember({ ...newMember, photoUrl: e.target.value })}
                    placeholder="https://res.cloudinary.com/..."
                    className={inputCls}
                  />
                  <p className="text-[11px] text-muted">
                    {lang === "ne"
                      ? "खाली छाडेमा नामको अक्षरबाट बनेको मोनोग्राम देखिनेछ।"
                      : "Leave blank to show a monogram built from the member name."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="adm-bio-en" className={labelCls}>
                      {lang === "ne" ? "परिचय (अङ्ग्रेजीमा)" : "Bio (English)"}
                    </label>
                    <textarea
                      id="adm-bio-en"
                      rows={3}
                      value={newMember.bioEn}
                      onChange={(e) => setNewMember({ ...newMember, bioEn: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="adm-bio-ne" className={labelCls}>
                      {lang === "ne" ? "परिचय (नेपालीमा)" : "Bio (Nepali)"}
                    </label>
                    <textarea
                      id="adm-bio-ne"
                      rows={3}
                      value={newMember.bioNe}
                      onChange={(e) => setNewMember({ ...newMember, bioNe: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>

                <button type="submit" className={primaryBtnCls}>
                  {lang === "ne" ? "नयाँ सदस्य सुरक्षित गर्नुहोस्" : "Save New Member"}
                </button>
              </form>
            )}

            {adminTab === "publications" && (
              <form onSubmit={submitPublication} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="adm-pub-title-en" className={labelCls}>
                      {lang === "ne" ? "शीर्षक (अङ्ग्रेजीमा)" : "Title (English)"}
                    </label>
                    <input
                      id="adm-pub-title-en"
                      required
                      type="text"
                      value={newPub.titleEn}
                      onChange={(e) => setNewPub({ ...newPub, titleEn: e.target.value })}
                      placeholder="e.g. Annual Bulletin 2081"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="adm-pub-title-ne" className={labelCls}>
                      {lang === "ne" ? "शीर्षक (नेपालीमा)" : "Title (Nepali)"}
                    </label>
                    <input
                      id="adm-pub-title-ne"
                      required
                      type="text"
                      value={newPub.titleNe}
                      onChange={(e) => setNewPub({ ...newPub, titleNe: e.target.value })}
                      placeholder="जस्तै: वार्षिक बुलेटिन २०८१"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="adm-pub-year" className={labelCls}>
                      {lang === "ne" ? "प्रकाशन वर्ष" : "Published Year"}
                    </label>
                    <input
                      id="adm-pub-year"
                      type="text"
                      value={newPub.publishedYearEn}
                      onChange={(e) => setNewPub({ ...newPub, publishedYearEn: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="adm-pub-size" className={labelCls}>
                      {lang === "ne" ? "फाइल आकार" : "File Size"}
                    </label>
                    <input
                      id="adm-pub-size"
                      type="text"
                      value={newPub.fileSize}
                      onChange={(e) => setNewPub({ ...newPub, fileSize: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="adm-pub-pages" className={labelCls}>
                      {lang === "ne" ? "पृष्ठ सङ्ख्या" : "Pages"}
                    </label>
                    <input
                      id="adm-pub-pages"
                      type="number"
                      value={newPub.pages}
                      onChange={(e) => setNewPub({ ...newPub, pages: Number(e.target.value) })}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="adm-pub-url" className={labelCls}>
                    {lang === "ne" ? "PDF लिङ्क" : "PDF URL"}
                  </label>
                  <input
                    id="adm-pub-url"
                    type="url"
                    value={newPub.pdfUrl}
                    onChange={(e) => setNewPub({ ...newPub, pdfUrl: e.target.value })}
                    placeholder="https://.../document.pdf"
                    className={inputCls}
                  />
                </div>

                <button type="submit" className={primaryBtnCls}>
                  {lang === "ne" ? "प्रकाशन थप्नुहोस्" : "Add Publication"}
                </button>
              </form>
            )}

            {adminTab === "events" && (
              <form onSubmit={submitEvent} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="adm-ev-title-en" className={labelCls}>
                      {lang === "ne" ? "शीर्षक (अङ्ग्रेजीमा)" : "Title (English)"}
                    </label>
                    <input
                      id="adm-ev-title-en"
                      required
                      type="text"
                      value={newEvent.titleEn}
                      onChange={(e) => setNewEvent({ ...newEvent, titleEn: e.target.value })}
                      placeholder="e.g. Free Health Clinic"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="adm-ev-title-ne" className={labelCls}>
                      {lang === "ne" ? "शीर्षक (नेपालीमा)" : "Title (Nepali)"}
                    </label>
                    <input
                      id="adm-ev-title-ne"
                      required
                      type="text"
                      value={newEvent.titleNe}
                      onChange={(e) => setNewEvent({ ...newEvent, titleNe: e.target.value })}
                      placeholder="जस्तै: निःशुल्क स्वास्थ्य शिविर"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="adm-ev-date-en" className={labelCls}>
                      {lang === "ne" ? "मिति (अङ्ग्रेजीमा)" : "Date (English)"}
                    </label>
                    <input
                      id="adm-ev-date-en"
                      type="text"
                      value={newEvent.dateEn}
                      onChange={(e) => setNewEvent({ ...newEvent, dateEn: e.target.value })}
                      placeholder="October 15, 2026"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="adm-ev-date-ne" className={labelCls}>
                      {lang === "ne" ? "मिति (नेपालीमा)" : "Date (Nepali)"}
                    </label>
                    <input
                      id="adm-ev-date-ne"
                      type="text"
                      value={newEvent.dateNe}
                      onChange={(e) => setNewEvent({ ...newEvent, dateNe: e.target.value })}
                      placeholder="कात्तिक ५, २०८१"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="adm-ev-loc" className={labelCls}>
                      {lang === "ne" ? "स्थान" : "Location"}
                    </label>
                    <input
                      id="adm-ev-loc"
                      type="text"
                      value={newEvent.locationEn}
                      onChange={(e) => setNewEvent({ ...newEvent, locationEn: e.target.value })}
                      placeholder="Kathmandu / Thorga"
                      className={inputCls}
                    />
                  </div>
                </div>

                <button type="submit" className={primaryBtnCls}>
                  {lang === "ne" ? "कार्यक्रम सुरक्षित गर्नुहोस्" : "Save Event"}
                </button>
              </form>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Upload size={20} className="text-accent" />
                <h3 className="text-base font-bold text-fg">
                  {lang === "ne" ? "नयाँ PDF दस्तावेज अपलोड" : "Upload New PDF Document"}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={lang === "ne" ? "बन्द गर्नुहोस्" : "Close"}
                className="p-1.5 rounded-control text-muted hover:text-fg hover:bg-tint transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitPublication} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="up-title-en" className={labelCls}>
                  {lang === "ne" ? "दस्तावेज शीर्षक (अङ्ग्रेजीमा)" : "Document Title (English)"}
                </label>
                <input
                  id="up-title-en"
                  required
                  type="text"
                  value={newPub.titleEn}
                  onChange={(e) => setNewPub({ ...newPub, titleEn: e.target.value })}
                  placeholder="e.g. Annual Souvenir 2081"
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="up-title-ne" className={labelCls}>
                  {lang === "ne" ? "दस्तावेज शीर्षक (नेपालीमा)" : "Document Title (Nepali)"}
                </label>
                <input
                  id="up-title-ne"
                  required
                  type="text"
                  value={newPub.titleNe}
                  onChange={(e) => setNewPub({ ...newPub, titleNe: e.target.value })}
                  placeholder="जस्तै: वार्षिक स्मारिका २०८१"
                  className={inputCls}
                />
              </div>

              <label
                htmlFor="up-file"
                className="border border-dashed border-line bg-ground rounded-card p-6 flex flex-col items-center gap-2 text-center cursor-pointer hover:border-accent transition-colors"
              >
                <FileText size={28} className="text-accent" weight="duotone" />
                <span className="text-xs font-semibold text-fg">
                  {pickedFile
                    ? pickedFile
                    : lang === "ne"
                    ? "PDF फाइल यहाँ तान्नुहोस् वा छान्नुहोस्"
                    : "Select or drag PDF file here"}
                </span>
                <span className="text-[10px] text-muted">PDF, max 25 MB</span>
                <input
                  id="up-file"
                  type="file"
                  accept="application/pdf"
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setPickedFile(file.name);
                      setNewPub((prev) => ({
                        ...prev,
                        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                      }));
                    }
                  }}
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="up-year" className={labelCls}>
                    {lang === "ne" ? "प्रकाशन वर्ष" : "Published Year"}
                  </label>
                  <input
                    id="up-year"
                    type="text"
                    value={newPub.publishedYearEn}
                    onChange={(e) => setNewPub({ ...newPub, publishedYearEn: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="up-pages" className={labelCls}>
                    {lang === "ne" ? "पृष्ठ सङ्ख्या" : "Pages"}
                  </label>
                  <input
                    id="up-pages"
                    type="number"
                    value={newPub.pages}
                    onChange={(e) => setNewPub({ ...newPub, pages: Number(e.target.value) })}
                    className={inputCls}
                  />
                </div>
              </div>

              <button type="submit" className={primaryBtnCls}>
                <Upload size={16} />
                {lang === "ne" ? "प्रकाशन सूचीमा थप्नुहोस्" : "Add to Publications"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
