export type Language = "en" | "ne";

export interface Member {
  id: string;
  nameEn: string;
  nameNe: string;
  roleEn: string;
  roleNe: string;
  committeeType: "current" | "past" | "advisor";
  tenureEn?: string;
  tenureNe?: string;
  phone?: string;
  email?: string;
  photoUrl: string;
  bioEn?: string;
  bioNe?: string;
  order: number;
}

export interface EventItem {
  id: string;
  titleEn: string;
  titleNe: string;
  dateEn: string;
  dateNe: string;
  timeEn: string;
  timeNe: string;
  locationEn: string;
  locationNe: string;
  descriptionEn: string;
  descriptionNe: string;
  status: "upcoming" | "completed";
  categoryEn: string;
  categoryNe: string;
  imageUrl: string;
}

export interface Publication {
  id: string;
  titleEn: string;
  titleNe: string;
  categoryEn: string;
  categoryNe: string;
  publishedYearEn: string;
  publishedYearNe: string;
  fileSize: string;
  pages: number;
  pdfUrl: string;
  coverImageUrl?: string;
  descriptionEn: string;
  descriptionNe: string;
}

export interface GalleryItem {
  id: string;
  titleEn: string;
  titleNe: string;
  categoryEn: string;
  categoryNe: string;
  imageUrl: string;
  dateEn: string;
  dateNe: string;
}

export const initialMembers: Member[] = [];

export const initialEvents: EventItem[] = [];

export const initialPublications: Publication[] = [];

export const initialGallery: GalleryItem[] = [];

export interface HeroContent {
  badgeNe: string;
  badgeEn: string;
  titleNe: string;
  titleEn: string;
  descriptionNe: string;
  descriptionEn: string;
  imageUrl: string;
  imageBadgeNe: string;
  imageBadgeEn: string;
  imageCaptionNe: string;
  imageCaptionEn: string;
  imageSubtitleNe: string;
  imageSubtitleEn: string;
}

export const initialHeroContent: HeroContent = {
  badgeNe: "थोर्गा, गुल्मी र काठमाडौँ सम्पर्क सञ्जाल",
  badgeEn: "Thorga, Gulmi and Kathmandu Liaison",
  titleNe: "थोर्गाको पहिचान, काठमाडौँमा एकता र सेवाको अभियान",
  titleEn: "Uniting Thorga Heritage, Advancing Community Welfare",
  descriptionNe: "काठमाडौँ उपत्यकामा रहेका थोर्गाबासीहरुलाई एकताबद्ध गर्दै गाउँको शैक्षिक, स्वास्थ्य तथा पूर्वाधार विकासमा समर्पित गैरनाफामूलक सामाजिक संस्था।",
  descriptionEn: "A dedicated non-profit forum connecting native families of Thorga in Kathmandu for mutual assistance, youth scholarships, and village development.",
  imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1000&q=80",
  imageBadgeNe: "आधिकारिक मञ्च",
  imageBadgeEn: "Official Forum",
  imageCaptionNe: "गुल्मी जिल्ला, रुरुक्षेत्र गाउँपालिका वडा नं. २ र ३ (साविक थोर्गा गा.वि.स.)",
  imageCaptionEn: "Gulmi District, Ruru Kshetra Ward 2 and 3 (Former Thorga VDC)",
  imageSubtitleNe: "काठमाडौँ सम्पर्क सचिवालय: शंखमूल मार्ग, नयाँ बानेश्वर",
  imageSubtitleEn: "Kathmandu Liaison Office: Shankhamul Marg, New Baneshwor",
};

const HERO_STORAGE_KEY = "thorga_hero_content";

let heroSubscribers: Array<() => void> = [];

export function subscribeHeroContent(callback: () => void) {
  heroSubscribers.push(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === HERO_STORAGE_KEY) {
      callback();
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }
  return () => {
    heroSubscribers = heroSubscribers.filter((s) => s !== callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

export function getStoredHeroSnapshot(): HeroContent {
  if (typeof window === "undefined") return initialHeroContent;
  try {
    const raw = localStorage.getItem(HERO_STORAGE_KEY);
    if (!raw) return initialHeroContent;
    return JSON.parse(raw);
  } catch {
    return initialHeroContent;
  }
}

export function getServerHeroSnapshot(): HeroContent {
  return initialHeroContent;
}

export function saveStoredHeroContent(content: HeroContent): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HERO_STORAGE_KEY, JSON.stringify(content));
    heroSubscribers.forEach((s) => s());
  } catch {}
}

