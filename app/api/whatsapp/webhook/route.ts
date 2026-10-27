import { NextRequest, NextResponse } from "next/server";

/**
 * Meta's one-time handshake to confirm we own this URL before it starts
 * sending real webhook events. Must echo back hub.challenge as plain text
 * if hub.verify_token matches what's configured in the Meta App dashboard.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

/**
 * Delivery/read-receipt and inbound-message events from Meta. Not acted on
 * yet — just logged — since nothing in this project currently reads them.
 * Must always respond 200 quickly; Meta retries (and can eventually disable
 * the webhook) if it doesn't get one.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  console.log("[WhatsApp Webhook]", JSON.stringify(body));
  return NextResponse.json({ received: true });
}
