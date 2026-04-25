/**
 * POST /api/notifications — Create a notification for one or more users
 * Body: { userIds: string[], type, title, body?, actorId?, resourceId?, resourceType? }
 *
 * Called server-side whenever a notable event occurs (new message, reaction, etc.)
 * Uses service-role key to bypass RLS.
 */
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userIds, type, title, body, actorId, resourceId, resourceType } = await req.json();
  if (!userIds?.length || !type || !title) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const rows = (userIds as string[])
    .filter((id) => id !== actorId) // don't notify yourself
    .map((userId) => ({
      user_id: userId,
      type,
      title,
      body: body ?? null,
      actor_id: actorId ?? null,
      resource_id: resourceId ?? null,
      resource_type: resourceType ?? null,
      is_read: false,
    }));

  if (rows.length === 0) return NextResponse.json({ ok: true, skipped: true });

  const { error } = await supabase.from("notifications").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, created: rows.length });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, is_read, created_at, actor:users!notifications_actor_id_fkey(display_name, avatar_url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const unread = (data ?? []).filter((n: any) => !n.is_read).length;
  return NextResponse.json({ notifications: data ?? [], unread });
}
