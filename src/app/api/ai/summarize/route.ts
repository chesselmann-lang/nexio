/**
 * POST /api/ai/summarize — Summarize recent chat messages using Claude Haiku
 * Body: { conversationId: string, limit?: number }
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

  const { conversationId, limit = 50 } = await req.json();
  if (!conversationId) return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });

  // Verify membership
  const { data: member } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .single();
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Fetch recent messages
  const { data: messages } = await supabase
    .from("messages")
    .select("content, type, created_at, sender:users(display_name)")
    .eq("conversation_id", conversationId)
    .eq("is_deleted", false)
    .eq("type", "text")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!messages || messages.length === 0) {
    return NextResponse.json({ summary: "Noch keine Nachrichten zum Zusammenfassen." });
  }

  // Filter out E2E encrypted messages
  const readable = messages
    .filter((m: any) => !m.content?.startsWith('{"iv":'))
    .reverse()
    .map((m: any) => `${(m.sender as any)?.display_name ?? "Unbekannt"}: ${m.content}`)
    .join("\n");

  if (!readable.trim()) {
    return NextResponse.json({ summary: "Keine lesbaren Nachrichten (E2E verschlüsselt)." });
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{
        role: "user",
        content: `Fasse dieses Chat-Gespräch auf Deutsch zusammen. Maximal 4 kurze Punkte. Format: "• Punkt"\n\nGespräch:\n${readable}`,
      }],
    });

    const summary = (response.content[0] as any).text ?? "Zusammenfassung nicht verfügbar.";
    return NextResponse.json({ summary, messageCount: messages.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
