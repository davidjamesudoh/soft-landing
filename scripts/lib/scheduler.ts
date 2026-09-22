import { EVENT_DATE, REMINDER_STAGES } from "../config";
import { runJob } from "./jobRunner";
import { log, error as logError } from "./log";

const PHASE = "Scheduler";
const LAGOS_TZ = "Africa/Lagos";
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly

function lagosDateString(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: LAGOS_TZ }); // "YYYY-MM-DD"
}

function stageTargetDateString(daysBefore: number): string {
  const eventDate = new Date(EVENT_DATE);
  const target = new Date(eventDate.getTime() - daysBefore * 24 * 60 * 60 * 1000);
  return lagosDateString(target);
}

/**
 * Fires the reminder job for any stage whose target date is today (Lagos
 * time). Safe to call repeatedly / on overlapping schedules — runJob()
 * refuses to start a second job while one's in progress, and even a
 * same-day re-check is a no-op in practice because fetchGuestsPendingField
 * only returns guests who haven't gotten that stage yet.
 */
async function checkDueReminders(): Promise<void> {
  const today = lagosDateString(new Date());

  for (const stage of REMINDER_STAGES) {
    if (stageTargetDateString(stage.daysBefore) !== today) continue;

    log(PHASE, `Today (${today}) matches reminder stage "${stage.key}" — auto-triggering...`);
    const result = await runJob({ type: "reminder", stage: stage.key });
    log(PHASE, `Auto-trigger result for "${stage.key}": ${result.message}`);
  }
}

export function startScheduler(): void {
  const run = () => {
    checkDueReminders().catch((err) =>
      logError(PHASE, `Scheduled check failed: ${err instanceof Error ? err.message : err}`),
    );
  };

  run(); // check immediately on boot, in case the server was down at the exact right moment
  setInterval(run, CHECK_INTERVAL_MS);
  log(PHASE, `Auto-reminder scheduler started (checks hourly, timezone ${LAGOS_TZ}).`);
}
