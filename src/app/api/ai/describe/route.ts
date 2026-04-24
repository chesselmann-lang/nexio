/**
 * POST /api/ai/describe — Describe an image using Claude Vision
 * Body: { imageUrl: string } OR multipart with image file
 */
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes("...")) {
    return NextResponse.json({ error: "ai_disabled" }, { status: 503 });
  }

  const { imageUrl } = await req.json();
  if (!imageUrl) return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "url", url: imageUrl },
          },
          {
            type: "text",
            text: "Beschreibe dieses Bild kurz und präzise auf Deutsch. Maximal 2-3 Sätze. Fokus auf das Wichtigste.",
          },
        ],
      }],
    });

    const description = (message.content[0] as any).text ?? "Keine Beschreibung verfügbar";
    return NextResponse.json({ description });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
