import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/dashboard/auth";
import { callTriggerServer } from "@/lib/dashboard/sendingService";

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  try {
    const { status, data } = await callTriggerServer("/trigger/thankyou", {
      method: "POST",
      body: { guestIds: body.guestIds },
    });
    return NextResponse.json(data, { status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Trigger server unreachable" },
      { status: 502 },
    );
  }
}
