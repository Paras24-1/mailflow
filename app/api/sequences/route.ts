import { NextResponse } from "next/server";
import { getSequences } from "@/lib/db";

export async function GET() {
  try {
    const sequences = await getSequences();
    return NextResponse.json(sequences);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";

