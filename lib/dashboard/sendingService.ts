/**
 * Thin client for the always-on WhatsApp trigger server (scripts/server.ts).
 * That service can't run on Vercel (needs a persistent headless-Chrome
 * session) — it's deployed separately, reached over the network via
 * TRIGGER_SERVER_URL. The shared secret never reaches the browser: it's
 * only used here, server-side, when the dashboard's API routes proxy to it.
 */
export async function callTriggerServer(
  path: string,
  options?: { method?: string; body?: unknown },
): Promise<{ status: number; data: unknown }> {
  const baseUrl = process.env.TRIGGER_SERVER_URL;
  const secret = process.env.TRIGGER_SECRET;
  if (!baseUrl || !secret) {
    throw new Error("Missing TRIGGER_SERVER_URL or TRIGGER_SECRET env var.");
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method: options?.method ?? "GET",
    headers: {
      "x-trigger-secret": secret,
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}
