import { NextRequest, NextResponse } from "next/server";
import { getTemplates, saveTemplate } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const templates = await getTemplates();
    return NextResponse.json(templates);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, sequenceStep, subject, body } = await req.json();

    if (!name || !subject || !body || !sequenceStep) {
      return NextResponse.json({ error: "Name, sequence step, subject, and body are required." }, { status: 400 });
    }

    const newTemp = {
      id: randomUUID(),
      name,
      sequenceStep: parseInt(sequenceStep),
      subject,
      body,
      isDefault: false,
      updatedAt: new Date().toISOString(),
    };

    const saved = await saveTemplate(newTemp);
    return NextResponse.json(saved, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
