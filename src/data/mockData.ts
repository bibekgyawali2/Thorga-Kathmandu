export type Language = "en" | "ne";

export interface Member {
  id: string;
  nameEn: string;
  nameNe: string;
  roleEn: string;
  roleNe: string;
  committeeType: "current" | "past" | "advisor" | "officials";
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

export interface GalleryAlbumImage {
  id: string;
  imageUrl: string;
  captionEn: string;
  captionNe: string;
}

export interface GalleryAlbum {
  id: string;
  titleEn: string;
  titleNe: string;
  descriptionEn?: string;
  descriptionNe?: string;
  coverImageUrl?: string;
  dateEn?: string;
  dateNe?: string;
  images: GalleryAlbumImage[];
  createdAt?: string;
}

export const initialGalleryAlbums: GalleryAlbum[] = [];

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
  badgeNe: "थोर्गा सम्पर्क मञ्च",
  badgeEn: "Thorga Liaison Forum",
  titleNe: "थोर्गाको पहिचान, काठमाडौँमा एकता र सेवाको अभियान",
  titleEn: "Uniting Thorga Heritage, Advancing Community Welfare",
  descriptionNe: "काठमाडौँ उपत्यकामा रहेका थोर्गाबासीहरुलाई एकताबद्ध गर्दै गाउँको शैक्षिक, स्वास्थ्य तथा पूर्वाधार विकासमा समर्पित गैरनाफामूलक सामाजिक संस्था।",
  descriptionEn: "A dedicated non-profit forum connecting native families of Thorga in Kathmandu for mutual assistance, youth scholarships, and village development.",
  imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1000&q=80",
  imageBadgeNe: "आधिकारिक मञ्च",
  imageBadgeEn: "Official Forum",
  imageCaptionNe: "गुल्मी जिल्ला, रुरुक्षेत्र गाउँपालिका वडा नं. २ र ३ (साविक थोर्गा गा.वि.स.)",
  imageCaptionEn: "Gulmi District, Ruru Kshetra Ward 2 and 3 (Former Thorga VDC)",
  imageSubtitleNe: "काठमाडौँ सम्पर्क: शंखमूल मार्ग, नयाँ बानेश्वर",
  imageSubtitleEn: "Kathmandu Liaison Office: Shankhamul Marg, New Baneshwor",
};

// ==========================================
// BRANDING SETTINGS STORE
// ==========================================
export interface BrandingSettings {
  logoUrl: string;
  faviconUrl: string;
}

export const initialBrandingSettings: BrandingSettings = {
  logoUrl: "",
  faviconUrl: "",
};

const BRANDING_STORAGE_KEY = "thorga_branding_settings";
let brandingSubscribers: Array<() => void> = [];
let _brandingCacheRaw: string | null = undefined as unknown as string | null;
let _brandingCache: BrandingSettings = initialBrandingSettings;

export function subscribeBranding(callback: () => void) {
  brandingSubscribers.push(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === BRANDING_STORAGE_KEY) {
      _brandingCacheRaw = undefined as unknown as string | null;
      callback();
    }
  };
  if (typeof window !== "undefined") window.addEventListener("storage", handleStorage);
  return () => {
    brandingSubscribers = brandingSubscribers.filter((s) => s !== callback);
    if (typeof window !== "undefined") window.removeEventListener("storage", handleStorage);
  };
}

export function getStoredBrandingSnapshot(): BrandingSettings {
  if (typeof window === "undefined") return initialBrandingSettings;
  try {
    const raw = localStorage.getItem(BRANDING_STORAGE_KEY);
    if (!raw) return initialBrandingSettings;
    if (raw === _brandingCacheRaw) return _brandingCache;
    _brandingCacheRaw = raw;
    _brandingCache = JSON.parse(raw);
    return _brandingCache;
  } catch {
    return initialBrandingSettings;
  }
}

export function getServerBrandingSnapshot(): BrandingSettings {
  return initialBrandingSettings;
}

export function saveStoredBranding(settings: BrandingSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(settings));
    _brandingCacheRaw = undefined as unknown as string | null;
    brandingSubscribers.forEach((s) => s());
  } catch { }
}

const HERO_STORAGE_KEY = "thorga_hero_content";

let heroSubscribers: Array<() => void> = [];
let _heroCacheRaw: string | null = undefined as unknown as string | null;
let _heroCache: HeroContent = initialHeroContent;

