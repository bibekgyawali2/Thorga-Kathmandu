"use client";

import React, { useState } from "react";
import { BaseTabProps, CommitteeSection } from "../adminTypes";
import {
  ADMIN_I18N,
  COMMITTEE_SECTIONS,
  revalidateCollection,
} from "../adminConstants";
import { Member, saveStoredMembers } from "@/data/mockData";
import {
  DocumentSectionEditor,
  FORMER_COMMITTEE_DOC_SLUGS,
} from "../DocumentSectionEditor";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import {
  isValidName,
  isValidPhone,
  isValidEmail,
} from "@/lib/validation";
import {
  Plus,
  Trash,
  PencilSimple,
  CircleNotch,
  MagnifyingGlass,
  CaretUp,
  CaretDown,
} from "@phosphor-icons/react";

interface MembersTabProps extends BaseTabProps {
  membersList: Member[];
  setMembersList: React.Dispatch<React.SetStateAction<Member[]>>;
  showAddModalInitial?: boolean;
}

export function MembersTab({
  lang,
  adminFetch,
  dialogAlert,
  dialogConfirm,
  toast,
  membersList,
  setMembersList,
  showAddModalInitial = false,
}: MembersTabProps) {
  const t = ADMIN_I18N[lang];
  const [committeeSection, setCommitteeSection] =
    useState<CommitteeSection>("current");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(
    showAddModalInitial
  );
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  const [memberFilterCategory, setMemberFilterCategory] = useState<
    "all" | "current" | "officials" | "advisor" | "past"
  >("all");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const [memberForm, setMemberForm] = useState({
    nameEn: "",
    nameNe: "",
    roleEn: "",
    roleNe: "",
    committeeType: "current" as "current" | "officials" | "advisor" | "past",
    order: 10,
    phone: "",
    email: "",
    bioEn: "",
    bioNe: "",
    tenureEn: "",
    tenureNe: "",
    photoUrl: "",
  });

  const filteredAdminMembers = membersList
    .filter((m) => {
      if (memberFilterCategory === "all") return true;
      return m.committeeType === memberFilterCategory;
    })
    .filter((m) => {
      if (!memberSearchQuery.trim()) return true;
      const q = memberSearchQuery.toLowerCase();
      return (
        m.nameEn.toLowerCase().includes(q) ||
        m.nameNe.toLowerCase().includes(q) ||
        m.roleEn.toLowerCase().includes(q) ||
        m.roleNe.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const handleStartEditMember = (member: Member) => {
    setEditingMember(member);
    setMemberForm({
      nameEn: member.nameEn || "",
      nameNe: member.nameNe || "",
      roleEn: member.roleEn || "",
      roleNe: member.roleNe || "",
      committeeType: member.committeeType || "current",
      order: member.order || 10,
      phone: member.phone || "",
      email: member.email || "",
      bioEn: member.bioEn || "",
      bioNe: member.bioNe || "",
      tenureEn: member.tenureEn || "",
      tenureNe: member.tenureNe || "",
      photoUrl: member.photoUrl || "",
    });
    setShowAddMemberModal(true);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidName(memberForm.nameNe) || !isValidName(memberForm.nameEn)) {
      dialogAlert({
        title: lang === "ne" ? "नाम अमान्य वा अपूर्ण" : "Invalid Name",
        description:
          lang === "ne"
            ? "कृपया सदस्यको पूरा नाम दुवै भाषामा अनिवार्य भर्नुहोस्।"
            : "Please fill member names in both languages.",
        type: "warning",
      });
      return;
    }
    if (!memberForm.roleNe.trim() || !memberForm.roleEn.trim()) {
      dialogAlert({
        title: lang === "ne" ? "पद आवश्यक" : "Role Required",
        description:
          lang === "ne"
            ? "कृपया सदस्यको पद (भूमिका) दुवै भाषामा भर्नुहोस्।"
            : "Please enter member role in both languages.",
        type: "warning",
      });
      return;
    }
    if (memberForm.phone.trim() && !isValidPhone(memberForm.phone)) {
      dialogAlert({
        title: lang === "ne" ? "अमान्य फोन नम्बर" : "Invalid Phone Number",
        description:
          lang === "ne"
            ? "कृपया मान्य फोन नम्बर प्रविष्ट गर्नुहोस् (उदा. +977 9851012345)।"
            : "Please enter a valid phone number format.",
        type: "warning",
      });
      return;
    }
    if (memberForm.email.trim() && !isValidEmail(memberForm.email)) {
      dialogAlert({
        title: lang === "ne" ? "अमान्य इमेल ठेगाना" : "Invalid Email Address",
        description:
          lang === "ne"
            ? "कृपया मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस् (उदा. member@example.com)।"
            : "Please enter a valid email address.",
        type: "warning",
      });
      return;
    }

    setIsSavingMember(true);
    try {
      if (editingMember) {
        const updatedMember: Member = {
          ...editingMember,
          ...memberForm,
          nameNe: memberForm.nameNe.trim(),
          nameEn: memberForm.nameEn.trim(),
          roleNe: memberForm.roleNe.trim(),
          roleEn: memberForm.roleEn.trim(),
          phone: memberForm.phone.trim(),
          email: memberForm.email.trim(),
        };

        let finalMember = updatedMember;
        try {
          const res = await adminFetch("/api/members", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedMember),
          });
          const data = await res.json();
          if (data && data.success && data.data) {
            finalMember = data.data;
          }
        } catch (err) {
          console.error("Failed to update member in db:", err);
        }

        const updated = membersList.map((m) =>
          m.id === editingMember.id ? finalMember : m
        );
        setMembersList(updated);
        saveStoredMembers(updated);
        revalidateCollection("members");
        setShowAddMemberModal(false);
        setEditingMember(null);
        setMemberForm({
          nameEn: "",
          nameNe: "",
          roleEn: "",
          roleNe: "",
          committeeType: "current",
          order: 10,
          phone: "",
          email: "",
          bioEn: "",
          bioNe: "",
          tenureEn: "",
          tenureNe: "",
          photoUrl: "",
        });
        dialogAlert({
          title: lang === "ne" ? "सदस्य सम्पादन भयो" : "Member Updated",
          description:
            lang === "ne"
              ? `${finalMember.nameNe} को विवरण सफलतापूर्वक अद्यावधिक गरिएको छ।`
              : `${finalMember.nameEn}'s profile has been successfully updated.`,
          type: "success",
        });
        return;
      }

      const generatedId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `m-${Date.now()}`;

      const newMember: Member = {
        id: generatedId,
        ...memberForm,
        nameNe: memberForm.nameNe.trim(),
        nameEn: memberForm.nameEn.trim(),
        roleNe: memberForm.roleNe.trim(),
        roleEn: memberForm.roleEn.trim(),
        phone: memberForm.phone.trim(),
        email: memberForm.email.trim(),
      };

      let finalSavedMember = newMember;
      try {
        const res = await adminFetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newMember),
        });
        const data = await res.json();
        if (data && data.success && data.data) {
          finalSavedMember = data.data;
        }
      } catch (err) {
        console.error("Failed to sync member to db:", err);
      }

      const updated = [
        finalSavedMember,
        ...membersList.filter((m) => m.id !== finalSavedMember.id),
      ];
      setMembersList(updated);
      saveStoredMembers(updated);
      revalidateCollection("members");
      setShowAddMemberModal(false);
      setMemberForm({
        nameEn: "",
        nameNe: "",
        roleEn: "",
        roleNe: "",
        committeeType: "current",
        order: 10,
        phone: "",
        email: "",
        bioEn: "",
        bioNe: "",
        tenureEn: "",
        tenureNe: "",
        photoUrl: "",
      });
      dialogAlert({
        title: lang === "ne" ? "सदस्य थपियो" : "Member Added",
        description:
          lang === "ne"
            ? `${finalSavedMember.nameNe} कार्यसमिति रोस्टरमा थपिनुभएको छ।`
            : `${finalSavedMember.nameEn} has been added to the committee roster.`,
        type: "success",
      });
    } finally {
      setIsSavingMember(false);
    }
  };

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

  const handleMoveMember = async (member: Member, direction: "up" | "down") => {
    const index = filteredAdminMembers.findIndex((m) => m.id === member.id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= filteredAdminMembers.length) return;

    const arranged = [...filteredAdminMembers];
    const [lifted] = arranged.splice(index, 1);
    arranged.splice(target, 0, lifted);

    const renumbered = arranged.map((m, i) => ({ ...m, order: i + 1 }));
    const changed = renumbered.filter(
      (m) =>
        m.order !==
        (filteredAdminMembers.find((v) => v.id === m.id)?.order ?? 0)
    );

    const previous = membersList;
    const nextList = membersList.map(
      (m) => renumbered.find((r) => r.id === m.id) ?? m
    );
    setMembersList(nextList);

    try {
      const results = await Promise.all(
        changed.map((payload) =>
          adminFetch("/api/members", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        )
      );
      if (results.some((r) => !r.ok)) throw new Error("Reorder failed");
      saveStoredMembers(nextList);
    } catch {
      setMembersList(previous);
      toast.error(
        lang === "ne" ? "क्रम मिलाउन सकिएन" : "Could not reorder",
        lang === "ne" ? "कृपया पुनः प्रयास गर्नुहोस्।" : "Please try again."
      );
    }
  };

  const handleDeleteMember = async (id: string) => {
    const memberToDelete = membersList.find((m) => m.id === id);
    const confirmed = await dialogConfirm({
      title: t.removeMemberConfirmTitle,
      description: `${t.removeMemberConfirmDesc} (${
        memberToDelete
          ? lang === "ne"
            ? memberToDelete.nameNe
            : memberToDelete.nameEn
          : ""
      })`,
      type: "danger",
      confirmText: t.deleteBtn,
      cancelText: t.cancelBtn,
    });
    if (confirmed) {
      setDeletingMemberId(id);
      try {
        if (memberToDelete?.photoUrl) {
          deleteCloudinaryAsset(memberToDelete.photoUrl);
        }
        const res = await adminFetch(
          `/api/members?id=${encodeURIComponent(id)}`,
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
                ? "सर्भरबाट सदस्य हटाउन सकिएन।"
                : "Failed to remove member from server."),
            type: "danger",
          });
          return;
        }

        const updated = membersList.filter((m) => m.id !== id);
        setMembersList(updated);
        saveStoredMembers(updated);
        revalidateCollection("members");
        dialogAlert({
          title: lang === "ne" ? "सदस्य हटाइयो" : "Member Removed",
          description:
            lang === "ne"
              ? "सदस्य सफलतापूर्वक हटाइएको छ।"
              : "Member removed successfully.",
          type: "success",
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.message === "Session expired") return;
        console.error("Failed to delete member from db:", err);
      } finally {
        setDeletingMemberId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Subsection Selector */}
      <div className="flex flex-wrap gap-2">
        {COMMITTEE_SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              setCommitteeSection(s.key);
              if (s.key === "current" || s.key === "officials" || s.key === "advisor") {
                setMemberFilterCategory(s.key);
                setShowAddMemberModal(false);
                setEditingMember(null);
              }
            }}
            className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors cursor-pointer ${
              committeeSection === s.key
                ? "bg-accent text-on-accent"
                : "bg-surface border border-line text-fg hover:bg-tint"
            }`}
          >
            {lang === "ne" ? s.ne : s.en}
          </button>
        ))}
      </div>

      {committeeSection === "former-officials" ||
      committeeSection === "former-advisors" ? (
        <DocumentSectionEditor
          lang={lang}
          adminFetch={adminFetch}
          slugs={FORMER_COMMITTEE_DOC_SLUGS.filter(
            (s) => s.slug === committeeSection
          )}
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-fg">
                {committeeSection === "current"
                  ? t.current
                  : committeeSection === "officials"
                  ? t.officials
                  : committeeSection === "advisor"
                  ? t.advisor
                  : t.members}
              </h2>
              <p className="text-xs text-muted mt-0.5">
                {lang === "ne"
                  ? "तपाईंले यहाँबाट सदस्यहरूको विवरण र तस्बिर अद्यावधिक गर्न सक्नुहुन्छ।"
                  : "Manage profiles, contact details, and display sequence."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (showAddMemberModal) {
                  setShowAddMemberModal(false);
                  setEditingMember(null);
                } else {
                  setEditingMember(null);
                  setMemberForm({
                    nameEn: "",
                    nameNe: "",
                    roleEn: "",
                    roleNe: "",
                    committeeType: "current",
                    order:
                      membersList.reduce(
                        (max, m) => Math.max(max, m.order ?? 0),
                        0
                      ) + 1,
                    phone: "",
                    email: "",
                    bioEn: "",
                    bioNe: "",
                    tenureEn: "",
                    tenureNe: "",
                    photoUrl: "",
                  });
                  setShowAddMemberModal(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>{showAddMemberModal ? t.closeBtn : t.addMember}</span>
            </button>
          </div>

          {showAddMemberModal && (
            <form
              onSubmit={handleAddMember}
              className="p-6 rounded-card border border-accent/40 bg-surface space-y-4 shadow-e1"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-accent">
                  {editingMember ? t.editMember : t.addMember}
                </div>
                {editingMember && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMember(null);
                      setShowAddMemberModal(false);
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
                    Full Name (English) *
                  </label>
                  <input
                    required
                    type="text"
                    value={memberForm.nameEn}
                    onChange={(e) =>
                      setMemberForm({ ...memberForm, nameEn: e.target.value })
                    }
                    placeholder="Dr. Ram Chandra Gyawali"
                    className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">
                    पूरा नाम (नेपाली) *
                  </label>
                  <input
                    required
                    type="text"
                    value={memberForm.nameNe}
                    onChange={(e) =>
                      setMemberForm({ ...memberForm, nameNe: e.target.value })
                    }
                    placeholder="डा. रामचन्द्र ज्ञवाली"
                    className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">
                    Role (English) *
                  </label>
                  <input
                    required
                    type="text"
                    value={memberForm.roleEn}
                    onChange={(e) =>
                      setMemberForm({ ...memberForm, roleEn: e.target.value })
                    }
                    placeholder="President"
                    className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">
                    पद (नेपाली) *
                  </label>
                  <input
                    required
                    type="text"
                    value={memberForm.roleNe}
                    onChange={(e) =>
                      setMemberForm({ ...memberForm, roleNe: e.target.value })
                    }
                    placeholder="अध्यक्ष"
                    className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                  />
                </div>
              </div>

              <div className="space-y-1.5 max-w-[16rem]">
                <label
                  htmlFor="member-order"
                  className="text-xs font-semibold text-fg"
                >
                  {lang === "ne" ? "क्रम" : "Display order"}
                </label>
                <input
                  id="member-order"
                  type="number"
                  min={1}
                  value={memberForm.order}
                  onChange={(e) =>
                    setMemberForm({
                      ...memberForm,
                      order: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                />
                <p className="text-[11px] text-muted">
                  {lang === "ne"
                    ? "सानो अङ्क माथि देखिन्छ। अध्यक्षलाई १ दिनुहोस्।"
                    : "A lower number appears first. Give the president 1."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">Category</label>
                  <select
                    value={memberForm.committeeType}
                    onChange={(e) =>
                      setMemberForm({
                        ...memberForm,
                        committeeType: e.target.value as "current" | "officials" | "advisor",
                      })
                    }
                    className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                  >
                    <option value="current">
                      {lang === "ne" ? "हाम्रो नेतृत्व" : "Our Leadership"}
                    </option>
                    <option value="officials">
                      {lang === "ne" ? "वर्तमान पदाधिकारीहरू" : "Current Office Bearers"}
                    </option>
                    <option value="advisor">
                      {lang === "ne" ? "सल्लाहकार परिषद्" : "Advisory Council"}
                    </option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">Phone</label>
                  <input
                    type="text"
                    value={memberForm.phone}
                    onChange={(e) =>
                      setMemberForm({ ...memberForm, phone: e.target.value })
                    }
                    placeholder="+977 98..."
                    className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                  />
                </div>
              </div>

              <CloudinaryUploader
                label="Member Portrait Photo (Max 2MB)"
                description="Clear portrait photo"
                folder="members"
                accept="image/*"
                value={memberForm.photoUrl}
                onChange={(url) =>
                  setMemberForm({ ...memberForm, photoUrl: url })
                }
              />

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSavingMember}
                  className="px-5 py-2 rounded-control btn-fill bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  {isSavingMember && (
                    <CircleNotch size={14} className="animate-spin" />
                  )}
                  <span>
                    {isSavingMember
                      ? lang === "ne"
                        ? "सुरक्षित गर्दै..."
                        : "Saving..."
                      : editingMember
                      ? lang === "ne"
                        ? "परिवर्तन सुरक्षित गर्नुहोस्"
                        : "Save Changes"
                      : t.saveChanges}
                  </span>
                </button>
                {editingMember && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMember(null);
                      setShowAddMemberModal(false);
                    }}
                    className="px-4 py-2 rounded-control border border-line text-xs font-medium text-muted hover:text-fg cursor-pointer"
                  >
                    {t.cancelBtn}
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Filter and Search */}
          <div className="p-4 rounded-card border border-line bg-surface space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setMemberFilterCategory("all")}
                  className={`px-3 py-1.5 rounded-control text-xs font-medium transition-colors cursor-pointer ${
                    memberFilterCategory === "all"
                      ? "bg-accent text-on-accent"
                      : "bg-ground border border-line text-fg hover:bg-tint"
                  }`}
                >
                  {t.all} ({membersList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMemberFilterCategory("current")}
                  className={`px-3 py-1.5 rounded-control text-xs font-medium transition-colors cursor-pointer ${
                    memberFilterCategory === "current"
                      ? "bg-accent text-on-accent"
                      : "bg-ground border border-line text-fg hover:bg-tint"
                  }`}
                >
                  {t.current} (
                  {
                    membersList.filter((m) => m.committeeType === "current")
                      .length
                  }
                  )
                </button>
                <button
                  type="button"
                  onClick={() => setMemberFilterCategory("officials")}
                  className={`px-3 py-1.5 rounded-control text-xs font-medium transition-colors cursor-pointer ${
                    memberFilterCategory === "officials"
                      ? "bg-accent text-on-accent"
                      : "bg-ground border border-line text-fg hover:bg-tint"
                  }`}
                >
                  {t.officials} (
                  {
                    membersList.filter((m) => m.committeeType === "officials")
                      .length
                  }
                  )
                </button>
                <button
                  type="button"
                  onClick={() => setMemberFilterCategory("advisor")}
                  className={`px-3 py-1.5 rounded-control text-xs font-medium transition-colors cursor-pointer ${
                    memberFilterCategory === "advisor"
                      ? "bg-accent text-on-accent"
                      : "bg-ground border border-line text-fg hover:bg-tint"
                  }`}
                >
                  {t.advisor} (
                  {
                    membersList.filter((m) => m.committeeType === "advisor")
                      .length
                  }
                  )
                </button>
              </div>

              <div className="relative w-full sm:w-56">
                <MagnifyingGlass
                  size={14}
                  className="absolute left-2.5 top-2.5 text-muted"
                />
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder={t.search}
                  className="w-full pl-8 pr-3 py-1.5 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
                />
              </div>
            </div>

            {/* Table list */}
            <div className="divide-y divide-line">
              {filteredAdminMembers.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted">
                  {t.noMembers}
                </div>
              ) : (
                filteredAdminMembers.map((member) => (
                  <div
                    key={member.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-control bg-accent-soft text-accent flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {member.nameEn.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-fg truncate">
                          {lang === "ne" ? member.nameNe : member.nameEn}{" "}
                          <span className="text-muted font-normal">
                            ({lang === "ne" ? member.nameEn : member.nameNe})
                          </span>
                        </div>
                        <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                          <span className="text-accent font-medium">
                            {lang === "ne" ? member.roleNe : member.roleEn}
                          </span>
                          {member.phone && (
                            <span className="font-mono text-muted">
                              {member.phone}
                            </span>
                          )}
                          <span className="text-muted text-[10px]">
                            (
                            {member.committeeType === "current"
                              ? (lang === "ne" ? "हाम्रो नेतृत्व" : "Our Leadership")
                              : member.committeeType === "officials"
                              ? (lang === "ne" ? "वर्तमान पदाधिकारीहरू" : "Current Office Bearers")
                              : member.committeeType === "advisor"
                              ? (lang === "ne" ? "सल्लाहकार परिषद्" : "Advisory Council")
                              : member.committeeType}
                            )
                          </span>
                          <span className="font-mono text-[10px] text-muted">
                            #{member.order ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center mr-1">
                        <button
                          type="button"
                          onClick={() => handleMoveMember(member, "up")}
                          disabled={filteredAdminMembers[0]?.id === member.id}
                          aria-label={
                            lang === "ne" ? "माथि सार्नुहोस्" : "Move up"
                          }
                          title={
                            lang === "ne" ? "माथि सार्नुहोस्" : "Move up"
                          }
                          className="p-1.5 text-muted hover:text-accent hover:bg-accent/10 rounded-control transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <CaretUp size={14} weight="bold" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveMember(member, "down")}
                          disabled={
                            filteredAdminMembers[
                              filteredAdminMembers.length - 1
                            ]?.id === member.id
                          }
                          aria-label={
                            lang === "ne" ? "तल सार्नुहोस्" : "Move down"
                          }
                          title={
                            lang === "ne" ? "तल सार्नुहोस्" : "Move down"
                          }
                          className="p-1.5 text-muted hover:text-accent hover:bg-accent/10 rounded-control transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <CaretDown size={14} weight="bold" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartEditMember(member)}
                        className="p-1.5 text-accent hover:bg-accent/10 rounded-control transition-colors cursor-pointer"
                        title={t.editBtn}
                      >
                        <PencilSimple size={15} />
                      </button>
                      <button
                        type="button"
                        disabled={deletingMemberId === member.id}
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-1.5 text-danger hover:bg-danger/10 disabled:opacity-60 rounded-control transition-colors cursor-pointer"
                        title={t.deleteBtn}
                      >
                        {deletingMemberId === member.id ? (
                          <CircleNotch size={15} className="animate-spin" />
                        ) : (
                          <Trash size={15} />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
