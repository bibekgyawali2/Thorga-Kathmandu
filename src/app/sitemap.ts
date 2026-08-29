import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thorgaktm.org.np";

const ROUTES = [
  "",
  "/committee",
  "/events",
  "/publications",
  "/gallery",
  "/about/organisation",
  "/about/thorga",
  "/about/advisors",
  "/about/former-office-bearers",
  "/about/former-advisors",
  "/about/statute",
  "/about/life-members",
  "/about/certificates",
  "/publications/calendar",
  "/publications/phone-directory",
  "/publications/bulletin",
  "/publications/souvenir",
  "/publications/other",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
