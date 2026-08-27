/**
 * Bikram Sambat date conversion.
 *
 * BS month lengths are not formulaic, so conversion needs a lookup table.
 * This one covers 2082-2090 BS, anchored on a date verified against the
 * Government of Nepal calendar:
 *
 *     2026-08-27 AD  =  11 Bhadra 2083 BS  (Bihibar / Thursday)
 *
 * Outside the table range the helpers return null and callers fall back to
 * the Gregorian date rather than printing a wrong one. Extend BS_MONTH_DAYS
 * with the official figures when the range runs out.
 */

const NEPALI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

export const BS_MONTHS_NE = [
  "बैशाख",
  "जेठ",
  "असार",
  "श्रावण",
  "भदौ",
  "असोज",
  "कार्तिक",
  "मंसिर",
  "पुष",
  "माघ",
  "फाल्गुन",
  "चैत",
];

export const WEEKDAYS_NE = [
  "आइतबार",
  "सोमबार",
  "मंगलबार",
  "बुधबार",
  "बिहिबार",
  "शुक्रबार",
  "शनिबार",
];

/** Days in each BS month, Baisakh through Chaitra. */
const BS_MONTH_DAYS: Record<number, number[]> = {
  2082: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2083: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2084: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2085: [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2086: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2087: [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30],
  2088: [30, 31, 32, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2089: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2090: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
};

const MIN_BS_YEAR = 2082;
const MAX_BS_YEAR = 2090;

/** The verified anchor: this AD date is this BS date. */
const ANCHOR_AD = Date.UTC(2026, 7, 27); // 2026-08-27
const ANCHOR_BS = { year: 2083, month: 5, day: 11 }; // 11 Bhadra 2083

export interface BSDate {
  year: number;
  /** 1 = Baisakh through 12 = Chaitra. */
  month: number;
  day: number;
  /** 0 = Sunday. */
  weekday: number;
}

export function toNepaliDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => NEPALI_DIGITS[Number(d)]);
}

function daysInBSMonth(year: number, month: number): number | null {
  const months = BS_MONTH_DAYS[year];
  if (!months) return null;
  return months[month - 1] ?? null;
}

/** Converts a Gregorian date to BS, or null if it falls outside the table. */
export function toBikramSambat(date: Date): BSDate | null {
  const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  let offset = Math.round((utc - ANCHOR_AD) / 86_400_000);

  let { year, month, day } = ANCHOR_BS;

  while (offset > 0) {
    const length = daysInBSMonth(year, month);
    if (length === null) return null;

    const remainingInMonth = length - day;
    if (offset <= remainingInMonth) {
      day += offset;
      offset = 0;
      break;
    }

    offset -= remainingInMonth + 1;
    day = 1;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
      if (year > MAX_BS_YEAR) return null;
    }
  }

  while (offset < 0) {
    if (day + offset >= 1) {
      day += offset;
      offset = 0;
      break;
    }

    offset += day;
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
      if (year < MIN_BS_YEAR) return null;
    }
    const length = daysInBSMonth(year, month);
    if (length === null) return null;
    day = length;
  }

  return { year, month, day, weekday: date.getDay() };
}

/** "वि.सं. २०८३ भदौ ११ गते, बिहिबार" or null when out of range. */
export function formatBikramSambat(date: Date): string | null {
  const bs = toBikramSambat(date);
  if (!bs) return null;
  return `वि.सं. ${toNepaliDigits(bs.year)} ${BS_MONTHS_NE[bs.month - 1]} ${toNepaliDigits(
    bs.day
  )} गते, ${WEEKDAYS_NE[bs.weekday]}`;
}

/** Long-form Gregorian date, used in English and as the BS fallback. */
export function formatGregorian(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
