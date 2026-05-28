import { NextRequest, NextResponse } from "next/server";
import { getEvents } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const events = await getEvents();
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaignId");
    const leadId = searchParams.get("leadId");

    let filtered = events;

    if (campaignId) {
      filtered = filtered.filter((e: any) => e.campaignId === campaignId);
    }
    if (leadId) {
      filtered = filtered.filter((e: any) => e.leadId === leadId);
    }

    filtered.sort(
      (a: any, b: any) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );

    return NextResponse.json(filtered);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
