"use client";
import { RosterPageView } from "@/components/about/RosterPageView";

export default function FormerAdvisorsPage() {
  return (
    <RosterPageView
      kind="former_advisor"
      titleNe="हालसम्मका सल्लाहाकारहरु"
      titleEn="Former Advisors"
      introNe="संस्थालाई विभिन्न कालखण्डमा मार्गदर्शन गर्नुभएका सल्लाहाकारहरु।"
      introEn="Advisors who have guided the forum over the years."
    />
  );
}
