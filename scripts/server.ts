import "./lib/loadEnv";
import crypto from "node:crypto";
import http from "node:http";
import { REMINDER_STAGES } from "./config";
import { getStatus, runJob } from "./lib/jobRunner";
import { log, error as logError } from "./lib/log";
import { startScheduler } from "./lib/scheduler";
import { destroyClient, waitForReady } from "./lib/sendWhatsapp";

const PHASE = "Server";
const PORT = Number(process.env.TRIGGER_SERVER_PORT || 4000);

function checkAuth(req: http.IncomingMessage): boolean {
  const secret = process.env.TRIGGER_SECRET;
  if (!secret) throw new Error("Missing TRIGGER_SECRET env var.");

  const provided = req.headers["x-trigger-secret"];
  if (typeof provided !== "string") return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function readJsonBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  try {
    if (!checkAuth(req)) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    if (req.url === "/status" && req.method === "GET") {
      sendJson(res, 200, getStatus());
      return;
    }

    if (req.url === "/trigger/card" && req.method === "POST") {
      const body = await readJsonBody(req);
      const result = await runJob({ type: "card" }, body.guestIds as string[] | undefined);
      sendJson(res, result.ok ? 200 : 409, result);
      return;
    }

    if (req.url === "/trigger/reminder" && req.method === "POST") {
      const body = await readJsonBody(req);
      const stage = body.stage as string;
      if (!REMINDER_STAGES.some((s) => s.key === stage)) {
        sendJson(res, 400, { error: `Unknown reminder stage "${stage}"` });
        return;
      }
      const result = await runJob({ type: "reminder", stage }, body.guestIds as string[] | undefined);
      sendJson(res, result.ok ? 200 : 409, result);
      return;
    }

    if (req.url === "/trigger/thankyou" && req.method === "POST") {
      const body = await readJsonBody(req);
      const result = await runJob({ type: "thankyou" }, body.guestIds as string[] | undefined);
      sendJson(res, result.ok ? 200 : 409, result);
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (err) {
    logError(PHASE, err instanceof Error ? err.message : String(err));
    sendJson(res, 500, { error: err instanceof Error ? err.message : "Internal error" });
  }
});

async function main() {
  log(PHASE, "Starting WhatsApp client...");
  await waitForReady();
  log(PHASE, "WhatsApp client ready.");

  server.listen(PORT, () => {
    log(PHASE, `Listening on http://localhost:${PORT}`);
  });

  startScheduler();
}

main().catch((err) => {
  logError(PHASE, `Fatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});

process.on("SIGINT", async () => {
  log(PHASE, "Shutting down...");
  await destroyClient();
  process.exit(0);
});
