import fs from "node:fs";
import opentype from "opentype.js";
import { DM_SANS_FONT_PATH } from "../config";

let font: opentype.Font | null = null;
function getFont(): opentype.Font {
  if (!font) {
    const buffer = fs.readFileSync(DM_SANS_FONT_PATH);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    font = opentype.parse(arrayBuffer);
  }
  return font;
}

/**
 * Rendered width in px of `text` at `fontSize`, using the actual DM Sans
 * Bold glyph metrics. Sums per-character advance widths directly via
 * charToGlyph rather than opentype.js's full shaping pipeline (getPath /
 * stringToGlyphs) — that pipeline applies GSUB features and throws on a
 * lookup subtable format this particular font uses that opentype.js
 * doesn't support. Advance-width summation doesn't need shaping for
 * plain uppercase Latin text (no ligatures at play here) and is simpler.
 */
export function measureTextWidth(text: string, fontSize: number): number {
  const f = getFont();
  const scale = fontSize / f.unitsPerEm;
  let width = 0;
  for (const char of text) {
    width += (f.charToGlyph(char).advanceWidth ?? 0) * scale;
  }
  return width;
}