export interface ContactSettings {
  contactHeadingNe: string;
  contactHeadingEn: string;
  contactDescriptionNe: string;
  contactDescriptionEn: string;
  kathmanduTitleNe: string;
  kathmanduTitleEn: string;
  kathmanduSubtitleNe: string;
  kathmanduSubtitleEn: string;
  kathmanduAddressNe: string;
  kathmanduAddressEn: string;
  phone1: string;
  phone2: string;
  email: string;
}

export const initialContactSettings: ContactSettings = {
  contactHeadingNe: "सम्पर्क तथा सदस्यता सोधपुछ",
  contactHeadingEn: "Contact & Membership Inquiries",
  contactDescriptionNe: "मञ्चको सदस्यता, सामाजिक परियोजना, स्मारिका प्रकाशन तथा सहयोगका लागि सम्पर्क गर्नुहोस्",
  contactDescriptionEn: "Reach out for memberships, community welfare programs, publications, or partnerships",
  kathmanduTitleNe: "काठमाडौँ सम्पर्क सचिवालय",
  kathmanduTitleEn: "Kathmandu Secretariat",
  kathmanduSubtitleNe: "केन्द्रीय सम्पर्क कार्यालय",
  kathmanduSubtitleEn: "Main Liaison Secretariat",
  kathmanduAddressNe: "शंखमूल मार्ग, नयाँ बानेश्वर, काठमाडौँ, नेपाल",
  kathmanduAddressEn: "Shankhamul Marg, New Baneshwor, Kathmandu, Nepal",
  phone1: "+977 01-4481234",
  phone2: "9851012345",
  email: "info@thorgaktm.org.np",
};

const CONTACT_STORAGE_KEY = "thorga_contact_settings";

let contactSubscribers: Array<() => void> = [];

export function subscribeContactSettings(callback: () => void) {
  contactSubscribers.push(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === CONTACT_STORAGE_KEY) {
      callback();
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }
  return () => {
    contactSubscribers = contactSubscribers.filter((s) => s !== callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

export function getStoredContactSettingsSnapshot(): ContactSettings {
  if (typeof window === "undefined") return initialContactSettings;
  try {
    const raw = localStorage.getItem(CONTACT_STORAGE_KEY);
    if (!raw) return initialContactSettings;
    return JSON.parse(raw);
  } catch {
    return initialContactSettings;
  }
}

export function getServerContactSettingsSnapshot(): ContactSettings {
  return initialContactSettings;
}

export function saveStoredContactSettings(settings: ContactSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(settings));
    contactSubscribers.forEach((s) => s());
  } catch {}
}

const LANG_STORAGE_KEY = "thorga_portal_lang";
let langSubscribers: Array<() => void> = [];

export function subscribeLanguage(callback: () => void) {
  langSubscribers.push(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === LANG_STORAGE_KEY) callback();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", handleStorage);
  return () => {
    langSubscribers = langSubscribers.filter((s) => s !== callback);
    if (typeof window !== "undefined") window.removeEventListener("storage", handleStorage);
  };
}

export function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "ne";
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY) as Language;
    return saved === "en" ? "en" : "ne";
  } catch {
    return "ne";
  }
}

export function getServerLanguageSnapshot(): Language {
  return "ne";
}

export function saveStoredLanguage(lang: Language): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    langSubscribers.forEach((s) => s());
  } catch {}
}

// ==========================================
// 1. MEMBERS STORE
// ==========================================
const MEMBERS_STORAGE_KEY = "thorga_members_list";
let membersSubscribers: Array<() => void> = [];

export function subscribeMembers(callback: () => void) {
  membersSubscribers.push(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === MEMBERS_STORAGE_KEY) callback();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", handleStorage);
  return () => {
    membersSubscribers = membersSubscribers.filter((s) => s !== callback);
    if (typeof window !== "undefined") window.removeEventListener("storage", handleStorage);
  };
}

export function getStoredMembersSnapshot(): Member[] {
  if (typeof window === "undefined") return initialMembers;
  try {
    const raw = localStorage.getItem(MEMBERS_STORAGE_KEY);
    if (!raw) return initialMembers;
    return JSON.parse(raw);
  } catch {
    return initialMembers;
  }
}

export function getServerMembersSnapshot(): Member[] {
  return initialMembers;
}

export function saveStoredMembers(members: Member[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
    membersSubscribers.forEach((s) => s());
  } catch {}
}

// ==========================================
// 2. EVENTS STORE
// ==========================================
const EVENTS_STORAGE_KEY = "thorga_events_list";
let eventsSubscribers: Array<() => void> = [];

