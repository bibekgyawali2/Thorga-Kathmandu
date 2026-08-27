import { NextRequest, NextResponse } from "next/server";
import {
  fetchInquiries,
  saveInquiry,
  markInquiryRead,
  deleteInquiry,
} from "@/lib/supabase/data";
import { verifyAuth } from "@/lib/authGuard";
import { isValidEmail, isValidName, isValidPhone, isValidMessage } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

const MAX_NAME = 100;
const MAX_PHONE = 30;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 4000;

// Public submissions are throttled per address so the inbox cannot be flooded.
// Best effort per instance; see the note in api/auth/login.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_SUBMISSIONS = 5;
const submissions = new Map<string, { count: number; firstAt: number }>();

function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function tooManySubmissions(key: string): boolean {
  const now = Date.now();
  const record = submissions.get(key);
  if (!record || now - record.firstAt > WINDOW_MS) {
    submissions.set(key, { count: 1, firstAt: now });
    if (submissions.size > 5000) {
      for (const [k, v] of submissions) {
        if (now - v.firstAt > WINDOW_MS) submissions.delete(k);
      }
    }
    return false;
  }
  record.count += 1;
  return record.count > MAX_SUBMISSIONS;
}

/** Public endpoint: a visitor submits a contact inquiry. */
export async function POST(req: NextRequest) {
  if (tooManySubmissions(clientKey(req))) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many messages sent from this connection. Please try again later.",
      },
      { status: 429, headers: NO_CACHE_HEADERS }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const name = String(body.name ?? "").trim().slice(0, MAX_NAME);
    const phone = String(body.phone ?? "").trim().slice(0, MAX_PHONE);
    const email = String(body.email ?? "").trim().slice(0, MAX_EMAIL);
    const message = String(body.message ?? "").trim().slice(0, MAX_MESSAGE);

    if (!isValidName(name)) {
      return NextResponse.json(
        { success: false, error: "Please provide your full name." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid phone number." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    if (!isValidMessage(message)) {
      return NextResponse.json(
        { success: false, error: "Please write a message of at least 10 characters." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const saved = await saveInquiry({ name, phone, email, message });

    return NextResponse.json(
      { success: true, data: saved },
      { status: 201, headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error("[api/inquiries] POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "We could not deliver your message. Please call the secretariat instead.",
      },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

/** Admin only: read the inbox. */
export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const data = await fetchInquiries();
    return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/inquiries] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inquiries" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

/** Admin only: mark an inquiry read or unread. */
export async function PATCH(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const body = await req.json().catch(() => null);
    const id = typeof body?.id === "string" ? body.id : null;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    await markInquiryRead(id, body.read !== false);
    return NextResponse.json({ success: true, id }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/inquiries] PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update inquiry" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

/** Admin only: delete an inquiry. */
export async function DELETE(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    await deleteInquiry(id);
    return NextResponse.json({ success: true, id }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[api/inquiries] DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete inquiry" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
