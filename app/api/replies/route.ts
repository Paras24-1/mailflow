import { NextResponse } from "next/server";
import { getReplies } from "@/lib/db";

export async function GET() {
  try {
    const replies = await getReplies();
    replies.sort(
      (a: any, b: any) =>
        new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );
    return NextResponse.json(replies);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
