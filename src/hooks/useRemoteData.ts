/**
 * useRemoteData
 *
 * On component mount, fetches data from the given API URL and calls the
 * provided `save` function to write it into the local state / store.
 * Always fetches fresh data with no caching.
 */
"use client";

import { useEffect } from "react";

export function useRemoteData<T>(
  url: string,
  save: (data: T) => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    fetch(url, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    })
      .then(async (res) => {
        if (cancelled) return;

        if (!res.ok) {
          console.warn(`[useRemoteData] ${url} responded ${res.status}`);
          return;
        }

        const data = (await res.json()) as T;
        if (!cancelled && data !== undefined && data !== null) {
          save(data);
        }
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

