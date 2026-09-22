import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/dashboard/auth";
import { findGuestById, markCheckedIn } from "@/lib/dashboard/airtable";

/**
 * Airtable's API has no atomic "update only if field X still equals Y" —
 * so two near-simultaneous scans of the same QR (e.g. shared/photographed
 * and used at two entrances at once) could both read "Not yet" before
 * either write lands, and both succeed. This in-process lock closes that
 * window for requests hitting the same server instance. It's not a
 * distributed guarantee across multiple concurrent serverless instances,
 * but genuinely-simultaneous duplicate scans of one QR are an extreme
 * edge case here, not something worth a real lock service over.
 */
const inFlight = new Set<string>();

/**
 * QR payload is JSON from scripts/lib/generateCard.ts's buildQrPayload:
 * {"id": recordId, "name": ..., "table": ...}. Only `id` is trusted here —
 * name/table are looked up live from Airtable rather than the value baked
 * into the QR at card-generation time, which could be stale (e.g. table
 * number wasn't assigned yet when the card was sent).
 */
function extractGuestId(qrText: string): string | null {
  try {
    const parsed = JSON.parse(qrText);
    if (parsed && typeof parsed.id === "string" && parsed.id) return parsed.id;
  } catch {
    // Not JSON — fall back to treating the raw text as a bare record id.
  }
  const trimmed = qrText.trim();
  return trimmed || null;
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ status: "invalid", error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const qrText = typeof body.qrText === "string" ? body.qrText : "";
  const id = extractGuestId(qrText);

  if (!id) {
    return NextResponse.json(
      { status: "invalid", error: "Could not read a guest ID from this QR code." },
      { status: 400 },
    );
  }

  if (inFlight.has(id)) {
    return NextResponse.json(
      { status: "invalid", error: "This QR code is already being processed — try again in a moment." },
      { status: 409 },
    );
  }

  inFlight.add(id);
  try {
    const guest = await findGuestById(id);
    if (!guest) {
      return NextResponse.json(
        { status: "not_found", error: "No guest found for this QR code." },
        { status: 404 },
      );
    }

    if (guest.checkedIn === "Yes") {
      return NextResponse.json({
        status: "already_checked_in",
        name: guest.name,
        tableNumber: guest.tableNumber,
      });
    }

    await markCheckedIn(guest.id);
    return NextResponse.json({ status: "ok", name: guest.name, tableNumber: guest.tableNumber });
  } finally {
    inFlight.delete(id);
  }
}
