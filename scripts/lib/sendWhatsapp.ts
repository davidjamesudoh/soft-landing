import fs from "node:fs";
import path from "node:path";
import qrcodeTerminal from "qrcode-terminal";
import { Client, LocalAuth, Message, MessageAck, MessageMedia } from "whatsapp-web.js";
import { WHATSAPP_SENDER_PHONE } from "../config";
import { log, warn } from "./log";
import { normalizePhone } from "./phone";

const PHASE = "WhatsApp";

/**
 * Thrown when we genuinely cannot tell whether a message sent — as
 * opposed to a normal Error, which means we're confident it did NOT send.
 * Callers (jobRunner) use this distinction to record an honest "unknown,
 * check manually" state in Airtable rather than leaving it looking
 * identical to "never attempted."
 */
export class InconclusiveSendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InconclusiveSendError";
  }
}

let client: Client | null = null;
let readyPromise: Promise<void> | null = null;

function formatPairingCode(code: string): string {
  return code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

function getClient(): Client {
  if (!client) {
    log(PHASE, "Launching browser session (this is the slow step on first run)...");

    const senderPhone = WHATSAPP_SENDER_PHONE
      ? normalizePhone(WHATSAPP_SENDER_PHONE)
      : null;
    if (WHATSAPP_SENDER_PHONE && !senderPhone) {
      throw new Error(
        `Could not parse WHATSAPP_SENDER_PHONE "${WHATSAPP_SENDER_PHONE}". Use a full number with country code.`,
      );
    }

    client = new Client({
      authStrategy: new LocalAuth({
        dataPath: path.resolve(__dirname, "..", "..", ".wwebjs_auth"),
      }),
      ...(senderPhone
        ? { pairWithPhoneNumber: { phoneNumber: senderPhone.e164.replace("+", "") } }
        : {}),
    });

    if (senderPhone) {
      client.on("code", (code) => {
        log(
          PHASE,
          `Pairing code for ${senderPhone.e164}: ${formatPairingCode(code)} ` +
            `— send this to whoever owns that number. On their phone: WhatsApp > Settings > Linked Devices > ` +
            `Link a Device > Link with phone number instead, then enter this code. Expires in ~3 minutes.`,
        );
      });
    } else {
      client.on("qr", (qr) => {
        log(PHASE, "QR code received — scan it with WhatsApp (Linked Devices) within 20s:");
        qrcodeTerminal.generate(qr, { small: true });
      });
    }

    client.on("loading_screen", (percent, message) => {
      log(PHASE, `Loading WhatsApp Web... ${percent}% (${message})`);
    });
    client.on("authenticated", () => log(PHASE, "Authenticated. Waiting for WhatsApp Web to load..."));
    client.on("auth_failure", (msg) => warn(PHASE, `Authentication failed: ${msg}`));
    client.on("change_state", (state) => log(PHASE, `State changed: ${state}`));
    client.on("disconnected", (reason) => warn(PHASE, `Disconnected: ${reason}`));
  }
  return client;
}

// WhatsApp Web's internal chat store keeps syncing for a bit after the
// "ready" event fires — sending too soon can make sendMessage() silently
// return undefined instead of a real message (see sendCard's retry loop).
const READY_SETTLE_MS = 8000;

/**
 * Initializes the client and resolves once it's ready to send messages.
 *
 * IMPORTANT: c.initialize() must be awaited/caught here. It returns a
 * Promise, and calling it fire-and-forget (as this used to) means any
 * rejection — e.g. Puppeteer failing to launch because a stale browser
 * lock is still held — becomes an unhandled promise rejection that
 * crashes the entire Node process, bypassing every try/catch in
 * jobRunner.ts entirely. That happened for real: a reconnect after a
 * detached-frame error hit exactly this and took the whole trigger
 * server down mid-run.
 */
export function waitForReady(): Promise<void> {
  const c = getClient();
  if (!readyPromise) {
    readyPromise = new Promise((resolve, reject) => {
      c.on("ready", async () => {
        log(PHASE, "Client ready. Giving WhatsApp Web a few seconds to finish syncing...");
        await new Promise((r) => setTimeout(r, READY_SETTLE_MS));
        log(PHASE, "Ready to send.");
        resolve();
      });
      c.initialize().catch((err) => {
        readyPromise = null; // don't leave a rejected promise cached — allow a later retry to start clean
        reject(err);
      });
    });
  }
  return readyPromise;
}

/**
 * Resolves once WhatsApp's servers acknowledge the message (ack >= ACK_SERVER),
 * or after timeoutMs with whatever ack level was last seen. sendMessage()
 * resolving on its own only means the message left this browser session —
 * it does NOT mean WhatsApp accepted or delivered it.
 */
function waitForServerAck(c: Client, messageId: string, timeoutMs: number): Promise<MessageAck> {
  return new Promise((resolve) => {
    let done = false;
    const handler = (msg: Message, ack: MessageAck) => {
      if (msg.id._serialized !== messageId) return;
      if (ack >= MessageAck.ACK_SERVER || ack === MessageAck.ACK_ERROR) {
        done = true;
        c.off("message_ack", handler);
        clearTimeout(timer);
        resolve(ack);
      }
    };
    c.on("message_ack", handler);
    const timer = setTimeout(() => {
      if (!done) {
        c.off("message_ack", handler);
        resolve(MessageAck.ACK_PENDING);
      }
    }, timeoutMs);
  });
}

/**
 * whatsapp-web.js's sendMessage() can return undefined (no error thrown)
 * even when the message actually went out — a known sync glitch in the
 * chat store, seen in practice within ~10s of a fresh "ready" event.
 *
 * IMPORTANT: never resend on that undefined result. Resending is not
 * safe here — sendMessage() failing to hand back a confirmation object
 * does not mean nothing was sent, so calling it a second time can
 * deliver a real duplicate message to the guest (this happened). Instead,
 * check the chat directly (read-only) to see if the message is actually
 * there before deciding whether it's safe to treat this as a failure.
 */
async function sendMessageOnce(
  c: Client,
  chatId: string,
  content: string | MessageMedia,
  options?: { caption?: string },
): Promise<Message> {
  const result = await c.sendMessage(chatId, content, options);
  if (result) return result;

  warn(
    PHASE,
    "WhatsApp Web returned no result for this send — checking the chat directly " +
      "instead of resending (resending here could duplicate a message that already went out)...",
  );
  await new Promise((r) => setTimeout(r, 3000));

  // The chat-history check itself can flake (WhatsApp Web's own minified
  // internals occasionally throw near-empty errors from page.evaluate).
  // Retry ONLY that failure mode a few times — if the check instead
  // succeeds and confidently finds nothing recent, that's a conclusive
  // "did not send" and we act on it immediately, no retry needed.
  const VERIFY_ATTEMPTS = 3;
  let lastVerifyError: unknown;

  for (let attempt = 1; attempt <= VERIFY_ATTEMPTS; attempt++) {
    let chat: Awaited<ReturnType<Client["getChatById"]>>;
    let recent: Message[];
    try {
      chat = await c.getChatById(chatId);
      recent = await chat.fetchMessages({ limit: 1, fromMe: true });
    } catch (err) {
      lastVerifyError = err;
      if (attempt < VERIFY_ATTEMPTS) {
        warn(PHASE, `Chat-history check failed (attempt ${attempt}/${VERIFY_ATTEMPTS}), retrying in 3s...`);
        await new Promise((r) => setTimeout(r, 3000));
      }
      continue;
    }

    const last = recent[0];
    const sentJustNow = last && Date.now() / 1000 - last.timestamp < 30;
    if (sentJustNow) {
      log(PHASE, "Confirmed via chat history: the message did go out despite no direct confirmation.");
      return last;
    }
    throw new Error(
      "WhatsApp Web didn't confirm the send, and no matching recent message was found in the chat — " +
        "it most likely did NOT go out. Safe to re-run for this guest.",
    );
  }

  throw new InconclusiveSendError(
    `Couldn't verify whether the message actually sent — WhatsApp Web's chat-history check itself ` +
      `kept failing after ${VERIFY_ATTEMPTS} attempts (${lastVerifyError instanceof Error ? lastVerifyError.message : String(lastVerifyError)}). ` +
      `This is inconclusive, not a confirmed failure: check this guest's WhatsApp chat manually before ` +
      `deciding whether to re-run — resending if it already went out would duplicate it.`,
  );
}

async function sendAndConfirm(
  e164Phone: string,
  content: string | MessageMedia,
  options?: { caption?: string },
): Promise<void> {
  const c = getClient();
  const digits = e164Phone.replace("+", "");

  log(PHASE, `Checking ${e164Phone} is registered on WhatsApp...`);
  const numberId = await c.getNumberId(digits);
  if (!numberId) {
    throw new Error(`${e164Phone} is not registered on WhatsApp.`);
  }

  log(PHASE, `Sending message to ${e164Phone}...`);
  const message = await sendMessageOnce(c, numberId._serialized, content, options);

  const ack = await waitForServerAck(c, message.id._serialized, 15000);
  if (ack === MessageAck.ACK_ERROR) {
    throw new Error(`WhatsApp rejected the message to ${e164Phone} (ack error).`);
  }
  if (ack < MessageAck.ACK_SERVER) {
    warn(
      PHASE,
      `Message to ${e164Phone} left the browser but WhatsApp hasn't confirmed receipt after 15s ` +
        `(it may not actually arrive). This is common right after linking a brand-new device — try ` +
        `waiting a minute or two after login before sending, then re-test.`,
    );
    return;
  }
  log(PHASE, `Message to ${e164Phone} confirmed received by WhatsApp's servers.`);
}

export async function sendCard(e164Phone: string, imagePath: string, caption: string): Promise<void> {
  const media = MessageMedia.fromFilePath(imagePath);
  await sendAndConfirm(e164Phone, media, { caption });
}

/** Plain text message — used for reminders and the thank-you message (no card image). */
export async function sendText(e164Phone: string, text: string): Promise<void> {
  await sendAndConfirm(e164Phone, text);
}

export async function destroyClient(): Promise<void> {
  if (client) {
    log(PHASE, "Closing browser session...");
    await client.destroy();
  }
}

/**
 * True for Puppeteer/browser-connection-layer failures (the underlying
 * Chrome page reloaded, crashed, or its frame got torn down mid-operation)
 * — as opposed to WhatsApp-level failures like an unregistered number.
 * These leave the client unusable for any further sends until reconnected.
 */
export function isRecoverableBrowserError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /detached frame|session closed|target closed|execution context was destroyed|protocol error/i.test(
    message,
  );
}

