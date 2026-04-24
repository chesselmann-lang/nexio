import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId, callType } = await req.json(); // callType: 'audio' | 'video'

  // Room name = deterministic from conversation ID + timestamp
  const roomName = `nexio-${conversationId}-${Date.now()}`;

  // Notify all members via Supabase Realtime (system message)
  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    type: "system",
    content: `call:${callType}:${roomName}`,
  });

  return NextResponse.json({ roomName, callType });
}
