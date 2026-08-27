/**
 * useRemoteData
 *
 * Refreshes a locally cached store from an API route. Pages render from the
 * cached snapshot immediately, so this is a background refresh rather than a
 * blocking load, and it reports its state so a page can tell the visitor when
 * what they are looking at could not be refreshed.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface RemoteDataState {
  /** True while the first fetch is in flight. */
  loading: boolean;
  /** True when the most recent fetch failed. The cached content still renders. */
  error: boolean;
  /** Re-runs the fetch. */
  refetch: () => void;
}

export function useRemoteData<T>(
  url: string,
  save: (data: T) => void,
  enabled = true
): RemoteDataState {
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Held in a ref so an inline arrow passed by the caller does not restart the
  // fetch on every render.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const controller = new AbortController();
    // Do not let a hung connection leave the page in a loading state forever.
    const timeout = setTimeout(() => controller.abort(), 15000);

    fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    })
      .then(async (res) => {
        if (cancelled) return;

        if (!res.ok) {
          console.warn(`[useRemoteData] ${url} responded ${res.status}`);
          setError(true);
          return;
        }

        const data = (await res.json()) as T;
        if (cancelled) return;

        if (data !== undefined && data !== null) {
          saveRef.current(data);
          setError(false);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn(`[useRemoteData] ${url} fetch error:`, err);
        setError(true);
      })
      .finally(() => {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [url, enabled, attempt]);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(false);
    setAttempt((n) => n + 1);
  }, []);

  // Derived rather than set inside the effect, which would cascade a render.
  return { loading: enabled && loading, error, refetch };
}
