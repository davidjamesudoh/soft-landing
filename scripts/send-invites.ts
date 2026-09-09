import "./lib/loadEnv";
import fs from "node:fs";
import path from "node:path";
import { fetchGuestsPendingCard, markCardSent, type Guest } from "./lib/airtable";
import { generateCard } from "./lib/generateCard";
import { log, warn, error as logError } from "./lib/log";
import { normalizePhone } from "./lib/phone";
import { destroyClient, sendCard, waitForReady } from "./lib/sendWhatsapp";
import { randomDelay, slugify } from "./lib/utils";
import { CAPTION, MAX_DELAY_MS, MIN_DELAY_MS, OUTPUT_DIR } from "./config";

const PHASE = "Run";

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const prefix = `--${flag}=`;
    const found = args.find((a) => a.startsWith(prefix));
    return found?.slice(prefix.length);
  };
  return {
    testPhone: get("phone"),
    testName: get("name") || "Test Guest",
    testTable: get("table") || "1",
  };
}

type SendResult = "sent" | "skipped" | "failed";

async function processGuest(guest: Guest, { markSent }: { markSent: boolean }): Promise<SendResult> {
  const phone = normalizePhone(guest.phone);
  if (!phone) {
    warn(PHASE, `Skipped ${guest.name}: could not parse phone number "${guest.phone}". Fix it and re-run.`);
    return "skipped";
  }

  try {
    const outputPath = path.join(OUTPUT_DIR, `${slugify(guest.name)}-${guest.id}.png`);
    await generateCard(guest, outputPath);
    await sendCard(phone.e164, outputPath, CAPTION(guest.name));
    if (markSent) {
      await markCardSent(guest.id);
    }
    log(PHASE, `✅ Done: ${guest.name} (${phone.e164})`);
    return "sent";
  } catch (err) {
    logError(PHASE, `Failed for ${guest.name}: ${err instanceof Error ? err.message : err}`);
    return "failed";
  }
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const { testPhone, testName, testTable } = parseArgs();

  if (testPhone) {
    log(PHASE, `Test mode: sending one card to ${testPhone}. Airtable will not be touched.`);
    await waitForReady();
    const result = await processGuest(
      { id: `TEST-${Date.now()}`, name: testName, phone: testPhone, tableNumber: testTable },
      { markSent: false },
    );
    log(PHASE, `Test result: ${result}`);
    return;
  }

  log(PHASE, "Fetching confirmed guests awaiting a card from Airtable...");
  const guests = await fetchGuestsPendingCard();

  if (guests.length === 0) {
    log(PHASE, "Nothing to send — no confirmed guests are pending a card.");
    return;
  }

  await waitForReady();

  const results: Record<SendResult, number> = { sent: 0, skipped: 0, failed: 0 };

  for (const [index, guest] of guests.entries()) {
    log(PHASE, `--- Guest ${index + 1}/${guests.length}: ${guest.name} ---`);
    const result = await processGuest(guest, { markSent: true });
    results[result]++;

    if (index < guests.length - 1) {
      await randomDelay(MIN_DELAY_MS, MAX_DELAY_MS);
    }
  }

  log(
    PHASE,
    `Done. Sent: ${results.sent}, Skipped: ${results.skipped}, Failed: ${results.failed}`,
  );
}

main()
  .catch((err) => {
    logError(PHASE, `Fatal error: ${err instanceof Error ? err.stack || err.message : err}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await destroyClient();
    process.exit(process.exitCode ?? 0);
  });
