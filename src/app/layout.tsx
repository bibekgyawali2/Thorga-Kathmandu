import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Noto_Sans_Devanagari } from "next/font/google";
import { DialogProvider } from "@/components/Dialog";
import { ToastProvider } from "@/components/Toast";
import NavigationProgressBar from "@/components/NavigationProgressBar";
import FaviconInjector from "@/components/FaviconInjector";
import "./globals.css";

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

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "थोर्गा काठमाडौं सम्पर्क तथा विकास मञ्च | Thorga Kathmandu Manch",
  description: "काठमाडौँमा रहेका थोर्गाबासीहरुलाई एकताबद्ध गर्दै गाउँको चौतर्फी उन्नति र विकासमा समर्पित गैरनाफामूलक संस्था।",
};

const themeInit = `(function(){try{var t=localStorage.getItem("thorga-theme");if(!t){t="light";}document.documentElement.dataset.theme=t;var l=localStorage.getItem("thorga_language");if(l){document.documentElement.lang=l;}}catch(e){document.documentElement.dataset.theme="light";}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ne"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansDevanagari.variable} h-full antialiased`}
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
