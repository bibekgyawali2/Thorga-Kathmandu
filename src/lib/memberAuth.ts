import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "./authGuard";

export const MEMBER_AUTH_COOKIE_NAME = "thorga_member_jwt";
export const MEMBER_SESSION_STORAGE_KEY = "thorga_member_session";
export const MEMBER_AUTH_SYNC_EVENT = "thorga_member_auth_sync";
export const DEFAULT_MEMBER_JWT_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface MemberSession {
  isAuthenticated: boolean;
  token: string;
  id: string;
  name: string;
  username: string;
  loginTime: number;
  expiresAt: number; // Unix timestamp ms
}

export interface MemberJWTPayload {
  sub: string;
  name: string;
  username: string;
  type: "member_special";
  iat: number;
  exp: number;
}

// ---------------------------------------------------------------------------
// Base64Url Helpers
// ---------------------------------------------------------------------------

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function base64UrlToBuffer(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

let devMemberSecret: string | null = null;
function getSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.MEMBER_JWT_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (!devMemberSecret) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    devMemberSecret = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return devMemberSecret;
}

async function getCryptoKey(usage: "sign" | "verify"): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

export async function signMemberJWT(
  user: { id: string; name: string; username: string },
  expiresInSeconds: number = DEFAULT_MEMBER_JWT_EXPIRY_SECONDS
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: MemberJWTPayload = {
    sub: user.id,
    name: user.name,
    username: user.username,
    type: "member_special",
    iat: now,
    exp: now + expiresInSeconds,
  };

  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await getCryptoKey("sign");
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(dataToSign)
  );

  const encodedSignature = bufferToBase64Url(signatureBuffer);
  return `${dataToSign}.${encodedSignature}`;
}

export interface VerifyMemberResult {
  valid: boolean;
  payload?: MemberJWTPayload;
  expired?: boolean;
  error?: string;
}

export async function verifyMemberJWT(token?: string | null): Promise<VerifyMemberResult> {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "No token provided." };
  }

  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    return { valid: false, error: "Malformed JWT structure." };
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  try {
    const header = JSON.parse(base64UrlDecode(encodedHeader));
    if (header.alg !== "HS256") {
      return { valid: false, error: "Unsupported algorithm." };
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as MemberJWTPayload;
    if (payload.type !== "member_special") {
      return { valid: false, error: "Invalid token type." };
    }

    const key = await getCryptoKey("verify");
    const signatureBytes = base64UrlToBuffer(encodedSignature);
    const dataToVerify = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);

    const isValid = await crypto.subtle.verify("HMAC", key, signatureBytes as BufferSource, dataToVerify);
    if (!isValid) {
      return { valid: false, error: "Invalid signature." };
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, expired: true, error: "Token expired." };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Client Storage & Session Helpers
// ---------------------------------------------------------------------------

export function getMemberSession(): MemberSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MEMBER_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as MemberSession;
    if (!session || !session.token) return null;
    if (session.expiresAt && Date.now() > session.expiresAt) {
      clearMemberSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveMemberSession(session: MemberSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MEMBER_SESSION_STORAGE_KEY, JSON.stringify(session));
    window.dispatchEvent(new Event(MEMBER_AUTH_SYNC_EVENT));
  } catch {}
}

export function clearMemberSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(MEMBER_SESSION_STORAGE_KEY);
    window.dispatchEvent(new Event(MEMBER_AUTH_SYNC_EVENT));
  } catch {}
}

// ---------------------------------------------------------------------------
// Server API Route Guard: Member OR Admin
// ---------------------------------------------------------------------------

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export interface MemberOrAdminAuthResult {
  authorized: boolean;
  role?: "member" | "admin";
  user?: {
    id: string;
    name: string;
    username?: string;
  };
  response?: NextResponse;
}

export async function verifyMemberOrAdminAuth(
  req: Request | NextRequest
): Promise<MemberOrAdminAuthResult> {
  // 1. Try checking Member token from Bearer header or cookie
  let memberToken: string | null = null;
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    memberToken = authHeader.substring(7).trim();
  }

  if (!memberToken) {
    if ("cookies" in req && typeof (req as NextRequest).cookies?.get === "function") {
      memberToken = (req as NextRequest).cookies.get(MEMBER_AUTH_COOKIE_NAME)?.value || null;
    } else {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${MEMBER_AUTH_COOKIE_NAME}=([^;]+)`));
      if (match) memberToken = decodeURIComponent(match[1]);
    }
  }

  if (memberToken) {
    const memberCheck = await verifyMemberJWT(memberToken);
    if (memberCheck.valid && memberCheck.payload) {
      return {
        authorized: true,
        role: "member",
        user: {
          id: memberCheck.payload.sub,
          name: memberCheck.payload.name,
          username: memberCheck.payload.username,
        },
      };
    }
  }

  // 2. Check if admin is accessing
  const adminCheck = await verifyAuth(req);
  if (adminCheck.authorized && adminCheck.user) {
    return {
      authorized: true,
      role: "admin",
      user: {
        id: adminCheck.user.sub,
        name: adminCheck.user.name,
        username: adminCheck.user.email,
      },
    };
  }

  const res = NextResponse.json(
    {
      success: false,
      error: "सदस्य विशेष पहुँचको लागि लगइन आवश्यक छ।",
      code: "UNAUTHORIZED",
    },
    { status: 401, headers: NO_CACHE_HEADERS }
  );

  return { authorized: false, response: res };
}
