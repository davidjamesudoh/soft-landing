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
  top: 1405,
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
export const TABLE_POSITION = {
  top: 1498,
  left: 0,
  width: CARD_WIDTH,
  height: 70,
};
export const TABLE_FONT_SIZE = 50;
export const TABLE_TEXT_COLOR = "#fefaf5";
export const TABLE_BADGE_COLOR = "#c1335e";
export const TABLE_BADGE_WIDTH = 316;
export const TABLE_BADGE_HEIGHT = 68;

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
  `Dear ${name},

Thank you for saying yes! We're so happy you'll be with us on October 30, 2026, at Stadplus Event Centre, XPRESS HOUSE, Off Otunba Jobi Fele Way, CBD, Alausa, Ikeja, Lagos State, Nigeria by 1PM.

Attached is your personal e-access card. It's just for you, one use only and can't be shared or reused once scanned. Please keep it safe.

Keep your QR code close by for entry.

We know your presence is a gift, and honestly? We couldn't agree more. But if your heart is feeling extra generous, we won't say no! Take a peek at our registry: https://www.softlanding.fyi/#registry

We can't wait for you to be part of our #SoftLanding. See you there! 🥂

With love,
Tomini & David`;

// Event date/time in Lagos (WAT, UTC+1, no DST) — used by the reminder
// auto-scheduler to compute days-until-event.
export const EVENT_DATE = "2026-10-30T13:00:00+01:00";

export interface ReminderStage {
  key: string;
  label: string;
  /** Days before EVENT_DATE this stage fires. 0 = morning-of. */
  daysBefore: number;
  fieldName: string;
}

// Requires a "Reminder 14d Sent" field (single select, "Not yet"/"Yes")
// on the Airtable table, matching the other reminder-stage fields.
export const REMINDER_STAGES: ReminderStage[] = [
  { key: "30d", label: "30 days to go", daysBefore: 30, fieldName: "Reminder 30d Sent" },
  { key: "14d", label: "2 weeks to go", daysBefore: 14, fieldName: "Reminder 14d Sent" },
  { key: "7d", label: "7 days to go", daysBefore: 7, fieldName: "Reminder 7d Sent" },
  { key: "3d", label: "3 days to go", daysBefore: 3, fieldName: "Reminder 3d Sent" },
  { key: "1d", label: "1 day to go", daysBefore: 1, fieldName: "Reminder 1d Sent" },
  { key: "morning", label: "Morning of", daysBefore: 0, fieldName: "Reminder Morning Sent" },
];

export const THANK_YOU_SENT_FIELD = "Thank You Sent";

export const REMINDER_MESSAGES: Record<string, (name: string) => string> = {
  "30d": (name) =>
    `Dear ${name},

30 days to go! 💍 We're counting down to our #SoftLanding on *October 30, 2026*, and we're so happy you'll be there with us.

📍 Stadplus Event Centre, XPRESS HOUSE, Off Otunba Jobi Fele Way, CBD, Alausa, Ikeja, Lagos State
🕐 Please be seated by 1PM

Hold on to your e-access card and QR code, you'll need it on the day. Can't wait to celebrate with you soon!`,

  "14d": (name) =>
    `Dear ${name},

2 weeks to go! 💍 We're getting so excited for our #SoftLanding on *October 30, 2026*.

📍 Stadplus Event Centre, XPRESS HOUSE, Off Otunba Jobi Fele Way, CBD, Alausa, Ikeja, Lagos State
🕐 Please be seated by 1PM

Keep your e-access card and QR code safe, you'll need it to get in on the day. Can't wait to celebrate with you!`,

  "7d": (name) =>
    `Dear ${name},

One week to go! 🥂 Tomini & David's wedding is almost here, *October 30, 2026*.

📍 Stadplus Event Centre, XPRESS HOUSE, Off Otunba Jobi Fele Way, CBD, Alausa, Ikeja, Lagos State
🕐 Please be seated by 1PM

Please keep your e-access card and QR code handy, it's your entry pass and can only be used once. We're getting so excited!`,

  "3d": (name) =>
    `Dear ${name},

Just 3 days left 💍 Our #SoftLanding is almost here!

📍 Stadplus Event Centre, XPRESS HOUSE, Off Otunba Jobi Fele Way, CBD, Alausa, Ikeja, Lagos State
🕐 Please be seated by 1PM

Please have your e-access card and QR code ready to go. We can't wait to see you.`,

  "1d": (name) =>
    `Dear ${name},

Tomorrow's the day! 🥂 We are so ready to celebrate with you.

📍 Stadplus Event Centre, XPRESS HOUSE, Off Otunba Jobi Fele Way, CBD, Alausa, Ikeja, Lagos State
🕐 Please be seated by 1PM

Please have your e-access card and QR code saved and ready for tomorrow. See you soon!`,

  morning: (name) =>
    `Good morning ${name} 💍

Today's the day! Tomini & David can't wait to celebrate their #SoftLanding with you.

📍 Stadplus Event Centre, XPRESS HOUSE, Off Otunba Jobi Fele Way, CBD, Alausa, Ikeja, Lagos State
🕐 Please be seated by 1PM

Kindly have your e-access card and QR code ready for entry. See you soon!`,
};

export const THANK_YOU_MESSAGE = (name: string) =>
  `Dear ${name},

Thank you for being part of our #SoftLanding 💍

Having you there meant so much to us. Every hug, every smile, every dance, we felt all of it, and it made our day even more special. We are so grateful you chose to share this moment with us.

We are truly blessed to have people like you in our lives. Thank you for the love, the prayers, and the memories.

With all our love,
Tomini & David 🥂`;
