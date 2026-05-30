import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const baseId = process.env.AIRTABLE_BASE_ID!;
    const tableName = process.env.AIRTABLE_TABLE_NAME ?? "RSVPs";
    const apiKey = process.env.AIRTABLE_API_KEY!;
    const tableUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    // Check for duplicate email or phone
    const formula = encodeURIComponent(
      `OR({Email address}="${data.email}",{Phone number}="${data.phone}")`,
    );
    const checkRes = await fetch(`${tableUrl}?filterByFormula=${formula}`, {
      headers,
    });
    const checkData = await checkRes.json();

    if (checkData.records?.length > 0) {
      return NextResponse.json(
        { success: false, duplicate: true },
        { status: 409 },
      );
    }

    // Create record
    const res = await fetch(tableUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        records: [
          {
            fields: {
              Name: data.fullName,
              "Phone number": data.phone,
              "Email address": data.email,
              Attending: data.attending,
              "Submitted At": new Date().toISOString(),
            },
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Airtable error:", err);
      return NextResponse.json(
        { success: false, error: err.error?.message ?? "Airtable error" },
        { status: res.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("RSVP API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save RSVP" },
      { status: 500 },
    );
  }
}
