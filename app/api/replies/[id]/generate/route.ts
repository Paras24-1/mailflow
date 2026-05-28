import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getReplies, saveReply } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const replies = await getReplies();
    const replyItem = replies.find((r: any) => r.id === id);

    if (!replyItem) {
      return NextResponse.json({ error: "Reply message not found." }, { status: 404 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini AI capability is not initialized. Please configure your secrets." },
        { status: 503 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const prompt = `You are a professional Account executive drafting a follow-up reply to a prospect.
Here is the client's reply we received:
- From: "${replyItem.fromName}" <${replyItem.fromEmail}>
- Email subject: "${replyItem.subject}"
- Received reply: "${replyItem.body}"

Perform the following tasks:
1. Detect and classify sentiment / lead status. Pick exactly one category from: "Interested" (leads wants to book a call/get details), "Not Interested" (leads wants to unsubscribe/quit), "Neutral" (leads asking an technical query, etc).
2. Generate an extremely polished, high-conversion follow-up reply draft that answers their concern and politely books a call or acknowledges their decision respectfully.
3. Return the response as a JSON object, matching exactly this structure:
{
  "sentiment": "Interested" | "Not Interested" | "Neutral",
  "draft": "Dear Alex, ..."
}
Double-check: Do NOT wrap in markdown ticks, output raw valid stringified JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const bodyText = response.text || "{}";
    const parsed = JSON.parse(bodyText.trim());

    replyItem.aiSuggestedDraft = parsed.draft;
    replyItem.sentiment = parsed.sentiment?.toLowerCase();
    await saveReply(replyItem);

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("Gemini reply draft generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate AI draft suggestions: " + err.message },
      { status: 500 }
    );
  }
}
export const dynamic = "force-dynamic";

