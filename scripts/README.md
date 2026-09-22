# WhatsApp invite sender

Standalone script (not part of the Next.js app) that pulls confirmed RSVPs
from Airtable, generates a personalized Access Card (QR code + name
composited onto a card template), and sends it to each guest over WhatsApp.

Safe to re-run: it only processes guests whose "Card Sent" is "Not yet",
and sets it to "Yes" immediately after a successful send.

## Structure

- `send-invites.ts` — entry point, orchestrates the run
- `config.ts` — layout, field-name, and delay constants (all overridable via `.env`)
- `lib/airtable.ts` — fetch pending guests / mark card sent
- `lib/phone.ts` — normalizes messy phone formats to E.164
- `lib/generateCard.ts` — composites the QR code + name onto the template
- `lib/ensureTemplate.ts` — generates a placeholder card template if none exists yet
- `lib/sendWhatsapp.ts` — whatsapp-web.js client + send
- `lib/utils.ts` — random delay, filename slugify

## One-time Airtable setup

Your `RSVPs` table already has `Name`, `Phone number`, and `Attending`
(written by the site's RSVP form). Before running this script, add two
more fields to that table:

1. **Card Sent** — single select, options "Not yet" / "Yes"
2. **Table Number** — text or number (leave blank for now; the script sends
   `"TBD"` in the QR payload until it's filled in, and the entrance scanner
   you'll build later will look up the live value by guest ID rather than
   trusting anything baked into the QR code)

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env` (repo root) — the Airtable values can be copied straight
from `.env.local`:

```
AIRTABLE_API_KEY=...
AIRTABLE_BASE_ID=...
AIRTABLE_TABLE_NAME=RSVPs
```

See `.env.example` for optional overrides (field names, delay range, view
name, custom card template path).

### Card template

On first run, if no template exists, the script auto-generates a
placeholder "Access Card" at `scripts/assets/card-template.png`
(1200×750) so the pipeline is runnable end-to-end. When you have the real
floral design:

1. Drop it at `scripts/assets/card-template.png` (same 1200×750), or point
   `CARD_TEMPLATE_PATH` in `.env` at it.
2. Adjust `QR_POSITION`, `NAME_POSITION`, `NAME_FONT_SIZE`, `NAME_COLOR` in
   `config.ts` to match where the blank area sits on your design.

## Running it

### Test with a single number first

Sends one card to a phone number of your choice, without touching
Airtable at all (no fetch, no `Card Sent` write) — use this to confirm
card generation and WhatsApp sending both work before running for real:

```bash
npm run send-invites -- --phone="+2348012345678" --name="Test Guest" --table="12"
```

`--name` and `--table` are optional (default to `"Test Guest"` / `"1"`)
and only affect what's printed on the card / encoded in the QR code.

### Full run

```bash
npm run send-invites
```

On the very first run, WhatsApp needs to confirm which account is allowed
to send through this script — same as linking WhatsApp Web on a browser.
How that confirmation happens depends on whether it's your own number or
someone else's:

- **Your own number, at this computer:** leave `WHATSAPP_SENDER_PHONE`
  unset. A QR code prints in the terminal — scan it from your phone:
  **WhatsApp → Linked Devices → Link a Device**.
- **Someone else's number (e.g. a friend sending on your behalf):** set
  `WHATSAPP_SENDER_PHONE` in `.env` to their number. Instead of a QR code,
  the terminal prints an 8-character **pairing code** (e.g. `ABCD-1234`).
  Send that code to them by any means (text, call it out, etc.) — they
  enter it on their own phone: **WhatsApp → Linked Devices → Link a
  Device → "Link with phone number instead"**. No image to transmit, no
  need for them to be at this computer. The code expires after ~3 minutes
  (it auto-regenerates if it does — just grab the newest one from the
  terminal).

Either way, the session is cached in `.wwebjs_auth/` (gitignored) after
the first successful login, so you won't need to repeat this on later
runs — as long as that folder sticks around and the phone stays linked.

The script then, for each pending guest:

1. Generates their card into `/output/<name>-<recordId>.png`
2. Sends it to their WhatsApp with a caption
3. Waits a random 3–8s (configurable) before the next guest
4. Ticks `Card Sent` in Airtable on success

Console output logs a ✅/⚠️/❌ line per guest and a summary at the end.
Guests with an unparseable phone number are skipped (not marked sent) —
fix the number in Airtable and re-run.

## Notes / caveats

- `whatsapp-web.js` drives WhatsApp Web via a real (headless) browser
  session under the hood — it's an unofficial client, not the WhatsApp
  Business API. Use a number you're comfortable having flagged if you send
  to a large list quickly; the randomized delay helps but isn't a
  guarantee.
- Phone parsing assumes Nigerian numbers by default and falls back to
  US-style parsing for numbers typed as `(NNN) NNN-NNNN`. Numbers in
  other formats/countries will be skipped with a warning — fix them in
  Airtable (e.g. add a leading `+<countrycode>`) and re-run.
- `npm install` pulls in Puppeteer (via whatsapp-web.js), which downloads
  a Chromium binary — expect the first install to take a few minutes.
