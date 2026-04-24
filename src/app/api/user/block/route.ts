import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetUserId, action } = await req.json();
  if (!targetUserId) return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });
  if (targetUserId === user.id) return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });

  if (action === "unblock") {
    await supabase.from("blocks").delete().eq("user_id", user.id).eq("blocked_id", targetUserId);
    return NextResponse.json({ ok: true, action: "unblocked" });
  }

  // Block (upsert to avoid duplicate error)
  const { error } = await supabase.from("blocks").upsert(
    { user_id: user.id, blocked_id: targetUserId },
    { onConflict: "user_id,blocked_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, action: "blocked" });
}
