import React from "react";

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4 bg-ground">
      {/* Top glowing progress bar indicator */}
      <div className="fixed top-0 inset-x-0 h-1 bg-accent/20 z-50 overflow-hidden">
        <div className="h-full bg-accent animate-[indeterminate_1.5s_infinite_linear] origin-left" />
      </div>

      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Pulsing ring */}
        <div className="absolute inset-0 rounded-full border-2 border-accent/30 animate-ping opacity-75" />
        <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <div className="absolute w-3 h-3 rounded-full bg-accent" />
      </div>

      <div className="text-center space-y-1">
        <div className="text-sm font-bold text-fg tracking-wide animate-pulse">
          लोड हुँदैछ... / Loading...
        </div>
        <p className="text-xs text-muted font-mono">थोर्गा सम्पर्क मञ्च</p>
      </div>
    </div>
  );
}
