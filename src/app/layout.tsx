import type { Metadata } from "next";
import { Suspense } from "react";
import { Mukta, Geist, Geist_Mono } from "next/font/google";
import { DialogProvider } from "@/components/Dialog";
import NavigationProgressBar from "@/components/NavigationProgressBar";
import "./globals.css";

const mukta = Mukta({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["devanagari", "latin"],
  variable: "--font-nepali",
  display: "swap",
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

export const metadata: Metadata = {
  title: "थोर्गा काठमाडौं सम्पर्क तथा विकास मञ्च | Thorga Kathmandu Manch",
  description: "काठमाडौँमा रहेका थोर्गाबासीहरुलाई एकताबद्ध गर्दै गाउँको चौतर्फी उन्नति र विकासमा समर्पित गैरनाफामूलक संस्था।",
};

const themeInit = `(function(){try{var t=localStorage.getItem("thorga-theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="light";}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ne"
      suppressHydrationWarning
      className={`${mukta.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        <DialogProvider>{children}</DialogProvider>
      </body>
    </html>
  );
}
