import fs from "node:fs";
import QRCode from "qrcode";
import sharp from "sharp";
import {
  CARD_FONT_FAMILY,
  CARD_TEMPLATE_PATH,
  DM_SANS_FONT_PATH,
  NAME_COLOR,
  NAME_FONT_SIZE,
  NAME_LETTER_SPACING,
  NAME_MAX_WIDTH,
  NAME_MIN_FONT_SIZE,
  NAME_POSITION,
  QR_DARK_COLOR,
  QR_LIGHT_COLOR,
  QR_POSITION,
  QR_SIZE,
  TABLE_BADGE_COLOR,
  TABLE_BADGE_HEIGHT,
  TABLE_BADGE_WIDTH,
  TABLE_FONT_SIZE,
  TABLE_POSITION,
  TABLE_TEXT_COLOR,
} from "../config";
import { ensureDummyTemplate } from "./ensureTemplate";
import { log, warn } from "./log";
import { measureTextWidth } from "./textMeasure";
import type { Guest } from "./airtable";

const PHASE = "Card";

// sharp's SVG rasterizer doesn't reliably pick up fonts installed on the
// OS, so embed the actual font file as a data URI — read once and cached.
let fontFaceCss: string | null = null;
function getFontFaceCss(): string {
  if (!fontFaceCss) {
    const base64 = fs.readFileSync(DM_SANS_FONT_PATH).toString("base64");
    fontFaceCss = `
      @font-face {
        font-family: "${CARD_FONT_FAMILY}";
        font-weight: 700;
        src: url(data:font/ttf;base64,${base64}) format("truetype");
      }
    `;
  }
  return fontFaceCss;
}

/**
 * Shrinks the font size (never wraps) so `text` fits within maxWidth at
 * NAME_LETTER_SPACING, down to NAME_MIN_FONT_SIZE. Glyph width scales
 * linearly with font size, but letter-spacing is a fixed px gap that
 * doesn't — so solve for the size that makes both terms sum to maxWidth,
 * rather than just scaling the whole measured width down proportionally.
 */
function fitNameFontSize(text: string, maxWidth: number): number {
  const glyphWidthAtBase = measureTextWidth(text, NAME_FONT_SIZE);
  const extraSpacing = Math.max(0, text.length - 1) * NAME_LETTER_SPACING;
  if (glyphWidthAtBase + extraSpacing <= maxWidth) return NAME_FONT_SIZE;

  const widthPerSizeUnit = glyphWidthAtBase / NAME_FONT_SIZE;
  const fitted = Math.floor((maxWidth - extraSpacing) / widthPerSizeUnit);
  if (fitted < NAME_MIN_FONT_SIZE) {
    warn(
      "Card",
      `Name "${text}" still doesn't fully fit at the minimum font size (${NAME_MIN_FONT_SIZE}px) — it may overflow slightly.`,
    );
  }
  return Math.max(NAME_MIN_FONT_SIZE, fitted);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * QR payload identifies the guest for the future entrance-scanning flow.
 * Table number isn't populated in Airtable yet, so it's "TBD" until it is —
 * the scanner will look up the live table number by `id` at scan time
 * rather than trusting a stale value baked into the code.
 */
function buildQrPayload(guest: Guest): string {
  return JSON.stringify({
    id: guest.id,
    name: guest.name,
    table: guest.tableNumber || "TBD",
  });
}

export async function generateCard(guest: Guest, outputPath: string): Promise<void> {
  log(PHASE, `Generating card for ${guest.name}...`);
  await ensureDummyTemplate();

  const qrBuffer = await QRCode.toBuffer(buildQrPayload(guest), {
    width: QR_SIZE,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: QR_DARK_COLOR, light: QR_LIGHT_COLOR },
  });

  const fontFace = getFontFaceCss();

  const nameUpper = guest.name.toUpperCase();
  const nameFontSize = fitNameFontSize(nameUpper, NAME_MAX_WIDTH);
  const nameSvg = `
    <svg width="${NAME_POSITION.width}" height="${NAME_POSITION.height}" xmlns="http://www.w3.org/2000/svg">
      <style>${fontFace}</style>
      <text x="50%" y="${NAME_POSITION.height / 2}" dominant-baseline="middle" text-anchor="middle"
            font-family="${CARD_FONT_FAMILY}" font-weight="700" letter-spacing="${NAME_LETTER_SPACING}"
            font-size="${nameFontSize}" fill="${NAME_COLOR}">
        ${escapeXml(nameUpper)}
      </text>
    </svg>
  `;

  const tableNumberDisplay =
    guest.tableNumber && /^\d+$/.test(guest.tableNumber)
      ? guest.tableNumber.padStart(2, "0")
      : guest.tableNumber || "TBD";
  const tableLabel = `TABLE ${tableNumberDisplay}`;
  const badgeLeft = (TABLE_POSITION.width - TABLE_BADGE_WIDTH) / 2;
  const badgeTop = (TABLE_POSITION.height - TABLE_BADGE_HEIGHT) / 2;
  const tableSvg = `
    <svg width="${TABLE_POSITION.width}" height="${TABLE_POSITION.height}" xmlns="http://www.w3.org/2000/svg">
      <style>${fontFace}</style>
      <rect x="${badgeLeft}" y="${badgeTop}" width="${TABLE_BADGE_WIDTH}" height="${TABLE_BADGE_HEIGHT}"
            rx="4" fill="${TABLE_BADGE_COLOR}"/>
      <text x="50%" y="${TABLE_POSITION.height / 2}" dominant-baseline="middle" text-anchor="middle"
            font-family="${CARD_FONT_FAMILY}" font-weight="700" letter-spacing="1"
            font-size="${TABLE_FONT_SIZE}" fill="${TABLE_TEXT_COLOR}">
        ${escapeXml(tableLabel)}
      </text>
    </svg>
  `;

  await sharp(CARD_TEMPLATE_PATH)
    .composite([
      { input: qrBuffer, top: QR_POSITION.top, left: QR_POSITION.left },
      { input: Buffer.from(nameSvg), top: NAME_POSITION.top, left: NAME_POSITION.left },
      { input: Buffer.from(tableSvg), top: TABLE_POSITION.top, left: TABLE_POSITION.left },
    ])
    .png()
    .toFile(outputPath);
  log(PHASE, `Saved card to ${outputPath}`);
}
