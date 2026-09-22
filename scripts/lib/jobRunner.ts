import path from "node:path";
import {
  CAPTION,
  CARD_SENT_YES_VALUE,
  MAX_DELAY_MS,
  MIN_DELAY_MS,
  OUTPUT_DIR,
  REMINDER_MESSAGES,
  REMINDER_STAGES,
  THANK_YOU_MESSAGE,
  THANK_YOU_SENT_FIELD,
} from "../config";
import {
  appendSendNote,
  fetchGuestsByIds,
  fetchGuestsPendingCard,
  fetchGuestsPendingField,
  markCardSent,
  markFieldSent,
  type Guest,
} from "./airtable";
import { generateCard } from "./generateCard";
import { log } from "./log";
import { normalizePhone } from "./phone";
import {
  InconclusiveSendError,
  isRecoverableBrowserError,
  reconnectClient,
  sendCard,
  sendText,
  type SentCallback,
  waitForReady,
} from "./sendWhatsapp";
import { randomDelay, slugify } from "./utils";

const PHASE = "Job";

export type JobAction =
  | { type: "card" }
  | { type: "reminder"; stage: string }
  | { type: "thankyou" };

export interface JobStatus {
  running: boolean;
  action: JobAction | null;
  total: number;
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  /** Sent-but-couldn't-verify — deliberately NOT counted as failed. See InconclusiveSendError. */
  unconfirmed: number;
  currentGuest: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  recentLog: string[];
}

let status: JobStatus = {
  running: false,
  action: null,
  total: 0,
  processed: 0,
  sent: 0,
  skipped: 0,
  failed: 0,
  unconfirmed: 0,
  currentGuest: null,
  startedAt: null,
  finishedAt: null,
  recentLog: [],
};

export function getStatus(): JobStatus {
  return { ...status };
}

function pushLog(line: string) {
  status.recentLog = [...status.recentLog.slice(-49), line];
  log(PHASE, line);
}

function actionLabel(action: JobAction): string {
  if (action.type === "card") return "Access Card";
  if (action.type === "reminder") return `Reminder (${action.stage})`;
  return "Thank You";
}

/** Reminder/thank-you tracking field name — not used for "card", which has its own markCardSent(). */
function trackingField(action: { type: "reminder"; stage: string } | { type: "thankyou" }): string {
  if (action.type === "reminder") {
    const stage = REMINDER_STAGES.find((s) => s.key === action.stage);
    if (!stage) throw new Error(`Unknown reminder stage "${action.stage}"`);
    return stage.fieldName;
  }
  return THANK_YOU_SENT_FIELD;
}

function markActionSent(guest: Guest, action: JobAction): Promise<void> {
  return action.type === "card" ? markCardSent(guest.id) : markFieldSent(guest.id, trackingField(action));
}

/**
 * Starts a send job in the background and returns immediately — the
 * caller (an HTTP handler) shouldn't block on a run that can take minutes.
 * Poll getStatus() for progress. Refuses to start a second job while one
 * is already running (double-trigger guard).
 */
export async function runJob(
  action: JobAction,
  guestIds?: string[],
): Promise<{ ok: boolean; message: string }> {
  if (status.running) {
    return { ok: false, message: "A job is already running — wait for it to finish." };
  }

  let guests: Guest[];
  try {
    if (guestIds && guestIds.length > 0) {
      // Explicit manual selection overrides the "pending" filter — an
      // admin selecting specific guests is deliberately choosing to
      // (re)send to them regardless of current status.
      guests = await fetchGuestsByIds(guestIds);
    } else if (action.type === "card") {
      guests = await fetchGuestsPendingCard();
    } else if (action.type === "reminder") {
      const stage = REMINDER_STAGES.find((s) => s.key === action.stage);
      if (!stage) throw new Error(`Unknown reminder stage "${action.stage}"`);
      guests = await fetchGuestsPendingField(stage.fieldName);
    } else {
      guests = await fetchGuestsPendingField(THANK_YOU_SENT_FIELD);
    }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }

  // fetchGuestsPendingCard() already excludes already-sent guests, but a
  // manual dashboard selection bypasses that filter by design (so an admin
  // can deliberately resend a reminder/thank-you to specific people). Cards
  // are the one case that must never be resent even on manual selection —
  // a duplicate card is a duplicate WhatsApp message to a real guest, not
  // just a redundant no-op — so this is enforced as a hard floor regardless
  // of how the guest list was selected.
  if (action.type === "card") {
    const alreadySent = guests.filter((g) => g.cardSent === CARD_SENT_YES_VALUE);
    guests = guests.filter((g) => g.cardSent !== CARD_SENT_YES_VALUE);
    for (const g of alreadySent) {
      log(PHASE, `Skipping ${g.name}: card already sent.`);
    }
  }

  if (guests.length === 0) {
    return { ok: true, message: `Nothing to send for ${actionLabel(action)} — no matching guests.` };
  }

  status = {
    running: true,
    action,
    total: guests.length,
    processed: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    unconfirmed: 0,
    currentGuest: null,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    recentLog: [],
  };

  processGuests(guests, action)
    .catch((err) => {
      pushLog(`Fatal: ${err instanceof Error ? err.message : String(err)}`);
    })
    .finally(() => {
      status.running = false;
      status.currentGuest = null;
      status.finishedAt = new Date().toISOString();
    });

  return { ok: true, message: `Started ${actionLabel(action)}: ${guests.length} guest(s) queued.` };
}

