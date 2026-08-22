/**
 * Server-side Supabase data helpers.
 * These run only in API routes / Server Components, never on the client.
 * Columns are snake_case in Supabase; we map them to camelCase to match the
 * TypeScript interfaces in mockData.ts.
 */
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";
import type {
  GalleryItem,
  EventItem,
  Member,
  Publication,
  HeroContent,
  BrandingSettings,
  ContactSettings,
} from "@/data/mockData";
import {
  initialHeroContent,
  initialBrandingSettings,
  initialContactSettings,
} from "@/data/mockData";

let pool: Pool | null = null;
function getPgPool(): Pool | null {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}

function makeAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const isRealServiceKey =
    serviceRoleKey &&
    serviceRoleKey.length > 20 &&
    !serviceRoleKey.includes("placeholder");

  const key = isRealServiceKey
    ? serviceRoleKey
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      "placeholder-key";
  return createClient(url, key, { auth: { persistSession: false } });
}

// ---------------------------------------------------------------------------
// Site Settings (Hero, Branding, Contact)
// ---------------------------------------------------------------------------
export async function fetchSiteSetting<T>(key: string, defaultValue: T): Promise<T> {
  // Direct pg pool first for high performance and bypassing client RLS latency
  const pg = getPgPool();
  if (pg) {
    try {
      const res = await pg.query(
        "SELECT value FROM public.site_settings WHERE key = $1 LIMIT 1",
        [key]
      );
      if (res.rows.length > 0 && res.rows[0].value !== undefined && res.rows[0].value !== null) {
        let val = res.rows[0].value;
        if (typeof val === "string") {
          try { val = JSON.parse(val); } catch {}
        }
        if (Array.isArray(defaultValue)) {
          return (Array.isArray(val) ? val : defaultValue) as T;
        }
        return (typeof val === "object" && val !== null
          ? { ...defaultValue, ...val }
          : val) as T;
      }
    } catch (err) {
      console.warn(`[fetchSiteSetting] pg query failed for ${key}:`, err);
    }
  }

  // Fallback to Supabase client
  try {
    const supabase = makeAdminClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (!error && data && data.value !== undefined && data.value !== null) {
      let parsed = data.value;
      if (typeof parsed === "string") {
        try { parsed = JSON.parse(parsed); } catch {}
      }
      if (Array.isArray(defaultValue)) {
        return (Array.isArray(parsed) ? parsed : defaultValue) as T;
      }
      return (typeof parsed === "object" && parsed !== null
        ? { ...defaultValue, ...parsed }
        : parsed) as T;
    }
  } catch {}

  return defaultValue;
}

export async function saveSiteSetting<T>(key: string, value: T): Promise<void> {
  const pg = getPgPool();
  if (pg) {
    try {
      await pg.query(
        `INSERT INTO public.site_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`,
        [key, JSON.stringify(value)]
      );
      return;
    } catch (err) {
      console.warn(`[saveSiteSetting] pg query failed for ${key}:`, err);
    }
  }

  // Fallback to Supabase client
  const supabase = makeAdminClient();
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });

  if (error) throw new Error(`saveSiteSetting (${key}): ${error.message}`);
}

export async function fetchHeroContent(): Promise<HeroContent> {
  return fetchSiteSetting<HeroContent>("hero", initialHeroContent);
}

export async function saveHeroContent(hero: HeroContent): Promise<void> {
  return saveSiteSetting<HeroContent>("hero", hero);
}

export async function fetchBrandingSettings(): Promise<BrandingSettings> {
  return fetchSiteSetting<BrandingSettings>("branding", initialBrandingSettings);
}

export async function saveBrandingSettings(branding: BrandingSettings): Promise<void> {
  return saveSiteSetting<BrandingSettings>("branding", branding);
}

export async function fetchContactSettings(): Promise<ContactSettings> {
  return fetchSiteSetting<ContactSettings>("contact", initialContactSettings);
}

