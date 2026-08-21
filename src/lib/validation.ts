/**
 * Form validation utilities for Thorga Kathmandu Portal
 */

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Supports Nepal mobile (98XXXXXXXX, 97XXXXXXXX, 96XXXXXXXX), Nepal landline (01-XXXXXXX, 079-XXXXXX), and international E.164 (+977..., etc.)
export const PHONE_REGEX = /^(\+?\d{1,4}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{6,10}$/;

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-().]/g, "");
  // Must have between 7 and 15 digits
  return /^\+?\d{7,15}$/.test(cleaned) && PHONE_REGEX.test(phone.trim());
}

export function isValidName(name: string): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
}

export function isValidMessage(message: string, minLength: number = 10): boolean {
  if (!message) return false;
  return message.trim().length >= minLength;
}

export function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidPassword(password: string): { isValid: boolean; errorNe: string; errorEn: string } {
  if (!password || password.length < 6) {
    return {
      isValid: false,
      errorNe: "पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ।",
      errorEn: "Password must be at least 6 characters long.",
    };
  }
  return { isValid: true, errorNe: "", errorEn: "" };
}

export function isValidImageSrc(src: string | undefined | null): boolean {
  if (!src || typeof src !== "string") return false;
  const trimmed = src.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/")) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

