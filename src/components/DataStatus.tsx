"use client";

import { WarningCircle, ArrowClockwise } from "@phosphor-icons/react";
import type { Language } from "@/data/mockData";

/**
 * Shown when a background refresh fails. Pages render from their cached
 * snapshot, so the content below is still readable; this only tells the
 * visitor it may be out of date and offers a retry.
 */
export function DataStatus({
  error,
  refetch,
  lang,
}: {
  error: boolean;
  refetch: () => void;
  lang: Language;
}) {
  if (!error) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      <div
        role="status"
        className="rounded-card border border-line bg-surface px-4 py-3 flex flex-wrap items-center gap-3"
      >
        <WarningCircle size={18} weight="duotone" className="text-warning flex-shrink-0" />
        <p className="text-xs text-muted flex-1 min-w-[12rem]">
          {lang === "ne"
            ? "पछिल्लो विवरण ल्याउन सकिएन। तल देखिएको सामग्री पुरानो हुन सक्छ।"
            : "Could not fetch the latest updates. The content below may be out of date."}
        </p>
        <button
          type="button"
          onClick={refetch}
          className="px-3 py-1.5 rounded-control border border-line bg-ground hover:bg-tint text-fg text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <ArrowClockwise size={13} />
          {lang === "ne" ? "पुनः प्रयास" : "Retry"}
        </button>
      </div>
    </div>
  );
}
