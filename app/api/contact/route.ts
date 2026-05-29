import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";

// Initialize Notion
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const sanitizedBudget = data.budget.replace(/,/g, "");
    const sanitizedDeadline = data.deadline.replace(/,/g, "");

    // 1️⃣ Save to Notion
    const response = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: {
        Name: { title: [{ text: { content: data.name } }] },
        Email: { email: data.email },
        Service: { select: { name: data.services } },
        Budget: { select: { name: sanitizedBudget } },
        "Project Details": {
          rich_text: [{ text: { content: data.projectDetails } }],
        },
        "Start Date": { rich_text: [{ text: { content: data.startDate } }] },
        Deadline: { select: { name: sanitizedDeadline } },
        "Success Definition": {
          rich_text: [{ text: { content: data.success } }],
        },
        "Heard About Us": {
          rich_text: [{ text: { content: data.hearAbout } }],
        },
        "Submitted At": { date: { start: new Date().toISOString() } },
      },
    });

    // console.log("Notion response:", response);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save contact" },
      { status: 500 },
    );
  }
}
