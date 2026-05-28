import { NextRequest, NextResponse } from "next/server";
import { getReplies, saveReply } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const replies = await getReplies();
    const reply = replies.find((r: any) => r.id === id);
    if (reply) {
      reply.isRead = true;
      await saveReply(reply);
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";

