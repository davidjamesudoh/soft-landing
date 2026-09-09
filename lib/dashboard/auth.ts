import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "dashboard_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing DASHBOARD_SESSION_SECRET env var.");
  }
  return secret;
}

export async function verifyCredentials(email: string, password: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswordHashB64 = process.env.ADMIN_PASSWORD_HASH_B64;
  if (!adminEmail || !adminPasswordHashB64) {
    throw new Error("Missing ADMIN_EMAIL or ADMIN_PASSWORD_HASH_B64 env var.");
  }
  const adminPasswordHash = Buffer.from(adminPasswordHashB64, "base64").toString("utf8");

  // Constant-time email comparison so response timing can't leak whether
  // the email matched before even checking the password.
  const emailMatches =
    email.length === adminEmail.length &&
    crypto.timingSafeEqual(Buffer.from(email), Buffer.from(adminEmail));

  const passwordMatches = await bcrypt.compare(password, adminPasswordHash);
  return emailMatches && passwordMatches;
}

/** Stateless session token: no server-side session store needed. */
export function createSessionToken(): string {
  const expires = Date.now() + SESSION_TTL_MS;
  const signature = crypto.createHmac("sha256", getSecret()).update(String(expires)).digest("hex");
  return `${expires}.${signature}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expiresStr, signature] = token.split(".");
  if (!expiresStr || !signature) return false;

  const expected = crypto.createHmac("sha256", getSecret()).update(expiresStr).digest("hex");
  const signatureValid =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  return signatureValid && Date.now() < Number(expiresStr);
}

/** For API routes — the layout.tsx gate only protects page rendering, not routes. */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}
