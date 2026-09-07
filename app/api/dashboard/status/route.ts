import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/dashboard/auth";
import { callTriggerServer } from "@/lib/dashboard/sendingService";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { status, data } = await callTriggerServer("/status");
    return NextResponse.json(data, { status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Trigger server unreachable" },
      { status: 502 },
    );
  }
}
