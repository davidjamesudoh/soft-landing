import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { CARD_HEIGHT, CARD_TEMPLATE_PATH, CARD_WIDTH } from "../config";
import { log } from "./log";

const PHASE = "Card";

/**
 * Generates a placeholder "Access Card" template so the pipeline is
 * runnable before the real floral design exists. Replace the file at
 * CARD_TEMPLATE_PATH with the real design (same dimensions, or update
 * scripts/config.ts) and this is skipped automatically.
 */
export async function ensureDummyTemplate(): Promise<void> {
  if (fs.existsSync(CARD_TEMPLATE_PATH)) return;

  fs.mkdirSync(path.dirname(CARD_TEMPLATE_PATH), { recursive: true });

  const svg = `
    <svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#fdf8f2"/>
      <rect x="20" y="20" width="${CARD_WIDTH - 40}" height="${CARD_HEIGHT - 40}" fill="none" stroke="#c9a97a" stroke-width="6"/>
      <rect x="34" y="34" width="${CARD_WIDTH - 68}" height="${CARD_HEIGHT - 68}" fill="none" stroke="#c9a97a" stroke-width="1.5"/>
      ${cornerFlorals(CARD_WIDTH, CARD_HEIGHT)}
      <text x="50%" y="90" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="#8a5a3b">ACCESS CARD</text>
      <text x="50%" y="130" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="#a97b52">Tomini &amp; David — DUMMY TEMPLATE, replace me</text>
      <text x="50%" y="${CARD_HEIGHT - 50}" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="#a97b52">Present this card and QR code at the entrance</text>
    </svg>
  `;

  await sharp(Buffer.from(svg)).png().toFile(CARD_TEMPLATE_PATH);
  log(PHASE, `Generated dummy card template at ${CARD_TEMPLATE_PATH}`);
}

function cornerFlorals(w: number, h: number): string {
  const petal = (cx: number, cy: number) =>
    `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="10" fill="#e7b8a0" opacity="0.6"/>`;
  const corners: Array<[number, number]> = [
    [60, 60],
    [w - 60, 60],
    [60, h - 60],
    [w - 60, h - 60],
  ];
  return corners
    .map(([cx, cy]) =>
      [0, 1, 2, 3, 4]
        .map((i) => {
          const angle = (i * 72 * Math.PI) / 180;
          return petal(cx + Math.cos(angle) * 14, cy + Math.sin(angle) * 14);
        })
        .join(""),
    )
    .join("");
}
