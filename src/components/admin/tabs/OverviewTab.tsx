"use client";

import React from "react";
import { BaseTabProps, AdminTab } from "../adminTypes";
import { ADMIN_I18N } from "../adminConstants";
import {
  Users,
  BookOpen,
  Calendar,
  EnvelopeSimple,
  ShieldCheck,
} from "@phosphor-icons/react";

interface OverviewTabProps extends BaseTabProps {
  counts: {
    members: number;
    publications: number;
    events: number;
    inquiries: number;
    adminUsers: number;
  };
  onQuickAction: (tab: AdminTab, openModal?: boolean) => void;
}

export function OverviewTab({
  lang,
  counts,
  onQuickAction,
}: OverviewTabProps) {
  const t = ADMIN_I18N[lang];

  return (
    <div className="space-y-6">
      {/* Stat Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-card border border-line bg-surface space-y-1">
          <div className="text-xs text-muted flex items-center justify-between">
            <span>{t.members}</span>
            <Users size={16} className="text-accent" />
          </div>
          <div className="text-2xl font-bold font-mono text-fg">{counts.members}</div>
        </div>

        <div className="p-4 rounded-card border border-line bg-surface space-y-1">
          <div className="text-xs text-muted flex items-center justify-between">
            <span>{t.publications}</span>
            <BookOpen size={16} className="text-accent" />
          </div>
          <div className="text-2xl font-bold font-mono text-fg">{counts.publications}</div>
        </div>

        <div className="p-4 rounded-card border border-line bg-surface space-y-1">
          <div className="text-xs text-muted flex items-center justify-between">
            <span>{t.events}</span>
            <Calendar size={16} className="text-accent" />
          </div>
          <div className="text-2xl font-bold font-mono text-fg">{counts.events}</div>
        </div>

        <div className="p-4 rounded-card border border-line bg-surface space-y-1">
          <div className="text-xs text-muted flex items-center justify-between">
            <span>{t.inquiries}</span>
            <EnvelopeSimple size={16} className="text-danger" />
          </div>
          <div className="text-2xl font-bold font-mono text-fg">{counts.inquiries}</div>
        </div>

        <div className="p-4 rounded-card border border-line bg-surface space-y-1">
          <div className="text-xs text-muted flex items-center justify-between">
            <span>{t.adminAccess}</span>
            <ShieldCheck size={16} className="text-warning" />
          </div>
          <div className="text-2xl font-bold font-mono text-fg">{counts.adminUsers}</div>
        </div>
      </div>

      {/* Action Triggers */}
      <div className="p-6 rounded-card border border-line bg-surface space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
          {t.quickActions}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => onQuickAction("hero")}
            className="p-4 rounded-control border border-line bg-ground hover:border-accent text-left transition-colors space-y-1 cursor-pointer"
          >
            <div className="text-xs font-bold text-fg">{t.updateHero}</div>
            <div className="text-[11px] text-muted">{t.updateHeroDesc}</div>
          </button>

          <button
            type="button"
            onClick={() => onQuickAction("members", true)}
            className="p-4 rounded-control border border-line bg-ground hover:border-accent text-left transition-colors space-y-1 cursor-pointer"
          >
            <div className="text-xs font-bold text-fg">{t.addMember}</div>
            <div className="text-[11px] text-muted">{t.addMemberDesc}</div>
          </button>

          <button
            type="button"
            onClick={() => onQuickAction("events", true)}
            className="p-4 rounded-control border border-line bg-ground hover:border-accent text-left transition-colors space-y-1 cursor-pointer"
          >
            <div className="text-xs font-bold text-fg">{t.scheduleEvent}</div>
            <div className="text-[11px] text-muted">{t.scheduleEventDesc}</div>
          </button>

          <button
            type="button"
            onClick={() => onQuickAction("publications", true)}
            className="p-4 rounded-control border border-line bg-ground hover:border-accent text-left transition-colors space-y-1 cursor-pointer"
          >
            <div className="text-xs font-bold text-fg">{t.uploadPub}</div>
            <div className="text-[11px] text-muted">{t.uploadPubDesc}</div>
          </button>

          <button
            type="button"
            onClick={() => onQuickAction("access")}
            className="p-4 rounded-control border border-line bg-ground hover:border-accent text-left transition-colors space-y-1 cursor-pointer"
          >
            <div className="text-xs font-bold text-fg">{t.adminAccess}</div>
            <div className="text-[11px] text-muted">{t.manageAccessDesc}</div>
          </button>
        </div>
      </div>
    </div>
  );
}
