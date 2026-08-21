"use client";

import React from "react";
import Link from "next/link";
import { Language } from "@/data/mockData";
import { Buildings, MapPin, EnvelopeSimple, Phone } from "@phosphor-icons/react";

export function SiteFooter({ lang }: { lang: Language }) {
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
                <Link href="/past-leaders" className="hover:text-accent transition-colors">
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
                  {lang === "ne" ? "तस्बिर सङ्ग्रह" : "Photo Gallery"}
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
                    : "Kathmandu Office: Shankhamul Marg, New Baneshwor"}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-accent flex-shrink-0 mt-0.5" />
                <span>
                  {lang === "ne"
                    ? "थोर्गा सम्पर्क केन्द्र: रुरुक्षेत्र-२, गुल्मी"
                    : "Thorga Center: Ruru Kshetra-2, Gulmi"}
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

        {/* Bottom Rights Strip */}
        <div className="pt-8 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>
            &copy; 2026 Thorga Kathmandu Samparka Tatha Bikash Manch. All rights reserved.
          </div>
          <div>
            {lang === "ne" ? "नेपाल सरकार दर्ता नं. ४१२/०५८" : "Govt Regd. No. 412/058"}
          </div>
        </div>
      </div>
    </footer>
  );
}
