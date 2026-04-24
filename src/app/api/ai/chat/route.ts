import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId, message, systemPrompt } = await req.json();

  // Load session history (last 20 messages for context)
  const { data: history } = await supabase
    .from("ai_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(20);

  const messages: { role: "user" | "assistant"; content: string }[] = [
    ...(history ?? []).map((m: any) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  // Save user message
  await supabase.from("ai_messages").insert({
    session_id: sessionId,
    role: "user",
    content: message,
  });

  // Stream Claude response
  const stream = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: systemPrompt ?? `Du bist Nexio KI — ein intelligenter persönlicher Assistent innerhalb der Nexio Super-App.
Du hilfst dem Nutzer mit allem: Nachrichten formulieren, übersetzen, zusammenfassen, Aufgaben planen, Fragen beantworten.
Antworte immer auf Deutsch, es sei denn, der Nutzer schreibt in einer anderen Sprache.
Sei präzise, hilfreich und freundlich. Halte Antworten kompakt, außer der Nutzer bittet um Details.`,
    messages,
    stream: true,
  });

  // Collect full response for saving
  let fullResponse = "";
  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const text = chunk.delta.text;
            fullResponse += text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        }

        // Save assistant message
        await supabase.from("ai_messages").insert({
          session_id: sessionId,
          role: "assistant",
          content: fullResponse,
        });

        // Update session
        await supabase
          .from("ai_sessions")
          .update({ last_message_at: new Date().toISOString(), message_count: (history?.length ?? 0) + 2 })
          .eq("id", sessionId);

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
