/**
 * Password hashing and constant-time comparison.
 *
 * Uses PBKDF2-HMAC-SHA256 via the Web Crypto API so the same code runs in the
 * Node.js runtime and on the Edge runtime with no native dependency.
 *
 * Stored format:  pbkdf2$<iterations>$<saltBase64>$<hashBase64>
 *
 * Legacy plaintext passwords are still accepted by verifyPassword() so that
 * accounts created before hashing existed can still log in, but the result
 * reports needsRehash so the caller can upgrade the record on the spot.
 */

const PREFIX = "pbkdf2";
const ITERATIONS = 210_000; // OWASP 2023 guidance for PBKDF2-HMAC-SHA256
const SALT_BYTES = 16;
const KEY_BITS = 256;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    key,
    KEY_BITS
  );
  return new Uint8Array(bits);
}

/**
 * Compares two byte arrays without leaking length-independent timing.
 * Length differences are unavoidable to detect, but content comparison is
 * constant time for equal-length inputs.
 */
function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Constant-time comparison for two strings of secret material. */
export function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  return timingSafeEqualBytes(enc.encode(a), enc.encode(b));
}

export function isHashed(stored: string | undefined | null): boolean {
  return typeof stored === "string" && stored.startsWith(`${PREFIX}$`);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, ITERATIONS);
  return `${PREFIX}$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

export interface PasswordVerifyResult {
  valid: boolean;
  /** True when the stored value was legacy plaintext or used weaker parameters. */
  needsRehash: boolean;
}

export async function verifyPassword(
  password: string,
  stored: string | undefined | null
): Promise<PasswordVerifyResult> {
  if (!password || !stored) return { valid: false, needsRehash: false };

  if (!isHashed(stored)) {
    // Legacy plaintext record. Accept once, then the caller upgrades it.
    return { valid: timingSafeEqual(password, stored), needsRehash: true };
  }

  const parts = stored.split("$");
  if (parts.length !== 4) return { valid: false, needsRehash: false };

  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 1000) {
    return { valid: false, needsRehash: false };
  }

  try {
    const salt = fromBase64(parts[2]);
    const expected = fromBase64(parts[3]);
    const actual = await derive(password, salt, iterations);
    return {
      valid: timingSafeEqualBytes(actual, expected),
      needsRehash: iterations < ITERATIONS,
    };
  } catch {
    return { valid: false, needsRehash: false };
  }
}
