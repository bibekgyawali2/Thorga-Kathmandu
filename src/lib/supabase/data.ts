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
  GalleryAlbum,
  GalleryAlbumImage,
  EventItem,
  Member,
  Publication,
  HeroContent,
  BrandingSettings,
  ContactSettings,
  ContentPage,
  PageDocument,
} from "@/data/mockData";
import {
  initialHeroContent,
  initialBrandingSettings,
  initialContactSettings,
} from "@/data/mockData";

let pool: Pool | null = null;
let warnedAboutTls = false;
function getPgPool(): Pool | null {
  if (!pool && process.env.DATABASE_URL) {
    try {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        // Supabase serves a chain rooted in its own CA, which is not in Node's
        // default trust store, so full verification only works once
        // DATABASE_CA_CERT is supplied. Without it the connection is still
        // encrypted but the chain is unverified, which is what this app has
        // always done; refusing to connect instead would take every write
        // offline, because the REST fallback cannot write under RLS.
        // Download the certificate from the Supabase dashboard
        // (Settings > Database > SSL Configuration) to close this properly.
        ssl: process.env.DATABASE_CA_CERT
          ? { ca: process.env.DATABASE_CA_CERT }
          : { rejectUnauthorized: false },
        max: 5,
        // The first connection pays a full TLS handshake to a remote Supabase
        // host, which regularly takes longer than five seconds; a timeout here
        // silently pushed every write onto the REST fallback, which cannot
        // write under RLS.
        connectionTimeoutMillis: 20000,
        idleTimeoutMillis: 30000,
        keepAlive: true,
      });
      if (!process.env.DATABASE_CA_CERT && !warnedAboutTls) {
        warnedAboutTls = true;
        console.warn(
          "[database] Connecting without certificate chain verification. " +
            "Set DATABASE_CA_CERT (Supabase dashboard > Settings > Database > " +
            "SSL Configuration) to verify the connection."
        );
      }

      pool.on("error", (err) => {
        // A TLS chain error here means DATABASE_CA_CERT is missing: Supabase
        // serves a certificate the default trust store does not recognise.
        // Everything still works through the Supabase REST client, but the
        // faster direct connection is not being used, so say so loudly rather
        // than degrading in silence.
        if (String(err.message).toLowerCase().includes("certificate")) {
          if (!warnedAboutTls) {
            warnedAboutTls = true;
            console.error(
              "[database] Direct Postgres connection rejected: " +
                err.message +
                "\n  Falling back to the Supabase REST client for every query." +
                "\n  Fix: download the CA certificate from the Supabase dashboard" +
                " (Settings > Database > SSL Configuration) and set DATABASE_CA_CERT."
            );
          }
          return;
        }
        console.warn("[getPgPool] unexpected client error:", err);
      });
    } catch (e) {
      console.warn("[getPgPool] failed to init pg pool:", e);
      pool = null;
    }
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isValidUUID(id: string | null | undefined): boolean {
  if (!id || typeof id !== "string") return false;
  return UUID_REGEX.test(id);
}

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
// Site Settings (Hero, Branding, Contact, Admin Users)
// ---------------------------------------------------------------------------
export async function fetchSiteSetting<T>(key: string, defaultValue: T): Promise<T> {
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
  } catch (err) {
    console.warn(`[fetchSiteSetting] Supabase client failed for ${key}:`, err);
  }

  return defaultValue;
}

