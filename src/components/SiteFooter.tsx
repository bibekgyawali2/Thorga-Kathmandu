"use client";

import React, { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Language,
  subscribeContactSettings,
  getStoredContactSettingsSnapshot,
  getServerContactSettingsSnapshot,
} from "@/data/mockData";
import { isAllowedMapEmbedUrl } from "@/lib/validation";
import { Buildings, MapPin, EnvelopeSimple, Phone } from "@phosphor-icons/react";

export function SiteFooter({ lang }: { lang: Language }) {
  const contact = useSyncExternalStore(
    subscribeContactSettings,
    getStoredContactSettingsSnapshot,
    getServerContactSettingsSnapshot
  );

  // Re-checked at render as well as on save: the value reaches an iframe src,
  // so a stale or tampered cached copy must not be able to frame another site.
  const mapUrl = isAllowedMapEmbedUrl(contact.mapEmbedUrl) ? contact.mapEmbedUrl : null;
  const mapLabel = lang === "ne" ? contact.mapLabelNe : contact.mapLabelEn;

  return (
    <footer className="bg-surface border-t border-line text-xs py-14 text-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5 font-bold text-base text-fg">
              <div className="w-8 h-8 rounded-card bg-accent text-on-accent flex items-center justify-center">
                <Buildings size={18} weight="duotone" />
              </div>
              <span>
                {lang === "ne"
                  ? "थोर्गा काठमाडौं सम्पर्क तथा विकास मञ्च"
                  : "Thorga Kathmandu Liaison Forum"}
              </span>
            </div>
            <p className="text-xs max-w-md leading-relaxed text-muted">
              {lang === "ne"
                ? "गुल्मी जिल्लाको ऐतिहासिक तथा पर्यटकीय थलो थोर्गाका बासिन्दाहरूलाई काठमाडौँमा जोड्ने तथा गाउँको सर्वाङ्गीण विकासमा समर्पित गैरनाफामूलक सामाजिक संस्था।"
                : "A registered non-profit forum connecting native families of Thorga, Gulmi in Kathmandu for community welfare, cultural preservation, and youth scholarships."}
            </p>
          </div>

          {/* Quick Page Links */}
          <div className="md:col-span-3 space-y-2">
            <div className="font-bold text-fg text-sm">
              {lang === "ne" ? "मुख्य पृष्ठहरू" : "Directory Pages"}
            </div>
            <ul className="space-y-1.5">
              <li>
                <Link href="/committee" className="hover:text-accent transition-colors">
                  {lang === "ne" ? "कार्यसमिति सदस्यहरू" : "Executive Committee"}
                </Link>
              </li>
              <li>
                <Link href="/about/former-office-bearers" className="hover:text-accent transition-colors">
                  {lang === "ne" ? "पूर्व नेतृत्व तथा कार्यकाल" : "Past Leadership Archive"}
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-accent transition-colors">
                  {lang === "ne" ? "कार्यक्रम तथा गतिविधि" : "Events & Programs"}
                </Link>
              </li>
              <li>
                <Link href="/publications" className="hover:text-accent transition-colors">
                  {lang === "ne" ? "वार्षिक स्मारिका तथा PDF" : "Publications & PDF"}
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-accent transition-colors">
                  {lang === "ne" ? "तस्बिर सङ्ग्रहहरू" : "Photo Gallery"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Secretariat Contact Details */}
          <div className="md:col-span-4 space-y-3">
            <div className="font-bold text-fg text-sm">
              {lang === "ne" ? "सम्पर्क तथा सचिवालय" : "Secretariat Office"}
            </div>
            <div className="space-y-2 leading-relaxed">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-accent flex-shrink-0 mt-0.5" />
                <span>
                  {lang === "ne"
                    ? "काठमाडौँ सचिवालय: शंखमूल मार्ग, नयाँ बानेश्वर"
                    : "Kathmandu Secretariat: Shankhamul Marg, New Baneshwor"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-accent flex-shrink-0" />
                <span>+977 01-4481234, 9851012345</span>
              </div>
              <div className="flex items-center gap-2">
                <EnvelopeSimple size={16} className="text-accent flex-shrink-0" />
                <span>info@thorgaktm.org.np</span>
              </div>
            </div>
          </div>
        </div>

        {/* Village location */}
        {mapUrl && (
          <section className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-fg font-bold text-sm">
              <MapPin size={16} className="text-accent" weight="duotone" />
              <h2>{lang === "ne" ? "थोर्गाको अवस्थिति" : "Where Thorga Is"}</h2>
            </div>
            {mapLabel && <p className="text-xs text-muted">{mapLabel}</p>}
            <div className="rounded-card overflow-hidden border border-line bg-tint">
              <iframe
                src={mapUrl}
                title={
                  lang === "ne"
                    ? "थोर्गाको स्थान देखाउने नक्सा"
                    : "Map showing the location of Thorga"
                }
                // Deferred so the footer map never competes with page content
                // for bandwidth on a slow connection.
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-64 sm:h-80 border-0 block"
              />
            </div>
          </section>
        )}

        {/* Bottom Rights Strip */}
        <div className="pt-8 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>
            &copy; 2026 Thorga Kathmandu Samparka Tatha Bikash Manch. All rights reserved.
          </div>
          <div className="text-muted">
            {lang === "ne" ? "गुल्मी र काठमाडौँ सम्पर्क सञ्जाल" : "Gulmi and Kathmandu Liaison Network"}
          </div>
        </div>
      </div>
    </footer>
  );
}
