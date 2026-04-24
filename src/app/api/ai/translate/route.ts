import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messageId, text, targetLang = "de" } = await req.json();

  // Check cache first
  const { data: cached } = await supabase
    .from("message_translations")
    .select("translation")
    .eq("message_id", messageId)
    .eq("target_lang", targetLang)
    .single();

  if (cached) return NextResponse.json({ translation: cached.translation, cached: true });

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `Übersetze den folgenden Text nach ${targetLang}. Gib NUR die Übersetzung zurück, keinen anderen Text:\n\n${text}`,
      },
    ],
  });

  const translation = (response.content[0] as any).text.trim();

  // Cache in DB
  await supabase.from("message_translations").upsert({
    message_id: messageId,
    target_lang: targetLang,
    translation,
  });

  return NextResponse.json({ translation, cached: false });
}
