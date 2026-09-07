import Airtable from "airtable";

// Field names mirror scripts/config.ts (same Airtable base) — kept as a
// separate, self-contained copy rather than a shared import, since this
// app and scripts/ are deployed to different places (see scripts/README.md).
const NAME_FIELD = "Name";
const PHONE_FIELD = "Phone number";
const ATTENDING_FIELD = "Attending";
const ATTENDING_YES_VALUE = "Yes! Wouldn’t miss it for anything";
const TABLE_NUMBER_FIELD = "Table Number";
const CARD_SENT_FIELD = "Card Sent";
const CHECK_IN_FIELD = "Check In";

export interface DashboardGuest {
  id: string;
  name: string;
  phone: string;
  tableNumber?: string;
  cardSent: "Yes" | "Not yet";
  checkedIn: "Yes" | "Not yet";
}

function getTable() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME || "RSVPs";

  if (!apiKey || !baseId) {
    throw new Error("Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID env var.");
  }

  return new Airtable({ apiKey }).base(baseId)(tableName);
}

function escapeFormulaValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function recordToDashboardGuest(record: Airtable.Record<Airtable.FieldSet>): DashboardGuest {
  const rawTableNumber = record.get(TABLE_NUMBER_FIELD) as string | number | undefined;
  return {
    id: record.id,
    name: (record.get(NAME_FIELD) as string) || "(no name)",
    phone: (record.get(PHONE_FIELD) as string) || "",
    tableNumber:
      rawTableNumber !== undefined && rawTableNumber !== null ? String(rawTableNumber) : undefined,
    cardSent: ((record.get(CARD_SENT_FIELD) as string) || "Not yet") as "Yes" | "Not yet",
    checkedIn: ((record.get(CHECK_IN_FIELD) as string) || "Not yet") as "Yes" | "Not yet",
  };
}

export async function fetchConfirmedGuests(): Promise<DashboardGuest[]> {
  const table = getTable();
  const formula = `{${ATTENDING_FIELD}}="${escapeFormulaValue(ATTENDING_YES_VALUE)}"`;

  const guests: DashboardGuest[] = [];
  await table.select({ filterByFormula: formula }).eachPage((records, fetchNextPage) => {
    for (const record of records) {
      guests.push(recordToDashboardGuest(record));
    }
    fetchNextPage();
  });

  return guests;
}

/**
 * Looks up a guest by Airtable record id (decoded from a scanned QR
 * payload). Returns null for any lookup failure — a QR encoding a stale,
 * malformed, or foreign id should read as "not found," not crash the
 * scanner.
 */
export async function findGuestById(id: string): Promise<DashboardGuest | null> {
  const table = getTable();
  try {
    const record = await table.find(id);
    return recordToDashboardGuest(record);
  } catch {
    return null;
  }
}

export async function markCheckedIn(id: string): Promise<void> {
  const table = getTable();
  await table.update(id, { [CHECK_IN_FIELD]: "Yes" });
}
