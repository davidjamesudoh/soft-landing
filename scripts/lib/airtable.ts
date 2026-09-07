import Airtable from "airtable";
import {
  AIRTABLE_VIEW_NAME,
  ATTENDING_FIELD,
  ATTENDING_YES_VALUE,
  CARD_SENT_FIELD,
  CARD_SENT_YES_VALUE,
  NAME_FIELD,
  PHONE_FIELD,
  TABLE_NUMBER_FIELD,
} from "../config";
import { log, warn } from "./log";

const PHASE = "Airtable";

export interface Guest {
  id: string;
  name: string;
  phone: string;
  tableNumber?: string;
}

function getTable() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME || "RSVPs";

  if (!apiKey || !baseId) {
    throw new Error(
      "Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID. Set them in .env (see .env.example).",
    );
  }

  return new Airtable({ apiKey }).base(baseId)(tableName);
}

function escapeFormulaValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function recordToGuest(record: Airtable.Record<Airtable.FieldSet>): Guest | null {
  const name = record.get(NAME_FIELD) as string | undefined;
  const phone = record.get(PHONE_FIELD) as string | undefined;

  if (!name || !phone) {
    warn(PHASE, `Skipping record ${record.id}: missing ${!name ? NAME_FIELD : PHONE_FIELD}.`);
    return null;
  }

  const rawTableNumber = record.get(TABLE_NUMBER_FIELD) as string | number | undefined;

  return {
    id: record.id,
    name,
    phone,
    tableNumber:
      rawTableNumber !== undefined && rawTableNumber !== null ? String(rawTableNumber) : undefined,
  };
}

async function selectGuests(formula: string): Promise<Guest[]> {
  const table = getTable();
  log(PHASE, `Querying table "${process.env.AIRTABLE_TABLE_NAME || "RSVPs"}" with filter: ${formula}`);

  const guests: Guest[] = [];
  try {
    await table
      .select({
        ...(AIRTABLE_VIEW_NAME ? { view: AIRTABLE_VIEW_NAME } : {}),
        filterByFormula: formula,
      })
      .eachPage((records, fetchNextPage) => {
        for (const record of records) {
          const guest = recordToGuest(record);
          if (guest) guests.push(guest);
        }
        fetchNextPage();
      });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/unknown field name/i.test(message)) {
      throw new Error(
        `Airtable rejected the query: ${message}\n` +
          `Check that all fields referenced in this query exist on the ` +
          `"${process.env.AIRTABLE_TABLE_NAME || "RSVPs"}" table — see scripts/README.md.`,
      );
    }
    throw err;
  }

  log(PHASE, `Fetched ${guests.length} guest(s).`);
  return guests;
}

/** Confirmed guests whose card hasn't been sent yet. */
export async function fetchGuestsPendingCard(): Promise<Guest[]> {
  return selectGuests(
    `AND({${ATTENDING_FIELD}}="${escapeFormulaValue(ATTENDING_YES_VALUE)}", NOT({${CARD_SENT_FIELD}}="${CARD_SENT_YES_VALUE}"))`,
  );
}

/** Confirmed guests where the given tracking field (a reminder stage, thank-you, etc.) isn't "Yes" yet. */
export async function fetchGuestsPendingField(fieldName: string): Promise<Guest[]> {
  return selectGuests(
    `AND({${ATTENDING_FIELD}}="${escapeFormulaValue(ATTENDING_YES_VALUE)}", NOT({${fieldName}}="${CARD_SENT_YES_VALUE}"))`,
  );
}

/** Specific guests by Airtable record id, regardless of their current status — for admin manual selection. */
export async function fetchGuestsByIds(ids: string[]): Promise<Guest[]> {
  const table = getTable();
  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        const record = await table.find(id);
        return recordToGuest(record);
      } catch (err) {
        warn(PHASE, `Could not fetch record ${id}: ${err instanceof Error ? err.message : err}`);
        return null;
      }
    }),
  );
  return results.filter((g): g is Guest => g !== null);
}

export async function markCardSent(recordId: string): Promise<void> {
  await markFieldSent(recordId, CARD_SENT_FIELD);
}

/** Generic setter for any "Not yet"/"Yes" tracking field (reminder stages, thank-you, etc.). */
export async function markFieldSent(recordId: string, fieldName: string): Promise<void> {
  const table = getTable();
  log(PHASE, `Marking "${fieldName}" = "${CARD_SENT_YES_VALUE}" for record ${recordId}...`);
  await table.update(recordId, { [fieldName]: CARD_SENT_YES_VALUE });
}
