import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/dashboard/auth";
import { findGuestById, markNotCheckedIn } from "@/lib/dashboard/airtable";

/** Undo check-in for guests selected in the dashboard table — for fixing mistaken check-ins. */
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.guestIds)
    ? body.guestIds.filter((id: unknown): id is string => typeof id === "string" && !!id)
    : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: "No guests selected." }, { status: 400 });
  }

  let unchecked = 0;
  let notCheckedIn = 0;
  let notFound = 0;

  for (const id of ids) {
    const guest = await findGuestById(id);
    if (!guest) {
      notFound++;
      continue;
    }
    if (guest.checkedIn !== "Yes") {
      notCheckedIn++;
      continue;
    }
    await markNotCheckedIn(guest.id);
    unchecked++;
  }

  const parts = [`Undid check-in for ${unchecked} guest(s).`];
  if (notCheckedIn) parts.push(`${notCheckedIn} weren't checked in (skipped).`);
  if (notFound) parts.push(`${notFound} not found.`);

  return NextResponse.json({ message: parts.join(" "), unchecked, notCheckedIn, notFound });
}
