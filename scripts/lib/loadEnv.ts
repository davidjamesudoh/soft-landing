import { config } from "dotenv";
import path from "node:path";

// Load .env first, then let .env.local (already used elsewhere in this
// project for Airtable creds) override it — same precedence Next.js uses.
// This must be its own module, imported before anything else, so it runs
// before config.ts reads process.env at import time.
const REPO_ROOT = path.resolve(__dirname, "..", "..");
config({ path: path.join(REPO_ROOT, ".env") });
config({ path: path.join(REPO_ROOT, ".env.local"), override: true });
