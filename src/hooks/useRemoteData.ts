/**
 * useRemoteData
 *
 * On component mount, fetches data from the given API URL and calls the
 * provided `save` function to write it into the localStorage store.
 * This bridges the API-cached Supabase data with the local stores used by
 * `useSyncExternalStore`.
 *
 * Cache strategy:
 * - Stores the last ETag in sessionStorage per URL
 * - On the next mount in the same session, sends `If-None-Match` so the
 *   server returns 304 if data hasn't changed (zero bytes transferred)
 */
"use client";

import { useEffect } from "react";

const ETAG_PREFIX = "__thorga_etag__";

export function useRemoteData<T>(
  url: string,
  save: (data: T) => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const etagKey = ETAG_PREFIX + url;
    const storedEtag = sessionStorage.getItem(etagKey);

    const headers: HeadersInit = {};
    if (storedEtag) {
      headers["If-None-Match"] = storedEtag;
    }

    fetch(url, { headers, cache: "no-store" })
      .then(async (res) => {
        if (cancelled) return;

        // 304 = data unchanged, nothing to do
        if (res.status === 304) return;

        if (!res.ok) {
          console.warn(`[useRemoteData] ${url} responded ${res.status}`);
          return;
        }

        const newEtag = res.headers.get("etag");
        if (newEtag) sessionStorage.setItem(etagKey, newEtag);

        const data = (await res.json()) as T;
        if (!cancelled) save(data);
      })
      .catch((err) => {
        if (!cancelled) console.warn(`[useRemoteData] fetch error:`, err);
      });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled]);
}