async function processGuests(guests: Guest[], action: JobAction): Promise<void> {
  await waitForReady();

  for (const [index, guest] of guests.entries()) {
    status.currentGuest = guest.name;

    const phone = normalizePhone(guest.phone);
    if (!phone) {
      status.skipped++;
      pushLog(`⚠️  Skipped ${guest.name}: could not parse phone number "${guest.phone}".`);
    } else {
      // Fires from inside sendWhatsapp.ts the instant a message is known
      // to have gone out (confirmed, or inconclusive-but-probably-sent) —
      // well before the 15s server-ack wait, sending itself. Marking
      // Airtable this early (rather than after sendOne() fully returns)
      // is what actually prevents the "sent but never marked, resent as a
      // duplicate on the next run" failure mode seen in practice.
      const onSent: SentCallback = async (confirmed) => {
        try {
          await markActionSent(guest, action);
        } catch (markErr) {
          pushLog(
            `❌ Message to ${guest.name} sent, but failed to mark it in Airtable — fix this manually: ` +
              `${markErr instanceof Error ? markErr.message : markErr}`,
          );
        }
        if (!confirmed) {
          try {
            await appendSendNote(guest.id, `${actionLabel(action)}: sent (unconfirmed)`);
          } catch (noteErr) {
            pushLog(
              `❌ Also failed to write the Airtable note for ${guest.name}: ` +
                `${noteErr instanceof Error ? noteErr.message : noteErr}`,
            );
          }
        }
      };

      try {
        await sendOne(guest, phone.e164, action, onSent);
        status.sent++;
        pushLog(`✅ Sent (${actionLabel(action)}) to ${guest.name}`);
      } catch (err) {
        if (err instanceof InconclusiveSendError) {
          // sendMessageOnce's verification step couldn't confirm this one
          // way or the other — but every real-world case observed so far
          // (repeated manual checks against actual WhatsApp) has turned
          // out to be a genuine send, so onSent(false) above already
          // marked it sent rather than making the admin manually fix every
          // ambiguous case. Still tracked as a distinct "unconfirmed"
          // count (not silently merged into normal sends), in case this
          // pattern is ever wrong for a particular guest.
          status.unconfirmed++;
          pushLog(
            `⚠️  Unconfirmed (${actionLabel(action)}) for ${guest.name}: ${err.message} ` +
              `— marked as sent anyway (this verification failure has consistently meant it did send).`,
          );
        } else {
          status.failed++;
          pushLog(`❌ Failed (${actionLabel(action)}) for ${guest.name}: ${err instanceof Error ? err.message : err}`);

          if (isRecoverableBrowserError(err)) {
            // The browser session broke mid-send — without reconnecting,
            // every remaining guest in this batch would fail the same way.
            // We do NOT retry this guest automatically: the error came from
            // the Puppeteer/connection layer (not the "ambiguous result"
            // path sendMessageOnce already verifies against chat history),
            // so we can't be sure whether it actually sent before breaking.
            // Safe path: mark this one failed, reconnect, keep going —
            // the admin can re-select just this guest afterward.
            pushLog(`⚠️  Browser-level error detected — reconnecting WhatsApp before continuing...`);
            try {
              await reconnectClient();
            } catch (reconnectErr) {
              pushLog(
                `❌ Reconnect failed: ${reconnectErr instanceof Error ? reconnectErr.message : reconnectErr}. ` +
                  `Stopping this run — restart the trigger server.`,
              );
              break;
            }
          }
        }
      }
    }

    status.processed++;
    if (index < guests.length - 1) {
      await randomDelay(MIN_DELAY_MS, MAX_DELAY_MS);
    }
  }
}

/** onSent marks Airtable as soon as sendWhatsapp.ts knows the message went out — see processGuests. */
async function sendOne(
  guest: Guest,
  e164Phone: string,
  action: JobAction,
  onSent: SentCallback,
): Promise<void> {
  if (action.type === "card") {
    const outputPath = path.join(OUTPUT_DIR, `${slugify(guest.name)}-${guest.id}.png`);
    await generateCard(guest, outputPath);
    await sendCard(e164Phone, outputPath, CAPTION(guest.name), onSent);
    return;
  }

  if (action.type === "reminder") {
    const stage = REMINDER_STAGES.find((s) => s.key === action.stage);
    if (!stage) throw new Error(`Unknown reminder stage "${action.stage}"`);
    const text = REMINDER_MESSAGES[stage.key](guest.name);
    await sendText(e164Phone, text, onSent);
    return;
  }

  await sendText(e164Phone, THANK_YOU_MESSAGE(guest.name), onSent);
}
