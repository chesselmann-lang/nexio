/**
 * POST /api/ai/transcribe — Convert voice message (webm blob) to text
 * Uses Web Speech API on client side; this endpoint handles fallback server-side.
 * Currently returns a graceful message since Whisper requires OpenAI key.
 * Body: multipart/form-data with "audio" file field
 */
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // If OpenAI key available, use Whisper
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json({
      transcript: null,
      fallback: true,
      message: "Sprach-zu-Text nicht konfiguriert (OPENAI_API_KEY fehlt)"
    });
  }

  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as Blob | null;
    if (!audio) return NextResponse.json({ error: "No audio" }, { status: 400 });

    const whisperForm = new FormData();
    whisperForm.append("file", audio, "audio.webm");
    whisperForm.append("model", "whisper-1");
    whisperForm.append("language", "de");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: whisperForm,
    });

    if (!res.ok) throw new Error(`Whisper error: ${res.status}`);
    const data = await res.json();
    return NextResponse.json({ transcript: data.text });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
