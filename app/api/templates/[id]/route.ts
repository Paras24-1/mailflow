import { NextRequest, NextResponse } from "next/server";
import { getTemplates, saveTemplate, deleteTemplate } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { name, subject, body } = await req.json();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const templates = await getTemplates();
    const existing = templates.find((t: any) => t.id === id);

    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const updated = {
      ...existing,
      name: name || existing.name,
      subject: subject || existing.subject,
      body: body || existing.body,
      updatedAt: new Date().toISOString(),
    };

    const saved = await saveTemplate(updated);
    return NextResponse.json(saved);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    await deleteTemplate(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";