export function subscribeHeroContent(callback: () => void) {
  heroSubscribers.push(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === HERO_STORAGE_KEY) {
      _heroCacheRaw = undefined as unknown as string | null; // invalidate cache
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
    if (raw === _heroCacheRaw) return _heroCache;
    _heroCacheRaw = raw;
    _heroCache = JSON.parse(raw);
    return _heroCache;
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
    _heroCacheRaw = undefined as unknown as string | null; // invalidate cache
    heroSubscribers.forEach((s) => s());
  } catch { }
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
  /** Google Maps embed URL for the village location shown in the footer. */
  mapEmbedUrl: string;
  mapLabelNe: string;
  mapLabelEn: string;
}

export const initialContactSettings: ContactSettings = {
  contactHeadingNe: "सम्पर्क तथा सदस्यता सोधपुछ",
  contactHeadingEn: "Contact & Membership Inquiries",
  contactDescriptionNe: "मञ्चको सदस्यता, सामाजिक परियोजना, स्मारिका प्रकाशन तथा सहयोगका लागि सम्पर्क गर्नुहोस्",
  contactDescriptionEn: "Reach out for memberships, community welfare programs, publications, or partnerships",
  kathmanduTitleNe: "काठमाडौँ सम्पर्क",
  kathmanduTitleEn: "Kathmandu Office",
  kathmanduSubtitleNe: "केन्द्रीय सम्पर्क कार्यालय",
  kathmanduSubtitleEn: "Main Contact Office",
  kathmanduAddressNe: "शंखमूल मार्ग, नयाँ बानेश्वर, काठमाडौँ, नेपाल",
  kathmanduAddressEn: "Shankhamul Marg, New Baneshwor, Kathmandu, Nepal",
  phone1: "9847996491",
  phone2: "9851170032",
  email: "thorgakathmandu@gmail.com",
  mapEmbedUrl:
    "https://www.google.com/maps?q=Thorga,%20Ruru%20Kshetra,%20Gulmi,%20Nepal&z=12&output=embed",
  mapLabelNe: "थोर्गा, रुरुक्षेत्र गाउँपालिका, गुल्मी, लुम्बिनी प्रदेश",
  mapLabelEn: "Thorga, Ruru Kshetra Rural Municipality, Gulmi, Lumbini Province",
};

const CONTACT_STORAGE_KEY = "thorga_contact_settings";

let contactSubscribers: Array<() => void> = [];
let _contactCacheRaw: string | null = undefined as unknown as string | null;
let _contactCache: ContactSettings = initialContactSettings;

export function subscribeContactSettings(callback: () => void) {
  contactSubscribers.push(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === CONTACT_STORAGE_KEY) {
      _contactCacheRaw = undefined as unknown as string | null;
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
    if (raw === _contactCacheRaw) return _contactCache;
    _contactCacheRaw = raw;
    _contactCache = JSON.parse(raw);
    return _contactCache;
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
    _contactCacheRaw = undefined as unknown as string | null;
    contactSubscribers.forEach((s) => s());
  } catch { }
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
    document.documentElement.lang = lang;
    langSubscribers.forEach((s) => s());
  } catch { }
}

// ==========================================
// 1. MEMBERS STORE
// ==========================================
const MEMBERS_STORAGE_KEY = "thorga_members_list";
let membersSubscribers: Array<() => void> = [];
let _membersCacheRaw: string | null = undefined as unknown as string | null;
let _membersCache: Member[] = initialMembers;

export function subscribeMembers(callback: () => void) {
  membersSubscribers.push(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === MEMBERS_STORAGE_KEY) { _membersCacheRaw = undefined as unknown as string | null; callback(); }
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
    if (raw === _membersCacheRaw) return _membersCache;
    _membersCacheRaw = raw;
    _membersCache = JSON.parse(raw);
    return _membersCache;
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
    _membersCacheRaw = undefined as unknown as string | null;
    membersSubscribers.forEach((s) => s());
  } catch { }
}

// ==========================================
// 2. EVENTS STORE
// ==========================================
const EVENTS_STORAGE_KEY = "thorga_events_list";
let eventsSubscribers: Array<() => void> = [];
let _eventsCacheRaw: string | null = undefined as unknown as string | null;
let _eventsCache: EventItem[] = initialEvents;

