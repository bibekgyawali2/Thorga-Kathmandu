"use client";
import { ContentPageView } from "@/components/about/ContentPageView";

export default function OrganisationProfilePage() {
  return (
    <ContentPageView
      slug="organisation"
      fallbackTitleNe="संस्था परिचय"
      fallbackTitleEn="Organisation Profile"
    />
  );
}
