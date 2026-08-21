/**
 * Server-side Supabase data helpers.
 * These run only in API routes / Server Components, never on the client.
 * Columns are snake_case in Supabase; we map them to camelCase to match the
 * TypeScript interfaces in mockData.ts.
 */
import { createClient } from "@supabase/supabase-js";
import type {
  GalleryItem,
  EventItem,
  Member,
  Publication,
} from "@/data/mockData";

function makeAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
  // Prefer service-role key for server reads so RLS doesn't block us;
  // fall back to anon key if service-role is not set.
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY !== "placeholder-service-role-key"
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        "placeholder-key";
  return createClient(url, key, { auth: { persistSession: false } });
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