export function subscribeEvents(callback: () => void) {
  eventsSubscribers.push(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === EVENTS_STORAGE_KEY) { _eventsCacheRaw = undefined as unknown as string | null; callback(); }
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
    if (raw === _eventsCacheRaw) return _eventsCache;
    _eventsCacheRaw = raw;
    _eventsCache = JSON.parse(raw);
    return _eventsCache;
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
    _eventsCacheRaw = undefined as unknown as string | null;
    eventsSubscribers.forEach((s) => s());
  } catch { }
}

// ==========================================
// 3. PUBLICATIONS STORE
// ==========================================
const PUBLICATIONS_STORAGE_KEY = "thorga_publications_list";
let pubSubscribers: Array<() => void> = [];
let _pubCacheRaw: string | null = undefined as unknown as string | null;
let _pubCache: Publication[] = initialPublications;

export function subscribePublications(callback: () => void) {
  pubSubscribers.push(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === PUBLICATIONS_STORAGE_KEY) { _pubCacheRaw = undefined as unknown as string | null; callback(); }
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
    if (raw === _pubCacheRaw) return _pubCache;
    _pubCacheRaw = raw;
    _pubCache = JSON.parse(raw);
    return _pubCache;
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
    _pubCacheRaw = undefined as unknown as string | null;
    pubSubscribers.forEach((s) => s());
  } catch { }
}

// ==========================================
// 4. GALLERY STORE
// ==========================================
const GALLERY_STORAGE_KEY = "thorga_gallery_list";
let gallerySubscribers: Array<() => void> = [];
let _galleryCacheRaw: string | null = undefined as unknown as string | null;
let _galleryCache: GalleryItem[] = initialGallery;

export function subscribeGallery(callback: () => void) {
  gallerySubscribers.push(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === GALLERY_STORAGE_KEY) { _galleryCacheRaw = undefined as unknown as string | null; callback(); }
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
    if (raw === _galleryCacheRaw) return _galleryCache;
    _galleryCacheRaw = raw;
    _galleryCache = JSON.parse(raw);
    return _galleryCache;
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
    _galleryCacheRaw = undefined as unknown as string | null;
    gallerySubscribers.forEach((s) => s());
  } catch { }
}

// ==========================================
// 4B. GALLERY ALBUMS STORE
// ==========================================
const GALLERY_ALBUMS_STORAGE_KEY = "thorga_gallery_albums_list";
let galleryAlbumsSubscribers: Array<() => void> = [];
let _galleryAlbumsCacheRaw: string | null = undefined as unknown as string | null;
let _galleryAlbumsCache: GalleryAlbum[] = initialGalleryAlbums;

export function subscribeGalleryAlbums(callback: () => void) {
  galleryAlbumsSubscribers.push(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === GALLERY_ALBUMS_STORAGE_KEY) {
      _galleryAlbumsCacheRaw = undefined as unknown as string | null;
      callback();
    }
  };
  if (typeof window !== "undefined") window.addEventListener("storage", handleStorage);
  return () => {
    galleryAlbumsSubscribers = galleryAlbumsSubscribers.filter((s) => s !== callback);
    if (typeof window !== "undefined") window.removeEventListener("storage", handleStorage);
  };
}

export function getStoredGalleryAlbumsSnapshot(): GalleryAlbum[] {
  if (typeof window === "undefined") return initialGalleryAlbums;
  try {
    const raw = localStorage.getItem(GALLERY_ALBUMS_STORAGE_KEY);
    if (!raw) return initialGalleryAlbums;
    if (raw === _galleryAlbumsCacheRaw) return _galleryAlbumsCache;
    _galleryAlbumsCacheRaw = raw;
    _galleryAlbumsCache = JSON.parse(raw);
    return _galleryAlbumsCache;
  } catch {
    return initialGalleryAlbums;
  }
}

export function getServerGalleryAlbumsSnapshot(): GalleryAlbum[] {
  return initialGalleryAlbums;
}

export function saveStoredGalleryAlbums(albums: GalleryAlbum[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GALLERY_ALBUMS_STORAGE_KEY, JSON.stringify(albums));
    _galleryAlbumsCacheRaw = undefined as unknown as string | null;
    galleryAlbumsSubscribers.forEach((s) => s());
  } catch { }
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
let _inquiriesCacheRaw: string | null = undefined as unknown as string | null;
let _inquiriesCache: Inquiry[] = initialInquiries;

