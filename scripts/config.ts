import path from "node:path";

// Card template & layout for the real lace-border "Tomini & David" invite
// card (portrait, 1679x2382). Positions below were measured pixel-exact
// off scripts/assets/card-reference.png (a design mockup with a visible
// pink guide box + example name/table) via automated color-run detection
// — not eyeballed. That reference file's own guide box/text aren't part
// of the actual CARD_TEMPLATE_PATH art; it was only used to derive these
// numbers. If the design changes, re-measure rather than guessing by eye.
export const CARD_TEMPLATE_PATH =
  process.env.CARD_TEMPLATE_PATH ||
  path.resolve(__dirname, "assets", "card-template.png");

export const CARD_WIDTH = 1679;
export const CARD_HEIGHT = 2382;

// Measured guide box: left=584, top=834, width=510, height=482. QR is
// square, so it's sized to the limiting (shorter) dimension with a little
// padding, then centered within that box.
export const QR_SIZE = 460;
export const QR_POSITION = { top: 845, left: 609 };
// QR module colors — inverted from the usual black-on-white to match the brand palette.
export const QR_DARK_COLOR = "#ffffff";
export const QR_LIGHT_COLOR = "#c1335e";

// Measured name text vertical center: y=1450. The oval interior at that
// row measures ~1064-1079px wide; NAME_MAX_WIDTH stays safely inside that
// curve. Long names auto-shrink (never wrap) to fit within it — see
// lib/generateCard.ts — down to NAME_MIN_FONT_SIZE before anything would
// actually overflow the card.
export const NAME_POSITION = {
  top: 1385,
  left: 0,
  width: CARD_WIDTH,
  height: 90,
};
export const NAME_FONT_SIZE = 72;
export const NAME_MIN_FONT_SIZE = 34;
export const NAME_MAX_WIDTH = 950;
export const NAME_LETTER_SPACING = 1;
export const NAME_COLOR = "#a0972a";

// Measured badge: x=[731,947] (width 216), y=[1506,1560] (height 54).
// top nudged down from the measured 1498 to add breathing room below the
// name (there's ~82px of spare oval space before the venue script begins,
// so this stays safely clear of it).
export const TABLE_POSITION = {
  top: 1480,
  left: 0,
  width: CARD_WIDTH,
  height: 70,
};
export const TABLE_FONT_SIZE = 50;
export const TABLE_MIN_FONT_SIZE = 24;
export const TABLE_TEXT_COLOR = "#fefaf5";
export const TABLE_BADGE_COLOR = "#c1335e";
export const TABLE_BADGE_WIDTH = 316;
export const TABLE_BADGE_HEIGHT = 68;

// Special table-number display overrides — e.g. named "high tables" that
// should show a label instead of "TABLE ##". Keyed by the exact Table
// Number value as stored in Airtable. These labels are longer than a
// normal "TABLE 03", so generateCard.ts auto-shrinks the badge font (down
// to TABLE_MIN_FONT_SIZE) to keep them inside the same fixed badge width
// rather than resizing the badge itself.
export const SPECIAL_TABLE_LABELS: Record<string, string> = {
  "102": "HIGH TABLE (G)",
  "0": "HIGH TABLE (B)",
  "100": "BRIDE & GROOM",
};

// Both name and table text are set in DM Sans Bold (matching the site's
// own font, app/layout.tsx). sharp's SVG renderer doesn't reliably see
// fonts installed on the OS, so the font file is embedded directly into
// each generated SVG via @font-face — see lib/generateCard.ts.
export const DM_SANS_FONT_PATH = path.resolve(
  __dirname,
  "assets",
  "DMSans-Bold.ttf",
);
export const CARD_FONT_FAMILY = "DM Sans";

export const OUTPUT_DIR = path.resolve(__dirname, "..", "output");

// Airtable field names — override via .env if your base uses different names.
export const NAME_FIELD = process.env.NAME_FIELD || "Name";
export const PHONE_FIELD = process.env.PHONE_FIELD || "Phone number";
export const ATTENDING_FIELD = process.env.ATTENDING_FIELD || "Attending";
// Matches the exact value written by the RSVP form (components/rsvpForm/schema.ts).
export const ATTENDING_YES_VALUE =
  process.env.ATTENDING_YES_VALUE || "Yes! Wouldn’t miss it for anything";
