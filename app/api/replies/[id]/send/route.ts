import { NextRequest, NextResponse } from "next/server";
import { getReplies, deleteReply, saveEvent, getSequences, saveSequence } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { replyText } = await req.json();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const replies = await getReplies();
    const replyItem = replies.find((r: any) => r.id === id);

    if (!replyItem) {
      return NextResponse.json({ error: "Reply chain not found" }, { status: 404 });
    }

    // 1. Create a new sent event
    const newEvent = {
      id: randomUUID(),
      sequenceId: replyItem.sequenceId,
      leadId: replyItem.leadId,
      campaignId: replyItem.campaignId,
      step: 1,
      eventType: "sent",
      subject: "Re: " + replyItem.subject,
      toEmail: replyItem.fromEmail,
      bodyPreview: replyText.substring(0, 100) + "...",
      occurredAt: new Date().toISOString(),
    };
    await saveEvent(newEvent);

    // 2. Update sequence status to completed
    const sequences = await getSequences();
    const sequence = sequences.find((s: any) => s.id === replyItem.sequenceId);
    if (sequence) {
      sequence.status = "completed";
      await saveSequence(sequence);
    }

    // 3. Delete the reply
    await deleteReply(id);

    return NextResponse.json({ success: true, message: "Response simulated and sent!" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";

