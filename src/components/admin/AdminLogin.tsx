"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ADMIN_I18N } from "./adminConstants";
import { Language } from "@/data/mockData";
import { AdminSession, setAdminSession } from "@/lib/adminAuth";
import {
  Buildings,
  LockKey,
  Translate,
  ArrowSquareOut,
  CircleNotch,
} from "@phosphor-icons/react";

interface AdminLoginProps {
  lang: Language;
  toggleAdminLang: () => void;
  onLoginSuccess: (session: AdminSession) => void;
}

export function AdminLogin({
  lang,
  toggleAdminLang,
  onLoginSuccess,
}: AdminLoginProps) {
  const t = ADMIN_I18N[lang];
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(false);
    setLoginErrorMessage("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        const newSession = setAdminSession(data.user, data.token, data.exp);
        onLoginSuccess(newSession);
      } else {
        setLoginError(true);
        setLoginErrorMessage(data.error || t.loginError);
      }
    } catch {
      setLoginError(true);
      setLoginErrorMessage(t.loginError);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-ground text-fg font-sans flex flex-col justify-between selection:bg-accent selection:text-on-accent">
      <header className="border-b border-line bg-surface px-6 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-control bg-accent text-on-accent flex items-center justify-center font-bold">
            <Buildings size={18} />
          </div>
          <div className="text-xs font-bold text-fg">{t.brandTitle}</div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleAdminLang}
            className="px-2.5 py-1 rounded-control border border-line bg-surface hover:bg-tint text-fg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Translate size={14} className="text-accent" />
            <span>{lang === "ne" ? "English" : "नेपाली"}</span>
          </button>
          <Link
            href="/"
            className="text-xs text-muted hover:text-fg flex items-center gap-1.5 py-1 px-2.5 rounded-control hover:bg-tint transition-colors"
          >
            <span>{t.publicPortal}</span>
            <ArrowSquareOut size={14} />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-card border border-line bg-surface p-6 sm:p-8 space-y-6 shadow-e1">
          <div className="space-y-1.5 text-center">
            <div className="w-10 h-10 rounded-control bg-accent-soft text-accent mx-auto flex items-center justify-center mb-2">
              <LockKey size={20} />
            </div>
            <h1 className="text-lg font-bold text-fg">{t.signInTitle}</h1>
            <p className="text-xs text-muted leading-relaxed">{t.signInDesc}</p>
          </div>

          {loginError && (
            <div className="p-3 rounded-control border border-danger/30 bg-danger/10 text-danger text-xs text-center leading-relaxed">
              {loginErrorMessage || t.loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">{t.username}</label>
              <input
                required
                disabled={isLoggingIn}
                type="text"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="admin or email"
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">{t.password}</label>
              <input
                required
                disabled={isLoggingIn}
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold shadow-e1 transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <CircleNotch size={16} className="animate-spin" />
                  <span>{lang === "ne" ? "प्रमाणीकरण हुँदैछ..." : "Signing in..."}</span>
                </>
              ) : (
                <span>{t.signInBtn}</span>
              )}
            </button>
          </form>
        </div>
      </main>

      <footer className="border-t border-line bg-surface py-3 text-center text-xs text-muted">
        {t.brandTitle} {t.brandSubtitle}
      </footer>
    </div>
  );
}
