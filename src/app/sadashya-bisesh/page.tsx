"use client";

import React, { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  MemberSpecialRecord,
  MemberSpecialFinance,
  PreviousYearSaving,
  Language,
  getStoredLanguage,
  subscribeMemberRecords,
  getStoredMemberRecordsSnapshot,
  getServerMemberRecordsSnapshot,
  saveStoredMemberRecords,
  subscribeMemberFinances,
  getStoredMemberFinancesSnapshot,
  getServerMemberFinancesSnapshot,
  saveStoredMemberFinances,
  subscribeMemberPreviousSavings,
  getStoredMemberPreviousSavingsSnapshot,
  getServerMemberPreviousSavingsSnapshot,
  saveStoredMemberPreviousSavings,
} from "@/data/mockData";
import {
  getMemberSession,
  saveMemberSession,
  clearMemberSession,
  MemberSession,
  MEMBER_AUTH_SYNC_EVENT,
} from "@/lib/memberAuth";
import { getAdminSession } from "@/lib/adminAuth";
import {
  getGoogleDrivePreviewUrl,
  getGoogleDriveViewUrl,
  getGoogleDriveDownloadUrl,
  isGoogleDriveUrl,
} from "@/lib/googleDrive";
import { useRemoteData } from "@/hooks/useRemoteData";
import { DataStatus } from "@/components/DataStatus";
import {
  LockKey,
  ShieldCheck,
  Eye,
  EyeSlash,
  SignOut,
  FileText,
  FilePdf,
  ArrowSquareOut,
  Download,
  TrendUp,
  TrendDown,
  Coins,
  Receipt,
  MagnifyingGlass,
  Funnel,
  CheckCircle,
  X,
  Spinner,
  FolderOpen,
  User,
  Info,
} from "@phosphor-icons/react";

