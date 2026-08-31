"use client";

import React, { useState } from "react";
import { BaseTabProps } from "../adminTypes";
import { ADMIN_I18N, revalidateCollection } from "../adminConstants";
import { BrandingSettings, saveStoredBranding } from "@/data/mockData";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import {
  PaintBucket,
  Image as ImageIcon,
  Globe,
  CircleNotch,
} from "@phosphor-icons/react";

interface BrandingTabProps extends BaseTabProps {
  initialBranding: BrandingSettings;
}

export function BrandingTab({
  lang,
  adminFetch,
  dialogAlert,
  initialBranding,
}: BrandingTabProps) {
  const t = ADMIN_I18N[lang];
  const [brandingState, setBrandingState] =
    useState<BrandingSettings>(initialBranding);
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-fg flex items-center gap-2">
          <PaintBucket size={18} className="text-accent" />
          {lang === "ne" ? "ब्रान्डिङ सेटिङ्स" : "Branding Settings"}
        </h2>
        <p className="text-xs text-muted mt-1">
          {lang === "ne"
            ? "वेबसाइटको लोगो र फेभिकन अपलोड गर्नुहोस्। यी परिवर्तनहरू तुरुन्त वेबसाइटमा देखिनेछन्।"
            : "Upload your site logo and browser favicon. Changes appear instantly across the website."}
        </p>
      </div>

      {/* Logo Section */}
      <div className="p-5 rounded-card border border-line bg-surface space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <ImageIcon size={15} className="text-accent" />
          <h3 className="text-sm font-semibold text-fg">
            {lang === "ne" ? "कम्पनी लोगो" : "Company Logo"}
          </h3>
        </div>
        <p className="text-[11px] text-muted">
          {lang === "ne"
            ? "साइट हेडरमा देखिने लोगो। वर्गाकार वा गोलो ढाँचा सिफारिस। (PNG, SVG, WebP)"
            : "Shown in the site header. Square or circle format recommended. (PNG, SVG, WebP)"}
        </p>

        {/* Live Preview */}
        {brandingState.logoUrl && (
          <div className="flex items-center gap-3 p-3 rounded-control border border-line bg-tint">
            <div className="w-12 h-12 rounded-card bg-accent overflow-hidden flex-shrink-0 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brandingState.logoUrl}
                alt="Logo preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-fg">
                {lang === "ne" ? "हालको लोगो" : "Current Logo"}
              </p>
              <p className="text-[11px] text-muted break-all">
                {brandingState.logoUrl}
              </p>
            </div>
          </div>
        )}

        <CloudinaryUploader
          value={brandingState.logoUrl}
          onChange={(url) =>
            setBrandingState((prev) => ({ ...prev, logoUrl: url }))
          }
          folder="thorga_branding"
          accept="image/*"
          label={lang === "ne" ? "लोगो अपलोड गर्नुहोस्" : "Upload Logo"}
        />

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            disabled={isSavingBranding}
            onClick={async () => {
              setIsSavingBranding(true);
              try {
                const next = { ...brandingState };
                saveStoredBranding(next);
                await adminFetch("/api/branding", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(next),
                });
                revalidateCollection("branding");

                dialogAlert({
                  title: lang === "ne" ? "लोगो सुरक्षित भयो" : "Logo Saved",
                  description:
                    lang === "ne"
                      ? "साइट हेडरमा नयाँ लोगो लागू भएको छ।"
                      : "New logo is now live in the site header.",
                  type: "success",
                });
              } catch (err) {
                console.error("Failed to sync branding:", err);
              } finally {
                setIsSavingBranding(false);
              }
            }}
            className="px-4 py-1.5 rounded-control btn-fill bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {isSavingBranding && (
              <CircleNotch size={13} className="animate-spin" />
            )}
            <span>
              {isSavingBranding
                ? lang === "ne"
                  ? "सुरक्षित गर्दै..."
                  : "Saving..."
                : t.saveChanges}
            </span>
          </button>
          {brandingState.logoUrl && (
            <button
              type="button"
              disabled={isSavingBranding}
              onClick={async () => {
                setIsSavingBranding(true);
                try {
                  const next = { ...brandingState, logoUrl: "" };
                  setBrandingState(next);
                  saveStoredBranding(next);
                  await adminFetch("/api/branding", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(next),
                  });
                  revalidateCollection("branding");
                } catch (err) {
                  console.error("Failed to sync branding:", err);
                } finally {
                  setIsSavingBranding(false);
                }
              }}
              className="px-4 py-1.5 rounded-control border border-line text-muted hover:text-fg disabled:opacity-60 text-xs font-medium transition-colors cursor-pointer"
            >
              {lang === "ne" ? "लोगो हटाउनुहोस्" : "Remove Logo"}
            </button>
          )}
        </div>
      </div>

      {/* Favicon Section */}
      <div className="p-5 rounded-card border border-line bg-surface space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Globe size={15} className="text-accent" />
          <h3 className="text-sm font-semibold text-fg">
            {lang === "ne" ? "फेभिकन (Favicon)" : "Browser Favicon"}
          </h3>
        </div>
        <p className="text-[11px] text-muted">
          {lang === "ne"
            ? "ब्राउजर ट्याबमा देखिने साना आइकन। वर्गाकार, न्यूनतम ३२×३२ px। (PNG, ICO, SVG)"
            : "Small icon shown in browser tabs. Square image, minimum 32×32 px recommended. (PNG, ICO, SVG)"}
        </p>

        {/* Live Preview */}
        {brandingState.faviconUrl && (
          <div className="flex items-center gap-3 p-3 rounded-control border border-line bg-tint">
            <div className="w-8 h-8 rounded border border-line overflow-hidden flex-shrink-0 bg-white flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brandingState.faviconUrl}
                alt="Favicon preview"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-fg">
                {lang === "ne" ? "हालको फेभिकन" : "Current Favicon"}
              </p>
              <p className="text-[11px] text-muted break-all">
                {brandingState.faviconUrl}
              </p>
            </div>
          </div>
        )}

        <CloudinaryUploader
          value={brandingState.faviconUrl}
          onChange={(url) =>
            setBrandingState((prev) => ({ ...prev, faviconUrl: url }))
          }
          folder="thorga_branding"
          accept="image/*"
          label={lang === "ne" ? "फेभिकन अपलोड गर्नुहोस्" : "Upload Favicon"}
        />

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            disabled={isSavingBranding}
            onClick={async () => {
              setIsSavingBranding(true);
              try {
                const next = { ...brandingState };
                saveStoredBranding(next);
                await adminFetch("/api/branding", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(next),
                });
                revalidateCollection("branding");

                dialogAlert({
                  title: lang === "ne" ? "फेभिकन सुरक्षित भयो" : "Favicon Saved",
                  description:
                    lang === "ne"
                      ? "ब्राउजर ट्याबमा नयाँ फेभिकन लागू भएको छ।"
                      : "New favicon is now active in browser tabs.",
                  type: "success",
                });
              } catch (err) {
                console.error("Failed to sync branding:", err);
              } finally {
                setIsSavingBranding(false);
              }
            }}
            className="px-4 py-1.5 rounded-control btn-fill bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {isSavingBranding && (
              <CircleNotch size={13} className="animate-spin" />
            )}
            <span>
              {isSavingBranding
                ? lang === "ne"
                  ? "सुरक्षित गर्दै..."
                  : "Saving..."
                : t.saveChanges}
            </span>
          </button>
          {brandingState.faviconUrl && (
            <button
              type="button"
              disabled={isSavingBranding}
              onClick={async () => {
                setIsSavingBranding(true);
                try {
                  const next = { ...brandingState, faviconUrl: "" };
                  setBrandingState(next);
                  saveStoredBranding(next);
                  await adminFetch("/api/branding", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(next),
                  });
                  revalidateCollection("branding");
                } catch (err) {
                  console.error("Failed to sync branding:", err);
                } finally {
                  setIsSavingBranding(false);
                }
              }}
              className="px-4 py-1.5 rounded-control border border-line text-muted hover:text-fg disabled:opacity-60 text-xs font-medium transition-colors cursor-pointer"
            >
              {lang === "ne" ? "फेभिकन हटाउनुहोस्" : "Remove Favicon"}
            </button>
          )}
        </div>
      </div>

      {/* Save All */}
      <button
        type="button"
        disabled={isSavingBranding}
        onClick={async () => {
          setIsSavingBranding(true);
          try {
            saveStoredBranding(brandingState);
            await adminFetch("/api/branding", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(brandingState),
            });
            revalidateCollection("branding");

            dialogAlert({
              title: lang === "ne" ? "ब्रान्डिङ सुरक्षित भयो" : "Branding Saved",
              description:
                lang === "ne"
                  ? "लोगो र फेभिकन दुवै सफलतापूर्वक अद्यावधिक गरिएको छ।"
                  : "Logo and favicon have been updated successfully across the site.",
              type: "success",
            });
          } catch (err) {
            console.error("Failed to sync branding:", err);
          } finally {
            setIsSavingBranding(false);
          }
        }}
        className="w-full py-2.5 rounded-control btn-fill bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold shadow-e1 transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        {isSavingBranding && <CircleNotch size={14} className="animate-spin" />}
        <span>
          {isSavingBranding
            ? lang === "ne"
              ? "सबै सुरक्षित गर्दै..."
              : "Saving All Branding..."
            : lang === "ne"
            ? "सबै ब्रान्डिङ सुरक्षित गर्नुहोस्"
            : "Save All Branding"}
        </span>
      </button>
    </div>
  );
}
