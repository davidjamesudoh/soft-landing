import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/dashboard/auth";
import { fetchConfirmedGuests } from "@/lib/dashboard/airtable";

// Auth here is separate from app/dashboard/admin/(protected)/layout.tsx —
// that layout only gates page rendering, not API routes, so this route
// needs its own session check or it'd leak guest data to anyone who finds
// the URL.
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const guests = await fetchConfirmedGuests();
    return NextResponse.json({ guests });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch guests" },
      { status: 500 },
    );
  }
}
