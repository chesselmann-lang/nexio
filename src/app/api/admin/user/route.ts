import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_USER_ID = "152f5271-385e-40f5-8d9e-ecedee59525b";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== ADMIN_USER_ID) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { targetUserId, action, reason } = await req.json();
  if (!targetUserId) return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });
  if (targetUserId === ADMIN_USER_ID) return NextResponse.json({ error: "Cannot ban admin" }, { status: 400 });

  if (action === "ban") {
    const { error } = await supabase
      .from("users")
      .update({ is_banned: true, banned_at: new Date().toISOString(), ban_reason: reason ?? "Admin-Entscheidung" })
      .eq("id", targetUserId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: "banned" });
  }

  if (action === "unban") {
    const { error } = await supabase
      .from("users")
      .update({ is_banned: false, banned_at: null, ban_reason: null })
      .eq("id", targetUserId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: "unbanned" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