export async function saveContactSettings(contact: ContactSettings): Promise<void> {
  return saveSiteSetting<ContactSettings>("contact", contact);
}

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------
export async function fetchGallery(): Promise<GalleryItem[]> {
  const supabase = makeAdminClient();
  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`fetchGallery: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    titleEn: row.title_en ?? "",
    titleNe: row.title_ne ?? "",
    categoryEn: row.category_en ?? "",
    categoryNe: row.category_ne ?? "",
    imageUrl: row.image_url ?? "",
    dateEn: row.date_en ?? "",
    dateNe: row.date_ne ?? "",
  }));
}

export async function saveGalleryItem(item: GalleryItem): Promise<void> {
  const pg = getPgPool();
  if (pg) {
    await pg.query(
      `INSERT INTO public.gallery (id, title_en, title_ne, category_en, category_ne, image_url, date_en, date_ne)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET 
         title_en = EXCLUDED.title_en,
         title_ne = EXCLUDED.title_ne,
         category_en = EXCLUDED.category_en,
         category_ne = EXCLUDED.category_ne,
         image_url = EXCLUDED.image_url,
         date_en = EXCLUDED.date_en,
         date_ne = EXCLUDED.date_ne;`,
      [
        item.id.startsWith("g-") ? undefined : item.id, // let postgres generate UUID if local temp id
        item.titleEn,
        item.titleNe,
        item.categoryEn,
        item.categoryNe,
        item.imageUrl,
        item.dateEn,
        item.dateNe,
      ]
    );
  }
}

export async function deleteGalleryItem(id: string): Promise<void> {
  const pg = getPgPool();
  if (pg) {
    await pg.query("DELETE FROM public.gallery WHERE id = $1", [id]);
  }
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
export async function fetchEvents(): Promise<EventItem[]> {
  const supabase = makeAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`fetchEvents: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    titleEn: row.title_en ?? "",
    titleNe: row.title_ne ?? "",
    dateEn: row.date_en ?? "",
    dateNe: row.date_ne ?? "",
    timeEn: row.time_en ?? "",
    timeNe: row.time_ne ?? "",
    locationEn: row.location_en ?? "",
    locationNe: row.location_ne ?? "",
    descriptionEn: row.description_en ?? "",
    descriptionNe: row.description_ne ?? "",
    status: row.status ?? "upcoming",
    categoryEn: row.category_en ?? "",
    categoryNe: row.category_ne ?? "",
    imageUrl: row.image_url ?? "",
  }));
}

export async function saveEventItem(item: EventItem): Promise<void> {
  const pg = getPgPool();
  if (pg) {
    await pg.query(
      `INSERT INTO public.events (id, title_en, title_ne, date_en, date_ne, time_en, time_ne, location_en, location_ne, description_en, description_ne, status, category_en, category_ne, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (id) DO UPDATE SET 
         title_en = EXCLUDED.title_en,
         title_ne = EXCLUDED.title_ne,
         date_en = EXCLUDED.date_en,
         date_ne = EXCLUDED.date_ne,
         time_en = EXCLUDED.time_en,
         time_ne = EXCLUDED.time_ne,
         location_en = EXCLUDED.location_en,
         location_ne = EXCLUDED.location_ne,
         description_en = EXCLUDED.description_en,
         description_ne = EXCLUDED.description_ne,
         status = EXCLUDED.status,
         category_en = EXCLUDED.category_en,
         category_ne = EXCLUDED.category_ne,
         image_url = EXCLUDED.image_url,
         updated_at = NOW();`,
      [
        item.id.startsWith("ev-") ? undefined : item.id,
        item.titleEn,
        item.titleNe,
        item.dateEn,
        item.dateNe,
        item.timeEn,
        item.timeNe,
        item.locationEn,
        item.locationNe,
        item.descriptionEn,
        item.descriptionNe,
        item.status,
        item.categoryEn,
        item.categoryNe,
        item.imageUrl,
      ]
    );
  }
}

