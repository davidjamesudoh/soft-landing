import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/dashboard/auth";
import { findGuestById, markCheckedIn } from "@/lib/dashboard/airtable";

/** Manual check-in for guests selected in the dashboard table — same "only once" rule as the QR scanner. */
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

  let checkedIn = 0;
  let alreadyCheckedIn = 0;
  let notFound = 0;

  for (const id of ids) {
    const guest = await findGuestById(id);
    if (!guest) {
      notFound++;
      continue;
    }
    if (guest.checkedIn === "Yes") {
      alreadyCheckedIn++;
      continue;
    }
    await markCheckedIn(guest.id);
    checkedIn++;
  }

  const parts = [`Checked in ${checkedIn} guest(s).`];
  if (alreadyCheckedIn) parts.push(`${alreadyCheckedIn} already checked in (skipped).`);
  if (notFound) parts.push(`${notFound} not found.`);

  return NextResponse.json({ message: parts.join(" "), checkedIn, alreadyCheckedIn, notFound });
}
