import type { Metadata } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import { Geist, Geist_Mono } from "next/font/google";
import { DialogProvider } from "@/components/Dialog";
import { ToastProvider } from "@/components/Toast";
import NavigationProgressBar from "@/components/NavigationProgressBar";
import FaviconInjector from "@/components/FaviconInjector";
import "./globals.css";

const kalimati = localFont({
  src: "../fonts/Kalimati.ttf",
  variable: "--font-nepali",
  display: "swap",
  declarations: [
    {
      prop: "unicode-range",
      value: "U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+A8E0-A8FF, U+20A8",
    },
  ],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "थोर्गा काठमाडौं सम्पर्क तथा विकास मञ्च | Thorga Kathmandu Manch",
  description: "काठमाडौँमा रहेका थोर्गाबासीहरुलाई एकताबद्ध गर्दै गाउँको चौतर्फी उन्नति र विकासमा समर्पित गैरनाफामूलक संस्था।",
};

const themeInit = `(function(){try{var t=localStorage.getItem("thorga-theme");if(!t){t="light";}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="light";}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ne"
      suppressHydrationWarning
      className={`${kalimati.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Suspense fallback={null}>
          <NavigationProgressBar />
          <FaviconInjector />
        </Suspense>
        <ToastProvider>
          <DialogProvider>{children}</DialogProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
