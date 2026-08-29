"use client";
import { DocumentPageView } from "@/components/about/DocumentPageView";

export default function StatutePage() {
  return (
    <DocumentPageView
      slug="statute"
      titleNe="संस्थाको विधान"
      titleEn="Organisation Statute"
      introNe="संस्थाको आधिकारिक विधान। तल पूरा दस्तावेज पढ्न सकिन्छ।"
      introEn="The official statute of the forum. The full document can be read below."
    />
  );
}