export function subscribeEvents(callback: () => void) {
  eventsSubscribers.push(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === EVENTS_STORAGE_KEY) callback();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", handleStorage);
  return () => {
    eventsSubscribers = eventsSubscribers.filter((s) => s !== callback);
    if (typeof window !== "undefined") window.removeEventListener("storage", handleStorage);
  };
}

export function getStoredEventsSnapshot(): EventItem[] {
  if (typeof window === "undefined") return initialEvents;
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!raw) return initialEvents;
    return JSON.parse(raw);
  } catch {
    return initialEvents;
  }
}

export function getServerEventsSnapshot(): EventItem[] {
  return initialEvents;
}

export function saveStoredEvents(events: EventItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    eventsSubscribers.forEach((s) => s());
  } catch {}
}

// ==========================================
// 3. PUBLICATIONS STORE
// ==========================================
const PUBLICATIONS_STORAGE_KEY = "thorga_publications_list";
let pubSubscribers: Array<() => void> = [];

export function subscribePublications(callback: () => void) {
  pubSubscribers.push(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === PUBLICATIONS_STORAGE_KEY) callback();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", handleStorage);
  return () => {
    pubSubscribers = pubSubscribers.filter((s) => s !== callback);
    if (typeof window !== "undefined") window.removeEventListener("storage", handleStorage);
  };
}

export function getStoredPublicationsSnapshot(): Publication[] {
  if (typeof window === "undefined") return initialPublications;
  try {
    const raw = localStorage.getItem(PUBLICATIONS_STORAGE_KEY);
    if (!raw) return initialPublications;
    return JSON.parse(raw);
  } catch {
    return initialPublications;
  }
}

export function getServerPublicationsSnapshot(): Publication[] {
  return initialPublications;
}

export function saveStoredPublications(publications: Publication[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PUBLICATIONS_STORAGE_KEY, JSON.stringify(publications));
    pubSubscribers.forEach((s) => s());
  } catch {}
}

// ==========================================
// 4. GALLERY STORE
// ==========================================
const GALLERY_STORAGE_KEY = "thorga_gallery_list";
let gallerySubscribers: Array<() => void> = [];

export function subscribeGallery(callback: () => void) {
  gallerySubscribers.push(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === GALLERY_STORAGE_KEY) callback();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", handleStorage);
  return () => {
    gallerySubscribers = gallerySubscribers.filter((s) => s !== callback);
    if (typeof window !== "undefined") window.removeEventListener("storage", handleStorage);
  };
}

export function getStoredGallerySnapshot(): GalleryItem[] {
  if (typeof window === "undefined") return initialGallery;
  try {
    const raw = localStorage.getItem(GALLERY_STORAGE_KEY);
    if (!raw) return initialGallery;
    return JSON.parse(raw);
  } catch {
    return initialGallery;
  }
}

export function getServerGallerySnapshot(): GalleryItem[] {
  return initialGallery;
}

export function saveStoredGallery(gallery: GalleryItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(gallery));
    gallerySubscribers.forEach((s) => s());
  } catch {}
}

// ==========================================
// 5. INQUIRIES STORE
// ==========================================
export interface Inquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  date: string;
  read: boolean;
}

export const initialInquiries: Inquiry[] = [];

const INQUIRIES_STORAGE_KEY = "thorga_inquiries_list";
let inquiriesSubscribers: Array<() => void> = [];

export function subscribeInquiries(callback: () => void) {
  inquiriesSubscribers.push(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === INQUIRIES_STORAGE_KEY) callback();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", handleStorage);
  return () => {
    inquiriesSubscribers = inquiriesSubscribers.filter((s) => s !== callback);
    if (typeof window !== "undefined") window.removeEventListener("storage", handleStorage);
  };
}

export function getStoredInquiriesSnapshot(): Inquiry[] {
  if (typeof window === "undefined") return initialInquiries;
  try {
    const raw = localStorage.getItem(INQUIRIES_STORAGE_KEY);
    if (!raw) return initialInquiries;
    return JSON.parse(raw);
  } catch {
    return initialInquiries;
  }
}

export function getServerInquiriesSnapshot(): Inquiry[] {
  return initialInquiries;
}

export function saveStoredInquiries(inquiries: Inquiry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(inquiries));
    inquiriesSubscribers.forEach((s) => s());
  } catch {}
}

export function addStoredInquiry(inquiry: Omit<Inquiry, "id" | "date" | "read">): Inquiry {
  const current = getStoredInquiriesSnapshot();
  const created: Inquiry = {
    id: `inq-${Date.now()}`,
    ...inquiry,
    date: new Date().toISOString().split("T")[0],
    read: false,
  };
  saveStoredInquiries([created, ...current]);
  return created;
}

