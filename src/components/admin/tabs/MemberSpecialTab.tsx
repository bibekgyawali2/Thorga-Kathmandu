"use client";

import React, { useState, useEffect, useMemo } from "react";
import { BaseTabProps } from "../adminTypes";
import {
  MemberSpecialRecord,
  MemberSpecialFinance,
  MemberSpecialUser,
  saveStoredMemberRecords,
  saveStoredMemberFinances,
} from "@/data/mockData";
import {
  isGoogleDriveUrl,
  getGoogleDrivePreviewUrl,
  getGoogleDriveViewUrl,
  getGoogleDriveDownloadUrl,
} from "@/lib/googleDrive";
import {
  FileText,
  Coins,
  UsersThree,
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
  XCircle,
  ShieldCheck,
  TrendUp,
  TrendDown,
  LockKey,
  Info,
  CalendarBlank,
} from "@phosphor-icons/react";

interface MemberSpecialTabProps extends BaseTabProps {
  // Can be optionally passed if parent holds state or self-managed
}

export function MemberSpecialTab({
  lang,
  adminFetch,
  dialogAlert,
  dialogConfirm,
  toast,
  session,
}: MemberSpecialTabProps) {
  // Sub-tab selection: "records" (अभिलेख) | "finances" (आम्दानी/खर्च) | "users" (सदस्य पहुँच खाता)
  const [subTab, setSubTab] = useState<"records" | "finances" | "users">("records");

  // Data states
  const [records, setRecords] = useState<MemberSpecialRecord[]>([]);
  const [finances, setFinances] = useState<MemberSpecialFinance[]>([]);
  const [users, setUsers] = useState<MemberSpecialUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MemberSpecialRecord | null>(null);
  const [recordForm, setRecordForm] = useState({
    title: "",
    driveUrl: "",
    displayOrder: 0,
  });

  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [editingFinance, setEditingFinance] = useState<MemberSpecialFinance | null>(null);
  const [financeForm, setFinanceForm] = useState({
    title: "",
    type: "income" as "income" | "expense",
    amount: "",
    fiscalYear: "२०८१/०८२",
    dateBs: "",
    category: "सदस्यता शुल्क",
    documentUrl: "",
    remarks: "",
  });

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<MemberSpecialUser | null>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    username: "",
    password: "",
    phone: "",
    notes: "",
    isActive: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Document preview modal
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState("");

  // Load all initial data
  const loadAll = React.useCallback(async () => {
    try {
      const [rRes, fRes, uRes] = await Promise.all([
        adminFetch("/api/member-special/records"),
        adminFetch("/api/member-special/finances"),
        adminFetch("/api/member-special/users"),
      ]);

      if (rRes.ok) {
        const rData = await rRes.json();
        setRecords(rData);
        saveStoredMemberRecords(rData);
      }
      if (fRes.ok) {
        const fData = await fRes.json();
        setFinances(fData);
        saveStoredMemberFinances(fData);
      }
      if (uRes.ok) {
        const uData = await uRes.json();
        setUsers(uData);
      }
    } catch (err) {
      console.error("[MemberSpecialTab] load error:", err);
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ---------------------------------------------------------------------------
  // 1. RECORD (अभिलेख) ACTIONS
  // ---------------------------------------------------------------------------

  const handleOpenAddRecord = () => {
    setEditingRecord(null);
    setRecordForm({
      title: "",
      driveUrl: "",
      displayOrder: records.length + 1,
    });
    setShowRecordModal(true);
  };

  const handleOpenEditRecord = (r: MemberSpecialRecord) => {
    setEditingRecord(r);
    setRecordForm({
      title: r.title,
      driveUrl: r.driveUrl,
      displayOrder: r.displayOrder || 0,
    });
    setShowRecordModal(true);
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordForm.title.trim()) {
      dialogAlert({
        title: "शीर्षक आवश्यक छ",
        description: "कृपया अभिलेखको शीर्षक लेख्नुहोस्।",
      });
      return;
    }

    const trimmedUrl = recordForm.driveUrl.trim();
    if (!trimmedUrl) {
      dialogAlert({
        title: "गुगल ड्राइभ लिङ्क आवश्यक छ",
        description: "कृपया गुगल ड्राइभको लिङ्क राख्नुहोस्।",
      });
      return;
    }

    // STRICT CHECK FOR GOOGLE DRIVE URL
    if (!isGoogleDriveUrl(trimmedUrl)) {
      dialogAlert({
        title: "अमान्य लिङ्क (Google Drive Required)",
        description:
          "अभिलेखको लागि केवल गुगल ड्राइभ (Google Drive) को लिङ्क मात्र मान्य छ। कृपया Google Drive मा फाइल सेयर गरी 'Anyone with the link can view' लिङ्क यहाँ राख्नुहोस्।",
        type: "danger",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        id: editingRecord?.id,
        title: recordForm.title.trim(),
        driveUrl: trimmedUrl,
        displayOrder: Number(recordForm.displayOrder) || 0,
      };

      const res = await adminFetch("/api/member-special/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "सुरक्षित गर्न सकिएन।");
      }

      toast.success(editingRecord ? "अभिलेख अद्यावधिक भयो।" : "नयाँ अभिलेख थपियो।");
      setShowRecordModal(false);
      loadAll();
    } catch (err) {
      dialogAlert({
        title: "त्रुटि",
        description: (err as Error).message,
        type: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecord = async (r: MemberSpecialRecord) => {
    const ok = await dialogConfirm({
      title: "अभिलेख मेटाउने?",
      description: `के तपाईं "${r.title}" अभिलेख मेटाउन निश्चित हुनुहुन्छ?`,
      type: "danger",
      confirmText: "मेटाउनुहोस्",
    });
    if (!ok) return;

    try {
      const res = await adminFetch(`/api/member-special/records?id=${r.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("मेटाउन सकिएन।");
      toast.success("अभिलेख सफलतापूर्वक मेटाइयो।");
      setRecords((prev) => prev.filter((item) => item.id !== r.id));
      saveStoredMemberRecords(records.filter((item) => item.id !== r.id));
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // ---------------------------------------------------------------------------
  // 2. FINANCE (आम्दानी / खर्च) ACTIONS
  // ---------------------------------------------------------------------------

  const handleOpenAddFinance = (typeOrEvent?: "income" | "expense" | React.MouseEvent) => {
    const defaultType: "income" | "expense" = typeOrEvent === "expense" ? "expense" : "income";
    setEditingFinance(null);
    setFinanceForm({
      title: "",
      type: defaultType,
      amount: "",
      fiscalYear: "२०८१/०८२",
      dateBs: "",
      category: defaultType === "income" ? "सदस्यता शुल्क" : "कार्यक्रम खर्च",
      documentUrl: "",
      remarks: "",
    });
    setShowFinanceModal(true);
  };

  const handleOpenEditFinance = (f: MemberSpecialFinance) => {
    setEditingFinance(f);
    setFinanceForm({
      title: f.title,
      type: f.type,
      amount: String(f.amount),
      fiscalYear: f.fiscalYear || "२०८१/०८२",
      dateBs: f.dateBs || "",
      category: f.category || "विविध",
      documentUrl: f.documentUrl || "",
      remarks: f.remarks || "",
    });
    setShowFinanceModal(true);
  };

  const handleSaveFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!financeForm.title.trim()) {
      dialogAlert({
        title: "विवरण आवश्यक छ",
        description: "कृपया आय-व्ययको शीर्षक वा विवरण लेख्नुहोस्।",
      });
      return;
    }

    const amt = parseFloat(financeForm.amount);
    if (isNaN(amt) || amt <= 0) {
      dialogAlert({
        title: "रकम अमान्य",
        description: "कृपया वैध रकम प्रविष्ट गर्नुहोस्।",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        id: editingFinance?.id,
        title: financeForm.title.trim(),
        type: financeForm.type,
        amount: amt,
        fiscalYear: financeForm.fiscalYear.trim(),
        dateBs: financeForm.dateBs.trim(),
        category: financeForm.category.trim(),
        documentUrl: financeForm.documentUrl.trim(),
        remarks: financeForm.remarks.trim(),
      };

      const res = await adminFetch("/api/member-special/finances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "सुरक्षित गर्न सकिएन।");
      }

      toast.success(editingFinance ? "आर्थिक विवरण अद्यावधिक भयो।" : "नयाँ आर्थिक विवरण थपियो।");
      setShowFinanceModal(false);
      loadAll();
    } catch (err) {
      dialogAlert({
        title: "त्रुटि",
        description: (err as Error).message,
        type: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFinance = async (f: MemberSpecialFinance) => {
    const ok = await dialogConfirm({
      title: "आर्थिक विवरण मेटाउने?",
      description: `के तपाईं "${f.title}" (रु. ${Number(f.amount).toLocaleString("ne-NP")}) मेटाउन निश्चित हुनुहुन्छ?`,
      type: "danger",
      confirmText: "मेटाउनुहोस्",
    });
    if (!ok) return;

    try {
      const res = await adminFetch(`/api/member-special/finances?id=${f.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("मेटाउन सकिएन।");
      toast.success("आर्थिक विवरण सफलतापूर्वक मेटाइयो।");
      setFinances((prev) => prev.filter((item) => item.id !== f.id));
      saveStoredMemberFinances(finances.filter((item) => item.id !== f.id));
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. MEMBER USERS (सदस्य पहुँच) ACTIONS
  // ---------------------------------------------------------------------------

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserForm({
      name: "",
      username: "",
      password: "",
      phone: "",
      notes: "",
      isActive: true,
    });
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u: MemberSpecialUser) => {
    setEditingUser(u);
    setUserForm({
      name: u.name,
      username: u.username,
      password: "", // blank means don't change
      phone: u.phone || "",
      notes: u.notes || "",
      isActive: u.isActive !== false,
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim() || userForm.name.trim().length < 2) {
      dialogAlert({
        title: "नाम आवश्यक छ",
        description: "कृपया सदस्यको पूरा नाम लेख्नुहोस्।",
      });
      return;
    }

    if (!userForm.username.trim() || userForm.username.trim().length < 3) {
      dialogAlert({
        title: "प्रयोगकर्ता नाम अमान्य",
        description: "प्रयोगकर्ता नाम कम्तिमा ३ अक्षरको हुनुपर्छ।",
      });
      return;
    }

    if (!editingUser && (!userForm.password || userForm.password.length < 6)) {
      dialogAlert({
        title: "पासवर्ड आवश्यक छ",
        description: "नयाँ सदस्य खाताको लागि पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ।",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        id: editingUser?.id,
        name: userForm.name.trim(),
        username: userForm.username.trim().toLowerCase(),
        phone: userForm.phone.trim(),
        notes: userForm.notes.trim(),
        isActive: userForm.isActive,
      };

      if (userForm.password && userForm.password.trim()) {
        payload.password = userForm.password.trim();
      }

      const res = await adminFetch("/api/member-special/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "सुरक्षित गर्न सकिएन।");
      }

      toast.success(editingUser ? "सदस्य विवरण अद्यावधिक भयो।" : "नयाँ सदस्य पहुँच थपियो।");
      setShowUserModal(false);
      loadAll();
    } catch (err) {
      dialogAlert({
        title: "त्रुटि",
        description: (err as Error).message,
        type: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleUserActive = async (u: MemberSpecialUser) => {
    try {
      const updatedStatus = !u.isActive;
      const res = await adminFetch("/api/member-special/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: u.id,
          name: u.name,
          username: u.username,
          isActive: updatedStatus,
        }),
      });

      if (!res.ok) throw new Error("स्थिति परिवर्तन गर्न सकिएन।");
      toast.success(updatedStatus ? "सदस्य खाता सक्रिय गरियो।" : "सदस्य खाता निष्क्रिय गरियो।");
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, isActive: updatedStatus } : item))
      );
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDeleteUser = async (u: MemberSpecialUser) => {
    const ok = await dialogConfirm({
      title: "सदस्य खाता मेटाउने?",
      description: `के तपाईं "${u.name}" (@${u.username}) को पहुँच मेटाउन निश्चित हुनुहुन्छ? यसो गर्दा उहाँले सदस्य विशेष पृष्ठ हेर्न पाउनुहुने छैन।`,
      type: "danger",
      confirmText: "मेटाउनुहोस्",
    });
    if (!ok) return;

    try {
      const res = await adminFetch(`/api/member-special/users?id=${u.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("मेटाउन सकिएन।");
      toast.success("सदस्य खाता सफलतापूर्वक मेटाइयो।");
      setUsers((prev) => prev.filter((item) => item.id !== u.id));
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // Calculations for summary
  const totalIncome = useMemo(
    () => finances.filter((f) => f.type === "income").reduce((s, f) => s + (Number(f.amount) || 0), 0),
    [finances]
  );
  const totalExpense = useMemo(
    () => finances.filter((f) => f.type === "expense").reduce((s, f) => s + (Number(f.amount) || 0), 0),
    [finances]
  );
  const incomeFinances = useMemo(() => finances.filter((f) => f.type === "income"), [finances]);
  const expenseFinances = useMemo(() => finances.filter((f) => f.type === "expense"), [finances]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Main Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-fg">सदस्य विशेष व्यवस्थापन</h2>
          </div>
          <p className="text-xs text-muted mt-1">
            अधिकृत सदस्यहरूका लागि आन्तरिक अभिलेख (Google Drive PDF), आय-व्यय विवरण, र सदस्य लगइन पहुँच नियन्त्रण।
          </p>
        </div>

        {/* Primary Action Button based on active sub-tab */}
        <div className="flex items-center gap-2 flex-wrap">
          {subTab === "records" && (
            <button
              type="button"
              id="admin-btn-add-abhilekh"
              onClick={handleOpenAddRecord}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-e1 transition-colors cursor-pointer"
            >
              <Plus size={16} weight="bold" />
              <span>नयाँ अभिलेख थप्नुहोस्</span>
            </button>
          )}
          {subTab === "finances" && (
            <button
              type="button"
              id="admin-btn-add-finance"
              onClick={handleOpenAddFinance}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-e1 transition-colors cursor-pointer"
            >
              <Plus size={16} weight="bold" />
              <span>नयाँ आर्थिक विवरण थप्नुहोस्</span>
            </button>
          )}
          {subTab === "users" && (
            <button
              type="button"
              id="admin-btn-add-user"
              onClick={handleOpenAddUser}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-e1 transition-colors cursor-pointer"
            >
              <Plus size={16} weight="bold" />
              <span>नयाँ सदस्य पहुँच थप्नुहोस्</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tab Navigation Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            id="tab-btn-records"
            onClick={() => setSubTab("records")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-control text-xs font-semibold transition-colors cursor-pointer ${
              subTab === "records"
                ? "btn-fill bg-accent text-on-accent shadow-e1"
                : "text-muted hover:text-fg hover:bg-tint"
            }`}
          >
            <FileText size={16} weight={subTab === "records" ? "fill" : "regular"} />
            <span>अभिलेख ({records.length})</span>
          </button>

          <button
            type="button"
            id="tab-btn-finances"
            onClick={() => setSubTab("finances")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-control text-xs font-semibold transition-colors cursor-pointer ${
              subTab === "finances"
                ? "btn-fill bg-accent text-on-accent shadow-e1"
                : "text-muted hover:text-fg hover:bg-tint"
            }`}
          >
            <Coins size={16} weight={subTab === "finances" ? "fill" : "regular"} />
            <span>आम्दानी र खर्च ({finances.length})</span>
          </button>

          <button
            type="button"
            id="tab-btn-users"
            onClick={() => setSubTab("users")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-control text-xs font-semibold transition-colors cursor-pointer ${
              subTab === "users"
                ? "btn-fill bg-accent text-on-accent shadow-e1"
                : "text-muted hover:text-fg hover:bg-tint"
            }`}
          >
            <UsersThree size={16} weight={subTab === "users" ? "fill" : "regular"} />
            <span>सदस्य पहुँच खाता ({users.length})</span>
          </button>
        </div>

        {/* Secondary visible shortcut on the right */}
        <div className="hidden sm:block">
          {subTab === "records" && (
            <button
              type="button"
              onClick={handleOpenAddRecord}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-control text-xs font-medium text-accent hover:bg-accent-soft transition-colors cursor-pointer"
            >
              <Plus size={14} weight="bold" />
              <span>+ अभिलेख थप्नुहोस्</span>
            </button>
          )}
          {subTab === "finances" && (
            <button
              type="button"
              onClick={handleOpenAddFinance}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-control text-xs font-medium text-accent hover:bg-accent-soft transition-colors cursor-pointer"
            >
              <Plus size={14} weight="bold" />
              <span>+ आर्थिक विवरण थप्नुहोस्</span>
            </button>
          )}
          {subTab === "users" && (
            <button
              type="button"
              onClick={handleOpenAddUser}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-control text-xs font-medium text-accent hover:bg-accent-soft transition-colors cursor-pointer"
            >
              <Plus size={14} weight="bold" />
              <span>+ सदस्य पहुँच थप्नुहोस्</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="p-12 text-center text-muted">
          <CircleNotch size={28} className="animate-spin mx-auto mb-2 text-accent" />
          <p className="text-xs">विवरण लोड हुँदैछ...</p>
        </div>
      ) : (
        <>
          {/* ================================================================= */}
          {/* SUBTAB 1: RECORDS (अभिलेख व्यवस्थापन)                             */}
          {/* ================================================================= */}
          {subTab === "records" && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2">
                <Info size={16} className="shrink-0 mt-0.5" />
                <span>
                  अभिलेखको लागि केवल गुगल ड्राइभ (Google Drive) को PDF सेयरिङ लिङ्क मान्य हुन्छ।
                </span>
              </div>

              {records.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-line rounded-2xl bg-surface/50">
                  <FileText size={40} className="mx-auto text-accent mb-3" weight="duotone" />
                  <p className="text-sm font-bold text-fg">अभिलेख सूची खाली छ</p>
                  <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                    हालसम्म कुनै बैठक निर्णय वा आधिकारिक कागजात थपिएको छैन। नयाँ अभिलेख थप्न तलको बटन थिच्नुहोस्।
                  </p>
                  <button
                    type="button"
                    id="empty-add-record-btn"
                    onClick={handleOpenAddRecord}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-e1 transition-colors cursor-pointer"
                  >
                    <Plus size={16} weight="bold" />
                    <span>नयाँ अभिलेख थप्नुहोस्</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted font-medium">
                      कुल {records.length} अभिलेख कागजातहरू उपलब्ध छन्।
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenAddRecord}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-e1 transition-colors cursor-pointer"
                    >
                      <Plus size={14} weight="bold" />
                      <span>+ नयाँ अभिलेख</span>
                    </button>
                  </div>

                  <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-line bg-tint/60 text-muted uppercase font-mono tracking-wider text-[11px]">
                          <th className="py-3 px-4">अभिलेख शीर्षक (Title)</th>
                          <th className="py-3 px-4">गुगल ड्राइभ लिङ्क (Drive PDF Link)</th>
                          <th className="py-3 px-4 text-right">कार्यहरू</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {records.map((r) => (
                          <tr key={r.id} className="hover:bg-tint/40 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-fg text-sm flex items-center gap-2">
                                <FilePdf size={18} weight="fill" className="text-rose-500 shrink-0" />
                                <span>{r.title}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewDocUrl(r.driveUrl);
                                    setPreviewDocTitle(r.title);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control text-[11px] font-semibold bg-accent-soft text-accent hover:bg-accent hover:text-on-accent transition-colors cursor-pointer"
                                >
                                  <Eye size={13} weight="bold" />
                                  <span>हेर्नुहोस्</span>
                                </button>
                                <a
                                  href={getGoogleDriveViewUrl(r.driveUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-control text-muted hover:text-fg hover:bg-tint transition-colors inline-flex items-center gap-1 text-[11px]"
                                  title="Google Drive मा खोल्नुहोस्"
                                >
                                  <ArrowSquareOut size={14} />
                                  <span>ड्राइभ खोल्नुहोस्</span>
                                </a>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditRecord(r)}
                                  className="p-1.5 rounded-control text-muted hover:text-accent hover:bg-accent-soft transition-colors cursor-pointer"
                                  title="सम्पादन गर्नुहोस्"
                                >
                                  <PencilSimple size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRecord(r)}
                                  className="p-1.5 rounded-control text-muted hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="मेटाउनुहोस्"
                                >
                                  <Trash size={15} />
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
            </div>
          )}

          {/* ================================================================= */}
          {/* SUBTAB 2: FINANCES (आम्दानी र खर्च व्यवस्थापन)                     */}
          {/* ================================================================= */}
          {subTab === "finances" && (
            <div className="space-y-4">
              {/* Financial mini-stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                    कुल आम्दानी (Total Income)
                  </div>
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                    रु. {totalIncome.toLocaleString("ne-NP")}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
                  <div className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold">
                    कुल खर्च (Total Expense)
                  </div>
                  <div className="text-xl font-black text-rose-700 dark:text-rose-400 mt-1">
                    रु. {totalExpense.toLocaleString("ne-NP")}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-accent/20 bg-accent-soft/30">
                  <div className="text-[11px] text-accent font-semibold">
                    कुल मौज्दात (Net Balance)
                  </div>
                  <div className="text-xl font-black text-accent mt-1">
                    रु. {(totalIncome - totalExpense).toLocaleString("ne-NP")}
                  </div>
                </div>
              </div>

              {finances.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-line rounded-2xl bg-surface/50">
                  <Coins size={40} className="mx-auto text-accent mb-3" weight="duotone" />
                  <p className="text-sm font-bold text-fg">कुनै आर्थिक विवरण प्रविष्ट छैन</p>
                  <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                    हालसम्म कुनै आय वा व्यय विवरण राखिएको छैन। नयाँ आर्थिक विवरण थप्न तलको बटन थिच्नुहोस्।
                  </p>
                  <button
                    type="button"
                    id="empty-add-finance-btn"
                    onClick={handleOpenAddFinance}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-e1 transition-colors cursor-pointer"
                  >
                    <Plus size={16} weight="bold" />
                    <span>नयाँ आर्थिक विवरण थप्नुहोस्</span>
                  </button>
                </div>
              ) : (
              <div className="space-y-4">
                {/* Header Action Bar with specific Add Income & Add Expense buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-3.5 rounded-xl border border-line">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-fg">सन्तुलन खाता:</span>
                    <span className="text-xs text-muted">
                      आम्दानी {incomeFinances.length} र खर्च {expenseFinances.length} प्रविष्टि
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenAddFinance("income")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control btn-fill bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-e1 transition-colors cursor-pointer"
                    >
                      <Plus size={14} weight="bold" />
                      <span>+ नयाँ आम्दानी</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenAddFinance("expense")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control btn-fill bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-e1 transition-colors cursor-pointer"
                    >
                      <Plus size={14} weight="bold" />
                      <span>+ नयाँ खर्च</span>
                    </button>
                  </div>
                </div>

                {/* Two-Column Trial Balance Grid (Left: Income, Right: Expense) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                  {/* =================================================== */}
                  {/* LEFT COLUMN: आम्दानी (INCOME)                        */}
                  {/* =================================================== */}
                  <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-xs flex flex-col">
                    <div className="bg-tint/40 border-b border-line px-3.5 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                          <TrendUp size={14} weight="bold" />
                        </div>
                        <h4 className="text-xs font-bold text-fg">आम्दानी</h4>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          रु. {totalIncome.toLocaleString("ne-NP")}
                        </div>
                        <span className="text-[10px] text-muted">{incomeFinances.length} प्रविष्टि</span>
                      </div>
                    </div>

                    {incomeFinances.length === 0 ? (
                      <div className="p-8 text-center text-muted">
                        <TrendUp size={26} className="mx-auto text-emerald-500/40 mb-1.5" />
                        <p className="text-xs font-medium">कुनै आम्दानी प्रविष्टि छैन</p>
                        <button
                          type="button"
                          onClick={() => handleOpenAddFinance("income")}
                          className="mt-2 text-xs text-emerald-600 hover:underline font-semibold"
                        >
                          + आम्दानी थप्नुहोस्
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-line bg-tint/40 text-muted uppercase font-mono tracking-wider text-[10px]">
                              <th className="py-2 px-3">मिति</th>
                              <th className="py-2 px-3">विवरण</th>
                              <th className="py-2 px-1 text-center">बिल</th>
                              <th className="py-2 px-3 text-right">रकम (रु.)</th>
                              <th className="py-2 px-2 text-right">कार्य</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line">
                            {incomeFinances.map((f) => (
                              <tr key={f.id} className="hover:bg-tint/30 transition-colors">
                                <td className="py-2.5 px-3 font-mono text-muted whitespace-nowrap text-[11px]">
                                  <div>{f.dateBs || "—"}</div>
                                  {f.fiscalYear && (
                                    <div className="text-[9px] text-accent font-semibold">{f.fiscalYear}</div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-fg text-xs">{f.title}</div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                                      {f.category || "विविध"}
                                    </span>
                                    {f.remarks && (
                                      <span className="text-[10px] text-muted truncate max-w-[120px]" title={f.remarks}>
                                        {f.remarks}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-1 text-center whitespace-nowrap">
                                  {f.documentUrl ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPreviewDocUrl(f.documentUrl!);
                                        setPreviewDocTitle(f.title);
                                      }}
                                      className="p-1 rounded text-accent hover:bg-accent-soft transition-colors cursor-pointer"
                                      title="प्रमाण हेर्नुहोस्"
                                    >
                                      <Eye size={13} />
                                    </button>
                                  ) : (
                                    <span className="text-muted text-[10px]">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-xs whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                                  रु. {Number(f.amount).toLocaleString("ne-NP")}
                                </td>
                                <td className="py-2.5 px-2 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditFinance(f)}
                                      className="p-1 rounded-md text-muted hover:text-accent hover:bg-accent-soft transition-colors"
                                      title="सम्पादन गर्नुहोस्"
                                    >
                                      <PencilSimple size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteFinance(f)}
                                      className="p-1 rounded-md text-muted hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                                      title="मेटाउनुहोस्"
                                    >
                                      <Trash size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-line bg-tint/30 font-semibold">
                              <td colSpan={3} className="py-2 px-3 text-xs text-fg">
                                कुल आम्दानी:
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                रु. {totalIncome.toLocaleString("ne-NP")}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* =================================================== */}
                  {/* RIGHT COLUMN: खर्च (EXPENSE)                        */}
                  {/* =================================================== */}
                  <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-xs flex flex-col">
                    <div className="bg-tint/40 border-b border-line px-3.5 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                          <TrendDown size={14} weight="bold" />
                        </div>
                        <h4 className="text-xs font-bold text-fg">खर्च</h4>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                          रु. {totalExpense.toLocaleString("ne-NP")}
                        </div>
                        <span className="text-[10px] text-muted">{expenseFinances.length} प्रविष्टि</span>
                      </div>
                    </div>

                    {expenseFinances.length === 0 ? (
                      <div className="p-8 text-center text-muted">
                        <TrendDown size={26} className="mx-auto text-rose-500/40 mb-1.5" />
                        <p className="text-xs font-medium">कुनै खर्च प्रविष्टि छैन</p>
                        <button
                          type="button"
                          onClick={() => handleOpenAddFinance("expense")}
                          className="mt-2 text-xs text-rose-600 hover:underline font-semibold"
                        >
                          + खर्च थप्नुहोस्
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-line bg-tint/40 text-muted uppercase font-mono tracking-wider text-[10px]">
                              <th className="py-2 px-3">मिति</th>
                              <th className="py-2 px-3">विवरण</th>
                              <th className="py-2 px-1 text-center">बिल</th>
                              <th className="py-2 px-3 text-right">रकम (रु.)</th>
                              <th className="py-2 px-2 text-right">कार्य</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line">
                            {expenseFinances.map((f) => (
                              <tr key={f.id} className="hover:bg-tint/30 transition-colors">
                                <td className="py-2.5 px-3 font-mono text-muted whitespace-nowrap text-[11px]">
                                  <div>{f.dateBs || "—"}</div>
                                  {f.fiscalYear && (
                                    <div className="text-[9px] text-accent font-semibold">{f.fiscalYear}</div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-fg text-xs">{f.title}</div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400">
                                      {f.category || "विविध"}
                                    </span>
                                    {f.remarks && (
                                      <span className="text-[10px] text-muted truncate max-w-[120px]" title={f.remarks}>
                                        {f.remarks}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-1 text-center whitespace-nowrap">
                                  {f.documentUrl ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPreviewDocUrl(f.documentUrl!);
                                        setPreviewDocTitle(f.title);
                                      }}
                                      className="p-1 rounded text-accent hover:bg-accent-soft transition-colors cursor-pointer"
                                      title="प्रमाण हेर्नुहोस्"
                                    >
                                      <Eye size={13} />
                                    </button>
                                  ) : (
                                    <span className="text-muted text-[10px]">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-xs whitespace-nowrap text-rose-600 dark:text-rose-400">
                                  रु. {Number(f.amount).toLocaleString("ne-NP")}
                                </td>
                                <td className="py-2.5 px-2 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditFinance(f)}
                                      className="p-1 rounded-md text-muted hover:text-accent hover:bg-accent-soft transition-colors"
                                      title="सम्पादन गर्नुहोस्"
                                    >
                                      <PencilSimple size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteFinance(f)}
                                      className="p-1 rounded-md text-muted hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                                      title="मेटाउनुहोस्"
                                    >
                                      <Trash size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-line bg-tint/30 font-semibold">
                              <td colSpan={3} className="py-2 px-3 text-xs text-fg">
                                कुल खर्च:
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-xs text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                रु. {totalExpense.toLocaleString("ne-NP")}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Trial Balance Summary Bar */}
                <div className="rounded-xl border border-line bg-surface p-3.5 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <Coins size={16} className="text-accent" weight="bold" />
                      <span className="font-bold text-fg font-sans text-xs">सन्तुलन सारांश:</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="px-2.5 py-1 rounded-control bg-tint/60 border border-line">
                        <span className="text-muted mr-1 font-sans">आम्दानी:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          रु. {totalIncome.toLocaleString("ne-NP")}
                        </span>
                      </div>

                      <div className="px-2.5 py-1 rounded-control bg-tint/60 border border-line">
                        <span className="text-muted mr-1 font-sans">खर्च:</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          रु. {totalExpense.toLocaleString("ne-NP")}
                        </span>
                      </div>

                      <div
                        className={`px-2.5 py-1 rounded-control border font-bold ${
                          totalIncome - totalExpense >= 0
                            ? "bg-accent-soft/40 border-accent/30 text-accent"
                            : "bg-rose-500/10 border-rose-500/30 text-rose-600"
                        }`}
                      >
                        <span className="mr-1 font-sans">
                          {totalIncome - totalExpense >= 0 ? "बचत मौज्दात:" : "घाटा:"}
                        </span>
                        <span>रु. {Math.abs(totalIncome - totalExpense).toLocaleString("ne-NP")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}


          {/* ================================================================= */}
          {/* SUBTAB 3: USERS (सदस्य पहुँच खाता व्यवस्थापन)                      */}
          {/* ================================================================= */}
          {subTab === "users" && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-700 dark:text-blue-400 text-xs flex items-start gap-2">
                <LockKey size={16} className="shrink-0 mt-0.5" />
                <span>
                  यहाँबाट सदस्य विशेष पृष्ठको लागि मात्र प्रयोगकर्ता पहुँच सिर्जना र व्यवस्थापन गर्न सकिन्छ।
                </span>
              </div>

              {users.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-line rounded-2xl bg-surface/50">
                  <UsersThree size={40} className="mx-auto text-accent mb-3" weight="duotone" />
                  <p className="text-sm font-bold text-fg">कुनै सदस्य पहुँच खाता छैन</p>
                  <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                    सदस्यहरूलाई यो पृष्ठ हेर्न दिन नयाँ प्रयोगकर्ता नाम र पासवर्ड सिर्जना गर्नुहोस्।
                  </p>
                  <button
                    type="button"
                    id="empty-add-user-btn"
                    onClick={handleOpenAddUser}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-e1 transition-colors cursor-pointer"
                  >
                    <Plus size={16} weight="bold" />
                    <span>नयाँ सदस्य पहुँच थप्नुहोस्</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted font-medium">
                      कुल {users.length} सदस्य पहुँच खाताहरू दर्ता छन्।
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenAddUser}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-e1 transition-colors cursor-pointer"
                    >
                      <Plus size={14} weight="bold" />
                      <span>+ नयाँ सदस्य</span>
                    </button>
                  </div>

                  <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-line bg-tint/60 text-muted uppercase font-mono tracking-wider text-[11px]">
                          <th className="py-3 px-4">नाम</th>
                          <th className="py-3 px-4">प्रयोगकर्ता नाम</th>
                          <th className="py-3 px-4">फोन / सम्पर्क</th>
                          <th className="py-3 px-4">कैफियत</th>
                          <th className="py-3 px-4">स्थिति</th>
                          <th className="py-3 px-4 text-right">कार्यहरू</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-tint/40 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-fg">
                              {u.name}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-muted">
                              @{u.username}
                            </td>
                            <td className="py-3.5 px-4 text-muted">
                              {u.phone || "—"}
                            </td>
                            <td className="py-3.5 px-4 text-muted">
                              {u.notes || "—"}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleUserActive(u)}
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                                  u.isActive
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                    : "bg-zinc-500/10 text-muted border border-line"
                                }`}
                              >
                                {u.isActive ? (
                                  <>
                                    <CheckCircle size={12} weight="fill" />
                                    <span>सक्रिय</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={12} weight="fill" />
                                    <span>निष्क्रिय</span>
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenEditUser(u)}
                                  className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent-soft transition-colors"
                                  title="सम्पादन गर्नुहोस्"
                                >
                                  <PencilSimple size={15} />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                                  title="मेटाउनुहोस्"
                                >
                                  <Trash size={15} />
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
            </div>
          )}
        </>
      )}

      {/* ================================================================= */}
      {/* MODAL 1: ADD/EDIT RECORD (अभिलेख थप्ने/सम्पादन)                     */}
      {/* ================================================================= */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-surface rounded-2xl border border-line shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <h3 className="text-base font-bold text-fg">
                {editingRecord ? "अभिलेख सम्पादन गर्नुहोस्" : "नयाँ अभिलेख थप्नुहोस्"}
              </h3>
              <button
                onClick={() => setShowRecordModal(false)}
                className="p-1 rounded-lg text-muted hover:text-fg hover:bg-tint"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-fg mb-1">
                  अभिलेखको शीर्षक <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={recordForm.title}
                  onChange={(e) => setRecordForm({ ...recordForm, title: e.target.value })}
                  placeholder="उदा: कार्यसमितिको १५ औं पूर्ण बैठकका निर्णयहरू"
                  className="w-full px-3 py-2 rounded-control border border-line bg-bg text-fg text-xs focus:ring-2 focus:ring-accent/40 focus:border-accent focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">
                  गुगल ड्राइभ (Google Drive) लिङ्क <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={recordForm.driveUrl}
                  onChange={(e) => setRecordForm({ ...recordForm, driveUrl: e.target.value })}
                  placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                  className="w-full px-3 py-2 rounded-control border border-line bg-bg text-fg text-xs focus:ring-2 focus:ring-accent/40 focus:border-accent focus:outline-hidden"
                />
                <p className="text-[11px] text-muted mt-1">
                  * गुगल ड्राइभमा PDF फाइलको &lsquo;Anyone with the link can view&rsquo; लिङ्क मात्र मान्य हुनेछ।
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-4 py-2 rounded-control text-xs font-medium text-muted hover:text-fg hover:bg-tint cursor-pointer"
                >
                  रद्द गर्नुहोस्
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-control btn-fill bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-e1"
                >
                  {isSubmitting && <CircleNotch size={14} className="animate-spin" />}
                  <span>सुरक्षित गर्नुहोस्</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: ADD/EDIT FINANCE (आर्थिक विवरण थप्ने/सम्पादन)              */}
      {/* ================================================================= */}
      {showFinanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-surface rounded-2xl border border-line shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <h3 className="text-base font-bold text-fg">
                {editingFinance ? "आर्थिक विवरण सम्पादन गर्नुहोस्" : "नयाँ आर्थिक विवरण थप्नुहोस्"}
              </h3>
              <button
                onClick={() => setShowFinanceModal(false)}
                className="p-1 rounded-lg text-muted hover:text-fg hover:bg-tint"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFinance} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-fg mb-1">
                  शीर्षक / विवरण <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={financeForm.title}
                  onChange={(e) => setFinanceForm({ ...financeForm, title: e.target.value })}
                  placeholder="उदा: सदस्यता शुल्क वा कार्यक्रम खर्च"
                  className="w-full px-3 py-2 rounded-control border border-line bg-bg text-fg text-xs focus:ring-2 focus:ring-accent/40 focus:border-accent focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">प्रकार</label>
                  <select
                    value={financeForm.type}
                    onChange={(e) => setFinanceForm({ ...financeForm, type: e.target.value as "income" | "expense" })}
                    className="w-full px-3 py-2 rounded-control border border-line bg-bg text-fg text-xs focus:outline-hidden"
                  >
                    <option value="income">आम्दानी (+)</option>
                    <option value="expense">खर्च (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">
                    रकम (रु.) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={financeForm.amount}
                    onChange={(e) => setFinanceForm({ ...financeForm, amount: e.target.value })}
                    placeholder="उदा: ५०००"
                    className="w-full px-3 py-2 rounded-control border border-line bg-bg text-fg text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">आर्थिक वर्ष</label>
                  <input
                    type="text"
                    value={financeForm.fiscalYear}
                    onChange={(e) => setFinanceForm({ ...financeForm, fiscalYear: e.target.value })}
                    placeholder="२०८१/०८२"
                    className="w-full px-3 py-2 rounded-control border border-line bg-bg text-fg text-xs focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">मिति (वि.सं.)</label>
                  <input
                    type="text"
                    value={financeForm.dateBs}
                    onChange={(e) => setFinanceForm({ ...financeForm, dateBs: e.target.value })}
                    placeholder="२०८१/०६/१५"
                    className="w-full px-3 py-2 rounded-control border border-line bg-bg text-fg text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">वर्गीकरण / शीर्षक</label>
                  <input
                    type="text"
                    value={financeForm.category}
                    onChange={(e) => setFinanceForm({ ...financeForm, category: e.target.value })}
                    placeholder="सदस्यता शुल्क, चन्दा, कार्यक्रम आदि"
                    className="w-full px-3 py-2 rounded-control border border-line bg-bg text-fg text-xs focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">प्रमाण / बिल / ड्राइभ लिङ्क</label>
                  <input
                    type="url"
                    value={financeForm.documentUrl}
                    onChange={(e) => setFinanceForm({ ...financeForm, documentUrl: e.target.value })}
                    placeholder="Google Drive वा फाइल लिङ्क"
                    className="w-full px-3 py-2 rounded-control border border-line bg-bg text-fg text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">कैफियत / टिप्पणी</label>
                <textarea
                  rows={2}
                  value={financeForm.remarks}
                  onChange={(e) => setFinanceForm({ ...financeForm, remarks: e.target.value })}
                  placeholder="थप विवरण..."
                  className="w-full px-3 py-2 rounded-control border border-line bg-bg text-fg text-xs focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowFinanceModal(false)}
                  className="px-4 py-2 rounded-control text-xs font-medium text-muted hover:text-fg hover:bg-tint cursor-pointer"
                >
                  रद्द गर्नुहोस्
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-control btn-fill bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-e1"
                >
                  {isSubmitting && <CircleNotch size={14} className="animate-spin" />}
                  <span>सुरक्षित गर्नुहोस्</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 3: ADD/EDIT USER (सदस्य पहुँच खाता थप्ने/सम्पादन)             */}
      {/* ================================================================= */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-surface rounded-2xl border border-line shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <h3 className="text-base font-bold text-fg">
                {editingUser ? "सदस्य खाता सम्पादन" : "नयाँ सदस्य पहुँच खाता थप्नुहोस्"}
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-1 rounded-lg text-muted hover:text-fg hover:bg-tint"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-fg mb-1">
                  सदस्यको पूरा नाम <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="उदा: राम प्रसाद ज्ञवाली"
                  className="w-full px-3 py-2 rounded-control border border-line bg-bg text-fg text-xs focus:ring-2 focus:ring-accent/40 focus:border-accent focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">
                  प्रयोगकर्ता नाम (Username / ID) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="उदा: ram.gyawali वा 98XXXXXXXX"
                  className="w-full px-3 py-2 rounded-control border border-line bg-bg text-fg text-xs focus:ring-2 focus:ring-accent/40 focus:border-accent focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">
                  पासवर्ड {editingUser ? "(परिवर्तन नगर्ने भए खाली छोड्नुहोस्)" : <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="कम्तिमा ६ अक्षरको पासवर्ड"
                  className="w-full px-3 py-2 rounded-control border border-line bg-bg text-fg text-xs focus:ring-2 focus:ring-accent/40 focus:border-accent focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">फोन नम्बर</label>
                <input
                  type="text"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  placeholder="९८XXXXXXXX"
                  className="w-full px-3 py-2 rounded-control border border-line bg-bg text-fg text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">कैफियत / पद / सदस्यता</label>
                <input
                  type="text"
                  value={userForm.notes}
                  onChange={(e) => setUserForm({ ...userForm, notes: e.target.value })}
                  placeholder="उदा: आजीवन सदस्य, सल्लाहकार, आदि"
                  className="w-full px-3 py-2 rounded-control border border-line bg-bg text-fg text-xs focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="userIsActive"
                  checked={userForm.isActive}
                  onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                  className="rounded-md border-line text-accent focus:ring-accent cursor-pointer"
                />
                <label htmlFor="userIsActive" className="text-xs font-semibold text-fg cursor-pointer">
                  खाता सक्रिय राख्नुहोस् (Active)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-control text-xs font-medium text-muted hover:text-fg hover:bg-tint cursor-pointer"
                >
                  रद्द गर्नुहोस्
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-control btn-fill bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-e1"
                >
                  {isSubmitting && <CircleNotch size={14} className="animate-spin" />}
                  <span>सुरक्षित गर्नुहोस्</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* DOCUMENT PREVIEW MODAL                                            */}
      {/* ================================================================= */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-5xl h-[90vh] bg-surface rounded-2xl border border-line shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-line bg-tint/40">
              <div className="flex items-center gap-2 min-w-0 pr-4">
                <FilePdf size={20} weight="fill" className="text-rose-500 shrink-0" />
                <h3 className="text-sm font-bold text-fg truncate">{previewDocTitle}</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={getGoogleDriveViewUrl(previewDocUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-tint"
                  title="नयाँ ट्याबमा खोल्नुहोस्"
                >
                  <ArrowSquareOut size={18} />
                </a>
                <button
                  onClick={() => setPreviewDocUrl(null)}
                  className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-tint"
                  title="बन्द गर्नुहोस्"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 w-full bg-black/5 dark:bg-black/40">
              <iframe
                src={getGoogleDrivePreviewUrl(previewDocUrl)}
                className="w-full h-full border-0"
                allow="autoplay"
                title={previewDocTitle}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
