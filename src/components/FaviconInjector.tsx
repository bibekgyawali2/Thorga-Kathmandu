"use client";

/**
 * FaviconInjector
 * Reads the stored branding settings on the client and updates the
 * <link rel="icon"> in <head> dynamically whenever the favicon URL changes.
 * Falls back gracefully to the static /favicon.ico when no custom favicon is set.
 */
import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import {
  subscribeBranding,
  getStoredBrandingSnapshot,
  getServerBrandingSnapshot,
} from "@/data/mockData";

export default function FaviconInjector() {
  const branding = useSyncExternalStore(
    subscribeBranding,
    getStoredBrandingSnapshot,
    getServerBrandingSnapshot
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    const url = branding.faviconUrl || "/favicon.ico";

    // Find existing <link rel="icon"> or create one
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = url;
  }, [branding.faviconUrl]);

  return null;
}