export default function SadashyaBiseshPage() {
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const [session, setSession] = useState<MemberSession | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Active section tab: "records" (अभिलेख) or "finances" (आम्दानी / खर्च)
  const [activeTab, setActiveTab] = useState<"records" | "finances">("records");

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Modals
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState<string>("");

  // Subscribed cached data
  const cachedRecords = useSyncExternalStore(
    subscribeMemberRecords,
    getStoredMemberRecordsSnapshot,
    getServerMemberRecordsSnapshot
  );
  const cachedFinances = useSyncExternalStore(
    subscribeMemberFinances,
    getStoredMemberFinancesSnapshot,
    getServerMemberFinancesSnapshot
  );
  const cachedPreviousSavings = useSyncExternalStore(
    subscribeMemberPreviousSavings,
    getStoredMemberPreviousSavingsSnapshot,
    getServerMemberPreviousSavingsSnapshot
  );

  // Remote data hooks (only active when logged in)
  const isAuthenticated = Boolean(session?.isAuthenticated || isAdminLoggedIn);
  const remoteRecords = useRemoteData<MemberSpecialRecord[]>(
    "/api/member-special/records",
    saveStoredMemberRecords,
    isAuthenticated
  );
  const remoteFinances = useRemoteData<MemberSpecialFinance[]>(
    "/api/member-special/finances",
    saveStoredMemberFinances,
    isAuthenticated
  );
  const remotePreviousSavings = useRemoteData<PreviousYearSaving[]>(
    "/api/member-special/savings",
    saveStoredMemberPreviousSavings,
    isAuthenticated
  );

  // Filters for Abhilekh (Records)
  const [recordSearch, setRecordSearch] = useState("");

  // Filters for Finances
  const [financeSearch, setFinanceSearch] = useState("");
  const [financeType, setFinanceType] = useState<"all" | "income" | "expense">("all");
  const [financeFiscalYear, setFinanceFiscalYear] = useState("all");

  // Auth sync
  useEffect(() => {
    function syncAuth() {
      const sess = getMemberSession();
      setSession(sess);

      const admin = getAdminSession();
      setIsAdminLoggedIn(Boolean(admin?.isAuthenticated));
      setCheckingAuth(false);
    }

    syncAuth();
    window.addEventListener(MEMBER_AUTH_SYNC_EVENT, syncAuth);
    return () => window.removeEventListener(MEMBER_AUTH_SYNC_EVENT, syncAuth);
  }, []);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!username.trim() || !password.trim()) {
      setLoginError("कृपया प्रयोगकर्ता नाम र पासवर्ड दुवै लेख्नुहोस्।");
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch("/api/member-special/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.error || "लगइन गर्न सकिएन। विवरण जाँच गर्नुहोस्।");
        return;
      }

      const newSession: MemberSession = {
        isAuthenticated: true,
        token: data.token,
        id: data.user.id,
        name: data.user.name,
        username: data.user.username,
        loginTime: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      };

      saveMemberSession(newSession);
      setSession(newSession);
      remoteRecords.refetch();
      remoteFinances.refetch();
    } catch {
      setLoginError("सर्भरसँग सम्पर्क हुन सकेन। कृपया पुनः प्रयास गर्नुहोस्।");
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    clearMemberSession();
    setSession(null);
    try {
      await fetch("/api/member-special/auth/logout", { method: "POST" });
    } catch {}
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return cachedRecords.filter((r) => {
      if (recordSearch.trim()) {
        const q = recordSearch.toLowerCase();
        return r.title.toLowerCase().includes(q);
      }
      return true;
    });
  }, [cachedRecords, recordSearch]);

  // Finance fiscal years
  const fiscalYears = useMemo(() => {
    const set = new Set<string>();
    cachedFinances.forEach((f) => {
      if (f.fiscalYear) set.add(f.fiscalYear);
    });
    return Array.from(set).sort().reverse();
  }, [cachedFinances]);

  // Filtered income (Left Section - Trial Balance)
  const filteredIncome = useMemo(() => {
    return cachedFinances.filter((f) => {
      if (f.type !== "income") return false;
      if (financeFiscalYear !== "all" && f.fiscalYear !== financeFiscalYear) return false;
      if (financeSearch.trim()) {
        const q = financeSearch.toLowerCase();
        const tMatch = f.title.toLowerCase().includes(q);
        const cMatch = f.category?.toLowerCase().includes(q);
        const rMatch = f.remarks?.toLowerCase().includes(q);
        if (!tMatch && !cMatch && !rMatch) return false;
      }
      return true;
    });
  }, [cachedFinances, financeFiscalYear, financeSearch]);

  // Filtered expense (Right Section - Trial Balance)
  const filteredExpenses = useMemo(() => {
    return cachedFinances.filter((f) => {
      if (f.type !== "expense") return false;
      if (financeFiscalYear !== "all" && f.fiscalYear !== financeFiscalYear) return false;
      if (financeSearch.trim()) {
        const q = financeSearch.toLowerCase();
        const tMatch = f.title.toLowerCase().includes(q);
        const cMatch = f.category?.toLowerCase().includes(q);
        const rMatch = f.remarks?.toLowerCase().includes(q);
        if (!tMatch && !cMatch && !rMatch) return false;
      }
      return true;
    });
  }, [cachedFinances, financeFiscalYear, financeSearch]);

  const filteredIncomeTotal = useMemo(() => {
    return filteredIncome.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  }, [filteredIncome]);

  const filteredExpenseTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  }, [filteredExpenses]);

  // Active previous year saving based on selected fiscal year
  const activePreviousSaving = useMemo(() => {
    if (!cachedPreviousSavings || cachedPreviousSavings.length === 0) return null;
    if (financeFiscalYear !== "all") {
      const match = cachedPreviousSavings.find((s) => s.fiscalYear === financeFiscalYear);
      if (match) return match;
    }
    return cachedPreviousSavings[0];
  }, [cachedPreviousSavings, financeFiscalYear]);

  const previousSavingAmount = activePreviousSaving ? Number(activePreviousSaving.amount) || 0 : 0;
  const netSavingsBalance = previousSavingAmount + filteredIncomeTotal - filteredExpenseTotal;



  return (
    <div className="min-h-screen flex flex-col bg-bg text-fg">
      <SiteHeader lang={lang} setLang={setLang} />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Top Header / Breadcrumb */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-fg">
                सदस्य विशेष
              </h1>
              <p className="text-sm text-muted mt-1 max-w-2xl">
                थोर्गा-काठमाडौं सम्पर्क तथा विकास मञ्चका आन्तरिक अभिलेख, निर्णय तथा पारदर्शी आम्दानी-खर्च विवरण।
              </p>
            </div>

            {/* Authenticated user status bar */}
            {isAuthenticated && (
              <div className="flex items-center gap-3 bg-surface border border-line px-4 py-2 rounded-xl shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                    {session?.name ? session.name.charAt(0) : "अ"}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-fg">
                      {session?.name || (isAdminLoggedIn ? "प्रशासक (Admin)" : "सदस्य")}
                    </div>
                    <div className="text-[11px] text-muted">
                      {isAdminLoggedIn ? "प्रशासनिक पहुँच" : `@${session?.username}`}
                    </div>
                  </div>
                </div>

                {session && (
                  <button
                    onClick={handleLogout}
                    className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="लगआउट गर्नुहोस्"
                  >
                    <SignOut size={14} weight="bold" />
                    <span>लगआउट</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* CASE 1: UNLOGGED / AUTHENTICATION REQUIRED                    */}
        {/* ------------------------------------------------------------- */}
        {!isAuthenticated && !checkingAuth && (
          <div className="max-w-md mx-auto my-12">
            <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-sm">
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-accent-soft text-accent flex items-center justify-center shadow-xs">
                  <LockKey size={30} weight="duotone" />
                </div>
                <h2 className="text-xl font-bold text-fg">सदस्य विशेष लगइन</h2>
              </div>

              {loginError && (
                <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-start gap-2">
                  <Info size={16} className="shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-fg mb-1.5">
                    प्रयोगकर्ता नाम वा फोन नम्बर
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="उदा: ram.gyawali वा 98XXXXXXXX"
                      className="w-full px-3.5 py-2.5 rounded-control border border-line bg-bg text-fg text-sm placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
                    />
                    <User size={16} className="absolute right-3.5 top-3 text-muted pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-fg mb-1.5">
                    पासवर्ड
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="पासवर्ड प्रविष्ट गर्नुहोस्"
                      className="w-full px-3.5 py-2.5 rounded-control border border-line bg-bg text-fg text-sm placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-muted hover:text-fg transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 px-4 rounded-control btn-fill bg-accent hover:bg-accent-hover active:scale-[0.99] text-on-accent text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-e1 disabled:opacity-50 cursor-pointer"
                >
                  {loginLoading ? (
                    <>
                      <Spinner size={16} className="animate-spin" />
                      <span>प्रमाणीकरण हुँदैछ...</span>
                    </>
                  ) : (
                    <>
                      <LockKey size={16} weight="bold" />
                      <span>लगइन गर्नुहोस्</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-line text-center">
                <Link
                  href="/#contact"
                  className="text-xs text-muted hover:text-accent transition-colors inline-flex items-center gap-1"
                >
                  <span>सम्पर्क तथा सहयोग</span>
                  <ArrowSquareOut size={12} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CASE 2: LOGGED IN PORTAL                                      */}
        {/* ------------------------------------------------------------- */}
        {isAuthenticated && (
          <div className="space-y-8">
            <DataStatus
              lang={lang}
              error={activeTab === "records" ? remoteRecords.error : remoteFinances.error}
              refetch={activeTab === "records" ? remoteRecords.refetch : remoteFinances.refetch}
            />

            {/* Navigation Section Tabs (अभिलेख vs आम्दानी / खर्च) */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
              <div className="inline-flex p-1 rounded-control bg-surface border border-line">
                <button
                  onClick={() => setActiveTab("records")}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-control text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === "records"
                      ? "btn-fill bg-accent text-on-accent shadow-e1"
                      : "text-muted hover:text-fg hover:bg-tint"
                  }`}
                >
                  <FileText size={18} weight={activeTab === "records" ? "fill" : "regular"} />
                  <span>अभिलेख ({cachedRecords.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("finances")}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-control text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === "finances"
                      ? "btn-fill bg-accent text-on-accent shadow-e1"
                      : "text-muted hover:text-fg hover:bg-tint"
                  }`}
                >
                  <Coins size={18} weight={activeTab === "finances" ? "fill" : "regular"} />
                  <span>आम्दानी / खर्च</span>
                </button>
              </div>
            </div>

            {/* ========================================================= */}
            {/* TAB 1: अभिलेख (RECORDS / ARCHIVES)                         */}
            {/* ========================================================= */}
            {activeTab === "records" && (
              <div className="space-y-6">
                {/* Search Bar */}
                <div className="relative max-w-md">
                  <input
                    type="text"
                    value={recordSearch}
                    onChange={(e) => setRecordSearch(e.target.value)}
                    placeholder="अभिलेखको शीर्षक खोज्नुहोस्..."
                    className="w-full pl-9 pr-4 py-2 rounded-control border border-line bg-surface text-fg text-sm placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
                  />
                  <MagnifyingGlass size={16} className="absolute left-3 top-2.5 text-muted" />
                </div>

                {/* Records Cards Grid */}
                {filteredRecords.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-line bg-surface/50 p-12 text-center">
                    <FolderOpen size={40} className="mx-auto text-accent mb-3" weight="duotone" />
                    <h3 className="text-sm font-semibold text-fg">कुनै अभिलेख फेला परेन</h3>
                    <p className="text-xs text-muted mt-1">
                      {recordSearch ? "तपाईंको खोजी अनुसार कुनै परिणाम छैन।" : "अभिलेखहरू चाँडै थपिनेछन्।"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredRecords.map((item) => (
                      <div
                        key={item.id}
                        className="group rounded-2xl border border-line bg-surface p-5 hover:shadow-md hover:border-accent/40 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                              <FilePdf size={20} weight="fill" />
                            </span>
                            <span className="text-xs font-medium text-muted">PDF कागजात</span>
                          </div>

                          <h3 className="text-base font-bold text-fg group-hover:text-accent transition-colors leading-snug">
                            {item.title}
                          </h3>
                        </div>

                        {/* Actions for Google Drive PDF */}
                        <div className="mt-5 pt-4 border-t border-line flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => {
                              setPreviewDocUrl(item.driveUrl);
                              setPreviewDocTitle(item.title);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-e1 active:scale-[0.98] transition-all cursor-pointer"
                          >
                            <Eye size={14} weight="bold" />
                            <span>कागजात हेर्नुहोस्</span>
                          </button>

                          <a
                            href={getGoogleDriveViewUrl(item.driveUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-control text-xs font-medium text-muted hover:text-fg hover:bg-tint transition-colors"
                            title="गुगल ड्राइभमा खोल्नुहोस्"
                          >
                            <ArrowSquareOut size={14} />
                            <span>नयाँ ट्याब</span>
                          </a>

                          <a
                            href={getGoogleDriveDownloadUrl(item.driveUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-control text-xs font-medium text-muted hover:text-fg hover:bg-tint transition-colors"
                            title="डाउनलोड गर्नुहोस्"
                          >
                            <Download size={14} />
                            <span>डाउनलोड</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: आम्दानी / खर्च (INCOME & EXPENSE)                   */}
            {/* ========================================================= */}
            {activeTab === "finances" && (
              <div className="space-y-6">
                {/* Top Section: गत वर्षको बचत (Previous Year Savings) */}
                <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-tint border border-line text-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0">
                      <Coins size={22} weight="bold" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-fg">गत वर्षको बचत</h3>
                        {activePreviousSaving?.fiscalYear && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-tint border border-line text-muted font-mono font-medium">
                            आ.व. {activePreviousSaving.fiscalYear}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted mt-0.5">
                        {activePreviousSaving?.remarks || "अघिल्लो आर्थिक वर्षबाट जिम्मेवारी सरेको बचत मौज्दात"}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <div className="text-[11px] text-muted font-medium mb-0.5">गत वर्षको मौज्दात रकम</div>
                    <div className="font-mono font-black text-lg sm:text-xl text-emerald-950 dark:text-emerald-300">
                      रु. {previousSavingAmount.toLocaleString("ne-NP")}
                    </div>
                  </div>
                </div>

                {/* Filter and search bar */}
                <div className="flex flex-wrap gap-3 items-center justify-between bg-surface p-4 rounded-2xl border border-line">
                  {/* View Mode Switcher */}
                  <div className="inline-flex p-1 rounded-control bg-bg border border-line">
                    <button
                      onClick={() => setFinanceType("all")}
                      className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-all cursor-pointer ${
                        financeType === "all"
                          ? "btn-fill bg-accent text-on-accent shadow-e1"
                          : "text-muted hover:text-fg"
                      }`}
                    >
                      सन्तुलन खाता
                    </button>
                    <button
                      onClick={() => setFinanceType("income")}
                      className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-all cursor-pointer ${
                        financeType === "income"
                          ? "btn-fill bg-accent text-on-accent shadow-e1"
                          : "text-muted hover:text-fg"
                      }`}
                    >
                      आम्दानी मात्र
                    </button>
                    <button
                      onClick={() => setFinanceType("expense")}
                      className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-all cursor-pointer ${
                        financeType === "expense"
                          ? "btn-fill bg-accent text-on-accent shadow-e1"
                          : "text-muted hover:text-fg"
                      }`}
                    >
                      खर्च मात्र
                    </button>
                  </div>

                  {/* Fiscal Year & Search */}
                  <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                    {fiscalYears.length > 0 && (
                      <select
                        value={financeFiscalYear}
                        onChange={(e) => setFinanceFiscalYear(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-line bg-bg text-fg text-xs focus:outline-hidden"
                      >
                        <option value="all">सबै आर्थिक वर्ष</option>
                        {fiscalYears.map((fy) => (
                          <option key={fy} value={fy}>
                            आ.व. {fy}
                          </option>
                        ))}
                      </select>
                    )}

                    <div className="relative flex-1 sm:w-60">
                      <input
                        type="text"
                        value={financeSearch}
                        onChange={(e) => setFinanceSearch(e.target.value)}
                        placeholder="विवरण वा शीर्षक खोज्नुहोस्..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-line bg-bg text-fg text-xs placeholder:text-muted focus:outline-hidden"
                      />
                      <MagnifyingGlass size={14} className="absolute left-2.5 top-2 text-muted" />
                    </div>
                  </div>
                </div>

                {/* Trial Balance Main Container */}
                {filteredIncome.length === 0 && filteredExpenses.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-line bg-surface/50 p-12 text-center">
                    <Receipt size={40} className="mx-auto text-muted mb-3" weight="duotone" />
                    <h3 className="text-sm font-semibold text-fg">कुनै आर्थिक विवरण फेला परेन</h3>
                    <p className="text-xs text-muted mt-1">
                      {financeSearch ? "खोजी अनुसार परिणाम छैन।" : "यस अवधिमा कुनै आय-व्यय प्रविष्ट गरिएको छैन।"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Two-Column Trial Balance Grid (Left: Income, Right: Expense) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                      {/* =================================================== */}
                      {/* LEFT SECTION: आम्दानी                                */}
                      {/* =================================================== */}
                      {(financeType === "all" || financeType === "income") && (
                        <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-xs flex flex-col">
                          {/* Left Header */}
                          <div className="bg-tint/40 border-b border-line px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-tint border border-line text-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold">
                                <TrendUp size={16} weight="bold" />
                              </div>
                              <h3 className="text-sm font-bold text-fg">आम्दानी</h3>
                            </div>
                            <span className="text-xs text-muted font-medium">{filteredIncome.length} प्रविष्टि</span>
                          </div>

                          {/* Left Table */}
                          {filteredIncome.length === 0 ? (
                            <div className="p-8 text-center text-muted">
                              <TrendUp size={30} className="mx-auto text-emerald-800/40 dark:text-emerald-400/40 mb-2" />
                              <p className="text-xs font-medium">यस अवधिमा कुनै आम्दानी प्रविष्टि छैन</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-line bg-tint/40 text-muted uppercase font-mono tracking-wider text-[10px]">
                                    <th className="py-2.5 px-3">मिति</th>
                                    <th className="py-2.5 px-3">विवरण / शीर्षक</th>
                                    <th className="py-2.5 px-2 text-center">बिल</th>
                                    <th className="py-2.5 px-3 text-right">रकम (रु.)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                  {filteredIncome.map((item) => (
                                    <tr key={item.id} className="hover:bg-tint/30 transition-colors">
                                      <td className="py-2.5 px-3 font-mono text-muted whitespace-nowrap text-[11px]">
                                        <div>{item.dateBs || "—"}</div>
                                        {item.fiscalYear && (
                                          <div className="text-[9px] text-accent font-semibold">{item.fiscalYear}</div>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <div className="font-semibold text-fg text-xs">{item.title}</div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-tint border border-line text-fg font-medium">
                                            {item.category || "आम्दानी"}
                                          </span>
                                          {item.remarks && (
                                            <span className="text-[10px] text-muted truncate max-w-[140px]" title={item.remarks}>
                                              {item.remarks}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                                        {item.documentUrl ? (
                                          <button
                                            onClick={() => {
                                              setPreviewDocUrl(item.documentUrl!);
                                              setPreviewDocTitle(item.title);
                                            }}
                                            className="inline-flex items-center gap-1 p-1 rounded-md text-accent hover:bg-accent-soft transition-colors cursor-pointer"
                                            title="बिल / भौचर हेर्नुहोस्"
                                          >
                                            <FilePdf size={14} weight="fill" className="text-rose-500" />
                                            <span className="text-[10px] font-semibold">हेर्नुहोस्</span>
                                          </button>
                                        ) : (
                                          <span className="text-muted text-[10px]">—</span>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-mono font-bold text-xs whitespace-nowrap text-emerald-950 dark:text-emerald-300">
                                        रु. {Number(item.amount).toLocaleString("ne-NP")}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t-2 border-line bg-tint/30 font-semibold">
                                    <td colSpan={3} className="py-2.5 px-3 text-xs text-fg">
                                      जम्मा आम्दानी:
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono font-black text-xs text-emerald-950 dark:text-emerald-300 whitespace-nowrap">
                                      रु. {filteredIncomeTotal.toLocaleString("ne-NP")}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {/* =================================================== */}
                      {/* RIGHT SECTION: खर्च                                 */}
                      {/* =================================================== */}
                      {(financeType === "all" || financeType === "expense") && (
                        <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-xs flex flex-col">
                          {/* Right Header */}
                          <div className="bg-tint/40 border-b border-line px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                                <TrendDown size={16} weight="bold" />
                              </div>
                              <h3 className="text-sm font-bold text-fg">खर्च</h3>
                            </div>
                            <span className="text-xs text-muted font-medium">{filteredExpenses.length} प्रविष्टि</span>
                          </div>

                          {/* Right Table */}
                          {filteredExpenses.length === 0 ? (
                            <div className="p-8 text-center text-muted">
                              <TrendDown size={30} className="mx-auto text-rose-500/40 mb-2" />
                              <p className="text-xs font-medium">यस अवधिमा कुनै खर्च प्रविष्टि छैन</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-line bg-tint/40 text-muted uppercase font-mono tracking-wider text-[10px]">
                                    <th className="py-2.5 px-3">मिति</th>
                                    <th className="py-2.5 px-3">विवरण / शीर्षक</th>
                                    <th className="py-2.5 px-2 text-center">बिल</th>
                                    <th className="py-2.5 px-3 text-right">रकम (रु.)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                  {filteredExpenses.map((item) => (
                                    <tr key={item.id} className="hover:bg-tint/30 transition-colors">
                                      <td className="py-2.5 px-3 font-mono text-muted whitespace-nowrap text-[11px]">
                                        <div>{item.dateBs || "—"}</div>
                                        {item.fiscalYear && (
                                          <div className="text-[9px] text-accent font-semibold">{item.fiscalYear}</div>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <div className="font-semibold text-fg text-xs">{item.title}</div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 font-medium">
                                            {item.category || "खर्च"}
                                          </span>
                                          {item.remarks && (
                                            <span className="text-[10px] text-muted truncate max-w-[140px]" title={item.remarks}>
                                              {item.remarks}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                                        {item.documentUrl ? (
                                          <button
                                            onClick={() => {
                                              setPreviewDocUrl(item.documentUrl!);
                                              setPreviewDocTitle(item.title);
                                            }}
                                            className="inline-flex items-center gap-1 p-1 rounded-md text-accent hover:bg-accent-soft transition-colors cursor-pointer"
                                            title="बिल / भौचर हेर्नुहोस्"
                                          >
                                            <FilePdf size={14} weight="fill" className="text-rose-500" />
                                            <span className="text-[10px] font-semibold">हेर्नुहोस्</span>
                                          </button>
                                        ) : (
                                          <span className="text-muted text-[10px]">—</span>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-mono font-bold text-xs whitespace-nowrap text-rose-600 dark:text-rose-400">
                                        रु. {Number(item.amount).toLocaleString("ne-NP")}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t-2 border-line bg-tint/30 font-semibold">
                                    <td colSpan={3} className="py-2.5 px-3 text-xs text-fg">
                                      जम्मा खर्च:
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-xs text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                      रु. {filteredExpenseTotal.toLocaleString("ne-NP")}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* =================================================== */}
                    {/* TRIAL BALANCE RECONCILIATION SUMMARY FOOTER         */}
                    {/* =================================================== */}
                    {financeType === "all" && (
                      <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                              <Coins size={20} weight="bold" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-fg">सन्तुलन सारांश</h4>
                              <p className="text-[11px] text-muted">
                                {financeFiscalYear === "all"
                                  ? "सबै आर्थिक वर्ष"
                                  : `आर्थिक वर्ष ${financeFiscalYear}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center text-xs font-mono">
                            <div
                              className={`px-3.5 py-2 rounded-control border font-bold flex items-center gap-2 ${
                                netSavingsBalance >= 0
                                  ? "bg-tint/70 border-line text-emerald-950 dark:text-emerald-300"
                                  : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              <span className="font-sans font-semibold">
                                {netSavingsBalance >= 0 ? "बचत मौज्दात:" : "घाटा मौज्दात:"}
                              </span>
                              <span className="font-black text-sm">
                                रु. {Math.abs(netSavingsBalance).toLocaleString("ne-NP")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* GOOGLE DRIVE DOCUMENT PREVIEW MODAL                           */}
      {/* ------------------------------------------------------------- */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-5xl h-[90vh] bg-surface rounded-2xl border border-line shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-line bg-tint/40">
              <div className="flex items-center gap-2 min-w-0 pr-4">
                <FilePdf size={20} weight="fill" className="text-rose-500 shrink-0" />
                <h3 className="text-sm font-bold text-fg truncate">{previewDocTitle}</h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={getGoogleDriveViewUrl(previewDocUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-tint transition-colors"
                  title="नयाँ ट्याबमा खोल्नुहोस्"
                >
                  <ArrowSquareOut size={18} />
                </a>
                <a
                  href={getGoogleDriveDownloadUrl(previewDocUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-tint transition-colors"
                  title="डाउनलोड गर्नुहोस्"
                >
                  <Download size={18} />
                </a>
                <button
                  onClick={() => setPreviewDocUrl(null)}
                  className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-tint transition-colors"
                  title="बन्द गर्नुहोस्"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Google Drive Preview Iframe */}
            <div className="flex-1 w-full bg-black/5 dark:bg-black/40 relative">
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

      <SiteFooter lang={lang} />
    </div>
  );
}
