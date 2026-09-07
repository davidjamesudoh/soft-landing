import { parsePhoneNumberFromString } from "libphonenumber-js";

export interface NormalizedPhone {
  /** E.164, e.g. +2348012345678 */
  e164: string;
  /** whatsapp-web.js chat id, e.g. 2348012345678@c.us */
  whatsappId: string;
}

/**
 * Guests' numbers arrive in a mix of formats: plain NGN local ("080..."),
 * NGN with a country code ("234..." or "+234..."), and a handful of
 * non-NGN numbers typed in US-style punctuation ("(814) 064-3185").
 * We sniff the format first, then hand off to libphonenumber-js to
 * validate + normalize rather than hand-rolling E.164 math.
 */
export function normalizePhone(raw: string): NormalizedPhone | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const candidates: Array<{ input: string; country?: "NG" | "US" }> = [];

  if (trimmed.startsWith("+")) {
    candidates.push({ input: trimmed });
  } else if (/^\(\d{3}\)/.test(trimmed)) {
    // "(814) 064-3185" style — not an NGN format guests use.
    candidates.push({ input: trimmed, country: "US" });
  } else {
    const digits = trimmed.replace(/\D/g, "");
    if (digits.startsWith("234") && digits.length === 13) {
      candidates.push({ input: `+${digits}` });
    } else if (digits.length === 11 && digits.startsWith("0")) {
      candidates.push({ input: trimmed, country: "NG" });
    } else if (digits.length === 10) {
      // Missing the local trunk "0" — try NGN first, then fall back to US
      // in case it's a foreign number typed without punctuation.
      candidates.push({ input: `0${digits}`, country: "NG" });
      candidates.push({ input: digits, country: "US" });
    } else {
      candidates.push({ input: trimmed, country: "NG" });
    }
  }

  for (const { input, country } of candidates) {
    const parsed = parsePhoneNumberFromString(input, country);
    if (parsed?.isValid()) {
      const digits = parsed.number.replace("+", "");
      return { e164: parsed.number, whatsappId: `${digits}@c.us` };
    }
  }

  return null;
}