export async function saveSiteSetting<T>(key: string, value: T): Promise<void> {
  const pg = getPgPool();
  if (pg) {
    try {
      await pg.query(
        `INSERT INTO public.site_settings (key, value, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`,
        [key, JSON.stringify(value)]
      );
      return;
    } catch (err) {
      console.warn(`[saveSiteSetting] pg query failed for ${key}:`, err);
    }
  }

  // Fallback to Supabase client
  try {
    const supabase = makeAdminClient();
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value: typeof value === "string" ? value : value, updated_at: new Date().toISOString() });

    if (error) {
      console.warn(`[saveSiteSetting] Supabase client warning for ${key}:`, error.message);
    }
  } catch (err) {
    console.warn(`[saveSiteSetting] Supabase fallback error for ${key}:`, err);
  }
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
  const pg = getPgPool();
  if (pg) {
    try {
      const res = await pg.query(
        "SELECT id, title_en, title_ne, category_en, category_ne, image_url, date_en, date_ne FROM public.gallery ORDER BY created_at DESC"
      );
      if (res.rows && res.rows.length > 0) {
        return res.rows.map((row) => ({
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
    } catch (err) {
      console.warn("[fetchGallery] pg query failed:", err);
    }
  }

  try {
    const supabase = makeAdminClient();
    const { data, error } = await supabase
      .from("gallery")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data.map((row) => ({
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
  } catch (err) {
    console.warn("[fetchGallery] supabase query failed:", err);
  }

  return [];
}

export async function saveGalleryItem(item: GalleryItem): Promise<GalleryItem> {
  const finalId = isValidUUID(item.id) ? item.id : generateUUID();
  const pg = getPgPool();
  if (pg) {
    try {
      const res = await pg.query(
        `INSERT INTO public.gallery (id, title_en, title_ne, category_en, category_ne, image_url, date_en, date_ne)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET 
           title_en = EXCLUDED.title_en,
           title_ne = EXCLUDED.title_ne,
           category_en = EXCLUDED.category_en,
           category_ne = EXCLUDED.category_ne,
           image_url = EXCLUDED.image_url,
           date_en = EXCLUDED.date_en,
           date_ne = EXCLUDED.date_ne
         RETURNING *;`,
        [
          finalId,
          item.titleEn,
          item.titleNe,
          item.categoryEn,
          item.categoryNe,
          item.imageUrl,
          item.dateEn,
          item.dateNe,
        ]
      );
      if (res.rows && res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: String(row.id),
          titleEn: row.title_en ?? "",
          titleNe: row.title_ne ?? "",
          categoryEn: row.category_en ?? "",
          categoryNe: row.category_ne ?? "",
          imageUrl: row.image_url ?? "",
          dateEn: row.date_en ?? "",
          dateNe: row.date_ne ?? "",
        };
      }
    } catch (err) {
      console.warn("[saveGalleryItem] pg query failed:", err);
    }
  }

  // Supabase fallback
  try {
    const supabase = makeAdminClient();
    const payload: Record<string, unknown> = {
      id: finalId,
      title_en: item.titleEn,
      title_ne: item.titleNe,
      category_en: item.categoryEn,
      category_ne: item.categoryNe,
      image_url: item.imageUrl,
      date_en: item.dateEn,
      date_ne: item.dateNe,
    };
    const { data } = await supabase.from("gallery").upsert(payload).select().single();
    if (data) {
      return {
        id: String(data.id),
        titleEn: data.title_en ?? "",
        titleNe: data.title_ne ?? "",
        categoryEn: data.category_en ?? "",
        categoryNe: data.category_ne ?? "",
        imageUrl: data.image_url ?? "",
        dateEn: data.date_en ?? "",
        dateNe: data.date_ne ?? "",
      };
    }
  } catch (err) {
    console.warn("[saveGalleryItem] Supabase fallback failed:", err);
  }

  throw new Error("Could not save the gallery item: no database backend accepted the write.");
}

export async function deleteGalleryItem(id: string): Promise<void> {
  if (!id) return;

  const pg = getPgPool();
  if (pg) {
    try {
      await pg.query("DELETE FROM public.gallery WHERE id::text = $1", [id]);
      return;
    } catch (err) {
      console.warn("[deleteGalleryItem] pg query failed:", err);
    }
  }

  try {
    if (isValidUUID(id)) {
      const supabase = makeAdminClient();
      const { error } = await supabase.from("gallery").delete().eq("id", id);
      if (error) {
        console.warn("[deleteGalleryItem] Supabase fallback error:", error.message);
      }
    }
  } catch (err) {
    console.warn("[deleteGalleryItem] Supabase fallback failed:", err);
  }
}

// ---------------------------------------------------------------------------
// Gallery Albums
// ---------------------------------------------------------------------------
export async function fetchGalleryAlbums(): Promise<GalleryAlbum[]> {
  const pg = getPgPool();
  if (pg) {
    try {
      const res = await pg.query(
        "SELECT id, title_en, title_ne, description_en, description_ne, cover_image_url, images, date_en, date_ne, created_at FROM public.gallery_albums ORDER BY created_at DESC"
      );
      if (res.rows && res.rows.length > 0) {
        return res.rows.map((row) => ({
          id: String(row.id),
          titleEn: row.title_en ?? "",
          titleNe: row.title_ne ?? "",
          descriptionEn: row.description_en ?? "",
          descriptionNe: row.description_ne ?? "",
          coverImageUrl: row.cover_image_url ?? "",
          images: Array.isArray(row.images) ? row.images : [],
          dateEn: row.date_en ?? "",
          dateNe: row.date_ne ?? "",
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
        }));
      }
    } catch (err) {
      console.warn("[fetchGalleryAlbums] pg query failed:", err);
    }
  }

  try {
    const supabase = makeAdminClient();
    const { data, error } = await supabase
      .from("gallery_albums")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data.map((row) => ({
        id: String(row.id),
        titleEn: row.title_en ?? "",
        titleNe: row.title_ne ?? "",
        descriptionEn: row.description_en ?? "",
        descriptionNe: row.description_ne ?? "",
        coverImageUrl: row.cover_image_url ?? "",
        images: Array.isArray(row.images) ? row.images : [],
        dateEn: row.date_en ?? "",
        dateNe: row.date_ne ?? "",
        createdAt: row.created_at,
      }));
    }
  } catch (err) {
    console.warn("[fetchGalleryAlbums] supabase query failed:", err);
  }

  // Graceful fallback to site_settings
  try {
    return await fetchSiteSetting<GalleryAlbum[]>("gallery_albums", []);
  } catch {
    return [];
  }
}

export async function saveGalleryAlbum(album: GalleryAlbum): Promise<GalleryAlbum> {
  const finalId = isValidUUID(album.id) ? album.id : generateUUID();
  const imagesJson = JSON.stringify(Array.isArray(album.images) ? album.images : []);
  const cover = album.coverImageUrl || (album.images && album.images[0]?.imageUrl) || "";

  const pg = getPgPool();
  if (pg) {
    try {
      const res = await pg.query(
        `INSERT INTO public.gallery_albums (id, title_en, title_ne, description_en, description_ne, cover_image_url, images, date_en, date_ne, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, NOW())
         ON CONFLICT (id) DO UPDATE SET 
           title_en = EXCLUDED.title_en,
           title_ne = EXCLUDED.title_ne,
           description_en = EXCLUDED.description_en,
           description_ne = EXCLUDED.description_ne,
           cover_image_url = EXCLUDED.cover_image_url,
           images = EXCLUDED.images,
           date_en = EXCLUDED.date_en,
           date_ne = EXCLUDED.date_ne,
           updated_at = NOW()
         RETURNING *;`,
        [
          finalId,
          album.titleEn,
          album.titleNe,
          album.descriptionEn ?? "",
          album.descriptionNe ?? "",
          cover,
          imagesJson,
          album.dateEn ?? "",
          album.dateNe ?? "",
        ]
      );
      if (res.rows && res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: String(row.id),
          titleEn: row.title_en ?? "",
          titleNe: row.title_ne ?? "",
          descriptionEn: row.description_en ?? "",
          descriptionNe: row.description_ne ?? "",
          coverImageUrl: row.cover_image_url ?? "",
          images: Array.isArray(row.images) ? row.images : [],
          dateEn: row.date_en ?? "",
          dateNe: row.date_ne ?? "",
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
        };
      }
    } catch (err) {
      console.warn("[saveGalleryAlbum] pg query failed:", err);
    }
  }

  // Supabase fallback
  try {
    const supabase = makeAdminClient();
    const payload: Record<string, unknown> = {
      id: finalId,
      title_en: album.titleEn,
      title_ne: album.titleNe,
      description_en: album.descriptionEn ?? "",
      description_ne: album.descriptionNe ?? "",
      cover_image_url: cover,
      images: album.images ?? [],
      date_en: album.dateEn ?? "",
      date_ne: album.dateNe ?? "",
      updated_at: new Date().toISOString(),
    };
    const { data } = await supabase.from("gallery_albums").upsert(payload).select().single();
    if (data) {
      return {
        id: String(data.id),
        titleEn: data.title_en ?? "",
        titleNe: data.title_ne ?? "",
        descriptionEn: data.description_en ?? "",
        descriptionNe: data.description_ne ?? "",
        coverImageUrl: data.cover_image_url ?? "",
        images: Array.isArray(data.images) ? data.images : [],
        dateEn: data.date_en ?? "",
        dateNe: data.date_ne ?? "",
        createdAt: data.created_at,
      };
    }
  } catch (err) {
    console.warn("[saveGalleryAlbum] Supabase fallback failed:", err);
  }

  // Fallback to site_settings
  const existing = await fetchSiteSetting<GalleryAlbum[]>("gallery_albums", []);
  const updatedAlbum: GalleryAlbum = { ...album, id: finalId, coverImageUrl: cover };
  const updatedList = [updatedAlbum, ...existing.filter((a) => a.id !== finalId)];
  await saveSiteSetting("gallery_albums", updatedList);
  return updatedAlbum;
}

export async function deleteGalleryAlbum(id: string): Promise<void> {
  if (!id) return;

  const pg = getPgPool();
  if (pg) {
    try {
      await pg.query("DELETE FROM public.gallery_albums WHERE id::text = $1", [id]);
      return;
    } catch (err) {
      console.warn("[deleteGalleryAlbum] pg query failed:", err);
    }
  }

  try {
    if (isValidUUID(id)) {
      const supabase = makeAdminClient();
      await supabase.from("gallery_albums").delete().eq("id", id);
    }
  } catch (err) {
    console.warn("[deleteGalleryAlbum] Supabase fallback failed:", err);
  }

  try {
    const existing = await fetchSiteSetting<GalleryAlbum[]>("gallery_albums", []);
    await saveSiteSetting(
      "gallery_albums",
      existing.filter((a) => a.id !== id)
    );
  } catch {}
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
export async function fetchEvents(): Promise<EventItem[]> {
  const pg = getPgPool();
  if (pg) {
    try {
      const res = await pg.query(
        "SELECT * FROM public.events ORDER BY created_at DESC"
      );
      if (res.rows && res.rows.length > 0) {
        return res.rows.map((row) => ({
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
    } catch (err) {
      console.warn("[fetchEvents] pg query failed:", err);
    }
  }

  try {
    const supabase = makeAdminClient();
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data.map((row) => ({
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
  } catch (err) {
    console.warn("[fetchEvents] supabase query failed:", err);
  }

  return [];
}

export async function saveEventItem(item: EventItem): Promise<EventItem> {
  const finalId = isValidUUID(item.id) ? item.id : generateUUID();
  const pg = getPgPool();
  if (pg) {
    try {
      const res = await pg.query(
        `INSERT INTO public.events (id, title_en, title_ne, date_en, date_ne, time_en, time_ne, location_en, location_ne, description_en, description_ne, status, category_en, category_ne, image_url, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
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
           updated_at = NOW()
         RETURNING *;`,
        [
          finalId,
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
      if (res.rows && res.rows.length > 0) {
        const row = res.rows[0];
        return {
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
        };
      }
    } catch (err) {
      console.warn("[saveEventItem] pg query failed:", err);
    }
  }

  // Supabase fallback
  try {
    const supabase = makeAdminClient();
    const payload: Record<string, unknown> = {
      id: finalId,
      title_en: item.titleEn,
      title_ne: item.titleNe,
      date_en: item.dateEn,
      date_ne: item.dateNe,
      time_en: item.timeEn,
      time_ne: item.timeNe,
      location_en: item.locationEn,
      location_ne: item.locationNe,
      description_en: item.descriptionEn,
      description_ne: item.descriptionNe,
      status: item.status,
      category_en: item.categoryEn,
      category_ne: item.categoryNe,
      image_url: item.imageUrl,
    };
    const { data } = await supabase.from("events").upsert(payload).select().single();
    if (data) {
      return {
        id: String(data.id),
        titleEn: data.title_en ?? "",
        titleNe: data.title_ne ?? "",
        dateEn: data.date_en ?? "",
        dateNe: data.date_ne ?? "",
        timeEn: data.time_en ?? "",
        timeNe: data.time_ne ?? "",
        locationEn: data.location_en ?? "",
        locationNe: data.location_ne ?? "",
        descriptionEn: data.description_en ?? "",
        descriptionNe: data.description_ne ?? "",
        status: data.status ?? "upcoming",
        categoryEn: data.category_en ?? "",
        categoryNe: data.category_ne ?? "",
        imageUrl: data.image_url ?? "",
      };
    }
  } catch (err) {
    console.warn("[saveEventItem] Supabase fallback failed:", err);
  }

  throw new Error("Could not save the event: no database backend accepted the write.");
}

export async function deleteEventItem(id: string): Promise<void> {
  if (!id) return;

  const pg = getPgPool();
  if (pg) {
    try {
      await pg.query("DELETE FROM public.events WHERE id::text = $1", [id]);
      return;
    } catch (err) {
      console.warn("[deleteEventItem] pg query failed:", err);
    }
  }

  try {
    if (isValidUUID(id)) {
      const supabase = makeAdminClient();
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) {
        console.warn("[deleteEventItem] Supabase fallback error:", error.message);
      }
    }
  } catch (err) {
    console.warn("[deleteEventItem] Supabase fallback failed:", err);
  }
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------
export async function fetchMembers(): Promise<Member[]> {
  const pg = getPgPool();
  if (pg) {
    try {
      const res = await pg.query(
        "SELECT * FROM public.members ORDER BY display_order ASC"
      );
      if (res.rows && res.rows.length > 0) {
        return res.rows.map((row) => ({
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
    } catch (err) {
      console.warn("[fetchMembers] pg query failed:", err);
    }
  }

  try {
    const supabase = makeAdminClient();
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("display_order", { ascending: true });

    if (!error && data) {
      return data.map((row) => ({
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
  } catch (err) {
    console.warn("[fetchMembers] supabase query failed:", err);
  }

  return [];
}

export async function saveMemberItem(item: Member): Promise<Member> {
  const finalId = isValidUUID(item.id) ? item.id : generateUUID();
  const pg = getPgPool();
  if (pg) {
    try {
      const res = await pg.query(
        `INSERT INTO public.members (id, name_en, name_ne, role_en, role_ne, committee_type, tenure_en, tenure_ne, phone, email, photo_url, bio_en, bio_ne, display_order, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
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
           updated_at = NOW()
         RETURNING *;`,
        [
          finalId,
          item.nameEn,
          item.nameNe,
          item.roleEn,
          item.roleNe,
          item.committeeType,
          item.tenureEn || null,
          item.tenureNe || null,
          item.phone || null,
          item.email || null,
          item.photoUrl,
          item.bioEn || null,
          item.bioNe || null,
          item.order || 0,
        ]
      );
      if (res.rows && res.rows.length > 0) {
        const row = res.rows[0];
        return {
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
        };
      }
    } catch (err) {
      console.warn("[saveMemberItem] pg query failed:", err);
    }
  }

  try {
    const supabase = makeAdminClient();
    const payload: Record<string, unknown> = {
      id: finalId,
      name_en: item.nameEn,
      name_ne: item.nameNe,
      role_en: item.roleEn,
      role_ne: item.roleNe,
      committee_type: item.committeeType,
      tenure_en: item.tenureEn || null,
      tenure_ne: item.tenureNe || null,
      phone: item.phone || null,
      email: item.email || null,
      photo_url: item.photoUrl,
      bio_en: item.bioEn || null,
      bio_ne: item.bioNe || null,
      display_order: item.order || 0,
    };
    const { data } = await supabase.from("members").upsert(payload).select().single();
    if (data) {
      return {
        id: String(data.id),
        nameEn: data.name_en ?? "",
        nameNe: data.name_ne ?? "",
        roleEn: data.role_en ?? "",
        roleNe: data.role_ne ?? "",
        committeeType: data.committee_type ?? "current",
        tenureEn: data.tenure_en ?? undefined,
        tenureNe: data.tenure_ne ?? undefined,
        phone: data.phone ?? undefined,
        email: data.email ?? undefined,
        photoUrl: data.photo_url ?? "",
        bioEn: data.bio_en ?? undefined,
        bioNe: data.bio_ne ?? undefined,
        order: data.display_order ?? 0,
      };
    }
  } catch (err) {
    console.warn("[saveMemberItem] Supabase fallback failed:", err);
  }

  throw new Error("Could not save the member: no database backend accepted the write.");
}

export async function deleteMemberItem(id: string): Promise<void> {
  if (!id) return;

  const pg = getPgPool();
  if (pg) {
    try {
      await pg.query("DELETE FROM public.members WHERE id::text = $1", [id]);
      return;
    } catch (err) {
      console.warn("[deleteMemberItem] pg query failed:", err);
    }
  }

  try {
    if (isValidUUID(id)) {
      const supabase = makeAdminClient();
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) {
        console.warn("[deleteMemberItem] Supabase fallback error:", error.message);
      }
    }
  } catch (err) {
    console.warn("[deleteMemberItem] Supabase fallback failed:", err);
  }
}

// ---------------------------------------------------------------------------
// Publications
// ---------------------------------------------------------------------------
export async function fetchPublications(): Promise<Publication[]> {
  const pg = getPgPool();
  if (pg) {
    try {
      const res = await pg.query(
        "SELECT * FROM public.publications ORDER BY created_at DESC"
      );
      if (res.rows && res.rows.length > 0) {
        return res.rows.map((row) => ({
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
    } catch (err) {
      console.warn("[fetchPublications] pg query failed:", err);
    }
  }

  try {
    const supabase = makeAdminClient();
    const { data, error } = await supabase
      .from("publications")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data.map((row) => ({
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
  } catch (err) {
    console.warn("[fetchPublications] supabase query failed:", err);
  }

  return [];
}

export async function savePublicationItem(item: Publication): Promise<Publication> {
  const finalId = isValidUUID(item.id) ? item.id : generateUUID();
  const pg = getPgPool();
  if (pg) {
    try {
      const res = await pg.query(
        `INSERT INTO public.publications (id, title_en, title_ne, category_en, category_ne, published_year_en, published_year_ne, file_size, pages, pdf_url, cover_image_url, description_en, description_ne, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
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
           updated_at = NOW()
         RETURNING *;`,
        [
          finalId,
          item.titleEn,
          item.titleNe,
          item.categoryEn,
          item.categoryNe,
          item.publishedYearEn,
          item.publishedYearNe,
          item.fileSize,
          item.pages,
          item.pdfUrl,
          item.coverImageUrl || null,
          item.descriptionEn || null,
          item.descriptionNe || null,
        ]
      );
      if (res.rows && res.rows.length > 0) {
        const row = res.rows[0];
        return {
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
        };
      }
    } catch (err) {
      console.warn("[savePublicationItem] pg query failed:", err);
    }
  }

  try {
    const supabase = makeAdminClient();
    const payload: Record<string, unknown> = {
      id: finalId,
      title_en: item.titleEn,
      title_ne: item.titleNe,
      category_en: item.categoryEn,
      category_ne: item.categoryNe,
      published_year_en: item.publishedYearEn,
      published_year_ne: item.publishedYearNe,
      file_size: item.fileSize,
      pages: item.pages,
      pdf_url: item.pdfUrl,
      cover_image_url: item.coverImageUrl || null,
      description_en: item.descriptionEn || null,
      description_ne: item.descriptionNe || null,
    };
    const { data } = await supabase.from("publications").upsert(payload).select().single();
    if (data) {
      return {
        id: String(data.id),
        titleEn: data.title_en ?? "",
        titleNe: data.title_ne ?? "",
        categoryEn: data.category_en ?? "",
        categoryNe: data.category_ne ?? "",
        publishedYearEn: data.published_year_en ?? "",
        publishedYearNe: data.published_year_ne ?? "",
        fileSize: data.file_size ?? "",
        pages: data.pages ?? 0,
        pdfUrl: data.pdf_url ?? "",
        coverImageUrl: data.cover_image_url ?? undefined,
        descriptionEn: data.description_en ?? "",
        descriptionNe: data.description_ne ?? "",
      };
    }
  } catch (err) {
    console.warn("[savePublicationItem] Supabase fallback failed:", err);
  }

  throw new Error("Could not save the publication: no database backend accepted the write.");
}

export async function deletePublicationItem(id: string): Promise<void> {
  if (!id) return;

  const pg = getPgPool();
  if (pg) {
    try {
      await pg.query("DELETE FROM public.publications WHERE id::text = $1", [id]);
      return;
    } catch (err) {
      console.warn("[deletePublicationItem] pg query failed:", err);
    }
  }

  try {
    if (isValidUUID(id)) {
      const supabase = makeAdminClient();
      const { error } = await supabase.from("publications").delete().eq("id", id);
      if (error) {
        console.warn("[deletePublicationItem] Supabase fallback error:", error.message);
      }
    }
  } catch (err) {
    console.warn("[deletePublicationItem] Supabase fallback failed:", err);
  }
}

// ---------------------------------------------------------------------------
// Contact inquiries
//
// Inquiries used to be written to the visiting browser's localStorage, which
// meant a message never reached the organisation. These persist to the
// inquiries table so the admin panel can actually read them.
// ---------------------------------------------------------------------------

export interface InquiryRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  date: string;
  read: boolean;
}

function mapInquiryRow(row: Record<string, unknown>): InquiryRecord {
  const created = row.created_at ? String(row.created_at) : "";
  return {
    id: String(row.id),
    name: (row.full_name as string) ?? "",
    phone: (row.phone as string) ?? "",
    email: (row.email as string) ?? "",
    message: (row.message as string) ?? "",
    date: created ? created.split("T")[0] : new Date().toISOString().split("T")[0],
    read: Boolean(row.is_read),
  };
}

export async function fetchInquiries(): Promise<InquiryRecord[]> {
  const pg = getPgPool();
  if (pg) {
    try {
      const res = await pg.query(
        "SELECT id, full_name, phone, email, message, is_read, created_at FROM public.inquiries ORDER BY created_at DESC LIMIT 500"
      );
      if (res.rows) return res.rows.map(mapInquiryRow);
    } catch (err) {
      console.warn("[fetchInquiries] pg query failed:", err);
    }
  }

  try {
    const supabase = makeAdminClient();
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (!error && data) return data.map(mapInquiryRow);
  } catch (err) {
    console.warn("[fetchInquiries] supabase query failed:", err);
  }

  return [];
}

export async function saveInquiry(input: {
  name: string;
  phone: string;
  email?: string;
  message: string;
}): Promise<InquiryRecord> {
  const finalId = generateUUID();

  const pg = getPgPool();
  if (pg) {
    try {
      const res = await pg.query(
        `INSERT INTO public.inquiries (id, full_name, phone, email, message)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, full_name, phone, email, message, is_read, created_at;`,
        [finalId, input.name, input.phone, input.email ?? null, input.message]
      );
      if (res.rows && res.rows.length > 0) return mapInquiryRow(res.rows[0]);
    } catch (err) {
      console.warn("[saveInquiry] pg query failed:", err);
    }
  }

  try {
    const supabase = makeAdminClient();
    const { data, error } = await supabase
      .from("inquiries")
      .insert({
        id: finalId,
        full_name: input.name,
        phone: input.phone,
        email: input.email ?? null,
        message: input.message,
      })
      .select()
      .single();
    if (!error && data) return mapInquiryRow(data);
    if (error) throw error;
  } catch (err) {
    console.warn("[saveInquiry] supabase insert failed:", err);
    throw err instanceof Error ? err : new Error("Failed to store inquiry.");
  }

  throw new Error("Failed to store inquiry.");
}

export async function markInquiryRead(id: string, read: boolean): Promise<void> {
  if (!id) return;

  const pg = getPgPool();
  if (pg) {
    try {
      await pg.query("UPDATE public.inquiries SET is_read = $2 WHERE id::text = $1", [id, read]);
      return;
    } catch (err) {
      console.warn("[markInquiryRead] pg query failed:", err);
    }
  }

  try {
    const supabase = makeAdminClient();
    await supabase.from("inquiries").update({ is_read: read }).eq("id", id);
  } catch (err) {
    console.warn("[markInquiryRead] supabase update failed:", err);
  }
}

export async function deleteInquiry(id: string): Promise<void> {
  if (!id) return;

  const pg = getPgPool();
  if (pg) {
    try {
      await pg.query("DELETE FROM public.inquiries WHERE id::text = $1", [id]);
      return;
    } catch (err) {
      console.warn("[deleteInquiry] pg query failed:", err);
    }
  }

  try {
    const supabase = makeAdminClient();
    await supabase.from("inquiries").delete().eq("id", id);
  } catch (err) {
    console.warn("[deleteInquiry] supabase delete failed:", err);
  }
}

// ---------------------------------------------------------------------------
// About Us section: content pages, rosters and documents
// ---------------------------------------------------------------------------

function mapContentPage(row: Record<string, unknown>): ContentPage {
  return {
    slug: String(row.slug),
    titleEn: (row.title_en as string) ?? "",
    titleNe: (row.title_ne as string) ?? "",
    bodyEn: (row.body_en as string) ?? "",
    bodyNe: (row.body_ne as string) ?? "",
  };
}

export async function fetchContentPages(): Promise<ContentPage[]> {
  const pg = getPgPool();
  if (pg) {
    try {
      const res = await pg.query(
        "SELECT slug, title_en, title_ne, body_en, body_ne FROM public.content_pages ORDER BY slug"
      );
      if (res.rows) return res.rows.map(mapContentPage);
    } catch (err) {
      console.warn("[fetchContentPages] pg query failed:", err);
    }
  }

  try {
    const supabase = makeAdminClient();
    const { data, error } = await supabase.from("content_pages").select("*").order("slug");
    if (!error && data) return data.map(mapContentPage);
  } catch (err) {
    console.warn("[fetchContentPages] supabase query failed:", err);
  }

  return [];
}

export async function saveContentPage(page: ContentPage): Promise<ContentPage> {
  const pg = getPgPool();
  if (pg) {
    try {
      const res = await pg.query(
        `INSERT INTO public.content_pages (slug, title_en, title_ne, body_en, body_ne, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (slug) DO UPDATE SET
           title_en = EXCLUDED.title_en,
           title_ne = EXCLUDED.title_ne,
           body_en = EXCLUDED.body_en,
           body_ne = EXCLUDED.body_ne,
           updated_at = NOW()
         RETURNING slug, title_en, title_ne, body_en, body_ne;`,
        [page.slug, page.titleEn, page.titleNe, page.bodyEn, page.bodyNe]
      );
      if (res.rows && res.rows.length > 0) return mapContentPage(res.rows[0]);
    } catch (err) {
      console.warn("[saveContentPage] pg query failed:", err);
    }
  }

  try {
    const supabase = makeAdminClient();
    const { data, error } = await supabase
      .from("content_pages")
      .upsert({
        slug: page.slug,
        title_en: page.titleEn,
        title_ne: page.titleNe,
        body_en: page.bodyEn,
        body_ne: page.bodyNe,
      })
      .select()
      .single();
    if (!error && data) return mapContentPage(data);
  } catch (err) {
    console.warn("[saveContentPage] supabase upsert failed:", err);
  }

  throw new Error("Could not save the page: no database backend accepted the write.");
}

function mapPageDocument(row: Record<string, unknown>): PageDocument {
  return {
    id: String(row.id),
    slug: (row.slug as PageDocument["slug"]) ?? "statute",
    titleEn: (row.title_en as string) ?? "",
    titleNe: (row.title_ne as string) ?? "",
    fileUrl: (row.file_url as string) ?? "",
    fileType: (row.file_type as PageDocument["fileType"]) ?? "pdf",
    pageCount: row.page_count === null || row.page_count === undefined ? null : Number(row.page_count),
    order: Number(row.display_order ?? 0),
  };
}

export async function fetchPageDocuments(): Promise<PageDocument[]> {
  const pg = getPgPool();
  if (pg) {
    try {
      const res = await pg.query(
        "SELECT id, slug, title_en, title_ne, file_url, file_type, page_count, display_order FROM public.page_documents ORDER BY display_order ASC, created_at ASC"
      );
      if (res.rows) return res.rows.map(mapPageDocument);
    } catch (err) {
      console.warn("[fetchPageDocuments] pg query failed:", err);
    }
  }

  try {
    const supabase = makeAdminClient();
    const { data, error } = await supabase
      .from("page_documents")
      .select("*")
      .order("display_order", { ascending: true });
    if (!error && data) return data.map(mapPageDocument);
  } catch (err) {
    console.warn("[fetchPageDocuments] supabase query failed:", err);
  }

  return [];
}

export async function savePageDocument(doc: PageDocument): Promise<PageDocument> {
  const finalId = isValidUUID(doc.id) ? doc.id : generateUUID();

  const pg = getPgPool();
  if (pg) {
    try {
      const res = await pg.query(
        `INSERT INTO public.page_documents (id, slug, title_en, title_ne, file_url, file_type, page_count, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           slug = EXCLUDED.slug,
           title_en = EXCLUDED.title_en,
           title_ne = EXCLUDED.title_ne,
           file_url = EXCLUDED.file_url,
           file_type = EXCLUDED.file_type,
           page_count = EXCLUDED.page_count,
           display_order = EXCLUDED.display_order
         RETURNING id, slug, title_en, title_ne, file_url, file_type, page_count, display_order;`,
        [
          finalId,
          doc.slug,
          doc.titleEn,
          doc.titleNe,
          doc.fileUrl,
          doc.fileType,
          doc.pageCount,
          doc.order ?? 0,
        ]
      );
      if (res.rows && res.rows.length > 0) return mapPageDocument(res.rows[0]);
    } catch (err) {
      console.warn("[savePageDocument] pg query failed:", err);
    }
  }

  try {
    const supabase = makeAdminClient();
    const { data, error } = await supabase
      .from("page_documents")
      .upsert({
        id: finalId,
        slug: doc.slug,
        title_en: doc.titleEn,
        title_ne: doc.titleNe,
        file_url: doc.fileUrl,
        file_type: doc.fileType,
        page_count: doc.pageCount,
        display_order: doc.order ?? 0,
      })
      .select()
      .single();
    if (!error && data) return mapPageDocument(data);
  } catch (err) {
    console.warn("[savePageDocument] supabase upsert failed:", err);
  }

  throw new Error("Could not save the document: no database backend accepted the write.");
}

export async function deletePageDocument(id: string): Promise<void> {
  if (!id) return;

  const pg = getPgPool();
  if (pg) {
    try {
      await pg.query("DELETE FROM public.page_documents WHERE id::text = $1", [id]);
      return;
    } catch (err) {
      console.warn("[deletePageDocument] pg query failed:", err);
    }
  }

  try {
    const supabase = makeAdminClient();
    await supabase.from("page_documents").delete().eq("id", id);
  } catch (err) {
    console.warn("[deletePageDocument] supabase delete failed:", err);
  }
}