export async function deleteEventItem(id: string): Promise<void> {
  const pg = getPgPool();
  if (pg) {
    await pg.query("DELETE FROM public.events WHERE id = $1", [id]);
  }
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------
export async function fetchMembers(): Promise<Member[]> {
  const supabase = makeAdminClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) throw new Error(`fetchMembers: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    nameEn: row.name_en ?? "",
    nameNe: row.name_ne ?? "",
    roleEn: row.role_en ?? "",
    roleNe: row.role_ne ?? "",
    committeeType: row.committee_type ?? "current",
    tenureEn: row.tenure_en ?? undefined,
    tenureNe: row.tenure_ne ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    photoUrl: row.photo_url ?? "",
    bioEn: row.bio_en ?? undefined,
    bioNe: row.bio_ne ?? undefined,
    order: row.display_order ?? 0,
  }));
}

export async function saveMemberItem(item: Member): Promise<void> {
  const pg = getPgPool();
  if (pg) {
    await pg.query(
      `INSERT INTO public.members (id, name_en, name_ne, role_en, role_ne, committee_type, tenure_en, tenure_ne, phone, email, photo_url, bio_en, bio_ne, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (id) DO UPDATE SET
         name_en = EXCLUDED.name_en,
         name_ne = EXCLUDED.name_ne,
         role_en = EXCLUDED.role_en,
         role_ne = EXCLUDED.role_ne,
         committee_type = EXCLUDED.committee_type,
         tenure_en = EXCLUDED.tenure_en,
         tenure_ne = EXCLUDED.tenure_ne,
         phone = EXCLUDED.phone,
         email = EXCLUDED.email,
         photo_url = EXCLUDED.photo_url,
         bio_en = EXCLUDED.bio_en,
         bio_ne = EXCLUDED.bio_ne,
         display_order = EXCLUDED.display_order,
         updated_at = NOW();`,
      [
        item.id.startsWith("m-") ? undefined : item.id,
        item.nameEn,
        item.nameNe,
        item.roleEn,
        item.roleNe,
        item.committeeType,
        item.tenureEn,
        item.tenureNe,
        item.phone,
        item.email,
        item.photoUrl,
        item.bioEn,
        item.bioNe,
        item.order,
      ]
    );
  }
}

export async function deleteMemberItem(id: string): Promise<void> {
  const pg = getPgPool();
  if (pg) {
    await pg.query("DELETE FROM public.members WHERE id = $1", [id]);
  }
}

// ---------------------------------------------------------------------------
// Publications
// ---------------------------------------------------------------------------
export async function fetchPublications(): Promise<Publication[]> {
  const supabase = makeAdminClient();
  const { data, error } = await supabase
    .from("publications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`fetchPublications: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    titleEn: row.title_en ?? "",
    titleNe: row.title_ne ?? "",
    categoryEn: row.category_en ?? "",
    categoryNe: row.category_ne ?? "",
    publishedYearEn: row.published_year_en ?? "",
    publishedYearNe: row.published_year_ne ?? "",
    fileSize: row.file_size ?? "",
    pages: row.pages ?? 0,
    pdfUrl: row.pdf_url ?? "",
    coverImageUrl: row.cover_image_url ?? undefined,
    descriptionEn: row.description_en ?? "",
    descriptionNe: row.description_ne ?? "",
  }));
}

export async function savePublicationItem(item: Publication): Promise<void> {
  const pg = getPgPool();
  if (pg) {
    await pg.query(
      `INSERT INTO public.publications (id, title_en, title_ne, category_en, category_ne, published_year_en, published_year_ne, file_size, pages, pdf_url, cover_image_url, description_en, description_ne)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO UPDATE SET
         title_en = EXCLUDED.title_en,
         title_ne = EXCLUDED.title_ne,
         category_en = EXCLUDED.category_en,
         category_ne = EXCLUDED.category_ne,
         published_year_en = EXCLUDED.published_year_en,
         published_year_ne = EXCLUDED.published_year_ne,
         file_size = EXCLUDED.file_size,
         pages = EXCLUDED.pages,
         pdf_url = EXCLUDED.pdf_url,
         cover_image_url = EXCLUDED.cover_image_url,
         description_en = EXCLUDED.description_en,
         description_ne = EXCLUDED.description_ne,
         updated_at = NOW();`,
      [
        item.id.startsWith("pub-") ? undefined : item.id,
        item.titleEn,
        item.titleNe,
        item.categoryEn,
        item.categoryNe,
        item.publishedYearEn,
        item.publishedYearNe,
        item.fileSize,
        item.pages,
        item.pdfUrl,
        item.coverImageUrl,
        item.descriptionEn,
        item.descriptionNe,
      ]
    );
  }
}

export async function deletePublicationItem(id: string): Promise<void> {
  const pg = getPgPool();
  if (pg) {
    await pg.query("DELETE FROM public.publications WHERE id = $1", [id]);
  }
}