function clearStaleBrowserLock(): void {
  const lockPath = path.resolve(__dirname, "..", "..", ".wwebjs_auth", "session", "SingletonLock");
  try {
    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
      warn(PHASE, "Removed a stale browser profile lock before relaunching.");
    }
  } catch {
    // Best effort — if this fails, the launch attempt below will surface a clear error anyway.
  }
}

/**
 * Tears down and re-initializes the client after a browser-layer error.
 * Reuses the persisted session (.wwebjs_auth), so this does NOT require
 * re-scanning a QR code or re-entering a pairing code — WhatsApp just
 * reconnects. Does not resend anything itself; callers decide what (if
 * anything) to retry, per the same no-blind-resend rule as sendMessageOnce.
 */
export async function reconnectClient(): Promise<void> {
  warn(PHASE, "Reconnecting WhatsApp client after a browser-level error...");
  const oldClient = client;
  client = null;
  readyPromise = null;
  if (oldClient) {
    await oldClient.destroy().catch(() => {});
  }
  // destroy() only closes the browser if it still reports itself as
  // connected — after the kind of crash that triggers a reconnect, it
  // often doesn't, so the old Chrome profile lock is left behind and the
  // next launch fails with "browser is already running". Clear it
  // defensively; harmless no-op if nothing's actually there.
  clearStaleBrowserLock();
  await waitForReady();
  log(PHASE, "WhatsApp client reconnected.");
}
