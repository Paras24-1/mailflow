import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { productName, productDesc, step, tone } = await req.json();

    if (!productName || !productDesc) {
      return NextResponse.json(
        { error: "Product name and description are required for generation." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API capability is not initialized. Please verify your GEMINI_API_KEY in the Settings secrets." },
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

    const prompt = `You are a high-performing SaaS Outbound SDR and cold-email copywriter.
Generate a cold email copy suited for outreach campaign:
- Product name: "${productName}"
- Product description: "${productDesc}"
- Campaign sequence step: ${step || "1"} (Step 1 is initial outreach, Step 2 is soft follow-up, Step 3 is final try/breakup)
- Output email tone: "${tone || "Professional"}"

Rules:
1. Make it sharp, direct, concise (keep below 150 words).
2. Use variables like {{first_name}} and {{company}} exactly as placeholders so our sequence engine can interpolate them.
3. Include a catchy, high-open-rate Subject Line.
4. Provide the response as a JSON object containing the "subject" and the "body" of the email to be generated, no markdown wrappers, just raw JSON matching this schema:
{
  "subject": "Our subject line with variables if needed",
  "body": "The email body copy with correct single-line linebreaks and SDR format"
}
Ensure there is no surrounding markdown ticks like \`\`\`json. Just Return pure JSON string.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const cleanedText = text.trim();
    const result = JSON.parse(cleanedText);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Gemini copy generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate personalized email with Gemini: " + err.message },
      { status: 500 }
    );
  }
}
export const dynamic = "force-dynamic";
