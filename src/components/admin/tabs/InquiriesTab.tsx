"use client";

import React from "react";
import { BaseTabProps } from "../adminTypes";
import { ADMIN_I18N } from "../adminConstants";
import { Inquiry } from "@/data/mockData";
import { Trash } from "@phosphor-icons/react";

interface InquiriesTabProps extends BaseTabProps {
  inquiriesList: Inquiry[];
  setInquiriesList: React.Dispatch<React.SetStateAction<Inquiry[]>>;
  inquiriesLoading: boolean;
  inquiriesError: boolean;
  onRetry: () => void;
}

export function InquiriesTab({
  lang,
  adminFetch,
  dialogConfirm,
  toast,
  inquiriesList,
  setInquiriesList,
  inquiriesLoading,
  inquiriesError,
  onRetry,
}: InquiriesTabProps) {
  const t = ADMIN_I18N[lang];

  const handleDeleteInquiry = async (id: string) => {
    const confirmed = await dialogConfirm({
      title: t.removeInquiryConfirmTitle,
      description: t.removeInquiryConfirmDesc,
      type: "danger",
      confirmText: t.deleteBtn,
      cancelText: t.cancelBtn,
    });
    if (!confirmed) return;

    const previous = inquiriesList;
    setInquiriesList((current) => current.filter((inq) => inq.id !== id));

    try {
      const res = await adminFetch(
        `/api/inquiries?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );
      if (!res || !res.ok) throw new Error("Delete failed");
    } catch {
      setInquiriesList(previous);
      toast.error(
        lang === "ne" ? "हटाउन सकिएन" : "Could not delete",
        lang === "ne" ? "कृपया पुनः प्रयास गर्नुहोस्।" : "Please try again."
      );
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-fg">{t.inquiries}</h2>
        <p className="text-xs text-muted">
          {lang === "ne"
            ? "सर्वसाधारणबाट प्राप्त सम्पर्क तथा सदस्यता सोधपुछ सन्देशहरू"
            : "Public contact submissions and inquiries."}
        </p>
      </div>

      <div className="space-y-3">
        {inquiriesLoading ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="p-4 border border-line rounded-card bg-surface space-y-2 animate-pulse"
              >
                <div className="h-3 w-40 rounded-chip bg-tint" />
                <div className="h-3 w-full rounded-chip bg-tint" />
                <div className="h-3 w-2/3 rounded-chip bg-tint" />
              </div>
            ))}
          </div>
        ) : inquiriesError ? (
          <div className="p-8 text-center border border-line rounded-card bg-surface space-y-3">
            <p className="text-xs text-danger font-semibold">
              {lang === "ne"
                ? "सन्देशहरू लोड गर्न सकिएन।"
                : "Could not load messages."}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="px-4 py-2 rounded-control bg-accent text-on-accent text-xs font-semibold cursor-pointer"
            >
              {lang === "ne" ? "पुनः प्रयास" : "Retry"}
            </button>
          </div>
        ) : inquiriesList.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted border border-line rounded-card bg-surface">
            {t.noInquiries}
          </div>
        ) : (
          inquiriesList.map((inq) => (
            <div
              key={inq.id}
              className="p-4 rounded-card border border-line bg-surface space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <div className="text-xs font-bold text-fg">{inq.name}</div>
                  <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                    <a
                      href={`tel:${inq.phone}`}
                      className="hover:text-accent font-mono"
                    >
                      {inq.phone}
                    </a>
                    <span>{inq.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted">
                    {inq.date}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteInquiry(inq.id)}
                    className="p-1 text-danger hover:bg-danger/10 rounded-control transition-colors cursor-pointer"
                    title={t.deleteBtn}
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-fg bg-ground p-3 rounded-control border border-line">
                {inq.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
