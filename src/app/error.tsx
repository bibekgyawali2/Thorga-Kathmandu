"use client";

import { useEffect } from "react";
import Link from "next/link";
import { WarningCircle, ArrowClockwise, House } from "@phosphor-icons/react";

/**
 * Route-level error boundary. Catches render and data errors in the page tree
 * and offers a way forward instead of a blank screen.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in server logs / the platform's error reporting.
    console.error("[route error]", error);
  }, [error]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-20 bg-ground">
      <div className="max-w-md w-full text-center space-y-5">
        <WarningCircle size={44} weight="duotone" className="text-danger mx-auto" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-fg">केही समस्या आयो</h1>
          <p className="text-sm text-muted leading-relaxed">
            Something went wrong while loading this page. You can try again, or return to the
            home page.
          </p>
        </div>

        {error.digest && (
          <p className="font-mono text-[11px] text-muted">Reference: {error.digest}</p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="px-5 py-2.5 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors flex items-center gap-2"
          >
            <ArrowClockwise size={15} />
            Try again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-control border border-line bg-surface hover:bg-tint text-fg text-xs font-semibold transition-colors flex items-center gap-2"
          >
            <House size={15} />
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
