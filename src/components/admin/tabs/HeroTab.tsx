"use client";

import React, { useState } from "react";
import { BaseTabProps } from "../adminTypes";
import { ADMIN_I18N, revalidateCollection } from "../adminConstants";
import { HeroContent, saveStoredHeroContent } from "@/data/mockData";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import {
  Globe,
  Image as ImageIcon,
  CircleNotch,
} from "@phosphor-icons/react";

interface HeroTabProps extends BaseTabProps {
  initialHero: HeroContent;
}

export function HeroTab({
  lang,
  adminFetch,
  dialogAlert,
  initialHero,
}: HeroTabProps) {
  const t = ADMIN_I18N[lang];
  const [heroState, setHeroState] = useState<HeroContent>(initialHero);
  const [isSavingHero, setIsSavingHero] = useState(false);

  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !heroState.titleNe.trim() ||
      !heroState.titleEn.trim() ||
      !heroState.descriptionNe.trim() ||
      !heroState.descriptionEn.trim()
    ) {
      dialogAlert({
        title: lang === "ne" ? "विवरण अपूर्ण छ" : "Incomplete Details",
        description:
          lang === "ne"
            ? "कृपया ब्यानरको मुख्य शीर्षक र विवरण दुवै भाषामा अनिवार्य भर्नुहोस्।"
            : "Please fill both Nepali and English titles and descriptions for the Hero banner.",
        type: "warning",
      });
      return;
    }

    setIsSavingHero(true);
    try {
      const res = await adminFetch("/api/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(heroState),
      });
      const data = await res.json();
      if (data && data.success && data.data) {
        setHeroState(data.data);
        saveStoredHeroContent(data.data);
      } else {
        saveStoredHeroContent(heroState);
      }
      revalidateCollection("hero");

      dialogAlert({
        title: lang === "ne" ? "ब्यानर सम्पादन भयो" : "Hero Banner Updated",
        description:
          lang === "ne"
            ? "मुख्य पृष्ठको ब्यानर विवरणहरू सफलतापूर्वक डेटाबेसमा अद्यावधिक गरिएको छ।"
            : "Hero section headlines, text, and visual frame have been updated live across all devices.",
        type: "success",
      });
    } catch (err) {
      console.error("Failed to sync hero to db:", err);
      dialogAlert({
        title: lang === "ne" ? "कार्य असफल" : "Save Failed",
        description:
          lang === "ne"
            ? "सर्भरसँग सम्पर्क हुन सकेन।"
            : "Network or server error occurred.",
        type: "danger",
      });
    } finally {
      setIsSavingHero(false);
    }
  };

  return (
    <form onSubmit={handleSaveHero} className="space-y-6">
      <div className="p-6 rounded-card border border-line bg-surface space-y-5">
        <div className="text-sm font-bold text-fg flex items-center gap-2">
          <Globe size={18} className="text-accent" />
          <span>Headlines and Descriptions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-fg">
              Top Ribbon Tag (Nepali)
            </label>
            <input
              required
              type="text"
              value={heroState.badgeNe}
              onChange={(e) =>
                setHeroState({ ...heroState, badgeNe: e.target.value })
              }
              className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-fg">
              Top Ribbon Tag (English)
            </label>
            <input
              required
              type="text"
              value={heroState.badgeEn}
              onChange={(e) =>
                setHeroState({ ...heroState, badgeEn: e.target.value })
              }
              className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-fg">
              Main Headline (Nepali)
            </label>
            <textarea
              required
              rows={2}
              value={heroState.titleNe}
              onChange={(e) =>
                setHeroState({ ...heroState, titleNe: e.target.value })
              }
              className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-fg">
              Main Headline (English)
            </label>
            <textarea
              required
              rows={2}
              value={heroState.titleEn}
              onChange={(e) =>
                setHeroState({ ...heroState, titleEn: e.target.value })
              }
              className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-fg">
              Subtitle Paragraph (Nepali)
            </label>
            <textarea
              required
              rows={3}
              value={heroState.descriptionNe}
              onChange={(e) =>
                setHeroState({ ...heroState, descriptionNe: e.target.value })
              }
              className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-fg">
              Subtitle Paragraph (English)
            </label>
            <textarea
              required
              rows={3}
              value={heroState.descriptionEn}
              onChange={(e) =>
                setHeroState({ ...heroState, descriptionEn: e.target.value })
              }
              className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
            />
          </div>
        </div>
      </div>

      {/* Image and Frame */}
      <div className="p-6 rounded-card border border-line bg-surface space-y-5">
        <div className="text-sm font-bold text-fg flex items-center gap-2">
          <ImageIcon size={18} className="text-accent" />
          <span>Landscape Visual Frame</span>
        </div>

        <CloudinaryUploader
          label="Hero Landscape Visual Image (Max 2MB)"
          description="High resolution photo for portal header"
          folder="hero"
          accept="image/*"
          value={heroState.imageUrl}
          onChange={(url) => setHeroState({ ...heroState, imageUrl: url })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-fg">
              Image Badge (Nepali)
            </label>
            <input
              type="text"
              value={heroState.imageBadgeNe}
              onChange={(e) =>
                setHeroState({ ...heroState, imageBadgeNe: e.target.value })
              }
              className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-fg">
              Image Badge (English)
            </label>
            <input
              type="text"
              value={heroState.imageBadgeEn}
              onChange={(e) =>
                setHeroState({ ...heroState, imageBadgeEn: e.target.value })
              }
              className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-fg">
              Caption Title (Nepali)
            </label>
            <input
              type="text"
              value={heroState.imageCaptionNe}
              onChange={(e) =>
                setHeroState({ ...heroState, imageCaptionNe: e.target.value })
              }
              className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-fg">
              Caption Title (English)
            </label>
            <input
              type="text"
              value={heroState.imageCaptionEn}
              onChange={(e) =>
                setHeroState({ ...heroState, imageCaptionEn: e.target.value })
              }
              className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-fg">
              Office Subtitle (Nepali)
            </label>
            <input
              type="text"
              value={heroState.imageSubtitleNe}
              onChange={(e) =>
                setHeroState({ ...heroState, imageSubtitleNe: e.target.value })
              }
              className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-fg">
              Office Subtitle (English)
            </label>
            <input
              type="text"
              value={heroState.imageSubtitleEn}
              onChange={(e) =>
                setHeroState({ ...heroState, imageSubtitleEn: e.target.value })
              }
              className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSavingHero}
          className="px-6 py-2.5 rounded-control btn-fill bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold shadow-e1 transition-colors flex items-center gap-2 cursor-pointer"
        >
          {isSavingHero && <CircleNotch size={14} className="animate-spin" />}
          <span>
            {isSavingHero
              ? lang === "ne"
                ? "सुरक्षित गर्दै..."
                : "Saving..."
              : t.saveChanges}
          </span>
        </button>
      </div>
    </form>
  );
}