// "Card Sent" is a single-select field with options "Not yet" / "Yes"
// (not a checkbox).
export const CARD_SENT_FIELD = process.env.CARD_SENT_FIELD || "Card Sent";
export const CARD_SENT_YES_VALUE = "Yes";
export const CARD_SENT_NOT_YET_VALUE = "Not yet";
export const TABLE_NUMBER_FIELD =
  process.env.TABLE_NUMBER_FIELD || "Table Number";
export const AIRTABLE_VIEW_NAME = process.env.AIRTABLE_VIEW_NAME || undefined;

// Long-text field for outcomes that don't fit "Not yet"/"Yes" — e.g. a
// send that couldn't be confirmed either way. Requires a "Notes" (long
// text) field on the Airtable table.
export const SEND_NOTES_FIELD = process.env.SEND_NOTES_FIELD || "Notes";

export const MIN_DELAY_MS = Number(process.env.MIN_DELAY_MS || 3000);
export const MAX_DELAY_MS = Number(process.env.MAX_DELAY_MS || 8000);

// The WhatsApp account that will actually send the invites (e.g. your
// friend's number). When set, login uses a pairing code (type this into
// WhatsApp > Linked Devices > Link with phone number) instead of a QR
// scan — much easier to hand off to someone who isn't at this computer.
// Any format normalizePhone() understands works (e.g. "0801..." or "+234...").
export const WHATSAPP_SENDER_PHONE =
  process.env.WHATSAPP_SENDER_PHONE || undefined;

export const CAPTION = (name: string) =>
  `Tomini Adebayo & David James Udoh Wedding 💍

Dear ${name},

We're so happy to have you join us on October 30, 2026, at Stadplus Event Centre, XPRESS HOUSE, Off Otunba Jobi Fele Way, CBD, Alausa, Ikeja, Lagos State.

🕐 Reception starts at 1PM, kindly be seated by then.

Attached is your personal e-access card, just for you, one use only, and non-transferable once scanned. Please keep it and your QR code safe for entry.

We know your presence is a gift, and honestly? We couldn't agree more. But if your heart is feeling extra generous, we won't say no! Take a peek at our registry: https://www.softlanding.fyi/#registry

Also, we love your little ones, but this will be a grown-ups-only celebration 🙂 We hope you can still make it! 

We can't wait to celebrate with you! 🥂

With love,
Tomini & David`;

// Event date/time in Lagos (WAT, UTC+1, no DST).
export const EVENT_DATE = "2026-10-30T13:00:00+01:00";

export interface ReminderStage {
  key: string;
  label: string;
  fieldName: string;
}

// Previously a staged 30d/14d/7d/3d/1d/morning-of sequence, auto-fired by
// scripts/lib/scheduler.ts on matching dates. Replaced with a single,
// manually-triggered reminder — requires a "First Reminder Sent" field
// (single select, "Not yet"/"Yes") on the Airtable table.
export const REMINDER_STAGES: ReminderStage[] = [
  {
    key: "reminder",
    label: "Reminder",
    fieldName: "First Reminder Sent",
  },
];

export const THANK_YOU_SENT_FIELD = "Thank You Sent";

export const REMINDER_MESSAGES: Record<string, (name: string) => string> = {
  reminder: (name) =>
    `Tomini & David's Wedding 💍

Dear ${name},

A reminder that Tomini & David's big day is on October 30, 2026.

Reception: 1PM
Guest colour of the day: White and Coral

Please save your e-access card on your phone. It has the QR code, Table number and venue, and admits only you.

Kindly note, no children or plus one please.

See you soon! 🥂`,
};

export const THANK_YOU_MESSAGE = (name: string) =>
  `Dear ${name},

Thank you for being part of our #SoftLanding 💍

Having you there meant so much to us. Every hug, every smile, every dance, we felt all of it, and it made our day even more special. We are so grateful you chose to share this moment with us.

We are truly blessed to have people like you in our lives. Thank you for the love, the prayers, and the memories.

With all our love,
Tomini & David 🥂`;
