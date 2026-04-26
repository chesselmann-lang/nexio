import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/messages/save  { message_id, conversation_id }  → toggles save
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { message_id, conversation_id } = body as { message_id: string; conversation_id: string };
  if (!message_id || !conversation_id) {
    return NextResponse.json({ error: "message_id and conversation_id required" }, { status: 400 });
  }

  // Check if already saved
  const { data: existing } = await supabase
    .from("saved_messages")
    .select("id")
    .eq("user_id", user.id)
    .eq("message_id", message_id)
    .maybeSingle();

  if (existing) {
    // Unsave
    await supabase.from("saved_messages").delete().eq("id", existing.id);
    return NextResponse.json({ saved: false });
  } else {
    // Save
    await supabase.from("saved_messages").insert({
      user_id: user.id,
      message_id,
      conversation_id,
    });
    return NextResponse.json({ saved: true });
  }
}
