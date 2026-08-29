"use client";
import { DocumentPageView } from "@/components/about/DocumentPageView";

export default function FormerAdvisorsPage() {
  return (
    <DocumentPageView
      slug="former-advisors"
      titleNe="हालसम्मका सल्लाहाकारहरु"
      titleEn="Former Advisors"
      introNe="प्रत्येक कार्यकालका सल्लाहाकारहरुको नामावली। तल कार्यकाल अनुसार हेर्न सकिन्छ।"
      introEn="Advisors listed by term. Each term is published as a single sheet below."
    />
  );
}
