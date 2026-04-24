import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages, lang = "de" } = await req.json();

  // Build context from last few messages
  const context = messages
    .slice(-5)
    .map((m: any) => `${m.sender}: ${m.content}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `Hier ist ein Chat-Verlauf:\n${context}\n\nGeneriere 3 kurze, natürliche Antwortvorschläge auf ${lang === "de" ? "Deutsch" : lang}. Jede Antwort max 8 Wörter. Formatiere als JSON-Array: ["Antwort 1", "Antwort 2", "Antwort 3"]. Nur das Array, kein anderer Text.`,
      },
    ],
  });

  try {
    const suggestions = JSON.parse(
      (response.content[0] as any).text.trim()
    );
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: ["👍", "Danke!", "Klingt gut!"] });
  }
}
