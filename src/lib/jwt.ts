/**
 * Universal JSON Web Token (JWT) Library
 * Built using the standard Web Crypto API (supported natively in Node.js, Edge, and Browsers).
 * Provides robust HMAC-SHA256 signing, verification, decoding, and expiration tracking.
 */

import { AdminRole } from "./adminAuth";

export const AUTH_COOKIE_NAME = "thorga_admin_jwt";
export const DEFAULT_JWT_EXPIRY_SECONDS = 24 * 60 * 60; // 24 hours

export interface JWTPayload {
  sub: string; // User ID
  email: string;
  name: string;
  role: AdminRole;
  isSuperadmin: boolean;
  iat: number; // Issued at (Unix timestamp in seconds)
  exp: number; // Expiration time (Unix timestamp in seconds)
}

const MIN_SECRET_LENGTH = 32;

/**
 * Per-process development fallback. Never a committed constant: a hardcoded
 * secret in the repository lets anyone who can read the source forge an admin
 * token. Restarting the dev server invalidates dev sessions, which is the
 * correct trade for not shipping a known signing key.
 */
let devSecret: string | null = null;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (secret && secret.length >= MIN_SECRET_LENGTH) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      secret
        ? `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters.`
        : "JWT_SECRET is not set. Refusing to sign or verify admin tokens."
    );
  }

  if (!devSecret) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    devSecret = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    console.warn(
      "[jwt] JWT_SECRET is not set. Using an ephemeral development secret. " +
        "Set JWT_SECRET in .env.local before deploying."
    );
  }
  return devSecret;
}

// ---------------------------------------------------------------------------
// Base64URL Encoding and Decoding Helpers (Safe for UTF-8 and binary)
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

// ---------------------------------------------------------------------------
// Web Crypto HMAC-SHA256 Key Derivation
// ---------------------------------------------------------------------------

async function getCryptoKey(secret: string, usage: "sign" | "verify"): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

// ---------------------------------------------------------------------------
// Sign JWT
// ---------------------------------------------------------------------------

export async function signJWT(
  payload: Omit<JWTPayload, "iat" | "exp">,
  expiresInSeconds: number = DEFAULT_JWT_EXPIRY_SECONDS
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const secret = getJwtSecret();
  const key = await getCryptoKey(secret, "sign");
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(dataToSign)
  );

  const encodedSignature = bufferToBase64Url(signatureBuffer);
  return `${dataToSign}.${encodedSignature}`;
}

// ---------------------------------------------------------------------------
// Verify JWT
// ---------------------------------------------------------------------------

export interface VerifyResult {
  valid: boolean;
  payload?: JWTPayload;
  expired?: boolean;
  error?: string;
}

export async function verifyJWT(token?: string | null): Promise<VerifyResult> {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "No token provided." };
  }

  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    return { valid: false, error: "Malformed JWT structure." };
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  try {
    // 1. Decode Header
    const headerStr = base64UrlDecode(encodedHeader);
    const header = JSON.parse(headerStr);
    if (header.alg !== "HS256") {
      return { valid: false, error: `Unsupported algorithm: ${header.alg}` };
    }

    // 2. Decode Payload
    const payloadStr = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadStr) as JWTPayload;

    // 3. Verify Signature
    const secret = getJwtSecret();
    const key = await getCryptoKey(secret, "verify");
    const signatureBytes = base64UrlToBuffer(encodedSignature);
    const dataToVerify = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);

    const isValidSignature = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as BufferSource,
      dataToVerify
    );

    if (!isValidSignature) {
      return { valid: false, error: "Invalid token signature." };
    }

    // 4. Check Expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now >= payload.exp) {
      return {
        valid: false,
        expired: true,
        payload,
        error: "Token has expired.",
      };
    }

    return { valid: true, payload };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to verify JWT.";
    return { valid: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Synchronous Client-Side Inspection Helpers (Does not verify cryptographic signature)
// ---------------------------------------------------------------------------

export function decodeJWT(token?: string | null): JWTPayload | null {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.trim().split(".");
    if (parts.length !== 3) return null;
    const payloadStr = base64UrlDecode(parts[1]);
    return JSON.parse(payloadStr) as JWTPayload;
  } catch {
    return null;
  }
}

export function isJWTExpired(token?: string | null): boolean {
  if (!token) return true;
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return now >= decoded.exp;
}

export function getJWTTimeRemainingMs(token?: string | null): number {
  if (!token) return 0;
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return 0;
  const remainingSeconds = decoded.exp - Math.floor(Date.now() / 1000);
  return Math.max(0, remainingSeconds * 1000);
}
