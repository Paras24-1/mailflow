import { NextRequest, NextResponse } from "next/server";
import { getOutlookConfig, saveOutlookConfig } from "@/lib/db";

export async function GET() {
  try {
    const config = await getOutlookConfig();
    return NextResponse.json(config);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { msTenantId, msClientId, msSenderEmail } = await req.json();

    const config = {
      msTenantId: msTenantId || "tenant-configured-9a",
      msClientId: msClientId || "client-configured-ff",
      msSenderEmail: msSenderEmail || "sender@mailflow-outbox.com",
      isConnected: true,
    };

    const saved = await saveOutlookConfig(config);
    return NextResponse.json(saved);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
