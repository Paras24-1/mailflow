import { NextResponse } from "next/server";
import { getOutlookConfig, saveOutlookConfig } from "@/lib/db";

export async function POST() {
  try {
    const config = await getOutlookConfig() || {
      msTenantId: "",
      msClientId: "",
      msSenderEmail: "",
      isConnected: false
    };
    config.isConnected = false;
    const saved = await saveOutlookConfig(config);
    return NextResponse.json(saved);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