export function subscribeInquiries(callback: () => void) {
  inquiriesSubscribers.push(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === INQUIRIES_STORAGE_KEY) { _inquiriesCacheRaw = undefined as unknown as string | null; callback(); }
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
    if (raw === _inquiriesCacheRaw) return _inquiriesCache;
    _inquiriesCacheRaw = raw;
    _inquiriesCache = JSON.parse(raw);
    return _inquiriesCache;
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
    _inquiriesCacheRaw = undefined as unknown as string | null;
    inquiriesSubscribers.forEach((s) => s());
  } catch { }
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


// ==========================================
// 6. ABOUT US SECTION
// ==========================================

/** A free-text page such as Organisation Profile or About Thorga. */
export interface ContentPage {
  slug: string;
  titleEn: string;
  titleNe: string;
  bodyEn: string;
  bodyNe: string;
}

/** A PDF or image attached to one of the document pages. */
export interface PageDocument {
  id: string;
  slug:
  | "statute"
  | "life-members"
  | "certificates"
  | "former-officials"
  | "former-advisors"
  | "calendar"
  | "phone-directory"
  | "bulletin"
  | "souvenir"
  | "sansthan-prakashan"
  | "thorga-sambandhi-anya-prakashan"
  | "other";
  titleEn: string;
  titleNe: string;
  fileUrl: string;
  fileType: "pdf" | "image";
  pageCount: number | null;
  order: number;
}

export const initialContentPages: ContentPage[] = [];
export const initialPageDocuments: PageDocument[] = [];

// ==========================================
// 7. COMMUNITY BUSINESS & PROFESSION SHOWCASE (पेशा तथा व्यवसाय)
// ==========================================

export interface BusinessItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  fileType: "image" | "pdf";
  fileUrl: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  order?: number;
  createdAt?: string;
}

export const BUSINESS_CATEGORIES = [
  "खाद्य, फलफूल तथा किराना",
  "औषधी व्यवसाय",
  "फेन्सी सामान",
  "स्टेशनरी, छपाई तथा खेलकुदका सामान",
  "फर्निचर तथा फर्निसिङ्ग र हार्डवेयर",
  "आई. टि. (वेबसाईट तथा एप्लिकेसन)",
  "वैदेशिक रोजगारी र कन्सल्टेन्सी",
  "होटल, रेष्टुरेन्ट तथा क्यान्टिन",
  "लेखापरीक्षण",
] as const;

export const initialBusinesses: BusinessItem[] = [];

const BUSINESSES_STORAGE_KEY = "thorga_businesses_list";
let businessSubscribers: Array<() => void> = [];
let _bizCacheRaw: string | null = undefined as unknown as string | null;
let _bizCache: BusinessItem[] = initialBusinesses;

export function subscribeBusinesses(callback: () => void) {
  businessSubscribers.push(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === BUSINESSES_STORAGE_KEY) {
      _bizCacheRaw = undefined as unknown as string | null;
      callback();
    }
  };
  if (typeof window !== "undefined") window.addEventListener("storage", handleStorage);
  return () => {
    businessSubscribers = businessSubscribers.filter((s) => s !== callback);
    if (typeof window !== "undefined") window.removeEventListener("storage", handleStorage);
  };
}

export function getStoredBusinessesSnapshot(): BusinessItem[] {
  if (typeof window === "undefined") return initialBusinesses;
  try {
    const raw = localStorage.getItem(BUSINESSES_STORAGE_KEY);
    if (!raw) return initialBusinesses;
    if (raw === _bizCacheRaw) return _bizCache;
    _bizCacheRaw = raw;
    _bizCache = JSON.parse(raw);
    return _bizCache;
  } catch {
    return initialBusinesses;
  }
}

export function getServerBusinessesSnapshot(): BusinessItem[] {
  return initialBusinesses;
}

export function saveStoredBusinesses(businesses: BusinessItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BUSINESSES_STORAGE_KEY, JSON.stringify(businesses));
    _bizCacheRaw = undefined as unknown as string | null;
    _bizCache = businesses;
    businessSubscribers.forEach((s) => s());
  } catch {}
}
